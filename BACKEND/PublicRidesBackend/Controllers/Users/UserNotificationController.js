const Controller = require('../Controller');
const Mongo = require('../DB/Mongo');
const { ObjectId } = require('mongodb');

// Lists subscription-related notification records for the authenticated user.
// Source collections: expiry_notifications (cron SendExpiryNotifications) and payment_notifications (admin payment flows)
// Types included: 'subscription' (day-zero expiry), 'subscription-threshold' (7/3/1 remaining warnings), 'payment-success' (successful subscription payments)
// Optional query params:
//   type: 'expiry' | 'threshold' | 'payment' | 'all' (default 'all')
//   page: number (default 1)
//   limit: number (default 20, max 100)
// Response: { success, notifications: [...], pagination:{...} }
// Each notification trimmed to public fields.
class UserNotificationController extends Controller {
    constructor() {
        super();
        this.collection = 'expiry_notifications';
        this.paymentCollection = process.env.PAYMENT_NOTIFICATIONS_COLLECTION || 'payment_notifications';
    }

    listMySubscriptionNotifications = async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        try {
            const { type, page, limit } = req.query || {};
            const parsedPage = page ? Math.max(parseInt(page, 10), 1) : 1;
            const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 100) : 20;
            const skip = (parsedPage - 1) * parsedLimit;
            const normalizedType = (type || 'all').toLowerCase();
            const includeExpiry = normalizedType === 'all' || normalizedType === 'expiry';
            const includeThreshold = normalizedType === 'all' || normalizedType === 'threshold';
            const includePayment = normalizedType === 'all' || normalizedType === 'payment';
            const internalTypes = [];
            if (includeExpiry) internalTypes.push('subscription');
            if (includeThreshold) internalTypes.push('subscription-threshold');
            // Match userId irrespective of ObjectId/string representation
            const userIdString = typeof userId === 'string' ? userId : userId.toString();
            const possibleUserIds = [userIdString];
            if (/^[a-fA-F0-9]{24}$/.test(userIdString)) {
                try { possibleUserIds.push(new ObjectId(userIdString)); } catch (_e) { /* ignore invalid cast */ }
            }
            let expiryRows = [];
            if (internalTypes.length) {
                const expiryQuery = {
                    type: { $in: internalTypes },
                    userId: { $in: possibleUserIds }
                };
                try {
                    expiryRows = await Mongo.findSort(this.collection, expiryQuery, { createdAt: -1 });
                } catch (err) {
                    console.error('Failed to fetch expiry notifications', err?.message || err);
                }
            }

            let paymentRows = [];
            if (includePayment) {
                const paymentQuery = {
                    type: 'payment-success',
                    userId: { $in: possibleUserIds }
                };
                try {
                    paymentRows = await Mongo.findSort(this.paymentCollection, paymentQuery, { createdAt: -1 });
                } catch (err) {
                    console.error('Failed to fetch payment notifications', err?.message || err);
                }
            }

            const combined = [
                ...expiryRows.map(r => ({ source: 'expiry', data: r })),
                ...paymentRows.map(r => ({ source: 'payment', data: r }))
            ];
            combined.sort((a, b) => {
                const aCreated = typeof a.data?.createdAt === 'number' ? a.data.createdAt : new Date(a.data?.createdAt || 0).getTime();
                const bCreated = typeof b.data?.createdAt === 'number' ? b.data.createdAt : new Date(b.data?.createdAt || 0).getTime();
                return bCreated - aCreated;
            });

            const total = combined.length;
            const paginated = combined.slice(skip, skip + parsedLimit);

            // Enrich notifications with device info so caller can show per-device expiry details
            const deviceIdStrings = paginated
                .flatMap(entry => {
                    if (entry.source === 'expiry') {
                        return Array.isArray(entry.data.deviceIds) ? entry.data.deviceIds : [];
                    }
                    if (entry.source === 'payment') {
                        return Array.isArray(entry.data.devices) ? entry.data.devices.map(d => d.deviceId) : [];
                    }
                    return [];
                })
                .map(val => {
                    if (!val) return null;
                    if (typeof val === 'string') return val;
                    if (typeof val.toString === 'function') return val.toString();
                    return null;
                })
                .filter(Boolean);
            const uniqueDeviceIds = [...new Set(deviceIdStrings)];
            let deviceMap = {};
            if (uniqueDeviceIds.length) {
                const orConditions = uniqueDeviceIds.map(id => {
                    if (/^[a-fA-F0-9]{24}$/.test(id)) {
                        try { return { _id: new ObjectId(id) }; } catch (_e) { /* ignore */ }
                    }
                    return { _id: id };
                }).filter(Boolean);
                const queryObj = orConditions.length > 1 ? { $or: orConditions } : orConditions[0] || {};
                if (Object.keys(queryObj || {}).length) {
                    const projection = {
                        name: 1,
                        imei: 1,
                        subscriptionPlanType: 1,
                        subscriptionEndDate: 1,
                        subscriptionDaysRemaining: 1,
                        subscriptionStatus: 1,
                        simPlanType: 1,
                        simExpiryDate: 1,
                        simDaysRemaining: 1
                    };
                    try {
                        const devices = await Mongo.findProjection('devices', queryObj, projection);
                        deviceMap = devices.reduce((acc, doc) => {
                            if (!doc?._id) return acc;
                            acc[doc._id.toString()] = doc;
                            return acc;
                        }, {});
                    } catch (e) {
                        console.error('Failed to hydrate notification devices', e?.message || e);
                    }
                }
            }

            const notifications = paginated.map(entry => {
                const r = entry.data;
                const id = r?._id?.toString() || null;
                if (entry.source === 'expiry') {
                    const deviceIds = (Array.isArray(r.deviceIds) ? r.deviceIds : []).map(raw => {
                        if (!raw) return null;
                        if (typeof raw === 'string') return raw;
                        if (typeof raw.toString === 'function') return raw.toString();
                        return null;
                    }).filter(Boolean);
                    const devices = deviceIds.map(key => {
                        const doc = key ? deviceMap[key] : undefined;
                        if (!doc) {
                            return {
                                deviceId: key,
                                name: null,
                                daysRemaining: null,
                                subscriptionEndDate: null,
                                planType: null
                            };
                        }
                        const subscriptionDaysRemaining = typeof doc.subscriptionDaysRemaining === 'number' ? doc.subscriptionDaysRemaining : null;
                        const simDaysRemaining = typeof doc.simDaysRemaining === 'number' ? doc.simDaysRemaining : null;
                        const daysRemaining = subscriptionDaysRemaining !== null ? subscriptionDaysRemaining : simDaysRemaining;
                        return {
                            deviceId: key,
                            name: doc.name || null,
                            imei: doc.imei || null,
                            planType: doc.subscriptionPlanType || doc.simPlanType || null,
                            subscriptionEndDate: doc.subscriptionEndDate || null,
                            subscriptionStatus: doc.subscriptionStatus || null,
                            subscriptionDaysRemaining,
                            simExpiryDate: doc.simExpiryDate || null,
                            simDaysRemaining,
                            daysRemaining
                        };
                    });
                    return {
                        id,
                        kind: r.type === 'subscription' ? 'expiry' : (r.type === 'subscription-threshold' ? 'threshold' : r.type),
                        dateStamp: r.dateStamp,
                        deviceCount: r.count ?? deviceIds.length,
                        deviceIds,
                        devices,
                        createdAt: r.createdAt || null,
                        emailSent: !!r.sentEmail,
                        whatsappSent: !!r.sentWhatsApp,
                        emailAttempts: r.emailAttempts ?? null,
                        whatsappAttempts: r.whatsappAttempts ?? null
                    };
                }

                // Payment success notification mapping
                const paymentDevicesRaw = Array.isArray(r.devices) ? r.devices : [];
                const deviceIds = paymentDevicesRaw.map(item => {
                    if (!item || !item.deviceId) return null;
                    if (typeof item.deviceId === 'string') return item.deviceId;
                    if (typeof item.deviceId.toString === 'function') return item.deviceId.toString();
                    return null;
                }).filter(Boolean);
                const devices = deviceIds.map(key => {
                    const doc = key ? deviceMap[key] : undefined;
                    const matching = paymentDevicesRaw.find(item => {
                        if (!item?.deviceId) return false;
                        try { return item.deviceId.toString() === key; } catch (_e) { return false; }
                    }) || null;
                    const subscriptionDaysRemaining = doc && typeof doc.subscriptionDaysRemaining === 'number' ? doc.subscriptionDaysRemaining : null;
                    const simDaysRemaining = doc && typeof doc.simDaysRemaining === 'number' ? doc.simDaysRemaining : null;
                    const daysRemaining = subscriptionDaysRemaining !== null ? subscriptionDaysRemaining : simDaysRemaining;
                    return {
                        deviceId: key,
                        name: doc?.name || null,
                        imei: doc?.imei || null,
                        planType: matching?.planType || doc?.subscriptionPlanType || doc?.simPlanType || null,
                        subscriptionEndDate: matching?.endDate || doc?.subscriptionEndDate || null,
                        subscriptionStatus: doc?.subscriptionStatus || null,
                        subscriptionDaysRemaining,
                        simExpiryDate: doc?.simExpiryDate || null,
                        simDaysRemaining,
                        daysRemaining,
                        paymentStartDate: matching?.startDate || null,
                        paymentEndDate: matching?.endDate || null
                    };
                });

                const userEmailStatus = r.userEmailResult?.status === true;
                const userWhatsAppStatus = r.userWhatsAppResult?.status === true;
                const amountDisplay = r.amountDisplay || (r.currency && r.amountFormatted ? `${r.currency} ${r.amountFormatted}` : null);
                const dateStamp = r.dateStamp || (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : null);

                return {
                    id,
                    kind: 'payment-success',
                    dateStamp,
                    deviceCount: r.deviceCount ?? deviceIds.length,
                    deviceIds,
                    devices,
                    createdAt: r.createdAt || null,
                    emailSent: userEmailStatus,
                    whatsappSent: userWhatsAppStatus,
                    emailAttempts: r.userEmailResult?.attempts ?? null,
                    whatsappAttempts: r.userWhatsAppResult?.attempts ?? null,
                    paymentDetails: {
                        paymentId: r.paymentId || id,
                        reference: r.reference || r.paymentMeta?.id || null,
                        amount: typeof r.amount === 'number' ? r.amount : null,
                        amountDisplay,
                        currency: r.currency || null,
                        method: r.method || null,
                        planType: r.planType || null,
                        paymentFor: r.paymentFor || null,
                        notes: r.notes || null,
                        status: r.status || null
                    }
                };
            });
            return res.status(200).json({ success: true, notifications, pagination: { page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit), total } });
        } catch (err) {
            console.error(err);
            return this.handleError(err, res);
        }
    }
}

module.exports = UserNotificationController;