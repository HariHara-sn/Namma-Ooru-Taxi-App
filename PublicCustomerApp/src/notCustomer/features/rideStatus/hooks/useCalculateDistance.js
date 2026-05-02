import { useEffect, useMemo, useState } from 'react';
import { useQuery } from "@apollo/client";
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import LocationGetGraphqlQuery from '../../../core/location/LocationGetGraphqlQuery';
import processDataMobile from "../../../core/location/DataProcessorMobile";
import { mapMatch } from '../../../API/EndPoints/EndPoints';
import polyline from '@mapbox/polyline';

const useCalculateDistance = ({ tripId, startTime, endTime,enabled = true }) => {
  const { userdetails } = useUserInfoStore();
  const [gpsDistance, setGpsDistance] = useState(0);
  const [gpsDuration, setGpsDuration] = useState(0);
  const query = useMemo(() => 
    LocationGetGraphqlQuery(tripId, false, startTime, endTime), 
    [tripId, startTime, endTime]
  );


 
  const { data, loading, error } = useQuery(query, {
    skip: !enabled,
    context: {
      headers: {
        authorization: ("Bearer " + userdetails?.token) || "",
      },
    },
    cacheTime: 5000 //180000, // 3 minutes in milliseconds
  });

  useEffect(() => {

    console.log('data',data);
    const processData = async () => {
    
      if(data?.getRecentLocations?.raw?.length == 0){
        setGpsDistance(-1);
        setGpsDuration(-1);
      }
      if (data) {
        // console.log('GraphQL Data received:', data);
        const processedData = processDataMobile({ data: data.getRecentLocations, options: { range: { start: startTime, end: endTime }, mergeLngLats: true } });
        if(processedData?.data?.lngLats){
          console.log('Processed data:', processedData.data.lngLats);
        const polylineData = polyline.encode(processedData.data.lngLats);
        //  const polylineData = "c}`aTgdi}qCwEXzCvl@ei@jDhHvzBw\fCuAdEnDjyAz@d^xQ`AvH`@lBBlUPh_@Vrp@f@f^^pWR|KHpbAdAlEPnIJpABdKhCjEZpg@fChP`AnFQbIe@hBAdQOtGG|H_@zCnEbLtRfJlM`S`ZxKtOpFxGzVd^xEbFl]h`@vY~[da@rg@tE`FlXp]zXn^lEnG"
          const payload = {
              "encoded_polyline": polylineData,
              "shape_match": "map_snap",
              "costing": "auto"
            }

          const mapmatchResponse = await mapMatch(payload);
         
          if(mapmatchResponse?.trip){
            if(mapmatchResponse?.trip?.summary?.length){
              
                setGpsDistance(mapmatchResponse?.trip?.summary?.length);
              
            }
            if(mapmatchResponse?.trip?.summary?.time){
                
                setGpsDuration(mapmatchResponse?.trip?.summary?.time/60);
              
            }
          }
        }
      }
    };

    processData();
  }, [data, startTime, endTime]);

  return {
    gpsDistance,
    gpsDuration,
    loading,
    error,
    data,
  }
};

export default useCalculateDistance;    