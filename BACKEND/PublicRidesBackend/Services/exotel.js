const axios = require('axios')
const FormData = require('form-data')

class Exotel {
    constructor() {
        this.accountApiKey = process.env.EXOTEL_API_KEY
        this.apiToken = process.env.EXOTEL_API_TOKEN
        this.accountSid = process.env.EXOTEL_ACCOUNT_SID
        this.apiSubdomain = process.env.EXOTEL_API_SUBDOMAIN
    }

    async makeCall(from, to) {
        if (!this.accountSid || !this.apiToken || !this.accountApiKey) {
            throw new Error('Missing EXOTEL_API_KEY, EXOTEL_API_TOKEN, or EXOTEL_ACCOUNT_SID in environment')
        }
       
        const url = `https://${this.apiSubdomain}/v1/Accounts/${this.accountSid}/Calls/connect`

        const form = new FormData()
        form.append('From', `${from}`)
        form.append('To', `${to}`)

        // Exotel uses HTTP Basic Auth with API key as username and token as password
        const auth = {
            username: this.accountApiKey,
            password: this.apiToken
        }

        try {
            const response = await axios.post(url, form, {
                headers: {
                    ...form.getHeaders(),
                    Accept: 'application/json',
                },
                auth: auth
            })

            if (response.status !== 200) {
                throw new Error('cannot do call')
            }
            return true
        } catch (error) {
            console.log(error)
            throw error
        }
    }
}

module.exports = Exotel
