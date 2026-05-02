import {create} from 'zustand';

const useUserStore = create(set => ({
  userRole: 'customer',
  setUserRole: userRole => set({userRole}),

  userInfo: null,
  setUserInfo: userInfo => set({userInfo}),

  isDev:false,
  setIsDev: isDev => set({isDev}),

  driverMode: 'driver',
  setDriverMode: driverMode => set({driverMode}),

  pendingDriverMode: null,
  setPendingDriverMode: pendingDriverMode => set({pendingDriverMode}),
}));

export default useUserStore;
