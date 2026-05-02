import Config from "react-native-config";
import { buildRouteCacheKey, getCachedRoute, setCachedRoute } from "../../../common/store/RouteCache";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRY_ATTEMPTS = 1;

async function fetchWithTimeout(url, attempt = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        const isTimeout = error.name === 'AbortError';

        if (isTimeout && attempt < MAX_RETRY_ATTEMPTS) {
            const nextAttempt = attempt + 1;
            console.warn(`Route fetch timeout retry ${nextAttempt}/${MAX_RETRY_ATTEMPTS} for ${url}`);
            return fetchWithTimeout(url, nextAttempt);
        }

        throw isTimeout
            ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`)
            : error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function findRoute(points) {
    if (!points) return null;
 
    const latlngs = points.map(item => {
        return {
            lat: item.location ? item.location[1] : item.lat,
            lon: item.location ? item.location[0] : item.lon,
        };
    });
  
    const cacheKey = buildRouteCacheKey(latlngs);
    const cachedResponse = getCachedRoute(cacheKey);
    if (cachedResponse) {
        console.log("Route Response (from cache)");
        return cachedResponse;
    }

    const jsonObject = {
        costing: 'auto',
        costing_options: {},
        language: 'en',
        locations: latlngs,
        units: 'kilometers',
    };
    // console.log("Route Request Object:", jsonObject);
    
    try {
        const jsonString = JSON.stringify(jsonObject);
        const encodedData = encodeURIComponent(jsonString);
        const url = `${Config.ROUTE_API_URL}?data=${encodedData}&access_token=${Config.NE_ACCESS_TOKEN}`;

        const response = await fetchWithTimeout(url);
        const routeData = await response.json();
        setCachedRoute(cacheKey, jsonObject, routeData);
        return {requests: jsonObject, response: routeData};
    } catch (error) {
        console.error("Error fetching route:", error);
        return null;
    }
}