const Controller = require('../Controller');
const Mongo = require('../DB/Mongo');
const { ObjectId } = require('mongodb');

class UserSubscriptionController extends Controller {
    constructor() {
        super();
        this.collection = 'gps_sim_subscription';
    }

    // GET /user/subscriptions?active=true&deviceId=...&page=&limit=
    listMySubscriptions = async (req, res) => {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        try {
            const { active, deviceId, page, limit, search } = req.query || {};
            const parsedPage = page ? Math.max(parseInt(page, 10), 1) : 1;
            const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10), 1), 100) : 20;
            const skip = (parsedPage - 1) * parsedLimit;

            const query = { userId };
            if (deviceId) query.deviceId = deviceId;
            // active=true => only active (non-expired) subscriptions
            // active=false => only expired subscriptions
            if (active === 'true' || active === '1') {
                query.status = 'active';
            } else if (active === 'false' || active === '0') {
                query.status = 'expired';
            }
            if (search) {
                const regex = new RegExp(search, 'i');
                const or = [
                    { deviceId: { $regex: regex } },
                    { planType: { $regex: regex } },
                    { paymentId: { $regex: regex } }
                ];
                if (/^[a-fA-F0-9]{24}$/.test(search)) {
                    or.push({ _id: new ObjectId(search) });
                }
                query.$or = or;
            }

            let total = await Mongo.countDocuments(this.collection, query);
            let subs = await Mongo.findPagination(this.collection, query, skip, parsedLimit, { createdAt: -1 });

            // Defensive: ensure active=true enforces non-past endDate in addition to status.
            const activeRequested = active === 'true' || active === '1';
            if (activeRequested && Array.isArray(subs) && subs.length) {
                subs = subs.filter(s => s?.status === 'active' && this.calculateDaysRemaining ? (this.calculateDaysRemaining(s?.endDate) ?? -1) >= 0 : true);
                // We don't know total without another count; keep best-effort total for page length
                total = subs.length;
            }

            const enriched = subs.map(s => ({
                subscriptionId: s._id?.toString() || null,
                deviceId: s.deviceId,
                planType: s.planType || null,
                startDate: s.startDate || null,
                endDate: s.endDate || null,
                status: s.status || null,
                remainingDays: s.remainingDays ?? null,
                renewedFrom: s.renewedFrom || null,
                paymentId: s.paymentId || null
            }));

            return res.status(200).json({
                success: true,
                subscriptions: enriched,
                pagination: { page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit), total },
                filters: {
                    active: active === 'true' || active === '1' ? true : (active === 'false' || active === '0' ? false : null),
                    expiredOnly: active === 'false' || active === '0',
                    deviceId: deviceId || null,
                    search: search || null
                }
            });
        } catch (err) {
            console.error(err);
            return this.handleError(err, res);
        }
    }

    // Alias endpoint handler for /user/subscriptions/active
    listMyActiveSubscriptions = async (req, res) => {
        req.query = { ...req.query, active: 'true' };
        return this.listMySubscriptions(req, res);
    }
}

module.exports = UserSubscriptionController;