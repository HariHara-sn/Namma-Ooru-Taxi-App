import { create } from 'zustand';

const defaultConfig = {
  APP: 'PUBLICRIDE_CUSTOMER_APP',
  APP_NAME: 'Namma Ooru Taxi',
  COMPANYNAME: 'Namma Ooru Taxi',
  COMPANYADDRESS: '123, Main Street, Anytown, USA',
  COMPANYPHONE: '+1234567890',
  COMPANYEMAIL: 'info@nammaoorutaxi.com',
  APP_VERSION: '1.0.0',
  APP_BUILD_NUMBER: '1',
  APP_BUILD_VERSION: '1.0.0',
  SHOW_WAIT_PRICE_INFO: false,
  DEFAULT_WAIT_TIME: 5,
  WAIT_TIME_CHARGES_PER_MINUTE: 2,
  MAX_WAIT_TIME: 60,
  PAYMENT_METHODS: 'PG',
  SHOW_NEARBY_DRIVER: false,
  DRIVER_LOCATION_UPDATE_INTERVAL: 10,
  TOTAL_STOPS_ALLOWED: 2,
  SHOW_NEARBY_DRIVER_RADIUS: 10000,
  MIN_TRIP_DISTANCE_METER: 100,
  CUSTOMER_CANCEL_PENALTY:true,
  CUSTOMER_CANCEL_PENALTY_LIMIT: 3,
  IN_APP_REVIEW_ALWAYS: true,
  IN_APP_REVIEW_REQUIRED_RATING: 3,
  SOCIAL_MEDIA_LINKS: {
    facebook: 'https://www.facebook.com/nammaoorutaxi',
    twitter: 'https://twitter.com/nammaoorutaxi',
    instagram: 'https://www.instagram.com/nammaoorutaxi',
    linkedin: 'https://www.linkedin.com/company/nammaoorutaxi',
  }
};

const useConfigStore = create((set, get) => ({
  appConfig: { ...defaultConfig },
  updateAvailable: false,

  setConfig: (newConfig) => set({ appConfig: { ...defaultConfig, ...newConfig } }),

  updateConfig: (partial) =>
    set((state) => ({
      appConfig: { ...state.appConfig, ...(partial || {}) }
    })),

  resetConfig: () => set({ appConfig: { ...defaultConfig } }),
  setUpdateAvailable: (isAvailable) => set({ updateAvailable: isAvailable }),
}));

export default useConfigStore;
