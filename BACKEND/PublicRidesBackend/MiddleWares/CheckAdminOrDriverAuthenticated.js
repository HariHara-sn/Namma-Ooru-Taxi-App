const jwt = require('jsonwebtoken');

/**
 * Middleware to check if the user is authenticated as either admin or driver.
 * Also supports long-lived access tokens for admin dashboard.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function.
 */
module.exports = function CheckAdminOrDriverAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        // First try to verify as admin token
        try {
            const adminDecoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
            console.log(adminDecoded);
            if (adminDecoded?.adminId) {

                return next();
            }
        } catch (adminError) {
            // If admin verification fails, try driver verification
        }

        // Try to verify as driver token
        try {
            const driverDecoded = jwt.verify(token, process.env.JWT_SECRET_DRIVER);
            if (driverDecoded?.driver?.id) {
                req.driver = driverDecoded.driver;
                req.userType = 'driver';
                return next();
            }
        } catch (driverError) {
            // If both fail, return unauthorized
        }

        // If we reach here, neither admin nor driver verification succeeded
        return res.status(401).json({ success: false, error: 'Unauthorized' });
        
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};

/**
 * Generate a long-lived access token for admin dashboard
 * @param {Object} adminData - Admin data to include in token
 * @param {string} expiresIn - Token expiration time (default: 1 year)
 * @returns {string} JWT token
 */
module.exports.generateAdminAccessToken = function(adminData, expiresIn = '365d') {
    return jwt.sign(
        { 
            admin: adminData,
            tokenType: 'admin_access',
            generatedAt: new Date().toISOString()
        },
        process.env.JWT_SECRET_ADMIN,
        { expiresIn }
    );
};

/**
 * Generate a long-lived access token for driver dashboard
 * @param {Object} driverData - Driver data to include in token
 * @param {string} expiresIn - Token expiration time (default: 1 year)
 * @returns {string} JWT token
 */
module.exports.generateDriverAccessToken = function(driverData, expiresIn = '365d') {
    return jwt.sign(
        { 
            driver: driverData,
            tokenType: 'driver_access',
            generatedAt: new Date().toISOString()
        },
        process.env.JWT_SECRET_DRIVER,
        { expiresIn }
    );
};
