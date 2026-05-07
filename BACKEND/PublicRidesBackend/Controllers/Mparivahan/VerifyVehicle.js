const axios = require("axios");

class VehicleVerifierMParivahan {
  constructor() {
    this.MPARIVAHAN_RC_STAGING =
      "https://vendorstest.vmmaps.com/appbackend/api/admin/rc-verification_other";
    this.MPARIVAHAN_RC ="https://vendors.vmmaps.com/vmvendorsServer/api/admin/rc-verification_other";
  }

  async verfiyRC(vehicleId) {
    const requestPayload = {
      vehicleId: vehicleId,
    };
    try {
      const response = await axios.post(
        this.MPARIVAHAN_RC_STAGING,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.PARIVAHAN_KEY,
          },
        },
      );

      console.log("MParivahan RC verification response:", response.data.data);

      if (response?.data?.data?.status === "success") {
        const vehicleData =
          response?.data?.data?.response || response?.data?.data;
        return {
          valid: true,
          data: vehicleData,
        };
      } else {
        return {
          valid: false,
          status: response?.data?.data?.status,
          message:
            response?.data?.data?.message || "MParivahan verification failed",
        };
      }
    } catch (error) {
      console.error("Error verifying RC:", error);
      throw error;
    }
  }
}

module.exports = new VehicleVerifierMParivahan();