const { ObjectId } = require('mongodb');
const Mongo = require('../Controllers/DB/Mongo');

const COLLECTION_NAME = 'emergencyContacts'

class EmergencyContacts {

    static async getByUser(userId, userType) {
        const result = await Mongo.findOne(COLLECTION_NAME, { userId, userType });
        return result;
    }

    static async getForPassenger(passengerId, userType) {
        return await this.getByUser(passengerId, userType);
    }

    static async setContacts(userId, userType, contacts = []) {
        const now = Date.now();
        const sanitizedContacts = (contacts || []).map(contact => ({
            contactId: contact.contactId ? new ObjectId(contact.contactId) : new ObjectId(),
            name: contact.name,
            phone: contact.phone,
            addedAt: contact.addedAt || now
        }));

        const filter = { userId, userType };
        const updateDoc = {
            $set: { contacts: sanitizedContacts, updatedAt: now },
            $setOnInsert: { userId, userType, createdAt: now }
        };
        const result = await Mongo.updateOneRawUpsert(COLLECTION_NAME, filter, updateDoc);
        return result;
    }

    static async setContactsForPassenger(passengerId, userType, contacts = []) {
        return await this.setContacts(passengerId, userType, contacts);
    }

    static async addContact(userId, userType, contact) {
        await Mongo.insertOne(COLLECTION_NAME, { userId, userType, contacts: contact });
        return contact;
    }

    static async addContactForPassenger(passengerId, userType, contact) {
        return await this.addContact(passengerId, userType, contact);
    }



    static async updateContactForPassenger(passengerId, userType, contacts = []) {
        const now = Date.now();
        // Use the updateOneRawUpsert method to prevent $set error in replacement context
        const filter = { userId: passengerId, userType };
        const updateDoc = {
            $set: { contacts, updatedAt: now },
            $setOnInsert: { userId: passengerId, userType, createdAt: now }
        };
        return await Mongo.updateOneRawUpsert(COLLECTION_NAME, filter, updateDoc);
    }


    static async removeContact(userId, userType, contactId) {
        const now = Date.now();
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { userId, userType }, { contacts: { contactId: new ObjectId(contactId) } });
        await Mongo.updateOne(COLLECTION_NAME, { userId, userType }, { updatedAt: now });
        return result;
    }

    static async removeContactForPassenger(passengerId, userType, contactId) {
        return await this.removeContact(passengerId, userType, contactId);
    }

    static async removeContactByPhone(userId, userType, phone) {
        const now = Date.now();
        const result = await Mongo.updateOnePull(COLLECTION_NAME, { userId, userType }, { contacts: { phone } });
        await Mongo.updateOne(COLLECTION_NAME, { userId, userType }, { updatedAt: now });
        return result;
    }

    static async removeContactByPhoneForPassenger(passengerId, userType, phone) {
        return await this.removeContactByPhone(passengerId, userType, phone);
    }
}

module.exports = EmergencyContacts;


