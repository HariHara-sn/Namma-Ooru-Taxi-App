import io from 'socket.io-client';
import Config from 'react-native-config';
import { NativeModules, AppState } from 'react-native';
import { useStackScreenStore } from '../../store/useStackScreenStore';
import { useTripAcceptStore } from '../../../notdriver/store/useTripAcceptStore';
import useHotSpotStore from '../../../notdriver/store/useHotSpotStore';
import { useMapMarkerStore } from '../../store/useMapMarkerStore';
import useTripsStore from '../../../notdriver/store/useTripsStore';
import { DataStore } from '../DataStore';
import tripAlert from '../TripAlert';
import { cancelTrip } from '../../../notdriver/components/CancelTripUpdate';
import APIRequest from '../APIRequest';
import { firebaselog_tripBooking } from '../../utils/FirebaseAnalytics';

const SOCKET_URL = Config.DRIVER_SOCKET_URL;
const {NeNativeModule} = NativeModules;
class RideMatchWSService {
  constructor() {
    this.socket = null;
    this.fastSocket = null;
    this.sockeData = [];
    this.socketLiveData = {};
    this.socketInterval = null;

    // Internal flags to avoid duplicate connects and duplicate listener attachment
    this._isConnecting = false;
    this._listenersAttached = false;

    // Bind ALL handlers once so their identity is stable
    this.initDriverRoomSocket = this.initDriverRoomSocket.bind(this);
    this.onTripRequest = this.onTripRequest.bind(this);
    this.onHotSpotRegionUpdate = this.onHotSpotRegionUpdate.bind(this);
    this.onDriverReponseReceived = this.onDriverReponseReceived.bind(this);
    this._onConnect = this._onConnect.bind(this);
    this._onConnectError = this._onConnectError.bind(this);
    this._attachListeners = this._attachListeners.bind(this);
    this._detachListeners = this._detachListeners.bind(this);
  }

  async _acceptTripWithRetry(tripId, maxRetries = 3, token) {
    let attempt = 0;
    let lastResponse = null;
    while (attempt < maxRetries) {
      const attemptNum = attempt + 1;
      console.log(`[DriverWSService] Attempt ${attemptNum}/${maxRetries} - accepting trip ${tripId}`);
      try {
        const api = new APIRequest();
        const res =  await api.request(`/publicrides/driver/v2/acceptRide`, 'POST', { tripId }, token)
        if (res?.success) {
          console.log(`[DriverWSService] ✅ Accept succeeded on attempt ${attemptNum}`);
          return res;
        }
        lastResponse = res;
        // const msg = res?.message || 'Unknown error from server';
      } catch (e) {
        const errMsg = e?.message || String(e);
        lastResponse = { success: false, message: errMsg };
      }
      attempt += 1;
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt - 1);
        console.log(`[DriverWSService] 🔁 Retrying in ${delay}ms (next attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // console.log(`[DriverWSService] 🚫 Exhausted retries for trip ${tripId}`);
    return lastResponse;
  }

  /**
   * ===== Event handlers =====
   */
  async onTripRequest(data) {
    const {setStackScreen} = useStackScreenStore.getState();
    if (data?.type === 'trip_request') {
      useTripAcceptStore.setState({dataFromSocket: true});
      useTripAcceptStore.setState({tripDetails: data.data});
      useTripAcceptStore.setState({tripId: data.data?.trip_id});
      useTripAcceptStore.setState({currentFare: data.data?.fare});
      useTripAcceptStore.setState({requestId: data?.request_id});
      useTripAcceptStore.setState({timeOutSeconds: data.data?.timeout_seconds});
      useTripAcceptStore.setState({alertedAt: data?.data?.alerted_at});
      useTripAcceptStore.setState({
        escalationDetails: data?.data?.escalation_details,
      });
      firebaselog_tripBooking('TB_Driver_Allocation(TB_DA)', 'TB_DA:trip_request_received');
      setStackScreen('TripAccept');
      const isActive = AppState.currentState === 'active';
      if (isActive) {
        tripAlert.playAlertSound();
      } else {
        console.log('[RideMatchWSService] App in background; skipping alert sound');
      }
    }
  }

  onHotSpotRegionUpdate(data) {
    if (data?.hotspots) {
      useHotSpotStore.setState({hotSportMarkers: data.hotspots});
    }
  }

  async onDriverReponseReceived(data) {
    const {setStackScreen} = useStackScreenStore.getState();
    const {
      tripCancelReason,
      setFetchLocationDate,
      setIsGetFare,
      setLoading,
    } = useTripAcceptStore.getState();
    const {setDirectionPoints} = useMapMarkerStore.getState();
    const {activeTripData, setActiveTripData} = useTripsStore.getState();
    try {
      if (data?.status === 'success') {
        setLoading(true);
        if (data?.response === 'accept') {
          // const response = await this._acceptTripWithRetry(data?.trip_id, 3, userInfo?.token);
          // if (response?.success) {
            // DataStore.storeData('activeTripId', data?.trip_id);
            const tripData = data?.tripDetails;
            tripData.status = 'ACCEPTED';
            useTripsStore.setState({activeTripData: [tripData]});
            setLoading(false);
            firebaselog_tripBooking('TB_Driver_Allocation(TB_DA)', 'TB_DA:trip_accepted_inapp');
            setStackScreen('PublicDriverTrackingScreen');
            //  tripDetails.pickUpRoute.response = tripDetails?.pickUpRoute?.response
            //   .replace(/'/g, '"')
            //   .replace(/\bTrue\b/g, 'true')
            //   .replace(/\bFalse\b/g, 'false');
            // setTripDetails(tripDetails)
            // console.log('[RideMatchWSService] Trip accepted successfully via socket');

            // Clear trip accept store to prevent loop
            // reset();
          // } else {
          //   showNotification(
          //     `Failed to ${data?.response?.toLowerCase().replace('_', ' ')} Trip after 3 retries`,
          //     response?.message,
          //     'danger',
          //   );
          //   // Attempt to cancel the trip after repeated accept failures
          //   try {
          //     const cancelReason = 'Trip accept failed by tracking engine attempted three times';
          //     const api = new APIRequest();
          //     const cancelResp = await api.request(`/publicrides/driver/v2/cancelTrip`, 'POST', {tripId:data?.trip_id, reason: cancelReason, isBeforePickup: true}, userInfo?.token);
          //     if (cancelResp?.success) {
          //       firebaselog_tripBooking('TB_Driver_Allocation(TB_DA)', 'TB_DA:trip_cancelled_after_accept_retry');
          //       showNotification('Trip Cancelled', cancelResp?.message, 'success');
          //     } else {
          //       showNotification('Failed to Cancel Trip', cancelResp?.message, 'danger');
          //     }
          //   } catch (cancelErr) {
          //     showNotification('Failed to Cancel Trip', cancelErr?.message || String(cancelErr), 'danger');
          //   }
          //   // Reset store on failure too
          //   reset();
          // }
        } else {
          // Handle reject response
          if (tripCancelReason) {
            if (activeTripData?.[0]?.status === 'PICKEDUP') {
              setIsGetFare(false);
              setFetchLocationDate(true);
            }
          } else {
            tripAlert.stopAlertSound();
            // Clear all trip-related data to prevent loop
            setDirectionPoints(null);
            setStackScreen('Home');
            setActiveTripData([]);
            DataStore.storeData('activeTripId', null);
            NeNativeModule.clearDirectionPoints();
            firebaselog_tripBooking('TB_Driver_Allocation(TB_DA)', 'TB_DA:trip_reject_inapp');
          }
          // reset();
        }
      } else {
        // reset();
      }
      tripAlert.stopAlertSound();
    } catch (err) {
      // reset();
      tripAlert.stopAlertSound();
    } finally {
      useTripAcceptStore.getState().setLoading(false);
      tripAlert.stopAlertSound();
    }
  }

  onRideMatchCancel(data) {
    if (data.status === "CANCELLED") {
     cancelTrip(data)
     tripAlert.stopAlertSound();
    }
  }

  /**
   * ===== Socket lifecycle helpers =====
   */
  _onConnect() {
    if (!this.socket) return;
    console.log('Driver Socket connected:', SOCKET_URL, this.socket.id);
    this._attachListeners(); // ensure listeners attached once
    this._isConnecting = false;
  }

  _onConnectError(error) {
    console.error('Socket error: Failed to connect to socket server', error);
    this._isConnecting = false;
  }

  _attachListeners() {
    if (!this.socket || this._listenersAttached) return;

    this.socket.on('trip_request', this.onTripRequest);
    this.socket.on('hotspot_update', this.onHotSpotRegionUpdate);
    this.socket.on('driver_response_received', this.onDriverReponseReceived);
    this.socket.on('cancel_ride_match', this.onRideMatchCancel);
    this._listenersAttached = true;
  }

  _detachListeners() {
    if (!this.socket || !this._listenersAttached) return;

    this.socket.off('trip_request', this.onTripRequest);
    this.socket.off('hotspot_update', this.onHotSpotRegionUpdate);
    this.socket.off('driver_response_received', this.onDriverReponseReceived);
    this.socket.off('cancel_ride_match', this.onDriverReponseReceived);
    this._listenersAttached = false;
  }

  /**
   * ===== Public API =====
   */
  async initDriverRoomSocket(userId) {
    console.log('RideMatchWSService - initDriverRoomSocket called with userId:', userId);
    return new Promise((resolve, reject) => {
      try {
        // Already connected? Just ensure listeners are attached (idempotent)
        if (this.socket?.connected) {
          this._attachListeners();
          return resolve(true);
        }
        // Prevent racing multiple connects
        if (this._isConnecting) {
          return resolve(false);
        }
        this._isConnecting = true;

        // Build URL and path for custom namespaces/deploys
        const urlParts = String(SOCKET_URL).split('/');
        const protocolAndHost = urlParts.slice(0, 3).join('/');
        const path = '/' + urlParts.slice(3).join('/');

        // Create the socket
        this.socket = io(`${protocolAndHost}`, {
          path: path !== '/' ? path + '/socket.io' : '/socket.io',
          // Prefer `auth` → server connect(sid, environ, auth)
          query: {driver_id: userId},
          // If server still reads query, you can also pass it (harmless):
          // query: { driver_id: userId },
          // transports: ['websocket'], // optional: prefer websocket first
        });

        // Core lifecycle
        this.socket.on('connect', this._onConnect);
        this.socket.on('connect_error', error => {
          this._onConnectError(error);
          reject(
            new Error(
              'Driver Socket error: Failed to connect to socket server',
            ),
          );
        });

        // Resolve after initial connect
        this.socket.once('connect', () => resolve(true));
      } catch (error) {
        this._isConnecting = false;
        reject(
          new Error(
            'Error during Driver socket initialization: ' +
              (error?.message || String(error)),
          ),
        );
      }
    });
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
    try {
      if (this.socket) {
        this._detachListeners();
        this.socket.off('connect', this._onConnect); // detach lifecycle as well
        this.socket.off('connect_error', this._onConnectError);
        this.socket.close();
        clearInterval(this.socketInterval);
        this.socket = null;
        this._isConnecting = false;
      }
    } catch (err) {
      console.log(err);
    }
  }

  removeListeners(listener) {
    if (this.socket) {
      this.socket.removeAllListeners(listener);
    }
  }
}

/**
 * Make it a resilient singleton across RN Fast Refresh / HMR.
 * This prevents creating new instances (and new listeners) on hot reloads.
 */
const instance = global.__rideMatchWSService || new RideMatchWSService();
global.__rideMatchWSService = instance;
export default instance;
