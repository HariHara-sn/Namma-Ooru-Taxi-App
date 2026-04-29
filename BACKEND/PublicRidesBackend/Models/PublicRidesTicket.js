const Mongo = require('../Controllers/DB/Mongo');

const TICKET_CATEGORY_COLLECTION_NAME = 'ticketcategories'

class PublicRidesTicket {
    static getPublicRidesTickets = async () => {
        const result = await Mongo.find(TICKET_CATEGORY_COLLECTION_NAME, {});
        return result;
    }
}

module.exports = PublicRidesTicket;
