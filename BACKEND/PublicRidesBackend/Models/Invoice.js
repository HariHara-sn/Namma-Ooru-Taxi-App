const Mongo = require('../Controllers/DB/Mongo');

const COLLECTION = 'invoices';

class InvoiceModel {
    static async create(doc) {
        const now = Date.now();
        const payload = {
            invoiceNumber: doc.invoiceNumber,
            userId: doc.userId ? String(doc.userId) : null,
            billing: doc.billing || {},
            seller: doc.seller || {},
            invoice: doc.invoice || {},
            status: doc.status || 'PAID',
            payment: doc.payment || {},
            items: doc.items || [],
            tax: doc.tax || {},
            totals: doc.totals || {},
            meta: doc.meta || {},
            file: doc.file || {},
            createdAt: now,
            updatedAt: now
        };
        return Mongo.insertOne(COLLECTION, payload);
    }

    static async markEmailSent(invoiceNumber) {
        return Mongo.updateOne(COLLECTION, { invoiceNumber }, { 'meta.emailSent': true, updatedAt: Date.now() });
    }

    static async listByUser(userId, page = 1, limit = 10) {
        const filter = { userId: String(userId) };
        const skip = (page - 1) * limit;
        const items = await Mongo.findPagination(COLLECTION, filter, skip, limit, { createdAt: -1 });
        const total = await Mongo.countDocuments(COLLECTION, filter);
        return { items, total };
    }

    static async listAll(filter = {}, page = 1, limit = 10) {
        const q = { ...filter };
        const skip = (page - 1) * limit;
        const items = await Mongo.findPagination(COLLECTION, q, skip, limit, { createdAt: -1 });
        const total = await Mongo.countDocuments(COLLECTION, q);
        return { items, total };
    }

    static async getByNumber(invoiceNumber) {
        return Mongo.findOne(COLLECTION, { invoiceNumber });
    }
}

module.exports = InvoiceModel;
