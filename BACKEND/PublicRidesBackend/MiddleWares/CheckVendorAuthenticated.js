
const jwt = require('jsonwebtoken');
const Vendors = require('../Models/Vendor');
/**
 * Middleware to check if the user is authenticated.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function.
 */
module.exports = async function CheckVendorAuthenticated(req, res, next) {
    const authHeader = req.headers['Authorization'];
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
        const decoded = jwt.verify(token, process.env.JWT_VENDOR_SECRET);
        if(decoded.vendorId) {
            const vendor = await Vendors.getVendor(decoded.vendorId);
            if(!vendor) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }
            req.vendorId = vendor._id;
            req.fleetSysId = decoded.vendorId;
        } else {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

       
        next();
    } catch (error) {
        console.log("Device Token Expired")
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};