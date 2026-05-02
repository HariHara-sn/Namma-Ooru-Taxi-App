import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageOptions = {
name: 'trip-request-store',
  getStorage: () => AsyncStorage,
};

const storeFunctione = (set, get) => ({
    tripRequestData: null,  
    setTripRequestData: (tripRequestData) => set({tripRequestData}),
});

const useTripRequestStore = create(persist(storeFunctione, storageOptions));
export default useTripRequestStore  
