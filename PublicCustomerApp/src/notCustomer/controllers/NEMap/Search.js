import Config from "react-native-config";
import { NativeModules, Platform } from "react-native";

const { NeNativeModule } = NativeModules;

class SearchAPI {
    static CACHE = {};

    constructor(accessToken = Config.NE_ACCESS_TOKEN) {
        this.accessToken = accessToken

        this.searchAbortController = null
    }

    async search(locationName) {
        if (this.searchAbortController) this.searchAbortController.abort()
        this.searchAbortController = new AbortController()

        let searchText = locationName

        let response = await fetch(`${Config.NE_ROOT_URL}/search/api?access_token=${this.accessToken}&q=${searchText}&lang=en&limit=10`, { signal: this.searchAbortController.signal })
        let data = await response.json()

        return data;
    }

    async reverseGeocode(longitude, latitude) {
        if (this.searchAbortController) {
            this.searchAbortController.abort()
            this.searchAbortController = null
        }

        const cacheKey = `${longitude},${latitude}`
        if (SearchAPI.CACHE[cacheKey]) {
            return SearchAPI.CACHE[cacheKey]
        }

        if (Platform.OS === "android" && NeNativeModule?.reverseGeocode) {
            try {
                const nativeResponse = await NeNativeModule.reverseGeocode(latitude, longitude)
                const nativeResult = {}
                // console.log("Native reverseGeocode response:", nativeResponse)

                if (Array.isArray(nativeResponse?.address) && nativeResponse.address.some(item => typeof item === "string" && item.trim() !== "")) {
                    nativeResult.address = nativeResponse.address
                } else {
                    nativeResult.address = null
                }

                const placeName = typeof nativeResponse?.placeName === "string" ? nativeResponse.placeName.trim() : ""
                nativeResult.placeName = placeName.length > 0 ? placeName : "Unnamed Location"

                SearchAPI.CACHE[cacheKey] = nativeResult
                return nativeResult
            } catch (error) {
                console.warn("Android reverseGeocode fallback to HTTP", error)
            }
        }

        this.searchAbortController = new AbortController()

        let response = await fetch(`${Config.NE_ROOT_URL}?data={"addDebugInfo":false,"input":"${longitude},${latitude}","language":"en","limitResults":10,"mapunit":"india","sections":["reverse_geocode"],"userPos":[${longitude},${latitude}],"version":"1.2.0.0"}`, { signal: this.searchAbortController.signal })
        let data = await response.json()

        let { reverse_geocode } = data

        if (reverse_geocode && reverse_geocode.length > 0) {
            const addressData = reverse_geocode[0].address
            const placeName = reverse_geocode[0].place_name[0]
            const result = {}

            if (
                Array.isArray(addressData) &&
                addressData.filter(item => item !== "").length > 0
            ) {
                result.address = addressData
            } else {
                result.address = null
            }

            if (placeName) {
                result.placeName = placeName
            } else {
                result.placeName = "Unnamed Location"
            }

            SearchAPI.CACHE[cacheKey] = result
            return result
        }

        const fallback = { address: null, placeName: "Unnamed Location" }
        SearchAPI.CACHE[cacheKey] = fallback
        return fallback
    }

}

export default SearchAPI;



