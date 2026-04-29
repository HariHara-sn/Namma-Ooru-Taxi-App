const axios = require("axios");

class SubscriptionVerifierIOS {

    constructor() {
        this.APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
        this.APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
        this.SHARED_SECRET = process.env.APPLE_SHARED_SECRET;
    }

    async verfiyIOSSubscription( receipt ) {
        const requestPayload = {
            "receipt-data": receipt,
            "exclude-old-transactions": true,
            "password": this.SHARED_SECRET
        }
        try { 
            let response = await axios.post(this.APPLE_PRODUCTION_URL, requestPayload, {
                headers: { 'Content-Type': 'application/json' },
            });
          
            const { status } = response.data;
          
            // If status is 21007, it's a sandbox receipt. Retry on sandbox server.
            if (status === 21007) {
                response = await axios.post(this.APPLE_SANDBOX_URL, requestPayload, {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            if (response.data.status === 0) {
                return {valid: true, status: status, data: response.data}
            } else {
                return {
                    valid: false,
                    status: status,
                    message: 'Invalid receipt',
                }
            }
        } catch (error) {
            console.error('Error verifying subscription:', error);
            throw error;
        }
    }
}

module.exports = new SubscriptionVerifierIOS();