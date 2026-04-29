const axios = require('axios');
require("dotenv").config({
    path: `${process.env.NODE_ENV !== "test" ? ".env"
        : `.env.${process.env.NODE_ENV}`
    }`,
});
class PhonepayPaymentController {
    static PhonepayAuth = async () => {
        try {
            // console.log('process.env-->>', process.env)
            // Get PhonePe credentials from environment variables
            const clientId = process.env.PHONEPE_CLIENT_ID;
            const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
            const clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1';
            const environment = process.env.PHONEPE_ENVIRONMENT || 'UAT'; // UAT or PROD

            // Validate required environment variables
            if (!clientId || !clientSecret) {
                throw new Error('PhonePe credentials not configured. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.');
            }

            // Determine the base URL based on environment
            const baseUrl = environment === 'PROD' 
                ? process.env.PROD_PHONEPE_AUTH_BASE_URL
                : process.env.UAT_PHONEPE_BASE_URL;

            const authUrl = `${baseUrl}/v1/oauth/token`;

            // Prepare request data
            /* eslint-disable camelcase */
            const requestData = new URLSearchParams({
                client_id: clientId,
                client_version: clientVersion,
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            });
            /* eslint-enable camelcase */

            // Make the API call to PhonePe
            const response = await axios.post(authUrl, requestData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000 // 30 seconds timeout
            });

            const authData = response.data;

            // Validate response
            if (!authData.access_token) {
                throw new Error('Invalid response from PhonePe: No access token received');
            }

            // Return the authorization data
            return {
                success: true,
                data: {
                    accessToken: authData.access_token,
                    encryptedAccessToken: authData.encrypted_access_token,
                    expiresIn: authData.expires_in,
                    issuedAt: authData.issued_at,
                    expiresAt: authData.expires_at,
                    sessionExpiresAt: authData.session_expires_at,
                    tokenType: authData.token_type
                },
                
            };

        } catch (error) {
            console.error('PhonePe Authorization Error:', error);

            // Handle specific error cases
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const statusCode = error.response.status;
                const errorData = error.response.data;

                return {
                    success: false,
                    message: `PhonePe API Error (${statusCode})`,
                    error: errorData
                };
            } else if (error.request) {
                // The request was made but no response was received
                return {
                    success: false,
                    message: 'No response received from PhonePe API',
                    error: 'Network timeout or connection error'
                };
            } else {
                // Something happened in setting up the request that triggered an Error
                return {
                    success: false,
                    message: 'Error setting up PhonePe API request',
                    error: error.message
                };
            }
        }
    }

    static PhonepayCreateOrder = async (accessToken, orderData) => {
        try {

            const environment = process.env.PHONEPE_ENVIRONMENT || 'UAT';

            // Determine the base URL based on environment
            const baseUrl = environment === 'PROD' 
                ? process.env.PROD_PHONEPE_BASE_URL 
                : process.env.UAT_PHONEPE_BASE_URL

            const orderUrl = `${baseUrl}/checkout/v2/sdk/order`;

            // Validate required parameters
            console.log('orderData-->>', orderData)
            if (!orderData.merchantOrderId || !orderData.amount) {
                throw new Error('merchantOrderId and amount are required parameters');
            }

            // Validate amount (minimum 100 paise = 1 rupee)
            if (orderData.amount < 100) {
                throw new Error('Amount must be at least 100 paise (1 rupee)');
            }

            // Validate merchantOrderId (max 63 characters, only underscore and hyphen allowed)
            if (orderData.merchantOrderId.length > 63) {
                throw new Error('merchantOrderId must be maximum 63 characters');
            }

            if (!/^[a-zA-Z0-9_-]+$/.test(orderData.merchantOrderId)) {
                throw new Error('merchantOrderId can only contain alphanumeric characters, underscore (_) and hyphen (-)');
            }

            // Prepare request body
            const requestBody = {
                merchantOrderId: orderData.merchantOrderId,
                amount: orderData.amount,
                expireAfter: orderData.expireAfter || 1200, // Default 20 minutes
                metaInfo: orderData.metaInfo || {},
                paymentFlow: {
                    type: "PG_CHECKOUT"
                }
            };

            // Add payment mode configuration if provided
            if (orderData.paymentModeConfig) {
                requestBody.paymentFlow.paymentModeConfig = orderData.paymentModeConfig;
            }

            // Validate expireAfter (300-3600 seconds)
            if (requestBody.expireAfter < 300 || requestBody.expireAfter > 3600) {
                throw new Error('expireAfter must be between 300 and 3600 seconds');
            }

            // Validate metaInfo fields (max 256 characters each)
            if (requestBody.metaInfo) {
                for (let i = 1; i <= 5; i++) {
                    const udfKey = `udf${i}`;
                    if (requestBody.metaInfo[udfKey] && requestBody.metaInfo[udfKey].length > 256) {
                        throw new Error(`${udfKey} must be maximum 256 characters`);
                    }
                }
            }


            

            // Make the API call to PhonePe
            const response = await axios.post(orderUrl, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `O-Bearer ${accessToken}`
                },
                timeout: 30000 // 30 seconds timeout
            });

            const responseData = response.data;

            // Validate response
            if (!responseData.token) {
                throw new Error('Invalid response from PhonePe: No order token received');
            }

            // Return the order data
            return {
                success: true,
                data: {
                    orderId: responseData.orderId,
                    state: responseData.state,
                    expireAt: responseData.expireAt,
                    token: responseData.token
                },
                message: 'PhonePe order created successfully'
            };

        } catch (error) {
            console.error('PhonePe Create Order Error:', error);

            // Handle specific error cases
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const statusCode = error.response.status;
                const errorData = error.response.data;

                return {
                    success: false,
                    message: `PhonePe API Error (${statusCode})`,
                    error: errorData
                };
            } else if (error.request) {
                // The request was made but no response was received
                return {
                    success: false,
                    message: 'No response received from PhonePe API',
                    error: 'Network timeout or connection error'
                };
            } else {
                // Something happened in setting up the request that triggered an Error
                return {
                    success: false,
                    message: 'Error setting up PhonePe API request',
                    error: error.message
                };
            }
        }
    }

    static PhonepayStatusCheck = async (orderId, accessToken, details = false, errorContext = false) => {
        try {
            // Validate required parameters
            if (!orderId) {
                throw new Error('orderId is required parameter');
            }

            if (!accessToken) {
                throw new Error('accessToken is required parameter');
            }


            console.log('orderId-->>', orderId)
            console.log('accessToken-->>', accessToken)

            const environment = process.env.PHONEPE_ENVIRONMENT || 'UAT';

            // Determine the base URL based on environment
            const baseUrl = environment === 'PROD' 
                ? process.env.PROD_PHONEPE_BASE_URL 
                : process.env.UAT_PHONEPE_BASE_URL;

            // Build the status check URL with query parameters
            let statusUrl = `${baseUrl}/checkout/v2/order/${orderId}/status`;
            
            // Add query parameters if provided
            const queryParams = [];
            if (details !== undefined) {
                queryParams.push(`details=${details}`);
            }
            if (errorContext !== undefined) {
                queryParams.push(`errorContext=${errorContext}`);
            }
            
            if (queryParams.length > 0) {
                statusUrl += `?${queryParams.join('&')}`;
            }

            console.log('statusUrl-->>', statusUrl)

            // Make the API call to PhonePe
            const response = await axios.get(statusUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `O-Bearer ${accessToken}`
                },
                timeout: 30000 // 30 seconds timeout
            });

            const responseData = response.data;

            // Check if the response indicates an error (like ORDER_NOT_FOUND)
            if (responseData.success === false) {
                return {
                    success: false,
                    message: responseData.message || 'Order status check failed',
                    code: responseData.code,
                    data: responseData.data
                };
            }

            // Return the order status data
            return {
                success: true,
                data: {
                    orderId: responseData.orderId,
                    state: responseData.state,
                    amount: responseData.amount,
                    payableAmount: responseData.payableAmount,
                    feeAmount: responseData.feeAmount,
                    expireAt: responseData.expireAt,
                    metaInfo: responseData.metaInfo,
                    paymentDetails: responseData.paymentDetails,
                    errorCode: responseData.errorCode,
                    detailedErrorCode: responseData.detailedErrorCode,
                    errorContext: responseData.errorContext
                },
                message: 'Order status retrieved successfully'
            };

        } catch (error) {
            console.error('PhonePe Status Check Error:', error);

            // Handle specific error cases
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const statusCode = error.response.status;
                const errorData = error.response.data;

                return {
                    success: false,
                    message: `PhonePe API Error (${statusCode})`,
                    error: errorData
                };
            } else if (error.request) {
                // The request was made but no response was received
                return {
                    success: false,
                    message: 'No response received from PhonePe API',
                    error: 'Network timeout or connection error'
                };
            } else {
                // Something happened in setting up the request that triggered an Error
                return {
                    success: false,
                    message: 'Error setting up PhonePe API request',
                    error: error.message
                };
            }
        }
    }
}

module.exports = PhonepayPaymentController;
