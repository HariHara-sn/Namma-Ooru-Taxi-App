/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-catch */
import Config from "react-native-config";

const DefaultPostHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const DefaultFormDataHeaders = {
  'Content-Type': 'multipart/form-data',
  Accept: 'application/json',
};

class APIRequest {
  constructor(baseURL) {
    this.baseURL = baseURL || Config.ROOT_API_URL;
  }

  async request(
    endpoint,
    method = 'GET',
    body = null,
    authToken = null,
    queryParams = {},
    headers = {},
    abortController = null,
  ) {
    // Convert queryParams object to string
    let queryString = '';

    if (queryParams)
      queryString = Object.keys(queryParams)
        .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
        .join('&');

    const url = `${this.baseURL}${endpoint}${queryString ? `?${queryString}` : ''
      }`;

    if (authToken !== null) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    if (body instanceof FormData) {
      headers = { ...headers, ...DefaultFormDataHeaders };
    } else {
      headers = { ...headers, ...DefaultPostHeaders };
    }

    const options = {
      method,
      headers: {
        ...headers,
      },
      signal: abortController ? abortController.signal : null,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      if (body instanceof FormData) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }


    let response = await fetch(url, options);
    response = await response.json();
    return response

  }
}

export default APIRequest;
