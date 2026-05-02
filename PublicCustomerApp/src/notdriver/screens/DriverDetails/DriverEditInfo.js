import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import UseBackButton from '../../../common/hooks/UseBackButton';
import NavBar from '../../../common/components/NavBar';
import DriverVehiclesDetails from '../DriverVehicleDetails/DriverVehiclesDetails';
import { Colors } from '../../../common/constants/constants';


const DriverEditInfo = () => {
    const {setStackScreen} = useStackScreenStore();
    const backPress = () => {
        setStackScreen('DriverApprovalScreen') 
    }
  return (
    <View style={styles.screen}>
    <UseBackButton onBackPress={() => backPress()} />
    <NavBar title={'Driver Details Edit'} onBackPress={() => backPress()} />
    <ScrollView>
      <DriverVehiclesDetails isEdit={true}/>
    </ScrollView>
  </View>
  )
}

export default DriverEditInfo

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.white,
    },
})