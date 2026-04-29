const Controller = require('../Controller');
const Mongo = require('../DB/Mongo');
const { ObjectId } = require('mongodb');

class UserPaymentController extends Controller {
    constructor() {
        super();
        this.collection = 'gps_sim_payment';
        this.subscriptionsCollection = 'gps_sim_subscription';
    }

    calculateDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const parseDate = (value) => {
            if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
            if (typeof value === 'number') {
                const d = new Date(value);
                return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            }
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    const iso = `${trimmed}T00:00:00Z`;
                    const d = new Date(iso);
                    return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
                }
                const d = new Date(trimmed);
                return isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
            }
            return null;
        };
        const candidate = parseDate(endDate);
        if (!candidate) return null;
        const utcEnd = Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth(), candidate.getUTCDate());
        const today = new Date();
        const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        const diff = Math.floor((utcEnd - utcToday) / (1000 * 60 * 60 * 24));
        return diff < 0 ? 0 : diff;
    };

    // GET /user/payments  (auth: user)
    // Query params: page, limit
    listMyPayments = async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        try {
            const { page, limit, search } = req.query || {};
            const parsedPage = page ? Math.max(parseInt(page, 10), 1) : 1;
            const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 50) : 20;
            const skip = (parsedPage - 1) * parsedLimit;
            const query = { userId };
            if (search) {
                const regex = new RegExp(search, 'i');
                const or = [
                    { reference: { $regex: regex } },
                    { method: { $regex: regex } },
                    { currency: { $regex: regex } },
                    { planType: { $regex: regex } },
                    { paymentFor: { $regex: regex } }
                ];
                // allow direct lookup by paymentId if looks like ObjectId
                if (/^[a-fA-F0-9]{24}$/.test(search)) {
                    or.push({ _id: new ObjectId(search) });
                }
                query.$or = or;
            }
            const total = await Mongo.countDocuments(this.collection, query);
            const payments = await Mongo.findPagination(this.collection, query, skip, parsedLimit, { createdAt: -1 });

            // For each payment fetch associated subscriptions (device + dates)
            const paymentIds = payments.map(p => p._id?.toString()).filter(Boolean);
            const subsMap = {};
            if (paymentIds.length) {
                const subs = await Mongo.findProjection(this.subscriptionsCollection, { paymentId: { $in: paymentIds } }, { _id: 1, paymentId: 1, deviceId: 1, startDate: 1, endDate: 1, status: 1, planType: 1, remainingDays: 1 });
                for (const s of subs) {
                    const pid = s.paymentId;
                    if (!subsMap[pid]) subsMap[pid] = [];
                    const computedRemainingDays = this.calculateDaysRemaining(s.endDate);
                    const finalRemainingDays = computedRemainingDays !== null ? computedRemainingDays : (s.remainingDays ?? null);
                    subsMap[pid].push({
                        subscriptionId: s._id?.toString() || null,
                        deviceId: s.deviceId,
                        planType: s.planType || null,
                        startDate: s.startDate || null,
                        endDate: s.endDate || null,
                        status: s.status || null,
                        remainingDays: finalRemainingDays,
                        daysRemaining: finalRemainingDays
                    });
                }
            }

            const enriched = payments.map(p => {
                const subs = subsMap[p._id?.toString()] || [];
                const planSummary = p.planInfo ? {
                    planId: p.planInfo.planId || null,
                    name: p.planInfo.name || null,
                    amountPerDevice: p.planInfo.amountPerDevice || null,
                    duration: p.planInfo.duration || null,
                    currency: p.planInfo.currency || p.currency || null
                } : null;
                return {
                    paymentId: p._id?.toString() || null,
                    amount: p.amount,
                    currency: p.currency,
                    method: p.method,
                    status: p.status,
                    paymentFor: p.paymentFor || null,
                    reference: p.reference || null,
                    createdAt: p.createdAt,
                    deviceCount: subs.length,
                    plan: planSummary,
                    subscriptions: subs
                };
            });

            return res.status(200).json({
                success: true,
                payments: enriched,
                pagination: { page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit), total },
                filters: { search: search || null }
            });
        } catch (err) {
            console.error(err);
            return this.handleError(err, res);
        }
    }
}

module.exports = UserPaymentController;