const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Redis = require("../Controllers/DB/Redis");

module.exports = async function checkDriverAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_DRIVER);
        const driverId = decoded.driver.id;

        // Prefer real jti when present; otherwise derive a stable legacy id from token
        const derivedJti = decoded.jti || `legacy:${crypto.createHash('sha256').update(token).digest('hex').slice(0, 32)}`;

        const isActive = await Redis.getData(`driver_token:${derivedJti}`);
        const activeToken = await Redis.getData(`driver_active_token:${driverId}`);

        const nowSeconds = Math.floor(Date.now() / 1000);
        const expSeconds = decoded.exp; // may be undefined for non-expiring tokens
        const remainingTtl = expSeconds ? expSeconds - nowSeconds : null; // null => no expiry

        const setWithOptionalTtl = async (key, value) => {
            if (remainingTtl !== null && remainingTtl > 0) {
                return Redis.storeDataWithExpiry(key, value, remainingTtl);
            }
            return Redis.storeData(key, value);
        };

        // If both entries missing, rehydrate
        if (!isActive && !activeToken) {
            await setWithOptionalTtl(`driver_token:${derivedJti}`, 'active');
            await setWithOptionalTtl(`driver_active_token:${driverId}`, derivedJti);
        } else if (!isActive && activeToken === derivedJti) {
            // Active pointer exists but token flag missing
            await setWithOptionalTtl(`driver_token:${derivedJti}`, 'active');
        } else if (isActive && !activeToken) {
            // Token flag exists but active pointer missing (rare)
            await setWithOptionalTtl(`driver_active_token:${driverId}`, derivedJti);
        } else if (activeToken !== derivedJti) {
            // Another session is marked active
            return res.status(401).json({
                success: false,
                error: "SESSION_EXPIRED",
            });
        }

        req.driver = decoded.driver;
        next();
    } catch (error) {
        console.error("JWT verify error:", error);
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }
};
