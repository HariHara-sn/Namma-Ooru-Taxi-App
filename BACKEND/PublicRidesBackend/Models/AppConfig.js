const Mongo = require('../Controllers/DB/Mongo');

const COLLECTION_NAME = 'publicRidesAppConfig';

class AppConfig {
    static async getPublicRidesCustomerAppConfig() {
        const query = { APP: 'PUBLICRIDE_CUSTOMER_APP' };
        const result = await Mongo.findOne(COLLECTION_NAME, query);
        return result;
    }

    static async getOnboardingConfig() {
        const query = { type: 'ONBOARDING_CONFIG' };
        const result = await Mongo.findOne(COLLECTION_NAME, query);
        return result;
    }
}

module.exports = AppConfig;