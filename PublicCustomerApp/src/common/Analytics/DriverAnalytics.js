import { getAnalytics } from "@react-native-firebase/analytics"

class DriverAnalytics {
    constructor() {
    }

    async triggerDriverLogin(event,category,action){
        try {
            await getAnalytics().logEvent(event, {
                category: category,
                action: action
            })
            console.log('Driver login event logged:', event, category, action)
        } catch (error) {
            console.error('Error triggering driver login:', error) 
        }
    }

    async triggerDriverTripStatus(action){
        try {
            await getAnalytics().logEvent('driver_trip_status', {
                category: 'trip',
                action: action
            })
            console.log('Driver trip status:', action)
        } catch (error) {
            console.error('Error triggering driver trip status:', error) 
        }
    }

}

export default new DriverAnalytics()