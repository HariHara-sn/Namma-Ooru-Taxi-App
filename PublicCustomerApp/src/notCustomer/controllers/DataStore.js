/* eslint-disable no-useless-catch */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALLOWED_KEYS = [
  'language',
  'onBoarding',
  'access_token',
  'refresh_token',
  'userdetails',
  'login_phoneNumber',
  'Theme',
  'IS_FIRST',
  'IsDefault',
  'recentSearches',
  'currentTrip',
  'ThemeMode',  
  'IsDefault',
  'scheduledTrip',
  'sOS_EVENTID',
  'emergency_contact',
  'firstOutdatedDate',
  'updateSkipDate',

  // common,
   'userRole',

   // driverKeys
  'bg_userToken',
  'bg_deviceImei',
 
]

// const KEYS_TO_CLEAR_ON_SESSION_END = [
//   'liveAlertConfig',
//   'liveStatDrawer',
//   'userPreference',
//   'unitType',
//   'userInfo',
//   'myDevice',
//   'deviceToken',
// ]

export const DataStore = {
  storeData: async (key, value) => {
    if (!ALLOWED_KEYS.includes(key)) throw Error(`YOU have not mentioned ${key} in ALLOWED_KEYS check DataStore.js`)
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // console.log(error);
      throw error;
    }
  },

  loadData: async key => {
    try {
      let data = await AsyncStorage.getItem(key);
      data = JSON.parse(data);
      if (data) {
        // console.log(`Data loaded from store: ${key}`, data);
        return {
          status: true,
          data: data,
        };
      } else {
        return {
          status: false,
          data: null,
        };
      }
    } catch (error) {
      throw error;
    }
  },

  clearData: async key => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw error;
    }
  },

  clearSession: async (key) => {
    try {
      //   KEYS_TO_CLEAR_ON_SESSION_END.forEach(async key => {

      //   });
      await AsyncStorage.removeItem(key);
      
    } catch (error) {
      console.log(error)
    }
  }
};

