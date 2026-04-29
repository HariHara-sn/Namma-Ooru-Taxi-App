const axios = require("axios");

class DriverVerifierMParivahan {

    constructor() {
        this.MPARIVAHAN_RC = 'https://vendorstest.vmmaps.com/appbackend/api/admin/dl-verification_other';
    }

    formatDob(dob) {
        if (!dob) return null;

        const toDate = (value) => {
            if (!value) return null;
            if (value instanceof Date) {
                return Number.isNaN(value.getTime()) ? null : value;
            }
            if (typeof value === 'number') {
                const date = new Date(value);
                return Number.isNaN(date.getTime()) ? null : date;
            }
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return null;

                const dashMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                if (dashMatch) {
                    const date = new Date(`${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`);
                    return Number.isNaN(date.getTime()) ? null : date;
                }

                const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (slashMatch) {
                    const date = new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`);
                    return Number.isNaN(date.getTime()) ? null : date;
                }

                if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    const date = new Date(trimmed);
                    return Number.isNaN(date.getTime()) ? null : date;
                }

                const parsed = new Date(trimmed);
                return Number.isNaN(parsed.getTime()) ? null : parsed;
            }
            return null;
        };

        const dateObj = toDate(dob);
        if (!dateObj) return null;

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
    }

    async verifyDL( dlNo, dob ) {
        const formattedDob = this.formatDob(dob);
        if (!formattedDob) {
            return {
                valid: false,
                status: 'invalid_dob',
                message: 'Invalid or missing date of birth for verification'
            };
        }

        const requestPayload = {
            "dl_no": dlNo,
            "dob": formattedDob
        }
        try { 
            const response = await axios.post(this.MPARIVAHAN_RC, requestPayload, {
                headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.PARIVAHAN_KEY },
                
            });

            // console.log("MParivahan Driver Verification Response:", response?.data);

            if (response?.data?.data?.status === 'success') {
                return {valid: true, data: response?.data?.data}
            } else {
                return {
                    valid: false,
                    status: response?.data?.data?.status,
                    message: response?.data?.data?.message,
                }
            }
        } catch (error) {
            console.error('Error verifying subscription:', error);
            throw error;
        }
    }
}

module.exports = new DriverVerifierMParivahan();