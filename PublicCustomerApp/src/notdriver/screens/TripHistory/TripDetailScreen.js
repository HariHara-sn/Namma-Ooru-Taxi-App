import { NativeModules, StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import { useSelectedRouteStore } from '../../store/useTripsStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { useMapMarkerStore } from '../../../common/store/useMapMarkerStore';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import UseBackButton from '../../../common/hooks/UseBackButton';
import PublicDriverTripPaymentScreen from '../PublicDriverTripPaymentScreen';
import Polyline from '../../../common/map/Polyline';
import polyline from '@mapbox/polyline'
import Marker from '../../../common/map/Marker';

const {NeNativeModule} = NativeModules;

const TripDetailScreen = () => {
    const {selectedTrip, setSelectedTrip} = useSelectedRouteStore();
    const {goBack} = useStackScreenStore();
    const {setDirectionPoints,setMapBounds, setGeometries, setMapMarkers} = useMapMarkerStore();
    const onBackPress = () => {
        goBack('Home')
        setSelectedTrip(null)
        setDirectionPoints(null)
    }
    const {driverInfo}= usePublicDriverStore()

    useEffect(()=> {
    //     let polylineData = null;
    // if (selectedTrip?.encodedPolyline) {
    //     const decodedData = polyline.decode(selectedTrip?.encodedPolyline, 6);
    //     const reversedCoordinates = decodedData.map(([lat, lon]) => [lon, lat]);
    //     polylineData = new Polyline(
    //       1,
    //       `routes`,
    //       reversedCoordinates,
    //       "#174EA6",
    //       'small',
    //     );
    //     polylineData.setPadding([200, 230, 200, 400]);
    //     polylineData.setFocus(true);
    //     setGeometries([polylineData]);
    //     const startLocation = reversedCoordinates?.[0];
    //     const endLocation = reversedCoordinates?.[reversedCoordinates?.length - 1];
    //     // console.log('startLocation', startLocation);
    //     // console.log('endLocation', endLocation);
    //     // const startMarker = new Marker(
    //     //   'startMarker',
    //     //   'start_marker',
    //     //   startLocation[0],
    //     //   startLocation[1],
    //     //   'pickup_point',
    //     //   36,
    //     //   false,
    //     // );
    //     // const endMarker = new Marker(
    //     //   'endMarker',
    //     //   'endMarker',
    //     //   endLocation[0],
    //     //   endLocation[1],
    //     //   'marker_end',
    //     //   36,
    //     //   false
    //     // );
    //     // setMapMarkers([startMarker, endMarker])
    //     return
    // }
        if (selectedTrip?.stops && selectedTrip?.stops.length !== 0) {
          const directions = selectedTrip?.stops?.map((direction)=>{
            return {
              lat: direction.location[1],
              lon: direction.location[0],
            }
          })
          setDirectionPoints({
            locations: directions,
            type: 'car',
          });
        }
      },[selectedTrip])

      const supplierInfo = selectedTrip?.supplierInfo ? {
        name: selectedTrip?.supplierInfo.VendorName,
        phone: selectedTrip?.supplierInfo.ownerPhone,
        email: selectedTrip?.supplierInfo.ownerEmail,
        state: selectedTrip?.supplierInfo.state,
        address: selectedTrip?.supplierInfo.fullAddress,
      }: {
        name: driverInfo.name || 'N/A',
        phone: driverInfo.phone || 'N/A',
        email: driverInfo.email || 'N/A',
        state: driverInfo.homeLocation?.state || 'N/A',
        address: driverInfo.homeLocation?.address || 'N/A',
        gstNumber: driverInfo.gstNumber || 'N/A',
        panNumber: driverInfo.panNumber || 'N/A',
      };
      

  return (
    <View style={styles.container}>
        <UseBackButton onBackPress={()=>{onBackPress(), setDirectionPoints(null), NeNativeModule.clearDirectionPoints()}}/>
        <PublicDriverTripPaymentScreen fareDetails={selectedTrip?.paymentDetails} tripDetials={selectedTrip} supplierInfo={supplierInfo} isDetailsScreen={true}/>
    </View>
  )
}

export default TripDetailScreen

const styles = StyleSheet.create({
    container:{
        flex:1,
    }
})