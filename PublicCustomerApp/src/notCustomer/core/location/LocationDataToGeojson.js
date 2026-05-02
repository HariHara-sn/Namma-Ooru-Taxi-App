
export default function (locationData) {

    const { data } = locationData
    if (!data) return null


    const geoJSON = {
        type: "FeatureCollection",
        features: data.lats.map((lat, i) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [data.lons[i], lat],
            },
            properties: {
                time: data.times?.[i] || 0,
                accuracy: data.accuracies?.[i] || 0,
                altitude: data.altitudes?.[i] || 0,
                speed: data.speeds?.[i] || 0,
                heading: data.headings?.[i] || 0,
                battery: data.batteries?.[i] || 0,
                activity: data?.activities?.[i] || 0,
            },
        })),
    };

    return geoJSON;
}