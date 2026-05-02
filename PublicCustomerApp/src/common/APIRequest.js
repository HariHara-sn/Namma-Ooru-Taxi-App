/* eslint-disable no-param-reassign */
/* eslint-disable no-useless-catch */
import Config from 'react-native-config';
import { firebaselog_apicalls } from './utils/FirebaseAnalytics';

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
    this.retryTime = 1000 * 5
  }

  async request(
    endpoint,
    method = 'GET',
    body = null,
    authToken = null,
    queryParams = {},
    headers = {},
    abortController = null,
    continousRetry = false
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

    if (body && method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
      if (body instanceof FormData) {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    if (continousRetry) {
      let restTime = this.retryTime
      while (true) {
        if (restTime != this.retryTime) {
          console.log("Retrying ", url)
          firebaselog_apicalls('API_call_Driver(API_D)', `API_D:retry${url}`)
        }
        try {
          const response = await this.fetcher(url, options)
          return response
        } catch (error) {
          restTime = restTime * 2
        }

        await this.sleep(this.retryTime)
      }

    }

    return this.fetcher(url, options)
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetcher(url, options) {
    try {
      const response = await fetch(url, options);
      // just to get status code and attach to response
      const statusCode = response.status
      const data = await response.json();
      data.response_code = statusCode
      firebaselog_apicalls('API_call_Driver(API_D)', `API_D:${url}-${statusCode}`)
      return data
    } catch (error) {
      throw error;
    }
  }
}

export default APIRequest;
