/* eslint-disable no-useless-catch */
// const { RZP, ensureRouteProduct } = require("../../Constants/RazorpayRoute");
const axios = require('axios');
const Driver = require('../../Models/Driver');
require("dotenv").config();

class RazorPayLinking {
    constructor() {
        // Validate environment variables
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required');
        }
        
        this.RZP = axios.create({
            baseURL: 'https://api.razorpay.com',
            auth: {
                username: process.env.RAZORPAY_KEY_ID,
                password: process.env.RAZORPAY_KEY_SECRET,
            },
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000, // 30 seconds timeout
        });
        
        // Add request interceptor for debugging
        this.RZP.interceptors.request.use(
            (config) => {
                // console.log('Razorpay API Request:', {
                //     method: config.method,
                //     url: config.url,
                //     auth: {
                //         username: config.auth?.username ? `${config.auth.username.substring(0, 8)}...` : 'None'
                //     }
                // });
                return config;
            },
            (error) => {
                console.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );
        
        // Add response interceptor for debugging
        this.RZP.interceptors.response.use(
            (response) => {
                // console.log('Razorpay API Response:', {
                //     status: response.status,
                //     statusText: response.statusText,
                //     data: response.data
                // });
                return response;
            },
            (error) => {
                console.error('Razorpay API Error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    async testApiCredentials() {
        try {
            // Test API credentials by making a simple request
            const response = await this.RZP.get('/v1/account');
            console.log('API credentials test successful:', response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('API credentials test failed:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            return {
                success: false,
                error: error.response?.data?.error?.description || error.message,
                statusCode: error.response?.status
            };
        }
    }

    validateInputs(driverId, name, email, phone, bank, pan) {
        const errors = [];
        
        if (!driverId) errors.push('Driver ID is required');
        if (!name || typeof name !== 'string') errors.push('Valid name is required');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
        if (!phone || !/^[6-9]\d{9}$/.test(phone)) errors.push('Valid 10-digit phone number is required');
        if (!bank || !bank.accountNumber || !bank.ifsc || !bank.beneficiaryName) {
            errors.push('Bank details (accountNumber, ifsc, beneficiaryName) are required');
        }
        if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            errors.push('Valid PAN number is required');
        }
        
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
    }

    async linkRazorpayAccount(driverid, driverId, name, email, phone, address, bank, pan) {
        console.log("productId -- >> 1", bank);
        try {
            // Validate inputs
            // this.validateInputs(driverId, name, email, phone, bank, pan);

            // Test API credentials first
            console.log('Testing Razorpay API credentials...');
            const credentialsTest = await this.testApiCredentials();
            if (!credentialsTest.success) {
                return {
                    success: false,
                    error: `API credentials test failed: ${credentialsTest.error}`,
                    statusCode: credentialsTest.statusCode
                };
            }
            console.log('API credentials test passed, proceeding with account creation...');

            // 1) Create Account
            let linkedAccountId;
            try {
                const createAccResponse = await this.RZP.post('/v2/accounts', {
                    "type": 'route',
                    "reference_id": driverId, // TODO: change to driver DOB
                    "legal_business_name": 'Virtual Maze', // Using proper case
                    "business_type": 'individual',
                    "contact_name": name,
                    email,
                    phone,
                    profile: {
                        category: "transport",
                        subcategory: "cab_hailing",
                        addresses: {
                            registered: address
                        }
                    }
                });
                console.log("createAccResponse -- >> 1", createAccResponse);

                if (!createAccResponse.data || !createAccResponse.data.id) {
                    throw new Error('Failed to create Razorpay account: Invalid response from Razorpay API');
                }

                linkedAccountId = createAccResponse.data.id;
            } catch (createAccountError) {
                // Check if error is due to merchant email already existing
                if (createAccountError.response && 
                    createAccountError.response.status === 400 && 
                    createAccountError.response.data?.error?.description?.includes('Merchant email already exists for account')) {
                    
                    // Get account ID from driver's existing data only
                    const driver = await Driver.getDriverWithId(driverid);
                    if (driver?.razorpayLinkedAccountDetails?.linkedAccountId) {
                        linkedAccountId = driver.razorpayLinkedAccountDetails.linkedAccountId;
                        console.log(`Using driver's existing linkedAccountId: ${linkedAccountId}`);
                    } else {
                        throw new Error('Email already exists with a different account. Please use a different email.');
                    }
                } else {
                    // Re-throw other errors
                    throw createAccountError;
                }
            }

            // Immediately update driver with linkedAccountId
            try {
                await Driver.updateDriver(driverid, { 
                    'razorpayLinkedAccountDetails.linkedAccountId': linkedAccountId 
                });
                console.log(`Updated driver ${driverid} with linkedAccountId: ${linkedAccountId}`);
            } catch (updateError) {
                console.error('Failed to update driver with linkedAccountId:', updateError);
                return {
                    success: false,
                    error: `Failed to update driver with linkedAccountId: ${updateError.message}`
                };
            }

            // 2) Create Stakeholder (only if not already exists)
            let stakeholderResponse;
            try {
                // First, check if stakeholders already exist
                const existingStakeholders = await this.RZP.get(`/v2/accounts/${linkedAccountId}/stakeholders`);
                console.log("Existing stakeholders:", existingStakeholders.data);
                
                if (existingStakeholders.data && existingStakeholders.data.items && existingStakeholders.data.items.length > 0) {
                    console.log("Stakeholders already exist, skipping creation");
                    stakeholderResponse = { data: existingStakeholders.data.items[0] };
                } else {
                    // Create stakeholder only if none exist
                    stakeholderResponse = await this.RZP.post(`/v2/accounts/${linkedAccountId}/stakeholders`, {
                        name: name,
                        email: email,
                        kyc: { pan: pan }
                    });
                    console.log("createAccResponse -- >> 2", stakeholderResponse.data);
                }
            } catch (stakeholderError) {
                // If stakeholder creation fails due to access denied, check if stakeholders exist
                if (stakeholderError.response?.status === 400 && 
                    stakeholderError.response?.data?.error?.description === 'Access Denied') {
                    console.log("Access denied for stakeholder creation, checking if stakeholders already exist...");
                    try {
                        const existingStakeholders = await this.RZP.get(`/v2/accounts/${linkedAccountId}/stakeholders`);
                        if (existingStakeholders.data && existingStakeholders.data.items && existingStakeholders.data.items.length > 0) {
                            console.log("Stakeholders already exist, using existing stakeholder");
                            stakeholderResponse = { data: existingStakeholders.data.items[0] };
                        } else {
                            throw stakeholderError; // Re-throw if no stakeholders exist
                        }
                    } catch (getStakeholdersError) {
                        throw stakeholderError; // Re-throw original error if we can't get stakeholders
                    }
                } else {
                    throw stakeholderError; // Re-throw other errors
                }
            }

            if (!stakeholderResponse.data) {
                throw new Error('Failed to create stakeholder: Invalid response from Razorpay API');
            }

            // 3) Accept Terms and Conditions (only if not already exists)
            let productResponse;
            let productId;
            try {
                // First, check if products already exist
                const existingProducts = await this.RZP.get(`/v2/accounts/${linkedAccountId}/products`);
                console.log("Existing products:", existingProducts.data);
                
                if (existingProducts.data && existingProducts.data.items && existingProducts.data.items.length > 0) {
                    console.log("Products already exist, using existing product");
                    productResponse = { data: existingProducts.data.items[0] };
                    productId = productResponse.data.id;
                } else {
                    // Create product only if none exist
                    productResponse = await this.RZP.post(`/v2/accounts/${linkedAccountId}/products`, {
                        "product_name": "route",
                        "tnc_accepted": true
                    });
                    console.log("createAccResponse -- >> 3", productResponse.data);
                    productId = productResponse.data.id;
                }
            } catch (productError) {
                // Handle 404 error (no products found) by creating new product
                if (productError.response?.status === 404) {
                    console.log("No existing products found, creating new product...");
                    try {
                        productResponse = await this.RZP.post(`/v2/accounts/${linkedAccountId}/products`, {
                            "product_name": "route",
                            "tnc_accepted": true
                        });
                        console.log("createAccResponse -- >> 3", productResponse.data);
                        productId = productResponse.data.id;
                    } catch (createProductError) {
                        throw createProductError;
                    }
                }
                // If product creation fails due to access denied, check if products exist
                else if (productError.response?.status === 400 && 
                    productError.response?.data?.error?.description === 'Access Denied') {
                    console.log("Access denied for product creation, checking if products already exist...");
                    try {
                        const existingProducts = await this.RZP.get(`/v2/accounts/${linkedAccountId}/products`);
                        if (existingProducts.data && existingProducts.data.items && existingProducts.data.items.length > 0) {
                            console.log("Products already exist, using existing product");
                            productResponse = { data: existingProducts.data.items[0] };
                            productId = productResponse.data.id;
                        } else {
                            throw productError; // Re-throw if no products exist
                        }
                    } catch (getProductsError) {
                        throw productError; // Re-throw original error if we can't get products
                    }
                } else {
                    throw productError; // Re-throw other errors
                }
            }

            if (!productResponse.data || !productId) {
                throw new Error('Failed to accept terms and conditions: Invalid response from Razorpay API');
            }

            // 4) Update Product Config with settlement bank
            const activateResponse = await this.RZP.patch(`/v2/accounts/${linkedAccountId}/products/${productId}`, {
                settlements: {
                    "account_number": bank.accountNumber,
                    "ifsc_code": bank.ifsc,
                    "beneficiary_name": bank.beneficiaryName
                },
                "tnc_accepted": true
            });

            console.log("createAccResponse -- >> 4", activateResponse.data);

            if (!activateResponse.data) {
                throw new Error('Failed to update product configuration: Invalid response from Razorpay API');
            }

            return {
                success: true,
                data: {
                    linkedAccountId,
                    productId,
                    accountDetails: activateResponse.data
                },
                message: 'Razorpay account linked successfully'
            };

        } catch (error) {
            // Handle specific error types
            if (error.response) {
                // Razorpay API error
                const errorMessage = error.response.data?.error?.description || 
                                   error.response.data?.message || 
                                   'Razorpay API error';
                const statusCode = error.response.status;
                // Special case override: treat locked activation form as success
                if (statusCode === 400 && /Merchant activation form has been locked for editing by admin\.?/i.test(errorMessage)) {
                    return {
                        success: true,
                        message: '',
                        statusCode: 200
                    };
                }
                
                return {
                    success: false,
                    error: `Razorpay API Error (${statusCode}): ${errorMessage}`,
                    statusCode
                };
            } else if (error.request) {
                // Network error
                return {
                    success: false,
                    error: 'Network error: Unable to connect to Razorpay API'
                };
            } else {
                // Other errors (validation, etc.)
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    async updateRazorpayAccount(accountId, productId, accountNumber, ifscCode, beneficiaryName) {
        try {
            const payload = {
                "settlements": {
                    "account_number": accountNumber,
                    "ifsc_code": ifscCode,
                    "beneficiary_name": beneficiaryName
                },
                "tnc_accepted": true
            }
            const updateAccResponse = await this.RZP.patch(`/v2/accounts/${accountId}/products/${productId}`, payload);
            console.log("updateAccResponse -- >> 1", updateAccResponse);
            return {
                success: true,
                data: {
                    accountId,
                    productId,
                    accountDetails: updateAccResponse.data
                },
                message: 'Razorpay account updated successfully'
            };
        } catch (error) {
            if (error.response) {
                // Razorpay API error
                const errorMessage = error.response.data?.error?.description || 
                                   error.response.data?.message || 
                                   'Razorpay API error';
                const statusCode = error.response.status;
                
                return {
                    success: false,
                    error: `Razorpay API Error (${statusCode}): ${errorMessage}`,
                    statusCode
                };
            }
            console.log("error -- >> ", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPaymentDetails(paymentId) { 
        try {
            const accountDetailsResponse = await this.RZP.get(`v1/payments/${paymentId}`);
            return {
                success: true,
                data: accountDetailsResponse.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async verifyVpa(upiId) {
        const payload = {"vpa": upiId}
        try {
            const accountDetailsResponse = await this.RZP.post(`v1/validations/upi`, payload);
            return {
                success: true,
                data: accountDetailsResponse.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = RazorPayLinking;