import Config from "react-native-config";
import polyline from "@mapbox/polyline";

class DirectionAPI {

    constructor(accessToken = Config.NE_ACCESS_TOKEN) {
        this.accessToken = accessToken

        this.directionsAbortController = null
    }

    async findValhalla(points, distanceDurationonly = false) {
        let baseURL = "https://ne.vmmaps.com/routing/v1/route?data="
        points = points.map(loc => { return { 'lat': parseFloat(loc.lat || loc[1] || 0), 'lon': parseFloat(loc.lon || loc[0] || 0) } })
        let payload = {
            "locations": points,
            "directionsOptions": { "units": "kilometers" },
            "costing": "taxi",
        }
        let url = baseURL + JSON.stringify(payload)

        const options = {
            url: url,
            method: 'GET',
            json: true,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        let response = await fetch(url, options)
        response = await response.json()


        if (response && response.trip && Object.keys(response.trip).length) {
            let trip = response.trip
            let { time, length } = trip.summary
            let duration = parseFloat(time) / 60
            let distance = length
            if (distanceDurationonly) return [distance, duration]
            let { legs } = trip
            let route_track = []

            legs.forEach(leg => {
                let shape = leg.shape
                let track = polyline.decode(shape, 6)
                route_track.push(...track)
            })
            return {route_track, distance, duration};
        }

        return false

    }

    async find(locations, distanceDurationonly = false) {
        if (this.directionsAbortController) this.directionsAbortController.abort()
        this.directionsAbortController = new AbortController()

        let locationString = ""
        locations.forEach((location, index) => {
            locationString += `${location[1]},${location[0]}`
            if (index != locations.length - 1) locationString += ";"
        })
        let url = `${Config.NE_ROOT_URL}/router/route?access_token=${this.accessToken}&points=${locationString}`
        let response = await fetch(url, { signal: this.directionsAbortController.signal })
        let data = await response.json()
        let route = data.routes[0]
        if (!route) return null

        let { duration, distance } = route
        distance = distance / 1000
        duration = duration / 60

        if (distanceDurationonly) return [distance, duration]
        let decodedPoints = polyline.decode(route.geometry, 6)
        // reverse the lat and lng
        decodedPoints = decodedPoints.map(point => [point[1], point[0]])
        return decodedPoints;
    }

    async findRoute(points) {
        const latlngs = points?.map(item => {
            return {
              lat: item.location ? item.location[1] : item.lat,
              lon: item.location ? item.location[0] : item.lon,
            };
        });

        const jsonObject = {
            costing: 'auto',
            costing_options: {},
            language: 'en',
            locations: latlngs ? latlngs : [],
            units: 'kilometers',
        };
        const jsonString = JSON.stringify(jsonObject);
        const encodedData = encodeURIComponent(jsonString);
        const url = `${Config.ROUTE_API_URL}?data=${encodedData}&access_token=${Config.NE_ACCESS_TOKEN}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const routeData = await response.json();
            return routeData;
        } catch (error) {
            console.error("Error fetching route:", error);
            return null;
        }
    }
}

module.exports = DirectionAPI;
