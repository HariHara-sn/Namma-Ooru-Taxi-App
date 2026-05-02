import io from 'socket.io-client';
import Config from 'react-native-config';
import { NativeModules } from 'react-native';
import useTripsStore from '../../../notdriver/store/useTripsStore';
import useActingDriverMediaStore from '../../../notdriver/store/useActingDriverMediaStore';
import { useMapMarkerStore } from '../../store/useMapMarkerStore';
import { useTripAcceptStore } from '../../../notdriver/store/useTripAcceptStore';
import { useStackScreenStore } from '../../store/useStackScreenStore';
import useCurrentScreenStore from '../../store/useCurrentScreenStore';
import { DataStore } from '../DataStore';
import driverWaitingTime from '../../../notdriver/Controller/DriverWaitingTime';
import usePublicDriverStore from '../../../notdriver/store/usePublicDriverStore';
import { firebaselog_onRide } from '../../utils/FirebaseAnalytics';


const {NeNativeModule} = NativeModules;
class NOTWSService {
  constructor() {
    this.SOCKET_URL = Config.ROOT_API_URL;
    this.socket = null;
    this.fastSocket = null;
    this.onDriverTripStatus = this.onDriverTripStatus.bind(this)
    this.initSocket = this.initSocket.bind(this)
    this.passengerReceiptUploaded = this.passengerReceiptUploaded.bind(this)
  }

onDriverTripStatus(data) {
    const { activeTripData, setActiveTripData, setFareBreakDown } = useTripsStore.getState()
    const {setDirectionPoints, setStartNavigation, setDisduration} = useMapMarkerStore.getState()
    const {setHasActiveTrip, setIsOnGoing} = useTripAcceptStore.getState()
    const {setStackScreen} = useStackScreenStore.getState()
    const {setCurrentScreen} = useCurrentScreenStore.getState()
    const {setNewStopData} = useTripsStore.getState()
    if (data.tripStatus === 'CANCELLED') {
         if (data.isOnGoingTrip) {
          DataStore.storeData('isOngoingTrip', true)
          setFareBreakDown(data?.totalFare)
          setIsOnGoing(true)
          const updatedRideGroup = {...activeTripData[0], status:'DROPPED',
          finalDistance: data?.totalFare?.distance, 
          finalDuration: data?.totalFare?.duration
          };
          setActiveTripData([updatedRideGroup]);
          NeNativeModule.endNavigation();
          setStartNavigation(false);
          driverWaitingTime.stopWaitingTime();
          setNewStopData(null)
          useTripsStore.setState({newStopData: null})
          setStackScreen('PublicDriverTrackingScreen')
          firebaselog_onRide('OR_Status(OR_S)', 'OR_S:cancelled_by_customer_after_pickup')
          firebaselog_onRide('OR_Status(OR_S)', 'OR_S:dropped')
         } else {
          DataStore.storeData('activeTripId', null);
          DataStore.storeData('isOngoingTrip', null)
          setDirectionPoints(null)
          setHasActiveTrip(null)
          setDisduration(null)
          NeNativeModule.endNavigation();
          setStartNavigation(false);
          setActiveTripData([])
          setNewStopData(null)
          useTripsStore.setState({newStopData: null})
          setStackScreen('Home')
          setCurrentScreen('Map')
          firebaselog_onRide('OR_Status(OR_S)', 'OR_S:cancelled_by_customer_before_pickup')
      }
  }
}

  onStopChangeRequest(data) {
    const {setStartNavigation, setDisduration, setDirectionResponse} = useMapMarkerStore.getState()
    const {activeTripData} = useTripsStore.getState()
    const {setStackScreen} = useStackScreenStore.getState()
    const {setTripDetails} = useTripAcceptStore.getState()
  
    if (data.status && data.status === 'ACCEPTED') {
      const activeNewTrip = {...activeTripData[0], stops: data.changeRequestStops}
      useTripsStore.setState({activeTripData: [activeNewTrip]})
      NeNativeModule.endNavigation();
      setStartNavigation(false);
      setDisduration(null);
      setDirectionResponse(null);
      setTripDetails(null)
    } else {
      useTripsStore.setState({newStopData: data.changeRequestStops})
      NeNativeModule.endNavigation();
      setStartNavigation(false);
      setDisduration(null);
      setStackScreen('StopChangeRequest')
    }
  }

  paymentInitiated(data) {
    const {setShowPaymentInitiatedLoader} = usePublicDriverStore.getState();
    if (data?.data?.passangerPaymentInitiated) {
       setShowPaymentInitiatedLoader(true)
    }
  }

  billApprovalStatus(data) {
    console.log("billApprovalStatus", JSON.stringify(data))
    const idx = data?.billIndex;
    const approval = data?.approval;
    if (idx === undefined || idx === null || idx < 0 || !approval) return;

    // Update activeTripData if it has bills at that index
    const { activeTripData, setActiveTripData } = useTripsStore.getState();
    if (activeTripData?.[0]?.bills?.bills?.length > idx) {
      const bills = activeTripData[0].bills.bills;
      const updatedBills = bills.map((b, i) =>
        i === idx ? { ...b, approval } : b
      );
      const updatedTrip = {
        ...activeTripData[0],
        bills: { ...activeTripData[0].bills, bills: updatedBills },
      };
      setActiveTripData([updatedTrip]);
    }

    // Always update media store — this drives the screen UI
    const { bills: storedBills, setBills } = useActingDriverMediaStore.getState();
    if (storedBills?.length) {
      const serverBillId = data?.bill?.billId;
      const updatedStored = storedBills.map(b => {
        const matchById = serverBillId && b.serverId === serverBillId;
        const matchByIndex = !matchById && b.serverIndex !== undefined && b.serverIndex === idx;
        if (!matchById && !matchByIndex) return b;
        return { ...b, approval };
      });
      setBills(updatedStored);
    }
  }

  passengerReceiptUploaded(data) {
    const idx = data?.billIndex;
    const receiptUrl = data?.receiptUrl;
    if (idx === undefined || idx === null || idx < 0 || !receiptUrl) return;

    // Update activeTripData
    const { activeTripData, setActiveTripData } = useTripsStore.getState();
    if (activeTripData?.[0]?.bills?.bills?.length > idx) {
      const bills = activeTripData[0].bills.bills;
      const updatedBills = bills.map((b, i) =>
        i === idx ? { ...b, paymentReceiptPhoto: receiptUrl } : b
      );
      setActiveTripData([{
        ...activeTripData[0],
        bills: { ...activeTripData[0].bills, bills: updatedBills },
      }]);
    }

    // Update media store (drives screen UI)
    const { bills: storedBills, setBills } = useActingDriverMediaStore.getState();
    if (storedBills?.length) {
      const updatedStored = storedBills.map(b =>
        b.serverIndex === idx ? { ...b, paymentReceiptPhoto: receiptUrl } : b
      );
      setBills(updatedStored);
    }
  }

  driverPaymentCompleted(data) {
    const {setStartNavigation, setDisduration, setDirectionPoints} = useMapMarkerStore.getState()
    const {activeTripData, setActiveTripData} = useTripsStore.getState()
    const {setShowRatingModal, setShowPaymentCompletion, setShowPaymentInitiatedLoader} = usePublicDriverStore.getState();
    const {setFareBreakDown} = useTripsStore.getState()
    const {setIsGetFare, setHasActiveTrip, setIsOnGoing} = useTripAcceptStore.getState()
    setShowPaymentInitiatedLoader(false);
    // Show payment completion screen first
    setShowPaymentCompletion(true);
    // Update trip data after 3 seconds (handled by the PaymentCompletionScreen component)
    setTimeout(() => {
      const updatedRideGroup = {...activeTripData[0], status: data.status};
      setActiveTripData([updatedRideGroup]);
      DataStore.storeData('activeTripId', null)
      DataStore.storeData('isOngoingTrip', null)
      setFareBreakDown(null)
      setShowRatingModal(true)
      setIsGetFare(true)
      setIsOnGoing(false)
      setHasActiveTrip(null)
      setDirectionPoints(null)
      setDisduration(null)
      setStartNavigation(false)
    }, 3000);
  }


  isFastSocketConnected() {
    return this.fastSocket?.connected
  }

  destroyFastSocket() {
    try {
      if (this.fastSocket) {
        this.fastSocket.disconnect();
        this.fastSocket = null;
      }
    } catch (error) {
      console.log("Error disconnecting fast socket", error)
    }
  }

  async initSocket(userId) {
    return new Promise((resolve, reject) => {
      try {
        const url = Config.ROOT_API_URL;
        const urlParts = url.split('/');
        const protocolAndHost = urlParts.slice(0, 3).join('/');
        const path = '/' + urlParts.slice(3).join('/');
        const socketPath = '/public-rides-driver'
        this.socket = io(`${protocolAndHost}${socketPath}`, {
          path: path !== '/' ? path + '/socket.io' : '/socket.io',
          query: {
            accessToken: userId,
          },
        });
        this.socket.on('connect', () => {
          console.log("socket connected with user role", url, this.socket.id)
          resolve(true);
        });

        this.socket.on('driverTripStatus', this.onDriverTripStatus);
        this.socket.on('stopChangeRequest', this.onStopChangeRequest);
        this.socket.on('driverPaymentCompleted', this.driverPaymentCompleted);
        this.socket.on('passangerPaymentInitiated', this.paymentInitiated);
        this.socket.on('billApprovalStatus', data => this.billApprovalStatus(data));
        this.socket.on('passengerReceiptUploaded', data => this.passengerReceiptUploaded(data));
      
        this.socket.on('connect_error', error => {
          console.error(
            'Socket error: Failed to connect to socket server',
            error,
          );
          reject(
            new Error(
              'Socket error: Failed to connect to socket server [Error: server error]',
              +error,
            ),
          );
        });
      } catch (error) {
        // console.error('Error during socket initialization', error);
        reject(
          new Error('Error during socket initialization: ' + error.message),
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

      if (this.socket || this.fastSocket) {
        console.log("Socket disconnected")
        this.socket.close();
      }
    }
    catch (err) {
      console.log(err)
    }
  }

  closeFastSocket() {
    try {
      if (this.fastSocket) {
        this.fastSocket.close();
      }
    } catch (err) {
      console.log(err)
    }

  }

  removeListeners(listener) {
    if (this.socket) {
      this.socket.removeAllListeners(listener);
    }
  }
}

const notwsService = new NOTWSService();

export default notwsService;