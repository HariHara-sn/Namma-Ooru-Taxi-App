const CryptoJS = require('crypto-js');

class Password {
    constructor(password) {
        this.password = password;
    }

    encrypt = () => {

        const secretPassphrase = 'your secret passphrase'; // Replace with your secret passphrase
        const encrptedString = CryptoJS.AES.encrypt(this.password, secretPassphrase).toString();
        return encrptedString;
    }

    decrypt = (ciphertext) => {
        try {
            const secretPassphrase = 'your secret passphrase'; // Replace with your secret passphrase
            const bytes = CryptoJS.AES.decrypt(ciphertext, secretPassphrase);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedData) throw new Error('Failed to decrypt');
            return decryptedData;
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }
}

module.exports = Password