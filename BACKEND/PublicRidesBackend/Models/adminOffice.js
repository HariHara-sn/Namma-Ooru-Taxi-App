const Mongo = require('../Controllers/DB/Mongo');

const COLLECTION_NAME = "adminOffice";

class AdminOffice {
    static getAdminOffice = async () => {
        return Mongo.find(COLLECTION_NAME, {}, { limit: 1 }).then(docs => docs[0] || null);
    }
}

module.exports = AdminOffice;