import { useEffect, useState } from "react";
import Marker from "../../../controllers/NEMap/Marker";
import useMapStore from "../../map/store/useMapStore";

const useStopsMarkerHook = (stops,driverLatitude,driverLongitude,vehicleType,markerType="default",driverAngle=0, isActingDriverTrip, extraMarkers ) => {
    const { setMapMarkers } = useMapStore();    
    const [markersList, setMarkersList] = useState([]);
    const markerId = ``;

    // Add or update driver marker
    useEffect(() => {
        setMarkersList(prevMarkers => {
            // Remove any existing driver marker
            const filtered = prevMarkers.filter(marker => marker.id !== 'driver');
            if (!driverLatitude || !driverLongitude) return filtered;
            const driverMarker = new Marker(`marker-driver-${markerType}`,'driver', driverLongitude, driverLatitude, vehicleType?.toLowerCase(), 36);
            // console.log("driverMarker",driverMarker)
            if(driverAngle){
                driverMarker.setAngle(driverAngle);
            }
            if (isActingDriverTrip && markerType === "pickup") {
            return [...filtered];
            } else {
            return [...filtered, driverMarker];
            }
        });
    }, [driverLatitude, driverLongitude, driverAngle]);

    // Add stop markers
    useEffect(() => {
        setMapMarkers([])
        if (!stops || stops.length === 0) {
            setMarkersList(prevMarkers => prevMarkers.filter(marker => marker.id === 'driver'));
            return;
        }

       
        
        const driverMarker = new Marker(`marker-driver-${markerType}`,'driver', driverLongitude, driverLatitude, vehicleType?.toLowerCase(), 36);
        if(driverAngle){
            driverMarker.setAngle(driverAngle);
        }
        // console.log("driverMarker2",driverMarker)

        if(markerType === "pickup"){  
            setMarkersList(prevMarkers => {
                // Remove all stop markers (keep only driver marker)
                const stopMarker0 = new Marker(`${0}-stop${markerType}`, stops[0].name, stops[0].location[0], stops[0].location[1], 'home', 36 )
                if(driverLatitude && driverLongitude && !isActingDriverTrip){
                    return [driverMarker, stopMarker0];
                }else{
                    return [stopMarker0];
                }
            });
          }
          else{
        setMarkersList(prevMarkers => {
            // Remove all stop markers (keep only driver marker)
            const stopMarkers = stops.filter((stop)=>stop.isReached === false).map((stop,index) => {
                let markerName = index == stops?.length - 1 ? 'drop_point' : stop?.name?.toLowerCase().replace(' ','_');
                let markerSize = markerName.includes('stop') ? 24 : 64;
                // console.log("markerName",markerName)
                return new Marker(`${index}-stop${markerType}`, stop.name, stop.location[0], stop.location[1], markerName, markerSize);
            });
            if(driverLatitude && driverLongitude){
                return [driverMarker, ...stopMarkers];
            }else{
                return [...stopMarkers];
            }
        });


    }
    }, [stops]);

    // Sync markersList to map store
    useEffect(() => {
        const all = extraMarkers?.length ? [...markersList, ...extraMarkers] : [...markersList];
        setMapMarkers(all);

        return () => {
            setMapMarkers([]);
        }
    }, [markersList, extraMarkers, setMapMarkers]);

    return { markersList };
};

export default useStopsMarkerHook;