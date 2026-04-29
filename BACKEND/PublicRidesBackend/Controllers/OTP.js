
const crypto = require('crypto');

class OTP {
    /**
     * Generate a random OTP of specified length
     * @param {number} length - Length of the OTP (default: 6)
     * @returns {string} - Generated OTP
     */
    static generateOTP(length = 6) {
        // Generate a random number with the specified length
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        
        // Use crypto for more secure random generation
        const randomBytes = crypto.randomBytes(4);
        const randomNumber = parseInt(randomBytes.toString('hex'), 16);
        
        // Scale the random number to the desired range
        const otp = Math.floor(min + (randomNumber % (max - min + 1)));
        
        // Convert to string and ensure it has the correct length by padding with zeros
        return otp.toString().padStart(length, '0');
    }
    
}

module.exports = OTP;
