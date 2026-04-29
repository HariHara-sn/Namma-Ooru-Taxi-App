


const jwt = require('jsonwebtoken');

/**
 * Middleware to check if the user is authenticated.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function.
 */
module.exports = function checkUserAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        if(!decoded?.user?.id) return res.status(401).json({ success: false, error: 'Unauthorized' });
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};
