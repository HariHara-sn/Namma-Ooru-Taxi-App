export const parseDeepLink = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const safeDecode = (value) => {
    try {
      return decodeURIComponent(value.replace(/\+/g, ' '));
    } catch (err) {
      console.warn('[DeepLink] Failed to decode value, using raw string:', value, err);
      return value;
    }
  };

  let workingUrl = url.trim();
  let scheme = '';

  const schemeMatch = workingUrl.match(/^([a-z][a-z0-9+\-.]*):\/\//i);
  if (schemeMatch) {
    scheme = schemeMatch[1];
    workingUrl = workingUrl.slice(schemeMatch[0].length);
  }

  const hashIndex = workingUrl.indexOf('#');
  if (hashIndex !== -1) {
    workingUrl = workingUrl.slice(0, hashIndex);
  }

  const [hostAndPath = '', queryString = ''] = workingUrl.split('?');
  const pathSegments = hostAndPath.split('/');
  const hostname = pathSegments.shift() || '';
  const path = pathSegments.join('/');

  const queryParams = {};
  if (queryString) {
    queryString
      .split('&')
      .filter(Boolean)
      .forEach((pair) => {
        const [rawKey, rawValue = ''] = pair.split('=');
        const key = safeDecode(rawKey || '');
        if (!key) {
          return;
        }

        queryParams[key] = safeDecode(rawValue);
      });
  }

  return {
    scheme,
    hostname,
    path,
    queryParams,
  };
};
