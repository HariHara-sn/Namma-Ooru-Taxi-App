const { Server } = require('socket.io');
const Redis = require('../Controllers/DB/Redis');
const JWT = require('../Models/JWT');
const Device = require('../Models/Device');

const LocationHandler = require('./websocketHandlers/LocationHandler')

const DrivingEventsHandler = require('./websocketHandlers/DrivingEventsHandler')
const WireTamperingHandler = require('./websocketHandlers/WireTamperingHandler')
const AddUserHandler = require('./websocketHandlers/AddUserHandler')
const DeviceRequestHandler = require('./websocketHandlers/DeviceRequestHandler');
const CustomerRideAssignHandler = require('./websocketHandlers/CustomerRideAssignHandler');
const PublicRideDriverHandler = require('./websocketHandlers/PublicRideDriverHandler');
const DriverLocationHandler = require('./websocketHandlers/DriverLocationHandler');
const FastMobileTrackingHandler = require('./websocketHandlers/FastMobileTrackingHandler');

class SocketIOService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.initalizeNamespaces()
        this.initializeHandlers()
    }
    
    async validateTokenWithSecrets(token, secrets) {
        for (const [index, secret] of secrets.entries()) {
            try {
                const [payload, error] = await JWT.validateJWT(token, secret);
                if (payload) return [payload, error, secret];
            } catch (err) {
                console.log(`Error with secret ${index + 1}:`, err);
            }
        }
        return [null, 'Invalid token for all secrets', null];
    }    

    async doSocketValidation(socket, secrets = [
        process.env.JWT_SECRET, // General users
        process.env.JWT_SECRET_PASSANGER, // Passengers
        process.env.JWT_SECRET_DRIVER, // Drivers,
        process.env.DEVICE_IDENTITY_SECRET //Device Token
    ], onSocketDisconnect = null) {
        try {
            /* 
               Improve authentication later on
               For now it uses same login key to authenticate
           */
            const token = socket.handshake.query?.accessToken || socket.handshake.query?.deviceToken;

            if (!token) {
                console.log("No Access Token or Device Token")
                return socket.disconnect(true)
            }

            // const [payload, error] = await JWT.validateJWT(accessToken, process.env.JWT_SECRET)
            const [payload, error, usedSecret] = await this.validateTokenWithSecrets(token, secrets);

            if (!payload) {
                console.log(error, "No payload")
                return socket.disconnect(true)
            }

            // const userId = payload.user?.id;
            // Extract the appropriate ID based on the used secret
            const userId = usedSecret === process.env.JWT_SECRET_PASSANGER ? payload.passanger?.id :
                usedSecret === process.env.JWT_SECRET_DRIVER ? payload.driver?.id :
                    usedSecret === process.env.JWT_SECRET ? payload.user?.id :
                        payload.id;
       

            const socketId = socket.id
       
            const res = await Redis.appendData(userId, socketId)
        
            if (!res) {
                console.log("Failed to store data in Redis, disconnecting socket.");
                return socket.disconnect(true);
            }
            console.log("User with id:", userId, "connected with socket id:", socket.id)

            const onDisconnectDefault = () => {
                console.log(`User with userId: ${userId} disconnected`, socket.id);
                Redis.removeAppendKey(userId, socket.id)
            }
            socket.on('disconnect', onSocketDisconnect ? () => onSocketDisconnect(socketId, userId, socket.handshake.query) : onDisconnectDefault);

            return {
                userId,
                socketId,
            }

        } catch (err) {
            console.log("Error in doSocketValidation", err)
            return socket.disconnect(true)
        }
    }

    async setupFastMobileTracking(socketId, userId, deviceId) {
        const cacheId = 'FMT:' + deviceId
        await Redis.appendData(cacheId, socketId + "|" + userId)
    }

    async removeFastMobileTracking(socketId, userId, payload) {
        const cacheId = 'FMT:' + payload.deviceId
        await Redis.removeAppendKey(cacheId, socketId + "|" + userId)
    }

    initalizeNamespaces() {
        this.webAppClientsNamespace = this.io.of('/web-app-clients');
        this.realtimeServerNamespace = this.io.of('/realtime-server');

        this.publicRidesCustomerNamespace = this.io.of('/public-rides-customer');
        this.publicRidesDriverNamespace = this.io.of('/public-rides-driver');

        /* Namespace for web or app viewers to retrive fast tracking info of a device */
        this.fastMobileTrackingNamespace = this.io.of('/fast-mobile-tracking');

        this.webAppClientsNamespace.on('connection', async (socket) => {
            await this.doSocketValidation(socket)
        });

        this.publicRidesCustomerNamespace.on('connection', async (socket) => {
            await this.doSocketValidation(socket, [process.env.JWT_SECRET_PASSANGER])
        });

        this.publicRidesDriverNamespace.on('connection', async (socket) => {
            await this.doSocketValidation(socket, [process.env.JWT_SECRET_DRIVER])
        });

        this.fastMobileTrackingNamespace.on('connection', async (socket) => {
            const payload = socket.handshake.query
            if (!payload.deviceId) {
                this.fastMobileTrackingHandler.initialize(socket)
                console.log("Fast Socket Sender Connected")
                return
            }
            const { userId, socketId } = await this.doSocketValidation(socket, undefined, this.removeFastMobileTracking)

            /* 
                Check weather the user has access to this device 
            */

            if (socket.handshake.query?.accessToken && userId) {
                // const device = await Device.getDeviceFromId(payload.deviceId)
                const device = await Device.getDeviceFromImei(payload.deviceId)
                if (!device) {
                    console.log("No device found")
                    return socket.disconnect(true)
                }
                const hasAccess = await Device.doesUserHaveAccessToThisDevice(userId, device._id.toString())
                
                // const hasAccess = await Device.doesUserHaveAccessToThisDevice(userId, device._id.toString())
                if (!hasAccess) {
                    console.log("User does not have access to this device")
                    return socket.disconnect(true)
                }
                await this.setupFastMobileTracking(socketId, userId, payload.deviceId)
                console.log("Fast Socket Viewer Connected")
            }

            // if (socket.handshake.query?.deviceToken && userId) this.fastMobileTrackingHandler.initialize(socket)

        });

        this.realtimeServerNamespace.on('connection', (socket) => {
            console.log('A realtime server connected', socket.id);

            socket.on('disconnect', () => {
                console.log('Realtime server disconnected', socket.id);
            });

            this.locationHandler.initializeRealTimeServerListeners(socket)
           
            this.drivingEventsHandler.initializeRealTimeServerListeners(socket)
            this.wireTamperingHandler.initializeRealTimeServerListeners(socket)
            this.driverLocationHandler.initializeRealTimeServerListeners(socket)
        });
    }

    initializeHandlers() {
        this.locationHandler = new LocationHandler(this.webAppClientsNamespace, this.realtimeServerNamespace)
        this.addUserHandler = new AddUserHandler(this.webAppClientsNamespace, this.realtimeServerNamespace)
        this.deviceRequestHandler = new DeviceRequestHandler(this.webAppClientsNamespace, this.realtimeServerNamespace)
        this.drivingEventsHandler = new DrivingEventsHandler(this.webAppClientsNamespace, this.realtimeServerNamespace)
        this.wireTamperingHandler = new WireTamperingHandler(this.webAppClientsNamespace, this.realtimeServerNamespace)
        this.customerRideAssignHandler = new CustomerRideAssignHandler(this.publicRidesCustomerNamespace)
        this.publicRideDriverHandler = new PublicRideDriverHandler(this.publicRidesDriverNamespace)
        this.driverLocationHandler = new DriverLocationHandler(this.publicRidesCustomerNamespace, this.realtimeServerNamespace)
        this.fastMobileTrackingHandler = new FastMobileTrackingHandler(this.fastMobileTrackingNamespace)
    }

}

module.exports = SocketIOService;
