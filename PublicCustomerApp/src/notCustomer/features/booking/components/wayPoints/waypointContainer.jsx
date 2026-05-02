import React, { useEffect, useMemo, useCallback,useState, act } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import PropTypes from 'prop-types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SkeletonLoader from '../../../../components/Loaders/SkeletonLoader';
import LocationTypes from '../../types/LocationTypes.json';
import { useStackScreenStore } from '../../../../store/useStackScreenStore';
import useWayPointReorderStore from '../../store/useWayPointReorderStore';
import { utils } from '../../../../utils/Utils';
import WaitingTimeIconContainer from './WaitingTimeIconContainer';
import WaitingTimeModal from './WaitingTimeModal';
import { Fonts } from '../../../../constants/constants';
import  FontAwesome  from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import  useConfigStore  from '../../../../store/useConfigStore';
import useCurrentRideInfoStore from '../../../rideStatus/store/useCurrentRideInfoStore';
const ITEM_HEIGHT = 50;

const WaypointContainer = ({setEnableConfirmButton,editedRoutecheckText,fromDriverArrival=false}) => {
  const { t } = useTranslation();
  const { appConfig } = useConfigStore();
    const {tripStatus} = useCurrentRideInfoStore();

  console.log("appConfig.TOTAL_STOPS_ALLOWED",appConfig.TOTAL_STOPS_ALLOWED+2)
  

  // const [data, setData] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);
  const { setStackScreen,goBack } = useStackScreenStore();
  const { 
    reOrderWaypoints, 
    setReOrderWaypoints, 
    setLastAddStopIndex,
    lastAddStopIndex,
    isLoading,
    currentEditWaitWaypoint,
    setCurrentEditWaitWaypoint,
    isEditwaitingTime,
    setIsEditwaitingTime,
    reachedStops
  } = useWayPointReorderStore();
  // const [lastAddStopIndex, setLastAddStopIndex] = useState(waypoints.length-1);
  useEffect(() => {
    if (reOrderWaypoints.length > 0) {
      if(reOrderWaypoints.length == 1 && !reachedStops.length > 0){
        setLastAddStopIndex(reOrderWaypoints.length);
      }else{
        setLastAddStopIndex(reOrderWaypoints.length-1);
      }
    }

    const editedRoutecheckTextcurrent = reOrderWaypoints.map((item)=>{
      return `${item.latitude},${item.longitude},${item.waitingTime}`
    }).join(",")
    
    if(editedRoutecheckText !== editedRoutecheckTextcurrent){
      setEnableConfirmButton(true)
    }else{
      setEnableConfirmButton(false)
    }
    if(!reachedStops?.length && reOrderWaypoints.length ==1){
      setEnableConfirmButton(false)
    }
    if(reachedStops?.length && reOrderWaypoints.length ==0){
      setEnableConfirmButton(false)
    }
    
  }, [reOrderWaypoints]);


 
  


  const finalData = useMemo(() => {
    if (reOrderWaypoints.length === 0 && !reachedStops?.length) return [];
    
    const addStopItem = { type: 'add-stop', key: 'add-stop', id: 'add-stop' };
  
    if (reOrderWaypoints.length+reachedStops.length < appConfig.TOTAL_STOPS_ALLOWED+2) {
      const newData = [...reOrderWaypoints];
      if (!newData.find(d => d.id === 'add-stop')) {
        newData.splice(lastAddStopIndex, 0, addStopItem);
      }
      return newData;
    }

    

      return reOrderWaypoints;
  }, [reOrderWaypoints, lastAddStopIndex]);

  const handleReorder = useCallback(({ data: reorderedData,from,to }) => {
   
    
    // Process the reordered data immediately without delay
    const lastAddStopIndex = reorderedData.findIndex(item => item.type === 'add-stop');
    const filteredData = reorderedData.filter(item => item.type !== 'add-stop');
    
    if (filteredData.length > 0) {
      const processedData = filteredData.map((item,index)=>{
        return {
          ...item,
          type: index === 0 ? LocationTypes.START_LOCATION :LocationTypes.WAYPOINT_LOCATION
        }
      })

      // Use React's automatic batching for smoother updates
      setReOrderWaypoints([...processedData]);
      
      setLastAddStopIndex(lastAddStopIndex);
    }
  }, [reOrderWaypoints]);

  const handleAddWaypoint = (waypointItem,waypointIndex) => {

   
    // Map separately first
    const currentData = [...reOrderWaypoints];
    const currentFinalData = [...currentData];
    
    if (currentData.length < appConfig.TOTAL_STOPS_ALLOWED+2) {
      const addStopItem = { type: 'add-stop', key: 'add-stop', id: 'add-stop' };
      if (!currentFinalData.find(d => d.id === 'add-stop')) {
        currentFinalData.splice(lastAddStopIndex, 0, addStopItem);
      }
    }


  
 
    
    const AddStopIndex = currentFinalData.findIndex(item => item.type === 'add-stop');
    const updatedData = [...currentData];
    updatedData.splice(AddStopIndex, 0, waypointItem);


    
    // Transform the updated data with proper types
    const transformedData = updatedData.map((item, index) => ({
      ...item,
      id: item.id || `waypoint-${index}-${Date.now()}`,
      type: index === 0 ? LocationTypes.START_LOCATION :LocationTypes.WAYPOINT_LOCATION
    }));

    if((waypointIndex != 0 || ( reachedStops.length > 0 && waypointIndex == 0 ))  && waypointIndex != finalData.length-1){
   
      setCurrentEditWaitWaypoint({index:waypointIndex,item:transformedData[waypointIndex]})
      setIsEditwaitingTime(true)
    }
    
    // Set into store after mapping
    setLastAddStopIndex(AddStopIndex + 1);
    setReOrderWaypoints(transformedData);
  }
  ;

  const handleRemoveWaypoint = useCallback((index) => {
    const filteredData = reOrderWaypoints.filter((_, i) => i !== index);
    
    // Transform the filtered data with proper types
    const transformedData = filteredData.map((item, index) => ({
      ...item,
      id: item.id || `waypoint-${index}-${Date.now()}`,
      type: index === 0 ? LocationTypes.START_LOCATION :  LocationTypes.WAYPOINT_LOCATION
    }));
    
    setReOrderWaypoints(transformedData);
  }, [reOrderWaypoints]);


  const onSearchClickResultCallback=(item,searchType,index)=>{

    
    handleAddWaypoint(item,index)
    goBack()
    
  }


  const onClickAddWayPoint=(index)=>{
    const actualindex = index + reachedStops.length 
    let finalindex = finalData.length-1
    if(lastAddStopIndex <= index){
      finalindex = finalindex+reachedStops.length
    }

    console.log("index",index)
    console.log("lastAddStopIndex",lastAddStopIndex)
    console.log("actualindex",actualindex)
    console.log("finalindex",finalindex)
    
      let buttonLabel = actualindex == 0 ? t('button_locate_pickup_location') : actualindex == finalindex ? t('button_locate_drop_location') : t('button_locate_stop',{stop:actualindex})
    let label = actualindex == 0 ? t('locate_pickup_location') :actualindex == finalindex ? t('locate_drop_location') : t('locate_stop',{stop:actualindex})
    if(!reachedStops?.length && reOrderWaypoints.length == 1){
      label=t('locate_drop_location')
      buttonLabel = t('button_locate_drop_location')
    }
      // setStackScreen("SearchScreen",{
      //   onSearchClick:onSearchClickResultCallback,
      //   index:index,
      //   searchType:LocationTypes.WAYPOINT_LOCATION,
      //   fromaddWayPoint:index != 0 && index != finalData.length-1 ? true : false,
      //   getwaitingTime:index !== 0 && index !== finalData.length-1 ? true : false,
      //   label:label,
        
      // })

      const props ={
      onPickLocationResultCallback:onSearchClickResultCallback,
      index:index,
      locationType:LocationTypes.WAYPOINT_LOCATION,
      label:label,
      isFromRidePointsSelection:true,
      searchBar:true,
      buttonLabel: buttonLabel,
      focusSearchOnMount:true,
      isFromwaypointEdit:true
    }


     setStackScreen('PickLocationScreen', props)

      
    }
    

  const handleaddwaitingTime =(index,item)=>{
      setCurrentEditWaitWaypoint({index,item})
      setIsEditwaitingTime(true)
  }

  const handleSavewaitingTime = (index, updatedItem) => {
    const updatedWaypoints = [...reOrderWaypoints];
    updatedWaypoints[index] = updatedItem;
    setReOrderWaypoints(updatedWaypoints);
    setIsEditwaitingTime(false);
    setCurrentEditWaitWaypoint(null);
  }

  const handleClosewaitingTimeModal = () => {
    setIsEditwaitingTime(false);
    setCurrentEditWaitWaypoint(null);
  }

  const handleReplaceWaypoint = (item,index) => {
  
    const updatedWaypoints = [...reOrderWaypoints];
    console.log("addIndex",lastAddStopIndex)
    const indexToReplace = index>lastAddStopIndex?index-1:index;
    updatedWaypoints[indexToReplace] = item;
    setReOrderWaypoints(updatedWaypoints);
     if((index != 0 || ( reachedStops.length > 0 && index == 0 ))  && index != finalData.length-1){
    setCurrentEditWaitWaypoint({index:index,item:item})
    setIsEditwaitingTime(true)
     }
    
  }

  const onSearchReplaceWaypointCallback = (item,searchType,index) => {
    console.log("item",item)
    console.log("index",index)
  
    handleReplaceWaypoint(item,index)
    goBack()
  }

  const handleWaypointPress = (index) => {
    let dataIndex = index
    const actualindex = index + reachedStops.length
    // let finalindex = finalData.length-2
    // if(lastAddStopIndex < index){
    //   finalindex = reachedStops.length-1
    // }

    const totalIndex = finalData.length + reachedStops.length - 1
    
    const currentItemTotalIndex = finalData.length - 1 

    const isLastPoint = index == currentItemTotalIndex
    
   

   
    
    let label = actualindex == 0 ? t('locate_pickup_location') : isLastPoint ? t('locate_drop_location') : t('locate_stop',{stop:actualindex})
    let buttonLabel = actualindex == 0 ? t('button_locate_pickup_location') : isLastPoint ? t('button_locate_drop_location') : t('button_locate_stop',{stop:actualindex})
    // setStackScreen("SearchScreen",{
    //   onSearchClick:onSearchReplaceWaypointCallback,
    //   index:index,
    //   searchType:LocationTypes.WAYPOINT_LOCATION,
    //   label:label
    // })
     if(dataIndex == 0 && tripStatus == "ACCEPTED"){
     Alert.alert(t('warning'), t('cannot_change_pickup_location_driver_assigned'));
     return
   }
    console.log(dataIndex,'dataIndex')
    console.log(label,'label')
    const props ={
      onPickLocationResultCallback:onSearchReplaceWaypointCallback,
      index:index,
      locationType:LocationTypes.WAYPOINT_LOCATION,
      label:label,
      buttonLabel: buttonLabel,
      searchBar:true,
      focusSearchOnMount:true, 
      isFromwaypointEdit:true
    }
   if(dataIndex == 0 && tripStatus == "ACCEPTED"){
     props.limitRadius=1
   }
    if(finalData[dataIndex]){
      
      props.defaultLocation = finalData[dataIndex]
    }
    setStackScreen('PickLocationScreen', props)
  }

  const renderItem = useCallback(({ item, drag, isActive ,isReached}) => {
    const index = finalData.findIndex(i => i === item);
    
    if (item.type === 'add-stop') {
      return (
        <View style={[styles.row]}>
          <TouchableOpacity 
            style={styles.draggableArea}
            onPress={()=>isReached ? null : onClickAddWayPoint(index)}
            onLongPress={drag}
            delayLongPress={100}
          >
            <View style={[styles.AddressContainer,isActive && styles.draggingItem]}>
            <View style={styles.labelCol}>
              <Text style={styles.addLabel}>{index == 0 && !reachedStops.length > 0 ? "Add a Pickup Location" :index == finalData.length-1 ? "Add a Drop Location" : "Add a Stop"}</Text>
            </View>

            <View style={styles.actionCol}>
          
              <MaterialIcons name="drag-handle" size={24} color="black" />
            </View>
            </View>
            <View style={styles.actionBtn}>
            {reOrderWaypoints.length > 2 && <Icon name="close" size={24} color="transparent" />}
               
            </View>
          </TouchableOpacity>
         
        </View>
      );
    }

    const isWaypoint = item.type === LocationTypes.WAYPOINT_LOCATION;
    
    const actualIndex = reOrderWaypoints.findIndex(dataItem => 
      dataItem.name === item.name && 
      dataItem.address === item.address
    );

    const isLastWaypoint = index === finalData.length - 1;
    const isStartLocation =  index==0

    const isOngoingTrip = reachedStops.length > 0;
    
    return (
      <View style={[styles.row]}>
        <TouchableOpacity
          style={styles.draggableArea}
          onLongPress={drag}
          delayLongPress={100}
          onPress={
          isReached ? null : ()=>handleWaypointPress(index)
          }
        >
          <View style={[styles.AddressContainer,isActive && styles.draggingItem,isReached && {backgroundColor:"grey"}]}>
          <View style={styles.labelCol}>
            <Text style={[styles.labelText,isReached && {color:"#ededed"}]} numberOfLines={1}>
           {utils.formatAddressName(item)}
            </Text>
           
           
          </View>
          

        { !isReached && <View style={styles.actionCol}>
          {(((isWaypoint && !isLastWaypoint) ||  (!item?.isReached && !isLastWaypoint && !isStartLocation && !reachedStops.length > 0) || (reachedStops.length > 0 && !isLastWaypoint)) && ((reachedStops.length > 0 && reOrderWaypoints.length > 1)|| (!isOngoingTrip && (reOrderWaypoints.length > 2)))) && <WaitingTimeIconContainer onPress={() => handleaddwaitingTime(actualIndex, item)} value={item.waitingTime}/>}
            <MaterialIcons name="drag-handle" size={24} color="black" />
          </View>
  }
          </View>
          {((isWaypoint && !isLastWaypoint && !isStartLocation) || (!item?.isReached && !isLastWaypoint && !isStartLocation && !reachedStops.length > 0) || (reachedStops.length>0 && !isLastWaypoint && isStartLocation) || (reachedStops.length > 0 && isStartLocation && reOrderWaypoints.length > 1) || (reachedStops.length > 0 && !isLastWaypoint && !isReached && reOrderWaypoints.length > 1))  ?(
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleRemoveWaypoint(actualIndex)} 
              >
                 <Icon name="close" size={24} color="black" />
              </TouchableOpacity>
            ):
            <View style={styles.actionBtn}>
              {reOrderWaypoints.length > 2 && <Icon name="close" size={24} color="transparent" />}
               
            </View>
            }
        </TouchableOpacity>
      </View>
    );
  }, [reOrderWaypoints, handleAddWaypoint, handleRemoveWaypoint, handleaddwaitingTime]);

  const renderSkeletonLoader = () => {
    const skeletonItems = Array.from({ length: Math.max(2, 3) }, (_, index) => index);
    
    return (
      <View style={styles.container}>
        <View>
          <View style={styles.iconContainer}>
            {skeletonItems.map((_, index) => (
              <View key={index} style={styles.iconItemContainer}>
                <View style={[styles.line, index === 0 && { borderColor: 'transparent', borderWidth: 1 }]} />
                <View style={styles.iconItem}>
                  <SkeletonLoader width={25} height={25} borderRadius={15} />
                </View>
                <View style={[styles.line, index === skeletonItems.length - 1 && { borderColor: 'transparent' }]} />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.listContainer}>
          {skeletonItems.map((_, index) => (
            <View key={index} style={styles.row}>
              <View style={styles.draggableArea}>
                <View style={styles.AddressContainer}>
                  <View style={styles.labelCol}>
                    <SkeletonLoader width="80%" height={16} borderRadius={4} />
                  </View>
                  <View style={styles.actionCol}>
                    <SkeletonLoader width={24} height={24} borderRadius={4} />
                  </View>
                </View>
                <View style={styles.actionBtn}>
                  <SkeletonLoader width={20} height={20} borderRadius={10} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderIcon = (data) => {
    return (
      <View style={styles.iconContainer}>
        {data.map((item, index) => {
          return (
            <View key={index} style={styles.iconItemContainer}>
              <View style={[styles.line, index == 0 && { borderColor: 'transparent', borderWidth: 1 }]} />
              {item?.isReached? <View style={[styles.iconItem, {backgroundColor: "#4caf50"}]}>
                  <FontAwesome name="check" size={15} color="white" />
                </View>:index == 0 ?
                <View style={[styles.iconItem, {backgroundColor: "#4caf50"+"30"}]}>
                  <View style={styles.iconSubItem} />
                </View>
                :index == data.length-1 ?
                <View style={[styles.iconItem, { backgroundColor: "#ff5151"+"30" }]} >
                  <View style={[styles.iconSubItem, { backgroundColor: "#ff5151" }]} />
                </View>
                :
                <View style={styles.iconItem}>
                  <Text style={styles.iconText}>{index}</Text>
                </View>
              }
              <View style={[styles.line, index == data.length - 1 && { borderColor: 'transparent' }]} />
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return renderSkeletonLoader();
  }

  return (
    <View style={styles.container}>
      <View>
        {renderIcon([...reachedStops,...finalData])}
      </View>
      <View style={styles.listContainer}>
        {reachedStops.length > 0 &&  reachedStops.map((item,index)=>{
          return(
            renderItem({item,index,isReached:true})
          )
        })}
        <DraggableFlatList
          data={finalData}
          keyExtractor={(item, index) => {
            if (item.id) return item.id.toString();
            if (item.key) return item.key.toString();
            if (item.type === 'add-stop') return 'add-stop';
            // Use a combination of properties to create a unique key
            return `${item.name}-${item.address}-${index}`;
          }}
          renderItem={renderItem}
           
          onDragEnd={handleReorder}
          scrollEnabled={true}
          dragItemOverflow={true}
          contentContainerStyle={styles.listContent}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          bounces={true}
          // Add these props for smoother animations
          autoscrollSpeed={100}
          autoscrollThreshold={30}
          activationDistance={0}
         
        />
      </View>

      {/* Wait Time Modal */}
      <WaitingTimeModal
        visible={isEditwaitingTime}
        onClose={handleClosewaitingTimeModal}
        onSave={handleSavewaitingTime}
        waypointData={currentEditWaitWaypoint}
      />
    </View>
  );
};

WaypointContainer.propTypes = {
  waypoints: PropTypes.array.isRequired,
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius:20,

  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
   
    height: ITEM_HEIGHT,
    
    
  },
  draggingItem: {
    opacity: 0.6,
    backgroundColor: '#f6f6f6',
    
  },
  iconCol: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draggableArea: {
    
    flexDirection: 'row',
    marginVertical: 0,
 
   
  
    
  },
  AddressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor:"#f2f2f2",
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 0,
    minHeight:40
  },
  roundLocation: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2ecc40',
  },
  numberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  labelCol: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  labelText: {
    fontSize: 13,
    color: '#222',
    fontFamily: Fonts.medium,
  },
  addressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#888',
    fontSize: 25,
    fontWeight: 'bold',
  },
  dragText: {
    color: '#bbb',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  addLabel: {
    fontSize: 13,
    color: '#888',
    fontFamily: Fonts.medium,
    marginLeft: 2,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
   
    flexGrow: 1,
  },
  iconContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconItemContainer: {
    display: 'flex',
    minHeight: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    
    
  },
  iconItem: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSubItem: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#4caf50',
  },
  iconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  line: {
    width: 1,
    flex: 1,
    borderLeftWidth:1,
    borderStyle:"dashed",
    borderColor:"grey"
  },
  waitingTimeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});

export default WaypointContainer;