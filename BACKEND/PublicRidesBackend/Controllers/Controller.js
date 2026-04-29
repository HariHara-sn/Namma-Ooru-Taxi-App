const { v4: uuidv4 } = require('uuid');
const { DatabaseInsertFailed, DatabaseDeleteFailed, DatabaseUpdateFailed } = require('../Models/Exeptions');
const jwt = require('jsonwebtoken');
const { BSONError } = require('bson');
const Redis = require('./DB/Redis');

class Controller {

    constructor() {
        this.MAX_PAGINATION_LIMIT = 100;
    }

    createUniqueId = () => {
        return uuidv4();
    }

    validate = async (data, schema) => {
        try {
            const value = await schema.validateAsync(data);
            return [value, { success: true }];
        } catch (error) {
            console.log(error)
            return [null, { error: error.details[0].message, success: false }];
        }
    }

    validateBulkPassengers = async (data, schema) => {
        const validPassengers = [];
        const invalidPassengers = [];
    
        for (let i = 0; i < data.length; i++) {
            try {
                const value = await schema.validateAsync(data[i]);
                validPassengers.push(value);
            } catch (error) {
                invalidPassengers.push({
                    index: i,
                    error: error.details[0].message,
                    data: data[i]
                });
            }
        }

        console.log({
            validPassengers,
            invalidPassengers
        })
    
        return {
            validPassengers,
            invalidPassengers,
            success: true
        };
    };

    createJWT = async (data, secret, expiry = undefined, alg = "HS256") => {
        try {
            const options = { algorithm: alg };
            if (expiry) {
                options.expiresIn = expiry;
            }
            const token = await jwt.sign(data, secret, options);
            return token;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    createDriverJWT = async (data, secret, alg = "HS256") => {
        try {
            const jti = uuidv4(); // unique token identifier
            const payload = { ...data, jti };
            
            // Create JWT without expiry - permanent token
            const jwtOptions = { algorithm: alg };
            const token = jwt.sign(payload, secret, jwtOptions);
      
            const driverId = data.driver.id;
      
            // ❗ Remove any previous session for this driver
            const oldJti = await Redis.getData(`driver_active_token:${driverId}`);
            if (oldJti) {
                await Redis.removeKey(`driver_token:${oldJti}`);
                await Redis.removeKey(`driver_active_token:${driverId}`);
            }
      
            // ❗ Mark new token as active - store permanently (no expiry)
            await Redis.storeData(`driver_token:${jti}`, "active");
            await Redis.storeData(`driver_active_token:${driverId}`, jti);
      
            return token;
        } catch (error) {
            console.error("JWT Create Error:", error);
            return null;
        }
    };
    
    validateJWT = async (token, secret, alg = "HS256") => {
        try {
            const decoded = jwt.verify(token, secret, { algorithm: alg });
            return [decoded, { success: true }];
        } catch (error) {
            console.log(error);
            return [null, { error: error.message, success: false }];
        }
    }

    handleError = async (err, res) => {


        console.log(err)

        if (err instanceof DatabaseInsertFailed) {
            return res.status(400).json({
                error: err.message,
                success: false
            });
        }

        if (err instanceof DatabaseDeleteFailed) {
            return res.status(400).json({
                error: err.message,
                success: false
            });
        }

        if (err instanceof DatabaseUpdateFailed) {
            return res.status(400).json({
                error: err.message,
                success: false
            });
        }

        if (err instanceof BSONError) {
            return res.status(400).json({
                error: 'Invalid data',
                success: false
            });
        }
        res.status(500).json({
            error: 'Internal server error',
            success: false
        });
    }

}

module.exports = Controller;