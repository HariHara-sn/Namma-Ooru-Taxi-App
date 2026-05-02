import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist } from 'zustand/middleware'


const storageOptions = {
  name: 'device-api-store',
  getStorage: () => AsyncStorage,
}

const storeFunction = (set, get) => ({

  fastSocketConnected: false,
  setFastSocketConnected: fastSocketConnected => set({ fastSocketConnected }),

  loading: false,
  setLoading: (loading) => set({ loading }),

  setError: (deviceApiError) => set({ error: deviceApiError }),
  error: null,

  /* All devices in the store */
  deviceData: null,
  setDeviceData: deviceData => set({ deviceData }),

  addDeviceCount: 0,
  deleteDeviceCount: 0,
  setAddDeviceCount: count => set(state => {
    return { addDeviceCount: state.addDeviceCount + count }
  }),
  setDeleteDeviceCount: count => set(state => {
    return { deleteDeviceCount: state.deleteDeviceCount + count }
  }),

  /* Unique id of the mobile device its used as the imei*/
  userDeviceId: null,
  setUserDeviceId: userDeviceId => set({ userDeviceId }),

  /* Hold the current device use logged in if its added */
  userDevice: null,
  setUserDevice: userDevice => set({ userDevice }),

  isTrackingEnabled: true,
  setIsTrackingEnabled: isTrackingEnabled => {
      set({ isTrackingEnabled})
  },

  myMobileDevices: [],

  /* Delete a device from store */

  deleteDeviceFromStore: deviceId => {
    set(state => {
      const updated = state.deviceData.filter(item => item._id !== deviceId);
      const newState = { deviceData: updated };

      if (state?.userDevice?._id === deviceId) {
        console.log("Setting user device to null as its deleted")
        newState.userDevice = null
      }
      return newState
    });
  },

  /* Update a device in the store */
  editDeviceFromStore: device => {
    set(state => {
      const updated = state.deviceData.map(item => {
        if (item._id === device._id) return device;
        return item;
      });

      return { deviceData: updated };
    });
  },

  /* Add more devices to the end of the list */
  addMoreDevices: devices => {
    set(state => {
      const newState = { deviceData: !state.deviceData ? [...devices] : [...state.deviceData, ...devices] };
      if (!state.userDevice) {
        const userDeviceAdded = devices.find(device => device.imei === state.userDeviceId);
        if (userDeviceAdded) {
          newState.userDevice = userDeviceAdded
        }
      }
      return newState
    });
  },

  /* Add a devie to the intial postition */
  addMyDevice: device => {
    set(state => {
      return { userDevice: device, deviceData: !state.deviceData ? [device] : [device, ...state.deviceData] }
    })
  },
  addToMobileDevices: (device) => {
    set(state => {
      return { myMobileDevices: !state.deviceData ? [device] : [...state.deviceData, device] };
    })
  },

  getDeviceFromImei: imei => {
    return get().deviceData.find(device => device.imei === imei)
  },

  updateDeviceUsageAlert: (imei, newAlert) => set((state) => {
    return {
      deviceData: state.deviceData.map(device => {
        if (device.imei !== imei) return device;

        const alerts = device.deviceUsageAlertSentTo || [];
        const index = alerts.findIndex(alert => alert.deviceImei === imei);

        if (index !== -1) {
          // Update
          alerts[index] = { ...alerts[index], ...newAlert };
        } else {
          // Add
          alerts.push({ ...newAlert, deviceImei: imei });
        }

        return { ...device, deviceUsageAlertSentTo: alerts };
      }),
    };
  }),

  removeDeviceUsageAlert: (imei) => set((state) => ({
    deviceData: state.deviceData.map(device => {
      if (!device.deviceUsageAlertSentTo) return device;

      const updatedAlerts = device.deviceUsageAlertSentTo.filter(
        alert => alert.deviceImei !== imei
      );

      return { ...device, deviceUsageAlertSentTo: updatedAlerts };
    }),
  })),

  updateDeviceBlockedApps: (deviceId, appName, packageName, action) => {
    set((state) => ({
      deviceData: state.deviceData.map((device) => {
        if (device._id === deviceId) {
          const blockedApps = device.deviceInfo?.attributes?.blockedApps || [];

          const updatedBlockedApps =
            action === 'block'
              ? [...blockedApps, { appName, packageName }]
              : blockedApps.filter(app => app.packageName !== packageName);

          return {
            ...device,
            deviceInfo: {
              ...device.deviceInfo,
              attributes: {
                ...device.deviceInfo.attributes,
                blockedApps: updatedBlockedApps,
              },
            },
          };
        }
        return device;
      }),
    }));
  },
  
  resetDeviceStore: () => {
    set({
      deviceData: null,
      deviceApiError: null,
      error: null,
      loading: false,
      selectedDevice: null,
      userDevice: null,
      myMobileDevices: null,
      myDevice: null,
      getDevice: null,
      fastSocketConnected: false,
    });
  },
})

const useDeviceAPIStore = create(persist(storeFunction, storageOptions));

export default useDeviceAPIStore;
