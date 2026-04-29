const { createClient } = require('redis');
class Redis {
    constructor() {
        this.client = createClient();

        this.client.on('error', () => {
            // console.error('Redis Client Error');
        });

        this.client.on('connect', () => {
            console.log('Redis client connected successfully');

            console.log("Running flushall command on redis to clear prev socketids")
            this.flushData()
        });
        this.client.connect();
    }

    /* STORE as Comma Separated Values */
    async appendData(key, value) {
        try {
            await this.client.append(key, "," + value);
            return true;
        } catch (error) {
            console.error('Error appending data in Redis:', error);
            return false;
        }
    }

    /* Remove a value from the comma separated values */
    async removeAppendKey(key, value) {
        try {
            const res = await this.client.get(key);
            const values = res.split(',');
            const updatedValues = values.filter(v => v !== value && v !== '');
            if (updatedValues.length === 0) return this.removeKey(key);
            await this.removeKey(key);
            // console.log(updatedValues.join(','), "updatedValues");
            await this.client.set(key, updatedValues.join(','));
            return true;
        } catch (error) {
            console.error('Error removing key from Redis:', error);
            return false;
        }
    }

    async storeData(key, value) {
        try {
            const res = await this.client.set(key, value);
            return res === 'OK';
        } catch (error) {
            console.error('Error storing data in Redis:', error);
            return false;
        }
    }

    /* Expire the data after the given time */
    async storeDataWithExpiry(key, value, expiry) {
        try {
            const res = await this.client.set(key, value, { EX: expiry });
            return res === 'OK';
        } catch (error) {
            console.error('Error storing data in Redis:', error);
            return false;
        }
    }

    async removeKey(key) {
        try {
            const res = await this.client.del(key);
            return res === 1;
        } catch (error) {
            console.error('Error removing key from Redis:', error);
            return false;
        }
    }

    async getData(key) {
        try {
            const res = await this.client.get(key);
            return res;
        } catch (error) {
            console.error('Error getting data from Redis:', error);
            return null;
        }
    }

    mget = async (keys) => {
        try {
            const res = await this.client.mGet(keys);
            return res;
        } catch (error) {
            console.error('Error performing mget in Redis:', error);
            return null;
        }
    }

    async flushData() {
        try {
            await this.client.flushAll()
            return true
        } catch (error) {
            console.error('Error flushing data in Redis:', error);
            return false;
        }
    }

    async storeDeviceToken(key, value) {
        try {
            const res = await this.client.set(key + 'deviceToken', value);
            return res === 'OK';
        } catch (error) {
            console.error('Error storing data in Redis:', error);
            return false;
        }
    }

    async getDeviceToken(key) {
        try {
            const res = await this.client.get(key + 'deviceToken');
            return res;
        } catch (error) {
            console.error('Error getting data from Redis:', error);
            return null;
        }
    }
}

module.exports = new Redis();
