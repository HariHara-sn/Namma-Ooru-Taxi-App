const fetch = require('cross-fetch');
const ping4smsJson = require('../../creds/PingForSms.json')

class SendSMS {
    constructor() {
        this.OTP_PRODUCTION_URL = 'http://site.ping4sms.com/api/smsapi?key=7860ccc5920d609839f3ec5d63b1ff89&route=2&sender=?';
    }

    generateOTP() {
        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiry = Date.now() + 2 * 60 * 1000;
        return {otp: otp, expiry: expiry};
    }

    async sendOTP( number, to, event) {
        
        const templateid = ping4smsJson?.[to]?.[event]['ID']
        const {otp, expiry} = this.generateOTP();
        const message = `Your one-time verification code is ${otp}. Please use it to verify your identity for Namma Ooru Taxi.- VirtualMaze Softsys Pvt Ltd`;
        
        const phoneNumber = Number(number);
        try {
            const response = await fetch(`http://site.ping4sms.com/api/smsapi?key=7860ccc5920d609839f3ec5d63b1ff89&route=2&sender=VMSFLT&number=${phoneNumber}&sms=${message}&templateid=${templateid}`);
            const data = response;
            console.log('OTP response', data);
            return {otp: otp, expiry: expiry, status: data.status};
        } catch (error) {
            console.error('Error verifying subscription:', error);
            throw error;
        }
        // return {otp: otp, expiry: expiry, status: 200};
    }

    async sendMessage(number, passangerName, platform, link) {
        const templateid = ping4smsJson?.['CUSTOMER']?.['SOS']?.['ID']
       
        const phoneNumber = Number(number);
        const message = `ALERT!!! ${passangerName} booked a ride on ${platform}. SOS triggered asking HELP! Track live: ${link} -VirtualMaze Softsys Pvt Ltd`;
       
        const response = await fetch(`http://site.ping4sms.com/api/smsapi?key=7860ccc5920d609839f3ec5d63b1ff89&route=2&sender=VMSFLT&number=${phoneNumber}&sms=${message}&templateid=${templateid}`);
        const data = response;
        
        return {status: data.status};
    }
}

module.exports = new SendSMS();