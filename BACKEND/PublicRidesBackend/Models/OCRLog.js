const Mongo = require('../Controllers/DB/Mongo');
const scanCountConfig = require('../Core/PublicRides/ScanCount');

const COLLECTION = 'ocrlog';

const normalizeDocType = (docType) => {
    if (typeof docType !== 'string') return 'unknown';
    const trimmed = docType.trim();
    return trimmed ? trimmed.toLowerCase() : 'unknown';
};

const normalizeDriverId = (driverId) => {
    if (!driverId) return null;
    return String(driverId);
};

class OCRLog {
    static collectionReady = false;

    static getMaxScanCount(docType) {
        const normalizedDocType = normalizeDocType(docType);

        if (scanCountConfig && typeof scanCountConfig === 'object') {
            for (const [key, value] of Object.entries(scanCountConfig)) {
                if (key.toLowerCase() === normalizedDocType) {
                    const parsed = Number(value);
                    if (Number.isFinite(parsed) && parsed > 0) {
                        return parsed;
                    }
                }
            }
        }

        const defaultValue = Number(scanCountConfig?.MAX_SCAN_COUNT);
        if (Number.isFinite(defaultValue) && defaultValue > 0) {
            return defaultValue;
        }
        return 5;
    }

    static async ensureCollection() {
        if (OCRLog.collectionReady) {
            return;
        }
        try {
            await Mongo.createIndex(COLLECTION, { driverId: 1 });
        } catch (err) {
            console.warn('Failed to ensure ocrlog index:', err.message);
        }
        OCRLog.collectionReady = true;
    }

    static buildDocsArray(record) {
        if (!record || !Array.isArray(record.docs)) return [];
        return record.docs;
    }

    static async canScan(docType, driverId) {
        await OCRLog.ensureCollection();
        const normalizedDocType = normalizeDocType(docType);
        const normalizedDriverId = normalizeDriverId(driverId);
        const record = await Mongo.findOne(COLLECTION, { driverId: normalizedDriverId });

        if (!record) {
            return true;
        }

        const docs = OCRLog.buildDocsArray(record);
        const existingDoc = docs.find((doc) => doc.docType === normalizedDocType);

        if (!existingDoc) {
            return true;
        }

        const maxScanCount = OCRLog.getMaxScanCount(normalizedDocType);
        const currentCount = Number(existingDoc.count) || 0;
        return currentCount < maxScanCount;
    }

    static async increment(docType, driverId) {
        await OCRLog.ensureCollection();
        const normalizedDocType = normalizeDocType(docType);
        const normalizedDriverId = normalizeDriverId(driverId);
        const maxScanCount = OCRLog.getMaxScanCount(normalizedDocType);
        const now = Date.now();

        const record = await Mongo.findOne(COLLECTION, { driverId: normalizedDriverId });

        if (!record) {
            const docs = [{
                docType: normalizedDocType,
                count: 1,
                createdAt: now,
                updatedAt: now,
            }];
            await Mongo.insertOne(COLLECTION, {
                driverId: normalizedDriverId,
                docs,
                createdAt: now,
                updatedAt: now,
            });
            return 1;
        }

        const docs = OCRLog.buildDocsArray(record);
        const docIndex = docs.findIndex((doc) => doc.docType === normalizedDocType);

        if (docIndex >= 0) {
            const currentCount = Number(docs[docIndex].count) || 0;
            if (currentCount >= maxScanCount) {
                throw new Error('MAX_SCAN_COUNT_REACHED');
            }
            docs[docIndex] = {
                ...docs[docIndex],
                count: currentCount + 1,
                updatedAt: now,
            };
        } else {
            docs.push({
                docType: normalizedDocType,
                count: 1,
                createdAt: now,
                updatedAt: now,
            });
        }

        await Mongo.updateOne(
            COLLECTION,
            { _id: record._id },
            {
                docs,
                updatedAt: now,
            }
        );

        const updatedEntry = docs.find((doc) => doc.docType === normalizedDocType);
        return Number(updatedEntry?.count) || 0;
    }
}

module.exports = OCRLog;
