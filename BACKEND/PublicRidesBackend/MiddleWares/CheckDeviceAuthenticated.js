
const jwt = require('jsonwebtoken');

/**
 * Middleware to check if the user is authenticated.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function.
 */
module.exports = function CheckDeviceAuthenticated(req, res, next) {
    const authHeader = req.headers['x-device-auth'];
    if (!authHeader) {
        console.log('No auth header provided')
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.log('No token provided')
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.DEVICE_IDENTITY_SECRET);
        req.device = {
            id: decoded.deviceID,
        };
        req.user = {
            id: decoded.id
        };
        next();
    } catch (error) {
        console.log("Device Token Expired")
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};