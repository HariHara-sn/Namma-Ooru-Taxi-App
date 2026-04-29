const Redis = require('../Controllers/DB/Redis');
const { RATE_LIMITS } = require('../Constants/DevApi');

module.exports = function rateLimit(scope) {
    return async function (req, res, next) {
        try {
            const limit = RATE_LIMITS[scope] || 60;
            const keyId = req.apiKey?.id;
            if (!keyId) return res.status(401).json({ success: false, error: 'Unauthorized' });
            const bucketKey = `rl:${keyId}:${scope}`;
            const ttl = 60;

            const count = await Redis.client.incr(bucketKey);
            if (count === 1) {
                await Redis.client.expire(bucketKey, ttl);
            }
            const remaining = Math.max(0, limit - count);
            const resetSec = Math.floor(Date.now() / 1000) + await Redis.client.ttl(bucketKey);

            res.set('x-rate-limit-limit', String(limit));
            res.set('x-rate-limit-remaining', String(Math.max(0, remaining)));
            res.set('x-rate-limit-reset', String(resetSec));

            if (count > limit) {
                return res.status(429).json({ success: false, error: 'Rate limit exceeded', errorCode: 'rate_limit_exceeded', limit, remaining: Math.max(0, remaining), reset: resetSec });
            }
            next();
        } catch (e) {
            console.error('[RateLimit]', e);
            next();
        }
    }
}
