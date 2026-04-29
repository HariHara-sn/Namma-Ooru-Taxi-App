/* eslint-disable camelcase */
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const qs = require("qs");
const axios = require("axios");

const privateKey = fs.readFileSync(
    path.resolve(__dirname, "../../creds/AuthKey_3BUD8VY5B5.p8")
);

const appletoken = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "180d",
    issuer: "PL795Q2TQA",
    audience: "https://appleid.apple.com",
    subject: "com.virtualmaze.vmtracker",
    keyid: "3BUD8VY5B5",
});

class RefreshTokeniOS {
    constructor() {
        this.REFRESH_TOKEN_URL = "https://appleid.apple.com/auth/token";
        this.APPLE_CLIENT_ID = 'com.virtualmaze.vmtracker';
    }

    async generateRefreshToken(payload, grant_type) {
        let requestPayload;
        if(grant_type === 'authorization_code') {
            requestPayload = {
                "client_id": this.APPLE_CLIENT_ID,
                "client_secret": appletoken,
                "code": payload.authorizationCode,
                "grant_type": grant_type,
            };
        } else {
            requestPayload = {
                "client_id": this.APPLE_CLIENT_ID,
                "client_secret": appletoken,
                "refresh_token": payload.refresh_token,
                "grant_type": grant_type,
            };
        }

        // console.log('requestPayload', requestPayload)

        try {
            const RefreshTokenresponse = await axios.post(
                this.REFRESH_TOKEN_URL,
                qs.stringify(requestPayload),
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                }
            );

            if (RefreshTokenresponse.status === 200) {
                return { valid: true, status: RefreshTokenresponse.status, data: RefreshTokenresponse.data, client_secret: appletoken }
            } else {
                return { valid: false, status: RefreshTokenresponse.status, message: RefreshTokenresponse.data }
            }

        } catch (error) {
            console.error("Error Generating Refresh Token", error);
            throw error;
        }
    }
}

module.exports = new RefreshTokeniOS();
