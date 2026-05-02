import { StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Feather from 'react-native-vector-icons/Feather';
import useDriverStatusStore from '../../store/useDriverStatusStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { Colors, Fonts } from '../../../common/constants/constants';
import { height } from '../../../common/utils/scalingutils';

const UpComingTrips = (props) => {
    const {onLayout} = props;
    const {upComingTrips} = useDriverStatusStore()
    const {setStackScreen} = useStackScreenStore();

    const layOutChange = (event) => {
        const {width, height} = event.nativeEvent.layout;
        onLayout(width, height);
    }

    if (!upComingTrips || upComingTrips.length === 0){
        return <></>
    }

  return (
    <View style={styles.container} onLayout={layOutChange}>
     <TouchableOpacity style={styles.upComingTrips} onPress={()=>setStackScreen('UpComingTripsList')}>
     <View style={{flexDirection:'row', gap:10}}>
         {/* <Schedulecalendar width={30} height={30}/> */}
         <Text style={styles.upComingTripsTxt}>UpComing Trips</Text>
     </View>
     <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
     <Text style={styles.upComingTripsLength}>{upComingTrips?.length}</Text>
     <Feather name="arrow-right" color={Colors.periwinkle} size={20}/>
     </View>
     </TouchableOpacity>
    </View>
  )
}

export default UpComingTrips

const styles = StyleSheet.create({
    container:{
        position:'absolute',
        bottom:height * 0.09,
        backgroundColor:'white',
        width:'98%',
        // borderTopLeftRadius:20,
        // borderTopRightRadius:20,
        padding:24,
        shadowColor: '#000',
        alignSelf:'center',
        borderRadius:10
    },
    upComingTrips:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center'
    },
    upComingTripsTxt:{
        fontSize:20,
        fontFamily:Fonts.semi_bold,
        color:Colors.black,
    },
    upComingTripsLength:{
        fontSize:20,
        fontFamily:Fonts.medium,
        color:Colors.white,
        backgroundColor:Colors.periwinkle,
        borderRadius:50,
        height:40,
        width:40,
        alignItems:'center',
        justifyContent:'center',
        textAlign:'center',
        textAlignVertical:'center',
     
    }
})