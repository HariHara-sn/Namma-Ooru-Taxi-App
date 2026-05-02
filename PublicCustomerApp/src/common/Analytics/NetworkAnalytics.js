import { getAnalytics } from "@react-native-firebase/analytics"

class NetworkAnalytics {
    constructor() {
    }

       async triggerNetworkError(event,category,action){
        try {
            await getAnalytics().logEvent(event, {
                category: category,
                action: action
            })
            console.log('Network error event logged:', event, category, action)
        } catch (error) {
            console.error('Error triggering Network error:', error) 
        }
    }

}

export default new NetworkAnalytics()