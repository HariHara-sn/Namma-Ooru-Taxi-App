const axios = require("axios");

class WhatsappService {
    constructor() {
        this.PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
        this.ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
    }

    async sendReviewMessage(receiver) {
        const url = `https://graph.facebook.com/v20.0/${this.PHONE_NUMBER_ID}/messages`;

        const payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": receiver.phone,
            "type": "template",
            "template": {
                "name": "ride_completion",
                "language": {
                    "code": "en"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "parameter_name": "customer_name",
                                "text": receiver.name
                            },
                            {
                                "type": "text",
                                "parameter_name": "fare",
                                "text": receiver.fare
                            }
                        ]
                    }
                ]
            }
        }

        const res = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${this.ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        return res.data;
    }  
}

const whatsappService = new WhatsappService();

module.exports = whatsappService;
