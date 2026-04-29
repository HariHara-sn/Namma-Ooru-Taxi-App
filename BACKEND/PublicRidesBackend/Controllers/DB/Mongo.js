const { MongoClient } = require('mongodb');
const { indexes } = require('./indexes');
const FareEngineInterface = require('../../fareEngine/FareEngineInterface');

class MongoDBDatabase {
    constructor() {
        this.client = new MongoClient(process.env.MONGO_URL, {});
        this.database = null; // Will be assigned the database instance upon connection
        this.connect()
        console.log("Connecting to MongoDB", process.env.MONGO_URL + '/' + process.env.MONGO_DATABASE)
    }

    async ensureReady() {
        if (!this.database) {
            await this.connect();
        }
        if (!this.database) {
            throw new Error('MongoDB not connected');
        }
    }

    async connect() {
        try {
            await this.client.connect();
            console.log("Connected to MongoDB", process.env.MONGO_DATABASE)

            this.database = this.client.db(process.env.MONGO_DATABASE);
            console.log('Connected successfully to MongoDB');
            await FareEngineInterface.init(process.env.MONGO_URL + '/' + process.env.MONGO_DATABASE);
            await this.createIndexes(indexes);
        } catch (error) {
            console.error('Connection to MongoDB failed:', error);
        }
    }

    async disconnect() {
        await this.client.close();
        console.log('Disconnected from MongoDB');
    }

    async aggregate(collection, pipeline) {
        await this.ensureReady();
        return this.database.collection(collection).aggregate(pipeline).toArray();
    }

    async findOne(collection, query) {
        await this.ensureReady();
        return this.database.collection(collection).findOne(query);
    }

    async findOneSorted(collection, query, sort) {
        return this.database.collection(collection).find(query).sort(sort).limit(1).next(); // next() returns a single document from cursor
    }

    async findOneProjection(collection, query, projection) {
        await this.ensureReady();
        return this.database.collection(collection).findOne(query, { projection });
    }

    async find(collection, query) {
        await this.ensureReady();
        return this.database.collection(collection).find(query).toArray();
    }

    async findSort(collection, query, sort) {
        return this.database.collection(collection).find(query).sort(sort).toArray();
    }

    async findProjection(collection, query, projection) {
        return this.database.collection(collection).find(query).project(projection).toArray();
    }

    async findPagination(collection, query, skip = 0, limit = 10, sort = null) {
        const cursor = this.database.collection(collection)
            .find(query)
            .skip(skip) // Skip the specified number of documents
            .limit(limit); // Limit the number of documents returned
        if (sort) {
            cursor.sort(sort); // Sort if sort parameter is not null
        }
        return cursor.toArray(); // Convert the result to an array
    }

    async findPaginationWithProject(collection, query, projection, skip = 0, limit = 10, sort = null) {
        const cursor = this.database.collection(collection)
            .find(query)
            .project(projection)
            .skip(skip) // Skip the specified number of documents
            .limit(limit); // Limit the number of documents returned
        if (sort) {
            cursor.sort(sort); // Sort if sort parameter is not null
        }
        return cursor.toArray(); // Convert the result to an array
    }

    async insertOne(collection, document) {
        await this.ensureReady();
        return this.database.collection(collection).insertOne(document);
    }

    async insertMany(collection, documents) {
        return this.database.collection(collection).insertMany(documents);
    }

    async updateOnePush(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, { $push: updateDoc });
    }
    async updateOneAddToSet(collection, filter, updateDoc) {
        await this.ensureReady();
        return this.database.collection(collection).updateOne(filter, { $addToSet: updateDoc });
    }
    async updateOne(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, { $set: updateDoc });
    }

    async updateOneIncreament(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, { $inc: updateDoc });
    }

    async updateOneUpsert(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, { $setOnInsert: updateDoc }, { upsert: true });
    }

    async updateOneRaw(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, updateDoc);
    }

    async updateOnePull(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, { $pull: updateDoc });
    }

    async updateManyPull(collection, filter, updateDoc) {
        return this.database.collection(collection).updateMany(filter, { $pull: updateDoc });
    }

    async updateMany(collection, filter, updateDoc) {
        return this.database.collection(collection).updateMany(filter, { $set: updateDoc });
    }

    async updateManyRaw(collection, filter, updateDoc) {
        return this.database.collection(collection).updateMany(filter, updateDoc);
    }

    async updateOneRawUpsert(collection, filter, updateDoc) {
        return this.database.collection(collection).updateOne(filter, updateDoc, { upsert: true });
    }

    async findOneAndUpdateRaw(collection, filter, updateDoc) {
        return this.database.collection(collection).findOneAndUpdate(filter, updateDoc);
    }

    async bulkWrite(collection, updateDoc) {
        return this.database.collection(collection).bulkWrite(updateDoc);
    }

    async deleteOne(collection, filter) {
        return this.database.collection(collection).deleteOne(filter);
    }

    async deleteMany(collection, filter) {
        return this.database.collection(collection).deleteMany(filter);
    }

    async replaceOne(collection, filter, updateDoc) {
        return this.database.collection(collection).replaceOne(filter, updateDoc);
    }

    async dropdatabase() {
        this.database.dropDatabase()
        console.log("Dropped Exist testing Data")
    }

    async countDocuments(collectionName, filter = {}) {
        const collection = this.database.collection(collectionName)
        return await collection.countDocuments(filter);
    }

    async createIndexes(indexes) {
        try {
            const promises = [];

            for (const collection of Object.keys(indexes)) {
                for (const index of indexes[collection]) {
                    promises.push(this.createIndex(collection, index));
                }
            }

            await Promise.all(promises);
            console.log("All indexes created successfully");
        } catch (error) {
            console.error("Error creating indexes:", error);
        }
    }

    async createIndex(collection, index) {
        try {
            // Check if collection exists
            const collectionExists = await this.database.listCollections({ name: collection }).toArray();
            if (collectionExists.length === 0) {
                console.log(`Collection '${collection}' does not exist. Creating collection.`);
                await this.database.createCollection(collection);
            }

            // Check if index already exists
            const existingIndexes = await this.database.collection(collection).listIndexes().toArray();
            const indexExists = existingIndexes.some(existingIndex =>
                JSON.stringify(existingIndex.key) === JSON.stringify(index));

            if (indexExists) {
                console.log(`Index already exists on collection '${collection}'`);
                return;
            }

            // Create the index
            const result = await this.database.collection(collection).createIndex(index);
            console.log(`Index created for '${collection}':`, result);
            return result;
        } catch (error) {
            console.error(`Error creating index for collection '${collection}':`, error);
            throw error;
        }
    }

    async dropCollection(collectionName) {
        await this.database.collection(collectionName).drop();
        console.log(`Collection '${collectionName}' dropped.`);
    }

    async createNewCollection(collectionName) {

        // Drop collection if exists
        const collections = await this.database.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
            await this.database.collection(collectionName).drop();
            console.log(`Collection '${collectionName}' dropped.`);
        }

        await this.database.createCollection(collectionName);
        this.database.collection(collectionName).createIndex({ location: "2dsphere" });
        console.log(`Collection '${collectionName}' created `);
    }

    async distinct(collectionName, field, query = {}) {
        return this.database.collection(collectionName).distinct(field, query);
    }

    async close() {
        await this.client.close();
        console.log('Disconnected from MongoDB');
    }
}



module.exports = new MongoDBDatabase(); // Export a singleton instance