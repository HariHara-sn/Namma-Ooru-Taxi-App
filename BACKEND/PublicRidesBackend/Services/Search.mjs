import fetch from 'node-fetch';
import { URL } from 'url';

const token = "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ1c3ItNzV1bXJpa2k0YjY0c3AiLCJ0aWQiOiJ0a24tNzV1bXJpa2k0Y2RlY3ciLCJpYXQiOjE2MDY3MjgwMDl9.ck77ElEO7VR-yEJ0RrSHMp9OdDPvYUAuQqc-eASNk-sah2TX-Rhjvj71B2aFFlC-"
async function reverse(lat, lon, options = {}, properties = false) {
    const url = `https://nammaoorutaxi.com/search/reverse?access_token=${token}&lang=en&limit=10&lat=${lat}&lon=${lon}`;
    options.redirect = 'manual'; // Avoid automatic redirects
    let response = await fetch(url, options);
    let cookies = [];

    while (response.status === 301 || response.status === 302) {
        // Extract 'set-cookie' header and store cookies
        const setCookieHeader = response.headers.raw()['set-cookie'];
        if (setCookieHeader) {
            cookies.push(...setCookieHeader);
        }

        // Prepare the next request
        const location = response.headers.get('location');
        const nextUrl = new URL(location, response.url).toString();
        options.headers = {
            ...options.headers,
            'Cookie': cookies.join('; ')
        };

        // Fetch the next URL
        response = await fetch(nextUrl, options);

    }

    response = await response.json()
    let features = response.features ? response.features : []
    let feature = features[0]
    if (!feature) return false
    if (properties) return feature.properties
    let { name, city, district, state, country, postcode } = feature.properties
    let address = (name ? name + ', ' : '') +
        (city ? city + ', ' : '') +
        (district ? district + ', ' : '') +
        (state ? state + ', ' : '') +
        (country ? country + ', ' : '') +
        (postcode ? "pincode:" + postcode : '');
    return address;
}


export default reverse;