// Simple WhatsApp sending stub. Replace with real provider integration.
// Expects environment variables: WHATSAPP_ENABLE=true, WHATSAPP_API_URL, WHATSAPP_API_TOKEN
const https = require('https');

module.exports = async function sendWhatsAppMessage(phone, message) {
    if (!process.env.WHATSAPP_ENABLE || process.env.WHATSAPP_ENABLE !== 'true') {
        return { status: false, skipped: true, reason: 'Disabled' };
    }
    if (!phone || !message) throw new Error('Invalid WhatsApp params');
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_TOKEN;
    if (!apiUrl || !token) throw new Error('WhatsApp API config missing');

    return new Promise((resolve, reject) => {
        try {
            const body = JSON.stringify({ phone, message });
            const url = new URL(apiUrl);
            const opts = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': Buffer.byteLength(body)
                }
            };
            const req = https.request(opts, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ status: true, response: data });
                    } else {
                        resolve({ status: false, response: data, code: res.statusCode });
                    }
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        } catch (e) { reject(e); }
    });
};