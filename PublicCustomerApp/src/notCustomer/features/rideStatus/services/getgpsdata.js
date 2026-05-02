import processData from "../../../core/location/DataProcessorDriver";
import { mapMatch } from "../../../API/EndPoints/EndPoints";
import polyline from "@mapbox/polyline";
import client from "../../../API/apolloClient"; // your configured Apollo client
import LocationGetGraphqlQuery from "../../../core/location/LocationGetGraphqlQuery";

/**
 * Calculate distance & duration for a trip
 * @param {Object} params
 * @param {string} params.tripId
 * @param {number} params.startTime
 * @param {number} params.endTime
 * @param {string} params.token - auth token
 * @returns {Promise<{distance: number, duration: number}>}
 */
export default async function getGpsData({ tripId, startTime, endTime, token }) {
 
  try {
   
    const { data } = await client.query({
      query: LocationGetGraphqlQuery(tripId, false, startTime, endTime),
      context: {
        headers: { authorization: `Bearer ${token}` },
      },
      fetchPolicy: "no-cache",
    });

    

    const raw = data?.getRecentLocations?.raw;
    if (!Array.isArray(raw) || raw.length === 0) {
      return { distance: 0, duration: 0 };
    }

  
    const processed = processData({
      data: data.getRecentLocations,
      options: {
        range: { start: startTime, end: endTime },
        mergeLngLats: true,
      },
    });

    

    const GPSDistance = processed?.data?.sessions!=0 ? processed?.data?.sessions?.reduce((acc, session) => acc + (session[5] || 0), 0) : 0;
    const times = processed?.data?.times || [];
    const totalDuration = times.length > 1 ? times[times.length - 1] - times[0] : 0;
    const minutes = Math.floor(totalDuration / 60000);
    const lngLats = processed?.data?.lngLats || [];
    if (!Array.isArray(lngLats) || lngLats.length < 2) {
      return { distance: 0, duration: 0 };
    }

    console.log("GPSDistance.........",GPSDistance)
    console.log("minutes.........",minutes)

    // const latLngs = lngLats.map(([lng, lat]) => [lat, lng]);
    // const encoded = polyline.encode(latLngs,6);
  
    // const encoded = "c}`aTgdi}qCwEXzCvl@ei@jDhHvzBw\fCuAdEnDjyAz@d^xQ`AvH`@lBBlUPh_@Vrp@f@f^^pWR|KHpbAdAlEPnIJpABdKhCjEZpg@fChP`AnFQbIe@hBAdQOtGG|H_@zCnEbLtRfJlM`S`ZxKtOpFxGzVd^xEbFl]h`@vY~[da@rg@tE`FlXp]zXn^lEnG"

    // const resp = await mapMatch({
    //   encoded_polyline: encoded,
    //   shape_match: "map_snap",
    //   costing: "auto",
    // });

    // const lengthMeters = resp?.trip?.summary?.length;
    // const timeSeconds = resp?.trip?.summary?.time;

  
    return { distance: GPSDistance, duration: minutes };
  } catch (err) {
    console.error("calculateDistance error:", err);
    return { distance: 0, duration: 0 };
  }
}
