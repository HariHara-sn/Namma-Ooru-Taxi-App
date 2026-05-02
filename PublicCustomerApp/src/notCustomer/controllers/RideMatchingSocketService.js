import io from 'socket.io-client';
import Config from "react-native-config"; 
// You can change this URL to your ride matching socket server
const RIDE_MATCHING_SOCKET_URL = Config.DRIVER_SOCKET_URL// Replace with your actual ride matching socket URL
;
class RideMatchingSocketService {
  static instance = null;

  constructor() {
    if (RideMatchingSocketService.instance) {
      return RideMatchingSocketService.instance;
    }
    this.socket = null;
    this.isConnecting = false;
    this.hasAttemptedConnection = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.initSocket = this.initSocket.bind(this);
    this.joinPassengerRoom = this.joinPassengerRoom.bind(this);
    RideMatchingSocketService.instance = this;
  }

  async initSocket(userId) {
    if (this.isConnected()) {
      console.log('Ride matching socket already connected.');
      return true;
    }
    // Prevent multiple connection attempts
    if (this.isConnecting) {
      console.log('Ride matching socket connection already in progress');
      return false;
    }

    if (this.hasAttemptedConnection && this.connectionRetries >= this.maxRetries) {
      console.log('Ride matching socket connection max retries reached - skipping');
      return false;
    }

    this.isConnecting = true;
    this.hasAttemptedConnection = true;
    this.connectionRetries++;

    return new Promise((resolve) => {
      try {
        console.log("Ride Matching Socket - attempting connection to:", RIDE_MATCHING_SOCKET_URL);

        // Simplified connection without complex path parsing

        const urlParts = RIDE_MATCHING_SOCKET_URL.split('/');
        const protocolAndHost = urlParts.slice(0, 3).join('/');
        const path = '/' + urlParts.slice(3).join('/');
        console.log("userId",userId);
        this.socket = io(`${protocolAndHost}`, {
          path: path !== '/' ? path + '/socket.io' : '/socket.io',
          query: {
            passenger_id: userId,
          },
        });

        this.socket.on('connect', () => {
          console.log("✅ Ride matching socket connected successfully", this.socket.id);
          this.isConnecting = false;
          this.connectionRetries = 0; // Reset retry counter on success
          resolve(true);
        });

        this.socket.on('connect_error', error => {
          console.warn(
            '❌ Ride matching socket connection failed:',
            error.message,
          );
          this.socket = null;
          this.isConnecting = false;
          resolve(false);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Ride matching socket disconnected:', reason);
          this.isConnecting = false;
        });

        this.socket.on('error', (error) => {
          console.error('🚨 Ride matching socket error:', error);
        });

        // Add timeout to prevent hanging
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.warn('⏰ Ride matching socket connection timeout');
            this.socket = null;
            this.isConnecting = false;
            resolve(false);
          }
        }, 12000); // 12 second timeout

      } catch (error) {
        console.warn('🚨 Error during ride matching socket initialization:', error.message);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  joinPassengerRoom(passengerId) {
    if (this.socket && this.socket.connected) {
      console.log("👤 Joining passenger room with ID:", passengerId);
      this.socket.emit('join_passenger_room', { 
        passenger_id: passengerId 
      });
    } else {
      console.error('❌ Ride matching socket not connected!');
    }
  }

  
  findDriver(tripId, passengerId,vehicleType,routeData) {
    if (this.socket && this.socket.connected) {
     
      const socketData = {
        trip_id: tripId,
        passenger_id: passengerId,
        vehicleType: vehicleType,
        routeData:routeData,
        version: 'new',
        passangerVehicleId: routeData?.passangerVehicleId || null,
      };

      // console.log("🚕 Finding driver for trip:", tripId, socketData);
      
      this.socket.emit('findDriver', socketData);
    } else {
      console.error('❌ Ride matching socket not connected!');
    }
  }


  cancelRide(tripId,passengerId){
    if (this.socket && this.socket.connected) {
      console.log("🚕 Cancelling ride:", tripId);
      this.socket.emit('cancel_ride_match', {
        trip_id: tripId,
        passenger_id: passengerId,
      });
  }
  }

  // Listen for matching updates
  onMatchingUpdate(callback) {
    if (this.socket) {
      this.socket.on('matching_update', callback);
    } else {
      console.error('❌ Ride matching socket not connected!');
    }
  }

  onCancelRideMatch(callback) {
    if (this.socket) {
      this.socket.on('cancel_ride_match', callback);
    } else {
      console.error('❌ Ride matching socket not connected!');
    }
  }

 
  getSocket() {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Ride matching socket not connected!');
    }
    return this.socket;
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.error('❌ Ride matching socket not connected!');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  close() {
    if (this.socket) {
      console.log("🔌 Ride matching socket disconnected");
      this.socket.close();
      this.socket = null;
    }
  }

  removeListeners(listener) {
    if (this.socket) {
      this.socket.removeAllListeners(listener);
    }
  }

  // Reset connection state (useful for testing or reconnection)
  resetConnectionState() {
    this.hasAttemptedConnection = false;
    this.isConnecting = false;
    this.connectionRetries = 0;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Check if socket is connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
}

const rideMatchingSocketService = new RideMatchingSocketService();

export default rideMatchingSocketService;