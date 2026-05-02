// hooks/useNearbyDrivers.ts
import { useQuery, useQueryClient } from "react-query";
import {  getNearByDrivers } from "../API/EndPoints/EndPoints";
import { useNearbyDriversStore } from "../store/useNearByDrivers";
import { useNearbyPollingControl } from "../store/useNearByDriverPollingControl";
import useConfigStore from "../store/useConfigStore";

export function useNearbyDrivers() {
  const qc = useQueryClient();
  const { setDrivers } = useNearbyDriversStore();
  const { enabled, intervalMs, lat, lon } = useNearbyPollingControl();
  const { appConfig } = useConfigStore();
  return useQuery({
    queryKey: ["nearbyDrivers", lat, lon], // cache per target
    queryFn: () => getNearByDrivers(lat!, lon!),
    enabled: enabled && appConfig?.SHOW_NEARBY_DRIVER && lat != null && lon != null,
    staleTime: intervalMs,
    refetchInterval: (q:any) => (q?.state?.fetchFailureCount ? false : intervalMs),
    refetchOnWindowFocus: false, // RN
    onSuccess: (data:any) => {
      console.log("data",JSON.stringify(data));
      const drivers = Array.isArray(data?.drivers) ? data.drivers : [];
      // Since the new API response does not include a supply count, use drivers.length
      const count = drivers.length;
      setDrivers(
        drivers.map((d: any) => {
          // Extract lat/lon from location.coordinates [lon, lat]
          const coords = d.location?.coordinates || [];
          return {
            id: d._id,
            lat: typeof coords[1] === "number" ? coords[1] : 0,
            lon: typeof coords[0] === "number" ? coords[0] : 0,
            bearing: 0, // No bearing in new response
            updatedAt: Date.now(),
            vehicleType: d.vehicleType,
          };
        }),
        count
      );
    },
  });
}
