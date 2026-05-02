import io from 'socket.io-client';
  
import { useStackScreenStore } from '../store/useStackScreenStore';
import useCurrentRideInfoStore from '../features/rideStatus/store/useCurrentRideInfoStore';
import useRideMatchStore from '../features/rideStatus/store/useRideMatchStore';
import useAssignedDriverInfoStore from '../features/rideStatus/store/useAssignedDriverInfoStore';
import useWayPointReorderStore from '../features/booking/store/useWayPointReorderStore';
import useRideBookingLocationStore from '../features/booking/store/useRideBookingLocationStore';
 
import  usePaymentStore  from '../features/payment/store/usePaymentStore';
import { DataStore } from './DataStore';
import PREF from '../storage/PREF';
import useUserInfoStore  from '../../common/store/useUserInfoStore';
import Config from "react-native-config";
import useMapStore from '../features/map/store/useMapStore';
import { resetTo } from '../../navigation/RootNavigation';
import { showNotification } from '../components/NotificationManger';
import i18n from '../../common/i18n';
import useRideSelectionStore from '../store/useRideSelectionStore';
const SOCKET_URL = Config.ROOT_API_URL;


class WSService {
  constructor() {
    this.socket = null;
    this.socketDriverAssignedData = {}
    this.initSocket = this.initSocket.bind(this)
    this.driverAllocated = this.driverAllocated.bind(this)
    this.driverLocationUpdate = this.driverLocationUpdate.bind(this)
    this.onRideStatus = this.onRideStatus.bind(this)
    this.driverTestSimulation = this.driverTestSimulation.bind(this)
    this.passangerLocationChange = this.passangerLocationChange.bind(this)
    this.passangerAccount = this.passangerAccount.bind(this)
    this.newBillRequest = this.newBillRequest.bind(this)
    this.useWayPointReorderStore = useWayPointReorderStore
    // this.driverFareUpdate = this.driverFareUpdate.bind(this)
    this.useStackScreenStore = useStackScreenStore
    this.useCurrentRideInfoStore = useCurrentRideInfoStore
    this.useAssignedDriverInfoStore = useAssignedDriverInfoStore
    this.useRideBookingLocationStore = useRideBookingLocationStore
    this.useRideMatchStore = useRideMatchStore  
    this.usePaymentStore = usePaymentStore
    this.useUserInfoStore = useUserInfoStore
    this.useMapStore = useMapStore
    this.useRideSelectionStore = useRideSelectionStore
    this.DataStore = DataStore
  }

  async driverAllocated(data){
    if(data?.driver && data?.otp){
      console.log("driverAllocateddddddddddddddddddddddddddddddd",JSON.stringify(data))
      if(data?.tripData){
         if(data?.tripData?._id){
          const currentTrip = await this.DataStore.loadData(PREF.CURRENT_TRIP);
          if(currentTrip?.data){
              console.log("currentTrip?.data?._id",currentTrip?.data)
              console.log("data?._id",data?.tripData._id)
              if(currentTrip?.data !== data?.tripData._id){
                return;
              }
          }

        }
        this.useCurrentRideInfoStore.getState().setCurrentRideInfo(data?.tripData);
      }
      if(data?._id){
        await this.DataStore.storeData(PREF.CURRENT_TRIP,data?._id);
      }
    
      this.useCurrentRideInfoStore.getState().setTripStatus(data?.tripStatus);
      this.useAssignedDriverInfoStore.getState().setAllocatedDriverInfo(data?.driver);
      this.useCurrentRideInfoStore.getState().setOtp(data?.otp);
      this.useCurrentRideInfoStore.getState().setEstimatedFare(data?.tripData?.estimatedFare);
      this.useStackScreenStore.getState().setStackScreen('RideStatus',{});  console.log("driverAllocatedooooooo",JSON.stringify(this.useCurrentRideInfoStore.getState()))
    }
  }
  async onRideStatus(data){
    const currentTrip = await this.DataStore.loadData(PREF.CURRENT_TRIP);
     if(currentTrip?.data){
              console.log("currentTrip?.data?._id",currentTrip?.data)
              console.log("data?._id",data?._id)
              if(currentTrip?.data !== data?._id){
                return;
              }
    }
    
    if(data?.tripStatus){
      if(data?.tripStatus === 'CANCELLED'){
        try {
          if(data?.isOnGoingTrip && data?.fareDetails){
            this.useCurrentRideInfoStore.getState().setFareDetails(data?.tripFare);
            this.useCurrentRideInfoStore.getState().setFinalDistance(data?.tripFare?.distance);
            this.useCurrentRideInfoStore.getState().setFinalDuration(data?.tripFare?.duration);
            this.useCurrentRideInfoStore.getState().setOngoingingTripCancelled(true);
            this.useStackScreenStore.getState().setStackScreen('PaymentScreen',{});
          }else{
            this.useMapStore.getState().setGeometries([]);
            this.useMapStore.getState().setMapMarkers([]);
            this.useMapStore.getState().setVehicleMarkers([]);
            this.useCurrentRideInfoStore.getState().setOtp(null);
            this.useAssignedDriverInfoStore.getState().setDriverInfo(null);
            this.useCurrentRideInfoStore.getState().setOngoingingTripCancelled(false);
            this.useRideMatchStore.getState().resetRideMatchStatus();
          
            this.useWayPointReorderStore.getState().setWaitingForDriverApproval(null);
            
            const directIonsData = this.useRideBookingLocationStore.getState().rideStartLocation && this.useRideBookingLocationStore.getState().rideEndLocation 
            if(directIonsData){
               this.useStackScreenStore.getState().goBackToScreen('BookRideScreen',{});
            }else{
              this.useStackScreenStore.getState().reset();
            }
            this.useCurrentRideInfoStore.getState().setTripStatus(null);
            this.useUserInfoStore.getState().setActiveTripId(null);
            await this.DataStore.clearData(PREF.CURRENT_TRIP);

          }
          
        } catch (error) {
          console.error('Error handling ride cancellation:', error);
        }

        
      }

      if(data?.tripStatus === 'DROPPED'){
        
        this.useCurrentRideInfoStore.getState().setFareDetails(data?.fareData);
        this.useCurrentRideInfoStore.getState().setFinalDuration(data?.duration);
        this.useCurrentRideInfoStore.getState().setFinalDistance(data?.distance);
        
        
      }

      if(data?.tripStatus === 'COMPLETED' || data?.tripStatus === 'DIVERGED'){
        const currentTrip = await this.DataStore.loadData(PREF.CURRENT_TRIP);
        

        
        
        console.log("currentTrip",currentTrip)
       
      
        if(currentTrip?.data){
         
        this.useUserInfoStore.getState().incrementCompletedTrips()
        try {
          if(data?.tripData?.tripFare){
          this.useUserInfoStore.getState().incrementTotalSpend(data?.tripData?.tripFare)
          }
        } catch (error) {
          console.log(error,"error")
        }

        console.log("data?.tripData?.tripFare",data?.tripData?.tripFare)
        this.useStackScreenStore.getState().setStackScreen('TripFeedbackScreen',{});
        return;
        }
     
      }else if(data?.tripStatus === 'DROPPED'){
        this.useStackScreenStore.getState().setStackScreen('PaymentScreen',{})
        return;
      }
      else{

      
      if(data?.tripData?.stops){
        this.useCurrentRideInfoStore.getState().setStops(data?.tripData?.stops)
      }
      this.useCurrentRideInfoStore.getState().setTripStatus(data?.tripStatus);
      if(data?.tripData?.estimatedFare){
        this.useCurrentRideInfoStore.getState().setEstimatedFare(data?.tripData?.estimatedFare);
      }
    }
      
    }
   
  }

  passangerLocationChange(data){
    if(data?.stops){
      this.useCurrentRideInfoStore.getState().setpassangerLocationChange(data)
      this.useWayPointReorderStore.getState().setWaitingForDriverApproval("APPROVED")
    }
  }


  passangerAccount(data){

    try {
      console.log("passangerAccount",JSON.stringify(data))
      if(data?.type === 'LOG_OUT'){
        this.DataStore.clearData('access_token', null);
        this.DataStore.clearData('refresh_token', null);
        this.DataStore.clearData('userdetails', null);
        this.useStackScreenStore.getState().reset();
        this.close();
        showNotification(
          i18n.t('session_logged_out_title'),
          i18n.t('session_logged_out_other_device_message'),
          'warning'
        );
        resetTo('LoginScreen');
  
      }
      
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  
  }

  newBillRequest(data) {
    try {
      console.log('newBillRequest', JSON.stringify(data));
      // Always refresh bills regardless of whether bookingDetails is already populated
      if (data?.bills !== undefined) {
        const currentBookingDetails = this.useRideSelectionStore.getState().bookingDetails;
        this.useRideSelectionStore.getState().setBookingDetails({
          ...(currentBookingDetails || {}),
          bills: data.bills,
        });
        // Also keep currentRideInfo in sync (covers app-restart scenario)
        this.useCurrentRideInfoStore.getState().setBills(data.bills);
      }
    } catch (error) {
      console.error('Error handling newBillRequest:', error);
    }
  }
 
  
  driverLocationUpdate(data){
    // console.log("driverLocationUpdate",JSON.stringify(data))
    if(data){
      try {
        this.useAssignedDriverInfoStore.getState().setDriverLatitude(data?.data?.location?.coordinates[1]);
        this.useAssignedDriverInfoStore.getState().setDriverLongitude(data?.data?.location?.coordinates[0]);
        this.useAssignedDriverInfoStore.getState().setDriverAngle(data?.data?.liveStats?.course);
        this.useAssignedDriverInfoStore.getState().setDriverMaxSpeed(data?.data?.liveStats?.speed);
        if (data?.data?.liveStats?.harshDrivingStats) {
          this.useAssignedDriverInfoStore.getState().setHarshDrivingStats(data.data.liveStats.harshDrivingStats);
        }
        const ls = data?.data?.liveStats;

        // console.log("Live Stats Update:",ls )
        if (ls?.harshBreaking || ls?.harshAcceleration || ls?.harshCornering || ls?.overspeeding) {
          this.useCurrentRideInfoStore.getState().appendHarshDrivingEvents({
            harshBreaking:     ls.harshBreaking     || null,
            harshAcceleration: ls.harshAcceleration || null,
            harshCornering:    ls.harshCornering    || null,
            overspeeding:      ls.overspeeding      || null,
          });
        }
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    }
  }

  // driverFareUpdate(data){
  //   try {
  //     if(data?.currentFare){
  //       console.log('currentFare', data?.currentFare);
  //       this.useRideSelectionStore.getState().setCurrentFare(data?.currentFare);
  //     }
  //   } catch (error) {
  //     console.error('Error updating driver fare:', error);
  //   }
  // }

  driverTestSimulation(data){
    
    if(data){
      console.log('simulate sdata-->>', data)
      try {
        this.useAssignedDriverInfoStore.getState().setDriverLatitude(data?.data?.location?.coordinates[1]);
        this.useAssignedDriverInfoStore.getState().setDriverLongitude(data?.data?.location?.coordinates[0]);
        this.useAssignedDriverInfoStore.getState().setDriverAngle(data?.data?.liveStats?.course);
        this.useAssignedDriverInfoStore.getState().setDriverMaxSpeed(data?.data?.liveStats?.speed) || 0;
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    }
  }

  async initSocket(userId) {

    // ensure any existing socket is fully cleaned up before creating a new one
    if (this.socket) {
      this.close();
    }

    this.interval = setInterval(() => {
    }, 5000)
    
    return new Promise((resolve, reject) => {
      try {
        const urlParts = SOCKET_URL.split('/');
        const protocolAndHost = urlParts.slice(0, 3).join('/');
        const path = '/' + urlParts.slice(3).join('/');

        console.log("protocolAndHost",protocolAndHost)
        console.log("path",path)
        console.log("userId",userId)
        console.log('Connecting to sockeEEEEEEEt server at:', `${protocolAndHost}/public-rides-customer`, 'with path:', path);
        this.socket = io(`${protocolAndHost}/public-rides-customer`, {
          path: path !== '/' ? path + '/socket.io' : '/socket.io',
          query: {
            accessToken: userId,
          },
      
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 10000,
        });
        this.socket.on('connect', () => {
          console.log("socket connected...............................................", this.socket.id)
          resolve(true);
        });

        // this.socket.on('driverAllocated', this.driverAllocated);

        this.socket.on('driverLocationUpdate', this.driverLocationUpdate);

        this.socket.on('driverTestSimulation', this.driverTestSimulation);

        this.socket.on('passangerTripStatus', this.onRideStatus);

        this.socket.on('passangerLocationChange', this.passangerLocationChange);

        this.socket.on('passangerAccount', this.passangerAccount);

        this.socket.on('newBillRequest', this.newBillRequest);

        // this.socket.on('passangerTripFareUpdate', this.driverFareUpdate);

        this.socket.on('disconnect', (reason) => {
          console.log("socket disconnected", reason)
        })

        // helpful diagnostics around reconnection lifecycle
        this.socket.on('reconnect', (attempt) => {
          console.log('socket reconnect', attempt)
        })
        this.socket.on('reconnect_attempt', (attempt) => {
          console.log('socket reconnect_attempt', attempt)
        })
        this.socket.on('reconnect_error', (error) => {
          console.log('socket reconnect_error', error)
        })
        this.socket.on('reconnect_failed', () => {
          console.log('socket reconnect_failed')
        })
        this.socket.on('connect_timeout', () => {
          console.log('socket connect_timeout')
        })
        this.socket.on('error', (error) => {
          console.log('socket error', error)
        })

        this.socket.on('connect_error', error => {
          console.error('Socket connect_error:', {
            message: error?.message,
            description: error?.description,
            context: {
              host: protocolAndHost,
              path: this?.socket?.io?.opts?.path,
             
            }
          });
          reject(new Error(error?.message || 'Socket connection failed'));
        });
      } catch (error) {
        // console.error('Error during socket initialization', error);
        reject(
          new Error('Error during socket initialization: ' + error.message),
        );
      }
    });
  }

  getSocket() {
    if (!this.socket) {
      throw new Error('Socket not connected!');
    }
    return this.socket;
  }


  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
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
      console.log("Socket disconnected")
      try { this.socket.removeAllListeners(); } catch (e) { console.warn('socket removeAllListeners error', e) }
      try { this.socket.disconnect(); } catch (e) { console.warn('socket disconnect error', e) }
      this.socket = null;
    }
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null;
    }
  }

  removeListeners(listener) {
    if (this.socket) {
      this.socket.removeAllListeners(listener);
    }
  }
}

const wsService = new WSService();

export default wsService;
