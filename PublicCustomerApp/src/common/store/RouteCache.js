const cache = new Map();

export function buildRouteCacheKey(latlngs) {
    if (!Array.isArray(latlngs) || latlngs.length === 0) return "";
    return latlngs.map(p => `${p.lat},${p.lon}`).join(",");
}

export function getCachedRoute(key) {
    const entry = cache.get(key);
    return entry ? {response: entry.response , requests: entry.requests} : null;
}

export function getCachedRouteEntry(key) {
    return cache.get(key) || null;
}

export function setCachedRoute(key, requestObject, response) {
    cache.set(key, { requests: requestObject, response, timestamp: Date.now() });
}

export function clearRouteCache() {
    cache.clear();
}
