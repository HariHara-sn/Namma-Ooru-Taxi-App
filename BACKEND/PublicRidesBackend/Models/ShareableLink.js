const { ObjectId } = require("mongodb")
const Mongo = require("../Controllers/DB/Mongo")
const { DatabaseInsertFailed } = require("./Exeptions")

const COLLECTION_NAME = 'sharableLinks'

class ShareableLink {
    static addShareableLink = async (payload) => {
        const result = await Mongo.insertOne(COLLECTION_NAME, payload)
        if (!result.acknowledged) return DatabaseInsertFailed("Unable to add Link")
        return result
    }

    static getShareableLinks = async (deviceId) => {
        const result = await Mongo.findSort(COLLECTION_NAME, { deviceId: new ObjectId(deviceId) }, { _id: -1 })
        return result
    }
}

module.exports = ShareableLink