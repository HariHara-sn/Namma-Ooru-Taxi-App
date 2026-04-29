/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
const { driverPublicRidesSchema, driverPublicRidesLoginSchema, vehiclePublicRideSchema, driverDetailsUploadSchema, driverPublicRidesVerifyOTPSchema, driverBankDetailsSchema, driverLogoutSchema, driverDeleteAccountSchema } = require("../../Schemas/DriverSchema")
const Driver = require("../../Models/Driver");
const Password = require("../Users/Password");
const multer = require('multer');
const { ObjectId } = require('mongodb');
const { e2eS3File } = require("../../Models/e2eS3File");
const Trip = require("../../Models/Trip");
const { getUserSocketIds } = require("../../Services/WebsocketUtilities");
const SendSMS = require("../../Core/SMSService/SendSMS");
const Redis = require("../DB/Redis");
const Mongo = require("../DB/Mongo");
const FareService = require("../../fareEngine/services/FareService");
const { sendCustomerTripStartedMessage, reachedDestinationMessage, sendCompletedTripMessagePaymentCompleted } = require("../../Services/PushNotification/publicRideCustomerNotification");
const Passanger = require("../../Models/Passanger");
const PushNotifiationService = require("../../Services/PushNotification/PushNotifiationService");
const NOTPushNotifiationService = require("../../Services/PushNotification/NOTPushNotifiationService");
const PublicRidesPayment = require("../../Models/PublicRidesPayments");
const Passenger = require("../../Models/Passanger");
const RideStatus = require("../../Core/PublicRides/RideStatus");
const FareConfigs = require("../../Models/FareConfigs");
const DriverWorkHistory = require("../../Models/DriverWorkHistory");
const PublicRideRegionalOffices = require("../RegionalOffices/publicRideRegionalOffices");
const PublicRidesTicket = require("../../Models/PublicRidesTicket");
const Vendors = require("../../Models/Vendor");
const GeneratePresignedUrl = require("../GeneratePresignedUrl");
const RazorPayLinking = require("./RazorPayLinking");
const FinalDueCalculator = require("../../Scripts/calculateFinalDue");
const VehicleVerifierMParivahan = require("../Mparivahan/VerifyVehicle");
const AppConfig = require("../../Models/AppConfig");

const whatsappService = require("../../Services/whatsapp/WhatsappService");

async function sendPassangerSocketEvents(passangerId, socketService, trip, fareData) {
    const passangerSocketIds = await getUserSocketIds(passangerId);
    let socketData = {}
    if (fareData) {
        socketData = {
            _id: trip._id,
            tripStatus: trip.status,
            fareData: fareData,
            distance: fareData.distance,
            duration: fareData.duration
        }
    } else {
        
        socketData = {
            _id: trip._id,
            tripStatus: trip.status,
            tripData: trip
        }
    }
    socketService.customerRideAssignHandler.emitPassangerTripStatus(passangerSocketIds, socketData)
}

// Helper function to compare bank details with existing Razorpay account details
function compareBankDetailsWithRazorpayAccount(bankDetails, razorpayLinkedAccountDetails) {
    if (!razorpayLinkedAccountDetails || !razorpayLinkedAccountDetails.accountDetails) {
        return false;
    }

    const activeConfig = razorpayLinkedAccountDetails?.accountDetails?.active_configuration;
    if (!activeConfig || !activeConfig.settlements) {
        return false;
    }

    const settlements = activeConfig?.settlements;
    
    return (
        settlements?.account_number === bankDetails.accountNumber &&
        settlements?.ifsc_code === bankDetails.ifscCode &&
        settlements?.beneficiary_name === bankDetails.accountHolderName
    );
}

function generateUniqueReferenceCode() {
    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `DI_${randomNumber}`;
}


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const cpUpload = upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "driverPhoto", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "roadTaxDoc", maxCount: 1 },
    { name: "permitDoc", maxCount: 1 },
    { name: "fitnessDoc", maxCount: 1 },
    { name: "pucDoc", maxCount: 1 },
    { name: "vehicleRcDoc", maxCount: 1 },
    { name: "vehicleRcDocBackSide", maxCount: 1 },
    { name: "pvc", maxCount: 1 },
]);

const cpUloadPassBook = upload.single("passbookImage")

module.exports = function (CLASS) {
    CLASS.prototype.registerPublicRides = async function (req, res) {
        try {
            const platform = req?.query?.platform;
            const schema = driverPublicRidesSchema(platform);
            const [payload, errRes] = await this.validate(req.body, schema);
            if (!payload) return res.status(400).json(errRes);

            const existingDriver = await Driver.checkDriverExistWithPhoneOrEmail(payload);
            if (existingDriver) return res.status(400).json({ success: false, message: 'Driver with same email or Phone already exists' });

            payload.createdBy = "publicrides";
            payload.createdOn = new Date().getTime();
            payload.publicRidesDriver = true;
            payload.tripStatus = "NOTRIP"

            const password = new Password(payload.password);
            payload.password = password.encrypt()

            const result = await Driver.addDriver(payload);
            return res.json({ success: true, driverId: result.insertedId, message: 'Driver created successfully' });

        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.loginPublicRides = async function (req, res) {
        try {
            const platform = req?.query?.platform;
            const isDEV = req?.query?.isdev;
            const schema = driverPublicRidesLoginSchema(platform);
            const [payload, errRes] = await this.validate(req.body, schema);
            if (!payload) return res.status(400).json(errRes);
            let otpResponse;
            if (!isDEV && payload.phone !== process.env.DRIVER_TEST_PHONE) {
                otpResponse = await SendSMS.sendOTP(payload.phone, "DRIVER", "OTP");
            } else {
                otpResponse = {
                    otp: "112233",
                    expiry: Date.now() + 2 * 60 * 1000,
                    status: 200
                }
            }
            if (otpResponse.status === 200) {
                await Redis.storeDataWithExpiry(payload.phone, otpResponse.otp, otpResponse.expiry);
            } else {
                return res.status(400).json({ success: false, message: 'Failed to send OTP' });
            }
            return res.json({ success: true, message: 'OTP sent successfully', otp: otpResponse.otp });
        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.verifyPublicRidesOTP = async function (req, res) {
        try {
            const platform = req?.query?.platform;
            const schema = driverPublicRidesVerifyOTPSchema(platform);
            const [payload, errRes] = await this.validate(req.body, schema);
            if (!payload) return res.status(400).json(errRes);
            const driverCheck = await Driver.checkDriverExistWithPhoneOrEmail(payload);
            const otp = await Redis.getData(payload.phone);
            if (!otp) return res.status(400).json({ success: false, message: 'OTP expired' });
            if (Number(otp) !== payload.otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
            await Redis.removeKey(payload.phone);
            if (driverCheck) {
                const driverDetails = await Driver.getDriverWithId(driverCheck._id);
                if (!driverDetails?.publicRidesDriver) return res.status(400).json({ success: false, message: 'Your Account Has Not Registered For Public Rides' });
                const token = await this.createDriverJWT({ driver: { id: driverCheck._id } }, process.env.JWT_SECRET_DRIVER, 'HS256');
                driverDetails.token = token;
                driverDetails.driverStatus= {status: 'online', updatedOn: new Date().getTime()} 
                driverDetails.isAvailable = true
                // if (driverDetails.role === 'acting_driver') {
                //     await Driver.updateDriver(driverCheck._id, { role: driverDetails.vendorId ? 'salaried' : 'dco' });
                // }
                // Set role based on vendor ID
                driverDetails.role = driverDetails.vendorId ? 'salaried' : 'dco';
                if (payload.fcmToken) {
                    // const driverDeviceImeiSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.deviceImei) || []);
                    // const driverFcmTokensSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.token) || []);
                    // if (!driverDeviceImeiSet.has(payload.fcmToken.deviceImei) || !driverFcmTokensSet.has(payload.fcmToken.token)) {
                    await Driver.updateDriverFcmToken(driverDetails._id, payload.fcmToken, payload.deviceMeta);
                    // }
                }
                return res.json({ success: true, message: 'OTP verified successfully', user: driverDetails });
            }
            delete payload.otp;
            payload.createdBy = "publicrides";
            payload.createdOn = new Date().getTime();
            payload.publicRidesDriver = true;
            payload.tripStatus = "NOTRIP"
            payload.role = "dco"; // Set role as dco for new driver
            const result = await Driver.addDriver(payload);
            const driverDetails = await Driver.getDriverWithId(result.insertedId);
            const token = await this.createDriverJWT({ driver: { id: driverDetails._id, publicRides: true } }, process.env.JWT_SECRET_DRIVER, 'HS256');
            driverDetails.token = token;
            if (payload.fcmToken) {
                // const driverDeviceImeiSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.deviceImei) || []);
                // const driverFcmTokensSet = new Set(driverDetails.fcmTokens?.map(fcmToken => fcmToken.token) || []);
                // if (!driverDeviceImeiSet.has(payload.fcmToken.deviceImei) || !driverFcmTokensSet.has(payload.fcmToken.token)) {
                await Driver.updateDriverFcmToken(driverDetails._id, payload.fcmToken, payload.deviceMeta);
                // }
            }
            return res.json({ success: true, message: 'OTP verified successfully', user: driverDetails });
        }catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.uploadPublicRidesDocs = async function (req, res) {
        try {
            cpUpload(req, res, async (err) => {
                const driverId = req.driver.id;
                if (!driverId) {
                    return res.status(400).json({ success: false, message: 'Driver ID is required' });
                }
                if (err) {
                    return res.status(400).json({ success: false, message: 'Error uploading files', error: err.message });
                }

                const files = req.files;

                if (!files || Object.keys(files).length === 0) {
                    return res.status(400).json({ success: false, message: 'No files uploaded' });
                }

                const filesUrls = {};

                for (const [key, fileArray] of Object.entries(files)) {
                    for (const file of fileArray) {
                        try {
                            const fileUrl = await e2eS3File('upload', file, key, `driver/${driverId}/${key}/`);
                            if (fileUrl?.completed) {
                                filesUrls[key] = fileUrl.url;
                            } else {
                                return res.status(400).json({ success: false, message: `Error uploading ${key}`, error: fileUrl.message });
                            }
                        } catch (uploadError) {
                            return res.status(500).json({ success: false, message: `Internal server error while uploading ${key}`, error: uploadError.message });
                        }
                    }
                }

                try {
                    const driver = await Driver.getDriverWithId(driverId);
                    if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
                    if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });
                    const existingFiles = driver.documents || {};
                    const updatedFiles = { ...existingFiles, ...filesUrls };
                    
                  
                    const response = await Driver.uploadDriverDocs(driverId, updatedFiles);

                    if (response.driverUpdate.acknowledged || response.vehicleUpdate.acknowledged) {
                        return res.json({
                            success: true,
                            message: 'Files uploaded successfully',
                            files: filesUrls
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: 'Error Uploading Files please try again',
                        });
                    }
                    
                } catch (dbError) {
                    console.log(dbError);
                    return res.status(500).json({ success: false, message: 'Internal server error while saving file URLs to database', error: dbError.message });
                }
            });
        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.uploadPublicRidesDriverBankDetails = async function (req, res) {
        try {
            cpUloadPassBook(req, res, async (err) => { 
                if (err) {
                    return res.status(400).json({ success: false, message: 'Error uploading files', error: err.message });
                }
                const driverId = req.driver.id;
                if (!driverId) return res.status(400).json({ success: false, message: 'Driver ID is required' });
                const [payload, errRes] = await this.validate(req.body, driverBankDetailsSchema);
                if (!payload) return res.status(400).json(errRes);

                // Parse address if it's a string, otherwise use as-is
                let address;
                try {
                    address = typeof payload.address === 'string' ? JSON.parse(payload.address) : payload.address;
                } catch (error) {
                    address = payload.address; // Use original value if parsing fails
                }
                
                let fileUrl = null;
                const file = req.file;
                
                if (file) {
                    // New file uploaded - upload to S3
                    fileUrl = await e2eS3File('upload', file, `${driverId}_passbookImage`, `driver/${driverId}/passbookImage`);
                    if (!fileUrl?.completed) return res.status(400).json({ success: false, message: `Error uploading passbookImage`, error: fileUrl.message });
                } else {
                    // No file uploaded - check if driver has existing passbook image
                    const driver = await Driver.getDriverWithId(driverId);
                    if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
                    
                    const existingPassbookImage = driver.documents?.passbookImage;
                    if (!existingPassbookImage) {
                        return res.status(400).json({ success: false, message: "No passbook image found. Please upload a passbook image." });
                    }
                    
                    // Use existing passbook image URL
                    fileUrl = { url: existingPassbookImage };
                    console.log("Using existing passbook image:", existingPassbookImage);
                }

                // Get driver details to check existing bank details and Razorpay account
                const driver = await Driver.getDriverWithId(driverId);
                if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

                const existingBankDetails = driver?.bankDetails;
                const existingRazorpayAccount = driver?.razorpayLinkedAccountDetails;

                let razorpayResult = null;

                // Generate unique reference code
                const referenceCode = generateUniqueReferenceCode();

                const bank = {
                    accountNumber: payload.accountNumber,
                    ifsc: payload.ifscCode,
                    beneficiaryName: payload.accountHolderName,
                }
                // Check if driver has no bank details and no Razorpay account
                if (!existingBankDetails && !existingRazorpayAccount) {
                    // Call linkRazorpayAccount
                    const razorpayLinking = new RazorPayLinking();
                    const { accountHolderName, email } = payload;
                   
                    razorpayResult = await razorpayLinking.linkRazorpayAccount(driverId, referenceCode, accountHolderName, email, driver.phone, address, bank, driver.pan);
                    if (!razorpayResult.success) {
                        return res.status(400).json({ success: false, message: razorpayResult.error });
                    }
                }
                // Check if driver has bank details and Razorpay account but they are different
                else if (existingBankDetails && existingRazorpayAccount) {
                    const bankDetailsMatch = compareBankDetailsWithRazorpayAccount(existingBankDetails, existingRazorpayAccount);
                    if (!bankDetailsMatch) {
                        // Bank details are different, call updateRazorpayAccount
                        const razorpayLinking = new RazorPayLinking();
                        const { linkedAccountId, productId } = existingRazorpayAccount;
                        razorpayResult = await razorpayLinking.updateRazorpayAccount(
                            linkedAccountId, 
                            productId, 
                            payload.accountNumber, 
                            payload.ifscCode, 
                            payload.accountHolderName
                        );
                        
                        if (!razorpayResult.success) {
                            return res.status(400).json({ success: false, message: razorpayResult.error });
                        }
                        // Update driver's bankDetails if Razorpay update was successful
                        if (razorpayResult.success) {
                            const bankDetailsUpdate = {
                                accountHolderName: payload.accountHolderName,
                                accountNumber: payload.accountNumber,
                                bankName: payload.bankName,
                                ifscCode: payload.ifscCode,
                                branch: payload.branch,
                                UPIID: payload.UPIID,
                                email: payload.email,
                                address: address
                            };
                            
                            await Driver.updateDriver(driverId, { 
                                'bankDetails': bankDetailsUpdate 
                            });
                            console.log(`Updated driver ${driverId} bankDetails after Razorpay account update`);
                        }
                    }
                    // If bank details match, skip Razorpay API calls
                }
                // If driver has bank details but no Razorpay account, or vice versa, call linkRazorpayAccount
                else {
                    const razorpayLinking = new RazorPayLinking();
                    const { accountHolderName, email } = payload;
                    razorpayResult = await razorpayLinking.linkRazorpayAccount(driverId, referenceCode, accountHolderName, email, driver.phone, address, bank, driver.pan);
                    if (!razorpayResult.success) {
                        return res.status(400).json({ success: false, message: razorpayResult.error });
                    }
                }

                // Update driver bank details
                await Driver.uploadDriverBankDetails(driverId, payload, fileUrl.url);

                // If Razorpay account was created/updated, also update the Razorpay account details
                if (razorpayResult && razorpayResult.success) {
                    const accountDetailsData = {
                        accountDetails: razorpayResult.data.accountDetails,
                        email: payload.email,
                        linkedAccountId: razorpayResult.data.linkedAccountId || razorpayResult.data.accountId,
                        productId: razorpayResult.data.productId,
                        referenceCode: referenceCode,
                        address: address,
                        bankDetails: {
                            accountHolderName: payload.accountHolderName,
                            accountNumber: payload.accountNumber,
                            bankName: payload.bankName,
                            ifscCode: payload.ifscCode,
                            branch: payload.branch,
                            UPIID: payload.UPIID
                        }
                    };
                    
                    await Driver.updateDriver(driverId, { razorpayLinkedAccountDetails: accountDetailsData });
                }
                // await Driver.updateDriver(driverId, { isApproved: false });
                return res.status(200).json({ success: true, message: 'Bank details uploaded successfully' });
            })
        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.getDriverDocsPublicRides = async function (req, res) {
        const driverId = req.driver.id;
        try {

            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
            if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });

            return res.json({ success: true, documents: driver.documents });

        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.getDriverDetailsPublicRides = async function (req, res) {
        const driverId = req.driver.id;
        try {
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
            if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });

            delete driver['password'];
            let acceptDurationData = null
            let minDueAmount = 1
            // delete driver['fcmToken'];
            if (driver?.regionalOffice ) {
                const getRegionalOffice = await PublicRideRegionalOffices.getRegionalOfficeById(driver.regionalOffice);
                const fareConfigs = await FareConfigs.getFareConfigById(getRegionalOffice.fareConfig)
                acceptDurationData = fareConfigs
                minDueAmount = fareConfigs?.driverMinDueAmount || 1
            }
            const driverInfo = {...driver, acceptDuration: acceptDurationData?.tripAcceptDuration ? acceptDurationData?.tripAcceptDuration : null, minDueAmount: minDueAmount};
            return res.json({ success: true, driver: driverInfo });

        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.updateDriverDetails = async function (req, res) {
        try {
            const driverId = req.driver.id;
            const [payload, errRes] = await this.validate(req.body, driverDetailsUploadSchema);
            if (!payload) return res.status(400).json(errRes);
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

            if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });
            payload.location = { type: "Point", coordinates: [Number(payload?.location[0]), Number(payload?.location[1])] };
            const regionalOfficeData = await PublicRideRegionalOffices.getRegionalOffices(payload.homeLocation.coordinates); 
            // if (!regionalOfficeData) return res.status(200).json({ success: false, message: 'Regional office not found' });
            if(regionalOfficeData){
                payload.regionalOffice = new ObjectId(regionalOfficeData.regionOfficeId);
            }else{
                payload.regionalOffice = null;
            }
            const updatedDriver = await Driver.updateDriverInformation(driverId, payload);

            return res.json({ success: true, message: 'Driver details updated successfully', driver: updatedDriver });


        } catch (error) {
            console.log(error);
            return error;
        }
    }

    CLASS.prototype.updateVehicleInformationPublicRides = async function (req, res) {
        try {
            const driverId = req.driver.id;
            const [payload, errRes] = await this.validate(req.body, vehiclePublicRideSchema);
            if (!payload) return res.status(400).json(errRes);

            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });

            if (!driver.publicRidesDriver)
                return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });

            if (payload.roadTaxExpiry === 'lifetime') {
                payload.roadTaxExpiry = 'lifetime';
            } 
            
            const existingvehicle = await Driver.getVehiclesWithRegNum(payload.regNo)
            
            if (existingvehicle) {
                // Check if the vehicle belongs to the same driver
                const existingDriverId = existingvehicle.driverId?.toString() || existingvehicle.driverId || null;
                const currentDriverId = driverId.toString();
                
                // If vehicle is unassigned (no driverId) or belongs to the same driver, update it
                if (!existingDriverId || existingDriverId === currentDriverId) {
                    // Same driver or unassigned vehicle, update the existing vehicle
                    const vehicleInfo = payload;
                    vehicleInfo.driverId = driverId;
                    
                    // Update the existing vehicle directly
                    await Mongo.updateOneRaw(
                        'vehicles',
                        { _id: new ObjectId(existingvehicle._id) },
                        { $set: vehicleInfo }
                    );
                    
                    // Update driver's vehicleId reference if needed
                    await Mongo.updateOne(
                        'drivers',
                        { _id: new ObjectId(driverId) },
                        { vehicleId: existingvehicle._id.toString() }
                    );
                    
                    const updatedVehicle = await Driver.getVehiclesWithRegNum(payload.regNo);
                    return res.json({ success: true, message: 'Vehicle information updated successfully', vehicle: updatedVehicle });
                } else {
                    // Different driver, return error
                    return res.status(400).json({ success: false, message: 'Vehicle already registered by another driver' });
                }
            }

            // No existing vehicle with this regNo, proceed with normal update/create
            const vehicleInfo = payload
            payload.driverId = driverId

            const vehicle = await Driver.updateVehicleInformation(driverId, vehicleInfo);
            return res.json({ success: true, message: 'Vehicle information updated successfully', vehicle });

        } catch (error) {
            return this.handleError(error, res);
        }
    }

    CLASS.prototype.getTrip = async function (req, res) {
        const tripId = req.query.tripId;

        if (!tripId) return res.status(400).json({ success: false, message: 'Trip ID is required' });
      
        try {
            const trip = await Trip.getTripWithPassangerDetails(tripId);
            if (!trip) return res.status(400).json({ success: false, message: 'Trip does not exists' });

            return res.json({ success: true, trip });
        } catch (err) {
            return this.handleError(err, res);
        }

    }

    CLASS.prototype.getTotalFare = async function (req, res) {
        const tripId = req.query.tripId;
        const distance= Number(req.query.distance);
        const duration = Number(req.query.duration);
        const encodedData = req?.body?.encodedPolyline;

        let farecalculationDistance = distance || 0;
        let farecalculationDuration = duration || 0;
        

        // DistanceOffset logic: if distance < estimatedDistance, offset is 4; if more, offset is 1
        let DistanceOffset = 3; // default, will be set below
        const DurationOffset = 20;
        let estimatedDistance = 0;
        let estimatedDuration = 0;
      
        

        if (!tripId) return res.status(400).json({ success: false, message: 'Trip ID is required' });
        try {
            const driverId = req.driver.id;
            const trip = await Trip.getTripById(tripId);
            const passangerId = trip.passangerId;
            const totalWatingTime = trip.stops.reduce((sum, stop) => {
                return sum + (stop.driverWaitTime || 0);
            }, 0);
            // Continue only if trip status is PICKEDUP
            if (trip.status !== RideStatus.PICKEDUP) {
                return res.status(400).json({ success: false, message: 'Trip is not in PICKEDUP status' });
            }

            if (trip?.estimatedDistance && trip?.estimatedDuration) {
                estimatedDistance = trip?.estimatedDistance ? Number(trip?.estimatedDistance) : 0;
                estimatedDuration = trip?.estimatedDuration ? Number(trip?.estimatedDuration) : 0;
            }
          
   
            // Set DistanceOffset based on distance vs estimatedDistance
            if (distance < estimatedDistance) {
                DistanceOffset = 3;
            } else {
                DistanceOffset = 1;
            }
            const distanceDiff = Math.abs(distance - estimatedDistance);
            const durationDiff = Math.abs(duration - estimatedDuration);
            if (DistanceOffset >= distanceDiff) {
                farecalculationDistance = estimatedDistance;
            }
            if (DurationOffset >= durationDiff) {
                farecalculationDuration = estimatedDuration;
            }

            
            
            const getFinalStopIndex = trip?.stops.length - 1;
            const passangerDetails = await Passanger.getPassangerWithId(passangerId);
            if (!driverId) return res.status(400).json({ success: false, message: 'Driver Not Found' });
            const payload = {
                distance: farecalculationDistance,
                duration: farecalculationDuration,
                waitTime: totalWatingTime,
                zone: 'all',
                tripId: tripId
            }

            const getfinalFare = await FareService.calculateFinalFareFromTrip(payload)
            if (!getfinalFare.success) return res.json({ success: false, message: getfinalFare?.error || "Fare Details Fetch Fails" });
            const finalFare = getfinalFare?.data
            finalFare.distance = distance
            finalFare.duration = duration
            const tripTimelineObj = {
                state: 'DROPPED',
                timestamp: new Date().getTime(),
            }
           
            await Trip.updateTripFinalInfowithTimeline(tripId, RideStatus.DROPPED, duration, distance, totalWatingTime, getFinalStopIndex, encodedData, tripTimelineObj)
            // const updatePaymentsToTrip = await PublicRidesPayment.updatePaymentToTrip(tripId, driverId, passangerId, finalFare)
            // if (!updatePaymentsToTrip.success) return res.json({ success: true, message: "Error updating fare details"});
            if(getFinalStopIndex){
                trip.stops[getFinalStopIndex].isReached = true;
            }
            trip.status = RideStatus.DROPPED;
            let supplierInfo = null;
            // let adminInfo = null;
            if (finalFare.supplier.type === "vendor"){
                const vendor = await Vendors.getVendorWithId(finalFare.supplier.id);
                if(vendor){
                    supplierInfo = {
                        name: vendor.VendorName,
                        phone: vendor.ownerPhone,
                        email: vendor.ownerEmail,
                        state: vendor.state,
                        address: vendor.fullAddress,
                        gstNumber: vendor.gst,
                        panNumber: vendor.companyPANNumber,
                    }
                    if(vendor?.digitalSignature){
                        const ImagePath = vendor.digitalSignature.replace(/^https:\/\/[^/]+\/?/, '');
                        const rjvw = new GeneratePresignedUrl();
                        supplierInfo.digitalSignature = await rjvw.generatePresignedImg(ImagePath);
                    }
                }
            }
            // const adminOffice = await AdminOffice.getAdminOffice();
            // if(adminOffice){
            //     adminInfo = {
            //         name: adminOffice.CompanyName,
            //         phone: adminOffice.ownerPhone,
            //         email: adminOffice.ownerEmail,
            //         state: adminOffice.state,
            //         address: adminOffice.area,
            //         gstNumber: adminOffice.gst,
            //         panNumber: adminOffice.companyPANNumber,
                    
            //     }
            //     if(adminOffice?.digitalSignature){
            //         const ImagePath = adminOffice.digitalSignature.replace(/^https:\/\/[^/]+\/?/, '');
            //         const rjvw = new GeneratePresignedUrl();
            //         adminInfo.digitalSignature = await rjvw.generatePresignedImg(ImagePath);
            //     }
            // }
            sendPassangerSocketEvents(passangerId, req.socketService, trip, finalFare).catch(err => {  
                console.log(err, "Error sending socket events to passanger")
            })
            const PassengerToken = passangerDetails?.fcmToken?.token;
            // console.log(PassengerToken, "PassengerToken")
            // console.log(finalFare, "finalFare?.fare")
            if(PassengerToken && finalFare?.fareDetails?.fare){
                if(req?.useNotPushNotification){
                    NOTPushNotifiationService.sendPushNotification(PassengerToken, reachedDestinationMessage(finalFare.fareDetails.fare), null, 'high', { tripId: String(trip._id), "trip_status": 'DROPPED' });

                }else{
                    PushNotifiationService.sendPushNotification(PassengerToken, reachedDestinationMessage(finalFare.fareDetails.fare), null, 'high', { tripId: String(trip._id), "trip_status": 'DROPPED' });
                    
                }
                
            }
            finalFare.supplier = supplierInfo;
            // finalFare.adminInfo = adminInfo;
            return res.json({ success: true, message: "Fare details fetched successfully", totalFare: finalFare });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.verifyTripOtp = async function (req, res) {
        const { tripId, otp } = req.body;
        if (!tripId || !otp) return res.status(400).json({ success: false, message: 'Trip ID and OTP are required' });
        try {
            const trip = await Trip.getTripById(tripId);
            if (trip.status === RideStatus.CANCELLED ) return res.status(400).json({ success: true, message: 'Trip is already cancelled', isCancelled: true });
            const passangerId = trip.passangerId;
            if (!trip) return res.status(400).json({ success: false, message: 'Trip not found' });
            if (trip.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
            const timeline = {
                state: 'PICKEDUP',
                timestamp: new Date().getTime(),
            };
            await Trip.updateTripStatusandStopswithTimeline(tripId, 'PICKEDUP', timeline);
            trip.stops[0].isReached = true;
            trip.stops[0].arrivalTime = new Date().getTime();
            trip.stops[0].driverWaitTime = 0;
            trip.stops[0].stopUpdated = true;
            trip.status = RideStatus.PICKEDUP 
            sendPassangerSocketEvents(passangerId, req.socketService, trip).catch(err => {  
                console.log(err, "Error sending socket events to passanger")
            })
            const passanger = await Passanger.getPassangerWithId(passangerId);
            if (passanger?.fcmToken) {
                if(req?.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(
                        passanger.fcmToken.token,
                        sendCustomerTripStartedMessage(),
                        null,
                        "high",
                        { tripId: String(trip._id), "trip_status": 'PICKEDUP' }
                    );
                }else{
                    await PushNotifiationService.sendPushNotification(
                        passanger.fcmToken.token,
                        sendCustomerTripStartedMessage(),
                        null,
                        "high",
                        { tripId: String(trip._id), "trip_status": 'PICKEDUP' }
                    );
                }
            }
            return res.json({ success: true, message: 'OTP verified successfully' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updatePublicRidesDriverStatus = async function (req, res) {
        const driverId = req.driver?.id;
        const newStatus = String(req.body?.status || '').trim().toLowerCase();
        const userLocation = req.body?.location;

        try {
            if (!driverId) {
                return res.status(400).json({ success: false, message: 'Driver ID is required' });
            }
            if (!newStatus) {
                return res.status(400).json({ success: false, message: 'status is required' });
            }
            const now = Date.now();

            // const now = new Date();
            // const nextMonth = new Date();
            // const now = new Date(nextMonth);

            // now.setMonth(now.getMonth() + 1);

            // 1) Load driver
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            const prev = driver.driverStatus || {};
            const prevStatus = prev.status;
            const lastUpdatedOn = Number(prev.updatedOn || now);

            // 2) If status changed, close the previous session [lastUpdatedOn → now]
            const changed = !!prevStatus && prevStatus !== newStatus && lastUpdatedOn <= now;

            let closedWindowSummary = null;

            if (changed) {
                closedWindowSummary = { status: prevStatus, from: lastUpdatedOn, to: now };

                // Log to driverWorkHistory — creates separate doc per month,
                // pushes { status, from, to } into workingHours array,
                // and recomputes dailyOnlineHours + totalOnlineHours
                await DriverWorkHistory.logDriverSessionMonthly(
                    driverId,
                    lastUpdatedOn,
                    now,
                    prevStatus,
                    userLocation || null
                );
            }

            // 3) Update driver doc
            const update = {
                driverStatus: { status: newStatus, updatedOn: now },
                isAvailable: newStatus === 'online',
            };

            if (userLocation !== undefined) {
                update.location = userLocation;
            }

            await Driver.updateDriver(String(driverId), update);

            return res.json({
                success: true,
                message: `Status Updated - ${newStatus}`,
                data: {
                    driverId,
                    fromStatus: prevStatus || null,
                    toStatus: newStatus,
                    closedWindow: closedWindowSummary,
                    location: userLocation || null,
                    updatedOn: now,
                },
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    };

    CLASS.prototype.publicridesDriverPassengerRating = async function (req, res) {
        const { tripId, rating, comment } = req.body;
        const trip = await Trip.getTripById(tripId);
        if(!trip) return res.json({ success: false, message: "Trip not found" });
        const ratingdata={
            rating: rating,
            comment: comment,
        }
        let passengerRatingdata = {};
        const passenger = await Passenger.getPassangerWithId(trip.passangerId);

        if (!passenger) return res.json({ success: false, message: "Passenger not found" });

        if (passenger?.ratingData){
            const updatedCount = passenger.ratingData.count + 1;
            const updatedTotal = passenger.ratingData.total + rating;
            const updatedAverage = updatedTotal / updatedCount;
            passengerRatingdata={
                currentrating: updatedAverage,
                count: updatedCount,
                total: updatedTotal
            }
        }else{
            passengerRatingdata={
                currentrating: rating,
                count: 1,
                total: rating
            }
        }
        const updateratinginTrip = await Trip.updateTripPassengerRating(tripId, ratingdata);
        const updateratinginPassenger = await Passenger.updatePassangerRating(trip.passangerId, passengerRatingdata);
        if (updateratinginTrip?.acknowledged && updateratinginPassenger?.acknowledged) {
            return res.json({ success: true, message: "Rating updated successfully" });
        }

        return res.json({ success: false, message: "Failed to update rating" });
    }

    CLASS.prototype.updatePaymentReceive = async function (req, res) {
        const { tripId, fareDetails, status, role, paymentMethod } = req.body;
        const driverId = req.driver.id;
        try {
            const trip = await Trip.getTripById(tripId);
            if(!trip) return res.json({ success: false, message: "Trip not found" });
            if (!driverId) return res.json({ success: false, message: "Driver Id not found" });
            const passenger = await Passenger.getPassangerWithId(trip.passangerId);
            if (!passenger) return res.json({ success: false, message: "Passenger not found" });
            const driverDetails = await Driver.getDriverWithId(driverId)
           
            let nextDueDate = null;
            let dueCycle = null;
            if (role === 'dco') {
                const driverEarningData = {
                    driverEarnings: fareDetails?.breakdown?.driverEarnings,
                    driverDue: fareDetails?.breakdown?.driverDue
                }

                if (!fareDetails?.breakdown?.driverEarnings || !fareDetails?.breakdown?.driverDue) {
                    return res.json({ success: false, message: "Invalid fare data" })
                }
             
                const driverDueDate = await PublicRidesPayment.updateDriverDueDate(driverDetails)
                if(!driverDueDate) {
                    return res.json({ success: false, message: "Failed to update driver due date" })
                }
                nextDueDate = await Driver.updateDriverPayment(driverDetails, driverEarningData, tripId, driverDueDate)
                if (!nextDueDate) {
                    nextDueDate = driverDetails.nextDueDate
                    dueCycle = driverDueDate
                }
            }
            if (role === 'salaried') {
                let vendorId = driverDetails.vendorId
                const vendorDueEarnings = {
                    vendorDue: fareDetails?.breakdown?.driverDue,
                    vendorEarnings: fareDetails?.breakdown?.driverEarnings
                }
                
                if (!fareDetails?.breakdown?.driverEarnings || !fareDetails?.breakdown?.driverDue) {
                    return res.json({ success: false, message: "Invalid fare data" })
                }
                
                if (typeof driverDetails.vendorId === 'object') {
                    vendorId = driverDetails.vendorId.toString()
                }
                const updateVendorDue = await PublicRidesPayment.updateVendorDue(vendorId, vendorDueEarnings)
                if(!updateVendorDue.acknowledged) {
                    return res.json({ success: false, message: "Failed to update vendor due" })
                }
            }
            await Driver.updateDriver(driverId, { tripStatus: "NOTRIP", isAvailable: true });
            await PublicRidesPayment.updatePassangerPaymentStatus(tripId, paymentMethod);
            await Passanger.updatePassangerCompletedTripsandTspends(passenger?._id, fareDetails?.fare, status);
            trip.status = status;
            trip.tripFare = fareDetails?.fare;

            const tripTimelineObj = {
                state: status,
                timestamp: new Date().getTime(),
            }
            await Trip.updateTripStatusandPaymentMethodwithTimeline(tripId, status, 'CASH', tripTimelineObj);
            sendPassangerSocketEvents(passenger?._id, req.socketService, trip).catch(err => {  
                console.log(err, "Error sending socket events to passanger")
            })
            if (passenger?.fcmToken && fareDetails?.fare) {
                if(req?.useNotPushNotification){
                    await NOTPushNotifiationService.sendPushNotification(passenger.fcmToken.token, sendCompletedTripMessagePaymentCompleted(fareDetails?.fare), null, "high", { tripId: String(trip._id), "trip_status": status });
                }else{
                    await PushNotifiationService.sendPushNotification(passenger.fcmToken.token, sendCompletedTripMessagePaymentCompleted(fareDetails?.fare), null, "high", { tripId: String(trip._id), "trip_status": status });
                }
                
            }

            if (process.env.WA_ENABLED === "enabled") { 
              if (status === "COMPLETED" && passenger?.stats?.completedTrips === 1 ) { 
                whatsappService.sendReviewMessage({ name: passenger.name, phone: passenger.phone, fare: fareDetails?.fare }).catch(err => {
                    console.log(err, "Error sending WhatsApp review message")
                })
             }
            }
            
            res.json({ success: true, message: "Trip and Payment Completed", nextDueDate: role === 'dco' ? nextDueDate : null, dueCycle: role === 'dco' ? dueCycle : null });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.publicridesGetTrips = async function (req, res) {
        let { startTime, endTime, tripStatus, page, limit } = req.query;
        const driverId = req.driver.id;

        // Fix: Convert pagination parameters to integers with defaults
        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;


        try {

            if (startTime) {
                startTime = parseInt(startTime, 10);
            }

            if (endTime) {
                endTime = parseInt(endTime, 10);
            }

            // Fix: Convert driverId to ObjectId
            let filter = {};
            if (ObjectId.isValid(driverId)) {
                filter.driverId = new ObjectId(driverId);
            } else {
                filter.driverId = driverId;
            }

            // Only add bookingTime filter if startTime or endTime is provided
            if (startTime || endTime) {
                filter.bookingTime = {};
                if (startTime && !Number.isNaN(startTime)) {
                    filter.bookingTime.$gte = startTime;
                }
                if (endTime && !Number.isNaN(endTime)) {
                    filter.bookingTime.$lte = endTime;
                }
            }

            if (tripStatus) {
                filter.status = tripStatus;
            }

            const { trips, totalCount } = await Trip.getTripsForPassanger(filter, page, limit);
        
            const tripsWithPaymentDetails = await Promise.all(trips.map(async (trip) => {
                const paymentDetails = await PublicRidesPayment.getPaymentDetailsByTripId(trip._id);
                let supplierInfo = null;
                let recipient = null;
                // let adminInfo = null;
                const passengerDetails = await Passanger.getPassangerWithId(trip.passangerId);
                // const adminOffice = await AdminOffice.getAdminOffice();
                if (paymentDetails?.supplier?.type === "vendor"){
                    const vendor = await Vendors.getVendorWithId(paymentDetails?.supplier?.id);
                    if(vendor){
                        supplierInfo = {
                            name: vendor.VendorName,
                            phone: vendor.ownerPhone,
                            email: vendor.ownerEmail,
                            state: vendor.state,
                            address: vendor.fullAddress,
                            gstNumber: vendor.gst,
                            panNumber: vendor.companyPANNumber,
                        }
                    }
                }
              
                if(passengerDetails){
                    recipient = {
                        name: passengerDetails.name,
                        phone: passengerDetails.phone,
                        email: passengerDetails.email,
                    }
                }
               
                // if(adminOffice){
                //     adminInfo = {
                //         name: adminOffice.CompanyName,
                //         phone: adminOffice.ownerPhone,
                //         email: adminOffice.ownerEmail,
                //         state: adminOffice.state,
                //         address: adminOffice.area,
                //         gstNumber: adminOffice.gst,
                //         panNumber: adminOffice.companyPANNumber,
                        
                //     }
                //     if(adminOffice?.digitalSignature){
                //         const ImagePath = adminOffice.digitalSignature.replace(/^https:\/\/[^/]+\/?/, '');
                //         const rjvw = new GeneratePresignedUrl();
                //         adminInfo.digitalSignature = await rjvw.generatePresignedImg(ImagePath);
                //     }
                // }
                return { ...trip, paymentDetails, supplierInfo, recipient};
            }));

            return res.json({ 
                success: true, 
                trips: tripsWithPaymentDetails, 
                pagination: { totalPages: Math.ceil(totalCount / limit), page, limit } 
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.logoutFromVehicle = async function (req, res) {
        const driverId = req.driver.id;
        try {
            const result = await Driver.removePublicRidesDriverVehicle(driverId);
            if (!result) return res.json({ success: false, message: "Failed to logout from vehicle" });
            return res.json({ success: true, message: "Logged out from vehicle" });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getAvailabelVendorVehicle = async function (req, res) {
        const vendorId = req.query.vendorId;
        try {
            const result = await Driver.getAvailabelVendorVehicle(vendorId);
            if (!result) return res.json({ success: false, message: "No vehicle found" });
            return res.json({ success: true, message: "Vehicle found", vehicleList: result });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateDriverVehicle = async function (req, res) {
        const driverId = req.driver.id;
        const vehicleId = req.query.vehicleId;
        try {
            const result = await Driver.updatePublicRidesDriverVehicle(driverId, vehicleId);
            if (!result) return res.json({ success: false, message: "No vehicle found" });
            return res.json({ success: true, message: "Vehicle found", vehicleList: result });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getAvailabelVehicle = async function (req, res) {
        const driverId = req.driver.id;
        try {
            const driver = await Driver.getDriverWithId(driverId);
            if(!driver) return res.status(400).json({ message: "Driver not found" });
            const regionalOffice = driver.regionalOffice;
            if(!regionalOffice){
                const vehicleTypes = await FareConfigs.getVehicleType('default');
                if(!vehicleTypes.vehicleTypes){
                    return res.status(400).json({ message: "No vehicle types found" });
                }
                return res.json({ success: true, message: "Vehicle found", vehicleList: vehicleTypes });
            }
            const getRegionalOffice = await PublicRideRegionalOffices.getRegionalOfficeById(regionalOffice);
            const vehicleTypes = await FareConfigs.getFareConfigById(getRegionalOffice.fareConfig);
            if(!vehicleTypes.vehicleTypes){
                return res.status(400).json({ message: "No vehicle types found" });
            }
            return res.json({ success: true, message: "Vehicle found", vehicleList: vehicleTypes });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getPublicRidesTicketCategories = async function (req, res) {
        try {
            const categories = await PublicRidesTicket.getPublicRidesTickets();
            return res.json({ success: true, categories });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getPublicDriverWrkHistory = async function (req, res) { 
        const driverId = req.driver.id;
        try {
            const result = await Driver.getPublicDriverWrkHistory(driverId);
            return res.json({ success: true, wrkHistory: result });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.driverDeleteAccount = async function (req, res) { 
        const [payload, errRes] = await this.validate(req.body, driverDeleteAccountSchema);
        if (!payload) return res.status(400).json(errRes);
        const {phone, otp, role, vehicleId} = req.body;
        const driverId = req.driver.id;
        try {
            const otpData = await Redis.getData(phone);
            if (!otpData) return res.status(400).json({ success: false, message: 'OTP expired' });
          
            if (Number(otpData) !== Number(otp)) return res.status(400).json({ success: false, message: 'Invalid OTP' });
            await Redis.removeKey(phone);
            await Driver.deleteDriver(driverId, role, vehicleId);
            return res.json({ success: true, message: "Account deleted successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.sendUnblockRequest = async function (req, res) { 
        const driverId = req.driver.id;
        try { 
            // todo : send unblock request to admin, or vendor or fleet manager
            await Driver.updateDriver(driverId, { unBlockRequestSent: true });
            return res.json({ success: true, message: "Unblock request sent successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.updateDriverMovements = async function (req, res) { 
       
        const driverId = req.driver.id;
        const movements = req.body;
        const lastMovement = movements?.locations[movements?.locations?.length - 1];
        try { 
            if (!lastMovement) return res.json({ success: false, message: "Last movement not found" });
            await Driver.updateLiveDriverMovements(driverId, lastMovement);
            return res.json({ success: true, message: "Unblock request sent successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.requestEditDocuments = async function (req, res) { 
        const driverId = req.driver.id;
        try { 
            await Driver.updateDriver(driverId, { isApproved: false });
            return res.json({ success: true, message: "Request sent successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.publicridesdriverLogout = async function (req, res) { 
        const platform = req?.query?.platform;
        const driverId = req.driver.id;
        if (!driverId) return res.status(400).json({ success: false, message: 'driver Id is Required' });
        const schema = driverLogoutSchema(platform);
        const [payload, errRes] = await this.validate(req.body, schema);
        if (!payload) return res.status(400).json(errRes);

        // if (!refreshToken) return res.status(400).json({ success: false, message: 'No Refresh Token Available' });

        try {
            // const decoded = await this.validateJWT(refreshToken, process.env.JWT_REFRESH_SECRET);
            // const userIdFromRefreshToken = decoded[0].user.id;
            // if (userIdFromRefreshToken !== passangerId) return res.status(400).json({ success: false, message: 'Logout Access Denied' });

            const driverExists = await Driver.getDriverWithId(driverId);
            if (!driverExists) return res.status(400).json({ success: false, message: 'driver does not exist' });

            const updatedDriver = await Driver.updateDriver(String(driverId), {
                driverStatus: { status: 'offline', updatedOn: new Date().getTime() },
                isAvailable: false,
                fcmToken: {
                    deviceImei: null,
                    token: null
                }
            });
            if (!updatedDriver) return res.status(400).json({ success: false, message: 'Failed to update driver' });
            // Clear the refresh token cookie
            // res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'none', secure: true });

            // if (payload.fcmToken) {
            //     const userDeviceImeiSet = new Set(driverExists.fcmTokens?.map(token => token.deviceImei) || []);

            //     if (userDeviceImeiSet.has(payload.fcmToken.deviceImei)) {
            //         await Driver.removeUserFcmTokenDeviceImei(driverId, payload.fcmToken);
            //     }
            // }

            return res.status(200).json({ success: true, message: 'Logged out successfully' });

        } catch (err) {
            this.handleError(err, res);
        } 
    }

    CLASS.prototype.publicridesBlockDriver = async function (req, res) { 
        const driverId = req.driver.id;
        try {
            const result = await Driver.updateDriver(driverId, { isBlocked: true, isAvailable: false, driverStatus: { status: 'offline', updatedOn: new Date().getTime() } });
            if (!result) return res.status(400).json({ success: false, message: "Failed to block driver" });
            return res.json({ success: true, message: "Driver blocked successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.razorpayLink = async function (req, res) { 
        const { driverRefId, name, email, phone, address, bank, pan } = req.body;
        const driverId = req.driver.id;
         
        if (!driverRefId || !name || !email || !phone || !address || !bank?.ifsc || !bank?.accountNumber || !bank?.beneficiaryName) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required fields (driverRefId, name, email, phone, address, bank.ifsc, bank.accountNumber, bank.beneficiaryName)' }
            });
        }
        try {
            const razorpayLinking = new RazorPayLinking();
            const accountDetails = await razorpayLinking.linkRazorpayAccount(driverId, driverRefId, name, email, phone, address, bank, pan);
            
            // Check if the Razorpay linking was successful
            if (!accountDetails.success) {
                return res.status(400).json({
                    success: false,
                    error: accountDetails.error,
                    statusCode: accountDetails.statusCode || 400
                });
            }

            const accountDetailsData = {
                accountDetails: accountDetails.data.accountDetails,
                address: address,
                email: email,
                linkedAccountId: accountDetails.data.linkedAccountId,
                productId: accountDetails.data.productId,
            }
            
            // Only proceed if Razorpay linking was successful
            const result = await Driver.updateDriver(driverId, { razorpayLinkedAccountDetails: accountDetailsData });
            if (!result) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Failed to update driver with Razorpay account ID" 
                });
            }
            
            return res.json({
                success: true, 
                message: 'Account linked successfully', 
                data: accountDetailsData 
            });
        } catch (err) {
            console.log("err -- >> ", JSON.stringify(err));
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.updateDriverDynamicData = async function (req, res) { 
        const driverId = req.driver.id;
        const dynamicData = req.body;
        try {
            const result = await Driver.updateDriver(driverId, dynamicData);
            if (!result) return res.status(400).json({ success: false, message: "Failed to update driver dynamic data" });
            return res.json({ success: true, message: "Driver dynamic data updated successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.revokeAccountDeletion = async function (req, res) { 
        const driverId = req.driver.id;
        try {
            if(!driverId) return res.status(400).json({ success: false, message: "Driver ID is required" });
            const driver = await Driver.getDriverWithId(driverId);
            if(!driver) return res.status(400).json({ success: false, message: "Driver not found" });
            const vehicleId = driver.vehicleId;
            if(!vehicleId) return res.status(400).json({ success: false, message: "Vehicle ID is required" });
            const result = await Driver.updateDriver(driverId, { isDeleted: false });
            const vehicleResult = await Driver.updateVehicleId(vehicleId);
            if (!result || !vehicleResult) return res.status(400).json({ success: false, message: "Failed to revoke account deletion" });
            return res.json({ success: true, message: "Account deletion revoked successfully" });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.getActiveTrip = async function (req, res) { 
        const driverId = req.driver.id;
        try {
            const driverTripId = await Driver.getDriverWithId(driverId);
            const tripId = driverTripId?.currentTripId;
            const result = await Driver.getActiveTrip(tripId);
            const paymentDetails = await PublicRidesPayment.getPaymentDetailsByTripId(tripId);
            const tripWithPaymentDetails = { ...result, paymentDetails };
            return res.json({ success: true, trip: [tripWithPaymentDetails] });
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.driverAppConfig = async function (req, res) { 
        try {
            const driverConfig = await Driver.getDriverConfiguration();
            return res.json({ success: true, data: driverConfig});
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.notDriverAppConfig = async function (req, res) { 
        try {
            const driverConfig = await Driver.getNOTDriverConfiguration();
            return res.json({ success: true, data: driverConfig});
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.getOnboardingConfig = async function (req, res) {
        try {
            const config = await AppConfig.getOnboardingConfig();
            if (!config) return res.status(404).json({ success: false, message: 'Onboarding config not found' });
            const { VEHICLE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS, MAKES_IN_INDIA, MODELS_BY_MAKE, ADVANCED_FEATURES, TRANSMISSION_OPTIONS } = config;
            return res.json({ success: true, data: { VEHICLE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS, MAKES_IN_INDIA, MODELS_BY_MAKE, ADVANCED_FEATURES, TRANSMISSION_OPTIONS } });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getDueInvoice = async function (req, res) { 
        const driverId = req.driver.id;
        const DueAmount = req.body.DueAmount;
        try {
            if (!DueAmount || DueAmount <= 0) {
                return res.status(400).json({ success: false, message: "Due amount must be greater than zero" });
            }
            const driver = await Driver.getDriverWithId(driverId);
            if(!driver) return res.status(400).json({ message: "Driver not found" });
            const regionalOffice = driver.regionalOffice;
            const getRegionalOffice = await PublicRideRegionalOffices.getRegionalOfficeById(regionalOffice);
            if (!getRegionalOffice) {
                return res.status(400).json({ message: "Regional office not found" });
            }
            const fareConfig = await FareConfigs.getFareConfigById(getRegionalOffice.fareConfig);
            if(!fareConfig){
                return res.status(400).json({ message: "Fare config not found" });
            }
            const dueConfig = fareConfig?.driverDueConfig;

            const finalDueAmount = FinalDueCalculator.calculateFinalDue(DueAmount, dueConfig);
           
            return res.json({ success: true, data: finalDueAmount});
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateNextDueDate = async function (req, res) { 
        try {
            const driverId = req.driver.id;
            const driver = await Driver.getDriverWithId(driverId);
            if(!driver) return res.status(400).json({ message: "Driver not found" });
            const driverDueDate = await PublicRidesPayment.updateDriverDueDate(driver)
            if(!driverDueDate) {
                return res.json({ success: false, message: "Failed to update driver due date" })
            }
            const result = await Driver.updateDriverDueDate(driverId, driverDueDate)
            return res.json({ success: true, message: "Next due date updated successfully", nextDueDate: result.nextDueDate});
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getMultipleTripsDetail = async function (req, res) { 
        const { tripIds } = req.body;
        try {
            if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
                return res.status(400).json({ success: false, message: "tripIds must be a non-empty array" });
            }
            const tripDetails = await Trip.getMultipleTripsDetail(tripIds);
            const paymentsDetails = await PublicRidesPayment.getMultipleTripsPaymentDetails(tripIds);

            const concactData = tripDetails.map(trip => {
                const paymentDetail = paymentsDetails.find(payment => String(payment.tripId) === String(trip._id));
                return { ...trip, paymentDetail };
            })
            return res.json({ success: true, data: concactData});
        } catch (err) {
            return this.handleError(err, res);
        }   
    }

    CLASS.prototype.getFareConfigs = async function (req, res) {
        const driverId = req.driver.id;
        try {
            const driver = await Driver.getDriverWithId(driverId);
            if(!driver) return res.status(400).json({ message: "Driver not found" });
            const regionalOffice = driver.regionalOffice;
            const getRegionalOffice = await PublicRideRegionalOffices.getRegionalOfficeById(regionalOffice);
            if (!getRegionalOffice) {
                return res.status(400).json({ message: "Regional office not found" });
            }
            const fareConfig = await FareConfigs.getFareConfigById(getRegionalOffice.fareConfig);
            if(!fareConfig){
                return res.status(400).json({ message: "Fare config not found" });
            }
            const dataToReturn = {
                vehicleTypes: fareConfig.vehicleTypes,
                surge: fareConfig.surge,
            }
            return res.status(200).json({ success: true, message: "Fare Config Details", data: dataToReturn});
        } catch (err) { 
            return this.handleError(err, res);
        }
    }

    // New Driver Details Entry
    CLASS.prototype.updatePreferredWorkLocation = async function (req, res) {
        try {
            const driverId = req.driver.id;
            const [payload, errRes] = await this.validate(req.body, driverDetailsUploadSchema);
            if (!payload) return res.status(400).json(errRes);
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
            if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });
            payload.location = { type: "Point", coordinates: [Number(payload?.location[0]), Number(payload?.location[1])] };
            const regionalOfficeData = await PublicRideRegionalOffices.getRegionalOffices(payload.homeLocation.coordinates); 
            if(regionalOfficeData){
                payload.regionalOffice = new ObjectId(regionalOfficeData.regionOfficeId);
            } else {
                payload.regionalOffice = null;
            }
            payload.isApproved = false;
            const updatedDriver = await Driver.updateDriverInformation(driverId, payload);
            return res.json({ success: true, message: 'Driver details updated successfully', driver: updatedDriver });
        } catch (err) { 
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateDriverInfo = async function (req, res) {

        try {
            cpUpload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ success: false, message: 'Error parsing form data', error: err.message });
                }

                const driverId = req.driver.id;
                const driver = await Driver.getDriverWithId(driverId);
                if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
                if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });

                // 1) Update scalar fields from form-data (if provided)
                const allowedFields = ['name', 'phone', 'alternatePhone', 'gender', 'dob', 'licenseNo'];
                const coreUpdates = {};
                for (const key of allowedFields) {
                    if (Object.prototype.hasOwnProperty.call(req.body, key) && req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
                        coreUpdates[key] = req.body[key];
                    }
                }
                // Verify DL via MParivahan if licenseNo provided (uses dob from body or existing driver)
                if (coreUpdates.licenseNo) {
                    // const normalizeLicenseNo = (ln) => String(ln).trim().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
                    const normalizeDob = (d) => {
                        if (!d) return null;
                        if (typeof d === 'number') {
                            try { return new Date(d).toISOString().slice(0, 10); } catch { return null; }
                        }
                        if (typeof d === 'string') {
                            const s = d.trim();
                            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
                            const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
                            if (m) { return `${m[3]}-${m[2]}-${m[1]}`; }
                            const t = Date.parse(s);
                            if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
                        }
                        if (d instanceof Date) return d.toISOString().slice(0, 10);
                        return null;
                    };

                    // const normalizedLicenseNo = normalizeLicenseNo(coreUpdates.licenseNo);
                    const dobInput = Object.prototype.hasOwnProperty.call(coreUpdates, 'dob') ? coreUpdates.dob : driver?.dob;
                    const normalizedDob = normalizeDob(dobInput);
                    if (!normalizedDob) {
                        return res.status(400).json({ success: false, message: 'dob is required/invalid for license verification' });
                    }

                    // try {
                    //     const verifyDLRes = await DriverVerifierMParivahan.verifyDL(normalizedLicenseNo, normalizedDob);
                    //     if (!verifyDLRes?.valid) {
                    //         return res.status(400).json({ success: false, message: verifyDLRes?.message || 'Invalid license number' });
                    //     }
                    //     // Use normalized license number for persistence
                    //     coreUpdates.licenseNo = normalizedLicenseNo;
                    //     // Persist raw DL verification payload on driver
                    //     // const rawDL = verifyDLRes?.data?.response || verifyDLRes?.data || verifyDLRes;
                    //     // await Driver.updateDriver(driverId, { 'verification.parivahanDL': rawDL });
                    // } catch (e) {
                    //     return res.status(502).json({ success: false, message: 'License verification failed', error: e.message });
                    // }
                }
                if (Object.keys(coreUpdates).length > 0) {
                    await Driver.updateDriver(driverId, {...coreUpdates, isApproved: false});
                }

                // 2) Handle optional document uploads
                const docUpdates = {};
                const files = req.files;

                const collectFieldFiles = (filesObj, fieldName) => {
                    if (!filesObj) return [];
                    if (Array.isArray(filesObj)) return filesObj.filter((f) => f.fieldname === fieldName);
                    if (filesObj[fieldName]) return filesObj[fieldName];
                    return [];
                };

                const driverPhotoFiles = collectFieldFiles(files, 'driverPhoto');
                const drivingLicenseFiles = collectFieldFiles(files, 'drivingLicense');

                if (driverPhotoFiles.length > 0) {
                    const file = driverPhotoFiles[0];
                    const uploadRes = await e2eS3File('upload', file, `${driverId}_driverPhoto`, `driver/${driverId}/documents/driverPhoto`);
                    if (!uploadRes?.completed) return res.status(400).json({ success: false, message: 'Failed to upload driver photo' });
                    docUpdates.driverPhoto = uploadRes.url;
                }

                if (drivingLicenseFiles.length > 0) {
                    const file = drivingLicenseFiles[0];
                    const uploadRes = await e2eS3File('upload', file, `${driverId}_drivingLicense`, `driver/${driverId}/documents/drivingLicense`);
                    if (!uploadRes?.completed) return res.status(400).json({ success: false, message: 'Failed to upload driving license' });
                    docUpdates.drivingLicense = uploadRes.url;
                }

                if (Object.keys(docUpdates).length > 0) {
                    const existingFiles = driver.documents || {};
                    const updatedFiles = { ...existingFiles, ...docUpdates };
                    await Driver.uploadDriverDocs(driverId, updatedFiles);
                }

                return res.json({ success: true, message: 'Driver details updated successfully' });
            });
        } catch (err) { 
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateDriverVehicleInfo = async function (req, res) {
        try {
            cpUpload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ success: false, message: 'Error parsing form data', error: err.message });
                }

                const driverId = req.driver.id;
                const driver = await Driver.getDriverWithId(driverId);
                if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
                if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });

                const { type, regNo } = req.body || {};
                if (!type || !regNo) {
                    return res.status(400).json({ success: false, message: 'type and regNo are required' });
                }
                // Normalize and verify regNo with MParivahan
                const normalizedRegNo = String(regNo).trim().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
                let isParivahanFailed = false;

                let lastVerifyRes;
                try {
                    const verifyRes = await VehicleVerifierMParivahan.verfiyRC(normalizedRegNo);
                    // if (!verifyRes?.valid) {
                    //     return res.status(400).json({ success: true, isParivahanFailed: false, message: "parivahan_verification_failed" });
                    // }
                    if (verifyRes?.status === 'error') {
                        lastVerifyRes = verifyRes;
                        isParivahanFailed = true;
                    } else {
                        lastVerifyRes = verifyRes;
                        isParivahanFailed = false;
                    }
                } catch (e) {
                    isParivahanFailed = true;
                    // return res.status(200).json({ success: true, isParivahanFailed: false, message: 'parivahan_verification_failed', error: e.message });
                }

                // Map verification response into vehicle fields for persistence
                const parseDateToEpoch = (d) => {
                    if (!d || typeof d !== 'string') return null;
                    const trimmed = d.trim();
                    if (!trimmed || trimmed === '1900-01-01') return null;
                    const t = Date.parse(trimmed);
                    return Number.isNaN(t) ? null : t;
                };

                // Pull the verification payload from logs scope: recompute via a safe retry to obtain mapping
                let verificationMapping = {};
                try {
                    const v = lastVerifyRes?.data?.response || lastVerifyRes?.data || {};
                    verificationMapping = {
                        color: v.color || undefined,
                        make: v.brand_name || undefined,
                        model: v.brand_model || undefined,
                        year: v.registration_date ? String(new Date(v.registration_date).getUTCFullYear()) : undefined,
                        fuelType: v.fuel_type || undefined,
                        permitNumber: v.permit_number || undefined,
                        insuranceExpiry: parseDateToEpoch(v.insurance_expiry),
                        roadTaxExpiry: parseDateToEpoch(v.tax_upto),
                        pucExpiry: parseDateToEpoch(v.pucc_upto),
                        rcStatus: v.rc_status || undefined,
                    };
                    // Save raw too
                    verificationMapping._rawParivahan = v;
                } catch (_e) {
                    // If mapping fails, proceed without enrichment
                    verificationMapping = {};
                }
                verificationMapping.isParivahanFailed = isParivahanFailed;

                let vehicleRcDocUrl = null;
                const rcFiles = req.files && (Array.isArray(req.files) ? req.files.filter(f => f.fieldname === 'vehicleRcDoc') : req.files['vehicleRcDoc']);
                const rcFile = Array.isArray(rcFiles) ? rcFiles[0] : rcFiles?.[0];
                if (rcFile) {
                    const uploadRes = await e2eS3File('upload', rcFile, `${driverId}_vehicleRcDoc`, `driver/${driverId}/documents/vehicleRcDoc`);
                    if (!uploadRes?.completed) return res.status(400).json({ success: false, message: 'Failed to upload vehicle RC document' });
                    vehicleRcDocUrl = uploadRes.url;
                }

                // If driver already has a vehicle, update that to avoid duplicates
                const driverVehicleId = driver?.vehicleId ? String(driver.vehicleId) : null;
                if (driverVehicleId) {
                    const { ...verifiedFieldsForDriverVehicle } = verificationMapping;
                    // Ensure no other vehicle already uses this regNo
                    const regVehicle = await Driver.getVehiclesWithRegNum(normalizedRegNo);
                    if (regVehicle && String(regVehicle._id) !== String(driverVehicleId)) {
                        return res.status(400).json({ success: false, isParivahanFailed: isParivahanFailed, message: 'regno already exist' });
                    }

                    await Mongo.updateOneRaw(
                        'vehicles',
                        { _id: new ObjectId(driverVehicleId) },
                        { $set: { type, regNo: normalizedRegNo, driverId, ...verifiedFieldsForDriverVehicle } }
                    );

                    const setDocUpdateDriver = {};
                    if (vehicleRcDocUrl) setDocUpdateDriver['documents.vehicleRcDoc'] = vehicleRcDocUrl;
                    // if (_rawParivahan) setDocUpdateDriver['verification.parivahan'] = true;
                    if (Object.keys(setDocUpdateDriver).length > 0) {
                        await Mongo.updateOne(
                            'vehicles',
                            { _id: new ObjectId(driverVehicleId) },
                            setDocUpdateDriver
                        );
                    }

                    const updatedById = await Mongo.findOne('vehicles', { _id: new ObjectId(driverVehicleId) });
                    return res.json({ success: true, isParivahanFailed: isParivahanFailed, message: isParivahanFailed ? 'parivahan_verification_failed' : 'Vehicle info updated successfully', vehicle: updatedById });
                }

                const existingVehicle = await Driver.getVehiclesWithRegNum(normalizedRegNo);

                if (existingVehicle) {
                    const existingDriverId = existingVehicle.driverId?.toString() || existingVehicle.driverId || null;
                    const currentDriverId = driverId.toString();

                    if (!existingDriverId || existingDriverId === currentDriverId) {
                        const { ...verifiedFields } = verificationMapping;
                        const vehicleUpdate = { type, regNo: normalizedRegNo, driverId, ...verifiedFields };
                        await Mongo.updateOneRaw(
                            'vehicles',
                            { _id: new ObjectId(existingVehicle._id) },
                            { $set: vehicleUpdate }
                        );

                        // Ensure driver's vehicleId mapped
                        await Mongo.updateOne(
                            'drivers',
                            { _id: new ObjectId(driverId) },
                            { vehicleId: existingVehicle._id.toString(), isApproved: false }
                        );

                        const setDocUpdate = {};
                        if (vehicleRcDocUrl) setDocUpdate['documents.vehicleRcDoc'] = vehicleRcDocUrl;
                        // if (_rawParivahan) setDocUpdate['verification.parivahan'] = true;
                        if (Object.keys(setDocUpdate).length > 0) {
                            await Mongo.updateOne(
                                'vehicles',
                                { _id: new ObjectId(existingVehicle._id) },
                                setDocUpdate
                            );
                        }

                        const updated = await Driver.getVehiclesWithRegNum(normalizedRegNo);
                        return res.json({ success: true, isParivahanFailed: isParivahanFailed, message: isParivahanFailed ? 'parivahan_verification_failed' : 'Vehicle info updated successfully', vehicle: updated });
                    } else {
                        return res.status(400).json({ success: false, isParivahanFailed: isParivahanFailed, message: 'regno already exist' });
                    }
                }

                // Create new vehicle and map to driver
                const { ...verifiedFieldsNew } = verificationMapping;
                const newVehicle = { type, regNo: normalizedRegNo, driverId, ...verifiedFieldsNew };
                const insertRes = await Mongo.insertOne('vehicles', newVehicle);
                if (!insertRes?.insertedId) {
                    return res.status(400).json({ success: false, message: 'Failed to create vehicle' });
                }

                const newVehicleId = insertRes.insertedId;
                await Mongo.updateOne(
                    'drivers',
                    { _id: new ObjectId(driverId) },
                    { vehicleId: newVehicleId.toString(), isApproved: false }
                );

                const setDocCreate = {};
                if (vehicleRcDocUrl) setDocCreate['documents.vehicleRcDoc'] = vehicleRcDocUrl;
                // if (_rawParivahan) setDocCreate['verification.parivahan'] = true;
                if (Object.keys(setDocCreate).length > 0) {
                    await Mongo.updateOne(
                        'vehicles',
                        { _id: new ObjectId(newVehicleId) },
                        setDocCreate
                    );
                }

                const createdVehicle = await Driver.getVehiclesWithRegNum(normalizedRegNo);
                return res.json({ success: true, isParivahanFailed: isParivahanFailed, message: isParivahanFailed ? 'parivahan_verification_failed' : 'Vehicle created and mapped to driver', vehicle: createdVehicle });
            });
        } catch (err) { 
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateDriverProof = async function (req, res) {
        try {
            cpUpload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ success: false, message: 'Error parsing form data', error: err.message });
                }

                const driverId = req.driver.id;
                const driver = await Driver.getDriverWithId(driverId);
                if (!driver) return res.status(400).json({ success: false, message: 'Driver not found' });
                if (!driver.publicRidesDriver) return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });

                const files = req.files;
                if (!files || (Object.keys(files).length === 0)) {
                    return res.status(400).json({ success: false, message: 'No files uploaded' });
                }

                const collectFieldFiles = (filesObj, fieldName) => {
                    if (!filesObj) return [];
                    if (Array.isArray(filesObj)) return filesObj.filter((f) => f.fieldname === fieldName);
                    if (filesObj[fieldName]) return filesObj[fieldName];
                    return [];
                };

                const docUpdates = {};
                const aadharFiles = collectFieldFiles(files, 'aadhar');
                const panCardFiles = collectFieldFiles(files, 'panCard');

                if (aadharFiles.length > 0) {
                    const file = aadharFiles[0];
                    const uploadRes = await e2eS3File('upload', file, `${driverId}_aadhar`, `driver/${driverId}/documents/aadhar`);
                    if (!uploadRes?.completed) return res.status(400).json({ success: false, message: 'Failed to upload aadhar' });
                    docUpdates.aadhar = uploadRes.url;
                }

                if (panCardFiles.length > 0) {
                    const file = panCardFiles[0];
                    const uploadRes = await e2eS3File('upload', file, `${driverId}_panCard`, `driver/${driverId}/documents/panCard`);
                    if (!uploadRes?.completed) return res.status(400).json({ success: false, message: 'Failed to upload panCard' });
                    docUpdates.panCard = uploadRes.url;
                }

                if (Object.keys(docUpdates).length === 0) {
                    return res.status(400).json({ success: false, message: 'No supported files provided (aadhar, panCard)' });
                }

                const existingFiles = driver.documents || {};
                const updatedFiles = { ...existingFiles, ...docUpdates };
                const response = await Driver.uploadDriverDocs(driverId, updatedFiles);
                await Driver.updateDriver(driverId, { isApproved: false });

                if (response?.driverUpdate?.acknowledged || response?.vehicleUpdate?.acknowledged) {
                    return res.json({ success: true, message: 'Proof documents uploaded successfully', files: docUpdates });
                }
                return res.status(400).json({ success: false, message: 'Error updating proof documents' });
            });
        } catch (err) { 
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.verifyUPI = async function (req, res) {
        const driverId = req.driver.id;
        const { UPIID } = req.body;
        try {
            // const razorpayLinking = new RazorPayLinking();
            // const upiIDVerification = await razorpayLinking.verifyVpa(UPIID);
            // console.log("upiIDVerification -- >> ", JSON.stringify(upiIDVerification));
            const updateDriverUPI = await Driver.updateDriver(driverId, { "bankDetails.UPIID": UPIID, isBankVerified: true, isApproved: false });
            if (!updateDriverUPI) return res.status(400).json({ success: false, message: 'Failed to update UPI ID' });
            return res.json({ success: true, message: 'UPI ID verified and updated successfully', });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateDriverVehicleProof = async function (req, res) { 
        try {
            cpUpload(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({ success: false, message: 'Error parsing form data', error: err.message });
                }

                const driverId = req.driver.id;
                if (!driverId) {
                    return res.status(400).json({ success: false, message: 'Driver ID is required' });
                }

                const driver = await Driver.getDriverWithId(driverId);
                if (!driver) {
                    return res.status(400).json({ success: false, message: 'Driver not found' });
                }
                if (!driver.publicRidesDriver) {
                    return res.status(400).json({ success: false, message: 'Driver is not a public rides driver' });
                }

                const files = req.files;
                const docUpdates = {};

                const collectFieldFiles = (filesObj, fieldName) => {
                    if (!filesObj) return [];
                    if (Array.isArray(filesObj)) return filesObj.filter((f) => f.fieldname === fieldName);
                    if (filesObj[fieldName]) return filesObj[fieldName];
                    return [];
                };

                const vehicleDocFields = [
                    'vehiclePhoto',
                    'insurance',
                    'roadTaxDoc',
                    'permitDoc',
                    'fitnessDoc',
                    'pucDoc',
                    'vehicleRcDoc',
                    'vehicleRcDocBackSide'
                ];
                const driverDocFields = ['pvc'];

                const uploadDocument = async (field, file) => {
                    const uploadRes = await e2eS3File('upload', file, `${driverId}_${field}`, `driver/${driverId}/documents/${field}`);
                    if (!uploadRes?.completed) {
                        throw new Error(`Failed to upload ${field}`);
                    }
                    docUpdates[field] = uploadRes.url;
                };

                try {
                    for (const field of [...vehicleDocFields, ...driverDocFields]) {
                        const fieldFiles = collectFieldFiles(files, field);
                        if (fieldFiles.length > 0) {
                            await uploadDocument(field, fieldFiles[0]);
                        }
                    }
                } catch (uploadErr) {
                    return res.status(400).json({ success: false, message: uploadErr.message });
                }

                const vehicleUpdates = {};
                const rawBody = req.body || {};

                const normalizeString = (value) => {
                    if (value === undefined || value === null) return undefined;
                    const trimmed = String(value).trim();
                    return trimmed === '' ? undefined : trimmed;
                };

                const parseEpoch = (value) => {
                    if (value === undefined || value === null) return undefined;
                    const str = String(value).trim();
                    if (str === '') return undefined;
                    if (/^\d+$/.test(str)) {
                        const asNumber = Number(str);
                        return Number.isNaN(asNumber) ? undefined : asNumber;
                    }
                    const parsed = Date.parse(str);
                    return Number.isNaN(parsed) ? undefined : parsed;
                };

                const stringVehicleFields = ['regNo', 'color', 'make', 'model', 'year', 'fuelType', 'permitNumber', 'rcStatus', 'type'];
                for (const field of stringVehicleFields) {
                    const normalized = normalizeString(rawBody[field]);
                    if (normalized !== undefined) {
                        vehicleUpdates[field] = normalized;
                    }
                }

                const epochVehicleFields = ['insuranceExpiry', 'roadTaxExpiry', 'fitnessExpiry', 'pucExpiry', 'permitExpiry'];
                for (const field of epochVehicleFields) {
                    if (rawBody[field] !== undefined) {
                        const parsed = parseEpoch(rawBody[field]);
                        vehicleUpdates[field] = parsed !== undefined ? parsed : null;
                    }
                }

                if (Object.keys(docUpdates).length === 0 && Object.keys(vehicleUpdates).length === 0) {
                    return res.status(400).json({ success: false, message: 'No updates provided' });
                }

                let docUpdateResult = null;
                if (Object.keys(docUpdates).length > 0) {
                    const existingDocs = driver.documents || {};
                    const mergedDocs = { ...existingDocs, ...docUpdates };
                    docUpdateResult = await Driver.uploadDriverDocs(driverId, mergedDocs);
                    const docSuccess = docUpdateResult?.driverUpdate?.acknowledged || docUpdateResult?.vehicleUpdate?.acknowledged;
                    if (!docSuccess) {
                        return res.status(400).json({ success: false, message: 'Error updating documents' });
                    }
                }

                if (Object.keys(vehicleUpdates).length > 0) {
                    const vehicleId = driver?.vehicleId;
                    if (!vehicleId) {
                        return res.status(400).json({ success: false, message: 'Vehicle not found for driver' });
                    }
                    await Mongo.updateOneRaw(
                        'vehicles',
                        { _id: new ObjectId(vehicleId) },
                        { $set: vehicleUpdates }
                    );
                }

                const updatedDriver = await Driver.getDriverWithId(driverId);
                const updatedVehicle = updatedDriver?.vehicleId
                    ? await Mongo.findOne('vehicles', { _id: new ObjectId(updatedDriver.vehicleId) })
                    : null;
                await Driver.updateDriver(driverId, { isApproved: false });
                return res.json({
                    success: true,
                    message: 'Vehicle proof details updated successfully',
                    driver: updatedDriver,
                    vehicle: updatedVehicle,
                    files: docUpdates
                });
            });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.checkDriverToken = async function (req, res) { 
        const driverId = req.driver.id;
        try {
            const getDriverById = await Driver.getDriverWithId(driverId);
            if (!getDriverById) {
                return res.status(400).json({ success: false, message: 'Driver not found' });
            }
            return res.status(200).json({ success: false, message: 'Driver Found' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.wakeUpBGService = async function (req, res) {
        const driverId = req.driver.id;
        try {
            const driver = await Driver.getDriverWithId(driverId);
            if (!driver?.fcmToken) return res.status(400).json({ success: false, message: 'FCM Token not found' });
            if(req?.useNotPushNotification){
                NOTPushNotifiationService.sendPushNotification(
                    driver?.fcmToken.token, {
                        title: 'WAKEUP_BG_SERVICE',
                        body: '',
                    },
                    driver?.fcmToken.deviceImei,
                    'high', null, true)

            }else{
                PushNotifiationService.sendPushNotification(
                    driver?.fcmToken.token, {
                        title: 'WAKEUP_BG_SERVICE',
                        body: '',
                    },
                    driver?.fcmToken.deviceImei,
                    'high', null, true)
            }
            
            return res.status(200).json({ success: false, message: 'Driver Found' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.updateFCMToken = async function (req, res) {
        const driverId = req.driver.id;
        const { fcmToken } = req.body;
        try {
            if (!fcmToken) {
                return res.status(400).json({ success: false, message: 'fcmToken is required' });
            }
            const result = await Driver.updateDriver(driverId, { "fcmToken.token": fcmToken, "fcmToken.isUpdated": true});
            return res.status(200).json({ success: true, message: 'FCM Token updated successfully' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    CLASS.prototype.getWorkLog = async function (req, res) {
        const driverId = req.driver.id;
        const from = Number(req.query.from);
        const to = Number(req.query.to);

        const normalizedFrom = Number.isFinite(from) ? from : undefined;
        const normalizedTo = Number.isFinite(to) ? to : undefined;
        try {
            const workLog = await Driver.getDriverWorkLog(driverId, normalizedFrom, normalizedTo);
            return res.status(200).json({ success: true, message: 'Work log retrieved successfully', workLog });
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}