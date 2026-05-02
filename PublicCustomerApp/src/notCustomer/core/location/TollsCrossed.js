function findDistance(locationA, locationB) {
  const R = 6371e3;
  const φ1 = (locationB.latitude * Math.PI) / 180; // φ, λ in radians
  const φ2 = (locationA.latitude * Math.PI) / 180;
  const Δφ = ((locationA.latitude - locationB.latitude) * Math.PI) / 180;
  const Δλ = ((locationA.longitude - locationB.longitude) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKilometers = (R * c) / 1000;
  return distanceInKilometers;
}

const getTollCost = (vehicleType, charges) => {
  const tollCharge = charges.find(item => 
    item.vehicleType.toLowerCase().includes(vehicleType.toLowerCase())
  );
  return tollCharge
};

export const findIntersectingTolls = (tollData, lats, lons, times, vehicleType) => {
  const tollsCrossed = [];
  const tollCrossedCount = {};
  const tollCrossedTime = {};
  for (let i = 0; i < lats.length; i++) {
    const location = [lons[i], lats[i]];
    tollData.forEach(toll => {
      if (tollCrossedTime[toll._id] < times[i] + 10 * 60 * 1000) {
        return;
      }
      const tollCoord = toll.location.coordinates;
      const distance = findDistance(
        {
          latitude: location[1],
          longitude: location[0],
        },
        {
          latitude: tollCoord[1],
          longitude: tollCoord[0],
        },
      );
      const dm = distance * 1000;
      if (dm < 100) {
        tollsCrossed.push(toll);
        if (tollCrossedCount[toll._id]) {
          tollCrossedCount[toll._id]++;
          tollCrossedTime[toll._id] = times[i];
        } else {
          tollCrossedCount[toll._id] = 1;
          tollCrossedTime[toll._id] = times[i];
        }
      }
    });
  }
  let tollCost = 0;
  let costType = 'single'
  tollsCrossed.forEach(toll => {
    const charges = toll?.charges;
    const charge = getTollCost(vehicleType,charges);
    // if crossed twice round trip cost else single cose
    const cost =
      tollCrossedCount[toll._id] > 1 ? charge.round_trip : charge.single;
    tollCost += cost;
    
    costType = tollCrossedCount[toll._id] > 1 ? 'roundTrip' : 'single' 
  });
  return {
    tollsCrossed: tollsCrossed,
    tollPrice: tollCost,
    tollsCrossedLength: Object.keys(tollCrossedCount)?.length,
    costType: costType
  };
};
