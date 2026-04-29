const jwt = require('jsonwebtoken')

class JWT{
    static createJWT = async (data, secret, alg = "HS256") => {
        try {
            const token = jwt.sign(data, secret, { algorithm: alg });
            return token;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    static validateJWT = async (token, secret, alg = "HS256") => {
        try {
            const decoded = jwt.verify(token, secret, { algorithm: alg });
            return [decoded, { success: true }];
        } catch (error) {
            console.log(error);
            return [null, { error: error.message, success: false }];
        }
    } 
}

module.exports = JWT;