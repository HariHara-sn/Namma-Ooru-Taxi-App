const dotenv = require('dotenv');
dotenv.config({
    path: '../.env.test'
});
const Mongo = require('../Controllers/DB/Mongo');

const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const testfolderPath = "../testData"

const importData=async() => {
    if (process.env.MONGO_DATABASE === 'testLocationTracking'){
        const files = fs.readdirSync(testfolderPath);
        await Mongo.dropdatabase()
       
        for (const file of files) {
    
            if (file.endsWith('.json')) {
                const collectionName = path.parse(file).name;
                const filePath = path.join(testfolderPath, file);
                const data = JSON.parse(fs.readFileSync( filePath, 'utf8'));
                
                const modifiedData = data.map(document => {
                    for (const [key, value] of Object.entries(document)) {
                        if (value && typeof value === 'object' && value.$oid) {
                            document[key] = new ObjectId(value.$oid);
                        }
                    }
                    return document;
                });

                await Mongo.insertMany(collectionName, modifiedData);
                console.log(`Test data imported '${collectionName}' successfully`);
            }
        }

    }
}
setTimeout(importData, 1000);