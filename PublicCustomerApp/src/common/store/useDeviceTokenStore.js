import { create } from 'zustand';

const useDeviceTokenStore = create((set) => ({

    hasLocationPermission: false,
    setHasLocationPermission: hasLocationPermission => {
        set(state => state.hasLocationPermission !== hasLocationPermission ? { hasLocationPermission: hasLocationPermission } : state)
    },

    hasBackgroundLocationPermission: false,
    setHasBackgroundLocationPermission: hasBackgroundLocationPermission => {
        set(state => state.hasBackgroundLocationPermission !== hasBackgroundLocationPermission ? { hasBackgroundLocationPermission: hasBackgroundLocationPermission } : state)
    },
    
    hasNotificationPermission: false,
    setHasNotificationPermission: hasNotificationPermission => {
        set(state => state.hasNotificationPermission !== hasNotificationPermission ? { hasNotificationPermission: hasNotificationPermission } : state)
    },

    batteryOptimizationDisabled: false,
    setBatteryOptimizationDisabled: batteryOptimizationDisabled => {
        set(state => state.batteryOptimizationDisabled !== batteryOptimizationDisabled ? { batteryOptimizationDisabled: batteryOptimizationDisabled } : state)
    },
    
    hasActivityRecognitionPermission: false,
    setHasActivityRecognitionPermission: hasActivityRecognitionPermission => {
        set(state => state.hasActivityRecognitionPermission !== hasActivityRecognitionPermission ? { hasActivityRecognitionPermission: hasActivityRecognitionPermission } : state)
    },

    hasUsageStatsPermission: false,
    setHasUsageStatsPermission: hasUsageStatsPermission => {
        set(state => state.hasUsageStatsPermission !== hasUsageStatsPermission ? { hasUsageStatsPermission: hasUsageStatsPermission } : state)
    },

    hasAccessibilityPermission: false,
    setHasAccessibilityPermission: hasAccessibilityPermission => {
        set(state => state.hasAccessibilityPermission !== hasAccessibilityPermission ? { hasAccessibilityPermission: hasAccessibilityPermission } : state)
    },

    hasOverlayPermission: false,
    setHasOverlayPermission: hasOverlayPermission => {
        set(state => state.hasOverlayPermission !== hasOverlayPermission ? { hasOverlayPermission: hasOverlayPermission } : state)
    },

    // Whether the device supports querying overlay permission
    overlayCheckSupported: true,
    setOverlayCheckSupported: overlayCheckSupported => {
        set(state => state.overlayCheckSupported !== overlayCheckSupported ? { overlayCheckSupported } : state)
    },

    deviceToken: null,
    setDeviceToken: deviceToken => {
        set({ deviceToken: deviceToken })
    },

    reset: () => {
        set({ deviceToken: null })
    }
}))

export default useDeviceTokenStore

