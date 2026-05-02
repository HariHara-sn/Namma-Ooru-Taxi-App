import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
// import { FlatList } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelectedRouteStore } from '../store/useTripsStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { Colors, Fonts } from '../../common/constants/constants';
import UseBackButton from '../../common/hooks/UseBackButton';
import NavBar from '../../common/components/NavBar';


const DriverRouteDetailsScreen = () => {
    const {selectedRoute,setSelectedRoute} = useSelectedRouteStore();
    const {setDirectionPoints} = useMapMarkerStore();
    const {goBack} = useStackScreenStore();

    const [expandedId, setExpandedId] = useState(null);

    const onBackPress = () => {
        goBack();
        setDirectionPoints(null);
        setSelectedRoute(null);
    }

    useEffect(()=>{
        const locations = selectedRoute?.stops
    ?.map(stop => ({
      lat: stop?.location[1],
      lon: stop?.location[0],
    }));

    setDirectionPoints({
      locations,
      type: 'car',
    });
    },[selectedRoute])

    const getIcon = index => {
        if (index == 0) return <Ionicons name={'flag'} color={'red'} size={18} />;
        if (index == selectedRoute?.stops.length - 1)
          return <Ionicons name={'flag'} color={'red'} size={18} />;
        return <Ionicons name={'flag'} color={'red'} size={18} />;
      };
    
      const renderItem = useCallback(({item, index}) => {
        const isExpanded = expandedId === index;

        return (
          <View style={styles.stopsItemContainer}>
            <TouchableOpacity
              style={styles.stopsItemCard}
              onPress={() => setExpandedId(isExpanded ? null : index)}
              >
              <View style={styles.markerIcons}>{getIcon(index)}</View>
              <View style={styles.stopInfoContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.stopNameTxt}>{item.name}</Text>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#757575" 
                  />
                </View>
                <Text style={styles.stopAddressTxt}>{item.address}</Text>
                <Text style={styles.stopArrivalTimeTxt}>
                  {<ClockGrey />} {item.arrivalTime}
                </Text>
              </View>
            </TouchableOpacity>
            
            {isExpanded && (
              <View style={styles.expandedContent}>
                {item.passangers.map((passanger,index)=>{
                  return (
                    <View key={passanger?._id} style={styles.passangerContainer}>
                      <FontAwesome name='user-circle-o' size={20} color={Colors.primary} />
                      <View style={styles.passangerRow}>
                        <Text style={styles.detailsTitle}>{passanger?.name}</Text>
                        <Text style={styles.detailText}>{passanger?.email}</Text>
                        <Text style={styles.detailText}>{passanger?.phone}</Text>    
                      </View>
                    </View>
                  )
                })}
                {/* <Text style={styles.detailsTitle}>Additional Details:</Text>
                <Text style={styles.detailText}>Stop Duration: {item.duration || 'N/A'}</Text>
                <Text style={styles.detailText}>Contact: {item.contact || 'N/A'}</Text>
                <Text style={styles.detailText}>Notes: {item.notes || 'N/A'}</Text> */}
              </View>
            )}
          </View>
        );
      }, [expandedId]);

  return (
    <View style={styles.container}>
        <UseBackButton onBackPress={() => onBackPress()}/>
        <NavBar title={selectedRoute?.routeName} withBg onBackPress={() => onBackPress()} />
      {/* <BottomSheet> 
          <FlatList
            data={selectedRoute?.stops}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            initialNumToRender={10}
          />
          
        </BottomSheet> */}
    </View>
  )
}

export default DriverRouteDetailsScreen

const styles = StyleSheet.create({
    container:{
        flex:1
    },
    stopsItemContainer: {
        width: '90%',
        alignSelf: 'center',
        backgroundColor: '#fafafa',
        borderRadius: 6,
        marginVertical: 5,
    },
    stopsItemCard: {
        padding: 10,
        flexDirection: 'row',
        gap: 10,
    },
    stopInfoContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expandedContent: {
        padding: 10,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    detailsTitle: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        color: Colors.black,
    },
    detailText: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: Colors.black,
        marginBottom: 2,
    },
    stopNameTxt: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: '#757575',
    },
    stopAddressTxt: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: '#424242',
        marginVertical: 4,
    },
    stopArrivalTimeTxt: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: '#424242',
    },
    markerIcons: {
        top: 6,
    },
    flatListContent: {
        padding: 10,
    },
    passangerContainer:{
      flexDirection: 'row',
      gap:10,
      alignItems:'center', 
      marginVertical:10
    }
})