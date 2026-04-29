
const Mongo = require('../Controllers/DB/Mongo');
const { DatabaseInsertFailed } = require('./Exeptions');

const COLLECTION_NAME = 'feedbacks';

class Feedback {
    static addFeedback = async (feedback) => {
        // const sanitized = sanitizeDocument(feedback);
        const result = await Mongo.insertOne(COLLECTION_NAME, feedback);
        if (result.acknowledged) return result;
        else throw new DatabaseInsertFailed('Failed to add feedback to databse -- Insert Failed');
    }
}

module.exports = Feedback;
// ...existing code...
// Remove duplicate Feedback class declaration


