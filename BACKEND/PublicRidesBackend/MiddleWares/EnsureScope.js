module.exports = function ensureScope(scope) {
    return function (req, res, next) {
        const scopes = req.apiKey?.scopes || [];
        if (!scopes.includes(scope)) {
            console.warn('[EnsureScope] insufficient scope', { required: scope, scopes });
            return res.status(403).json({ success: false, error: 'Insufficient scope', errorCode: 'insufficient_scope', requiredScope: scope, scopes });
        }
        next();
    }
}
