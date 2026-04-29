const jwt = require('jsonwebtoken');

/**
 * Middleware to check if the user is authenticated.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function.
*/

module.exports = function CheckUserAPIKeyAuthenticated(req, res, next) {
    const apikey = req.headers.apikey;
    if (!apikey) {
        return res.status(401).json({ success: false, error: 'Unauthorized: API Key Required' });
    }

    try {
        const decoded = jwt.verify(apikey, process.env.JWT_API_KEY_SECRET);
        req.user = decoded.user;
        if(!decoded?.user?.id && decoded?.user?.apikey === 'api_key') return res.status(401).json({ success: false, error: 'Unauthorized: Type Should Be API Key' });
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

};
