const BASE_SCOPES = ['location:read', 'history:read', 'devices:read'];
const ENV_SCOPES = (process.env.ALLOWED_SCOPES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const ALLOWED_SET = new Set([...BASE_SCOPES, ...ENV_SCOPES]);

module.exports = {
    ALLOWED_SCOPES: Array.from(ALLOWED_SET),
    RATE_LIMITS: {
        'location:read': parseInt(process.env.RATE_LIMIT_LOCATION_PER_MIN || '60', 10),
        'history:read': parseInt(process.env.RATE_LIMIT_HISTORY_PER_MIN || '30', 10),
        'devices:read': parseInt(process.env.RATE_LIMIT_DEVICES_PER_MIN || '20', 10),
    },
    DAILY_LIMITS_PER_KEY: {
        '/api/location': parseInt(process.env.DEV_API_DAILY_LOCATION_PER_KEY || '1000', 10),
        '/api/history': parseInt(process.env.DEV_API_DAILY_HISTORY_PER_KEY || '500', 10),
        '/api/devices': parseInt(process.env.DEV_API_DAILY_DEVICES_PER_KEY || '200', 10),
    },
    DAILY_LIMITS_PER_USER: {
        '/api/location': process.env.DEV_API_DAILY_LOCATION_PER_USER ? parseInt(process.env.DEV_API_DAILY_LOCATION_PER_USER, 10) : null,
        '/api/history': process.env.DEV_API_DAILY_HISTORY_PER_USER ? parseInt(process.env.DEV_API_DAILY_HISTORY_PER_USER, 10) : null,
        '/api/devices': process.env.DEV_API_DAILY_DEVICES_PER_USER ? parseInt(process.env.DEV_API_DAILY_DEVICES_PER_USER, 10) : null,
    }
};
