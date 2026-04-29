const Controller = require('../Controller');
const OCRAPI = require('./OCRAPI');
const OCRLog = require('../../Models/OCRLog');

class OCRController extends Controller {

    constructor() {
        super()
    }
    
    scanDocument = async (req, res) => {
        const driverId = req.driver.id;
        const { image, docType } = req.body;
        try {
            if (!docType || typeof docType !== 'string' || docType.trim() === '') {
                return res.status(400).json({ success: false, message: 'docType is required' });
            }
            const canScan = await OCRLog.canScan(docType, driverId);
            if (!canScan) {
                return res.status(429).json({ success: false, message: 'max_scan_reached' });
            }
            const result = await OCRAPI.scanIdDocument(image, docType);
            const usageCount = await OCRLog.increment(docType, driverId);
            // console.log(`OCR scan successful for`, result);
            return res.status(200).json({ success: true, data: result, usageCount });
        } catch (err) {
            if (err?.message === 'MAX_SCAN_COUNT_REACHED') {
                return res.status(429).json({ success: false, message: 'max_scan_reached' });
            }
            return this.handleError(err, res);
        }
    }

}

module.exports = OCRController