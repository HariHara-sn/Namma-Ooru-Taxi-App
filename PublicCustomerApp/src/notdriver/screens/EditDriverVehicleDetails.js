import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import UseBackButton from '../../common/hooks/UseBackButton';
import NavBar from '../../common/components/NavBar';
import DriverVehiclesDetails from './DriverVehicleDetails/DriverVehiclesDetails';
import { Colors } from '../../common/constants/constants';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';


const EditDriverVehicleDetails = () => {
  const {goBack} = useStackScreenStore();
  return (
    <View style={styles.screen}>
      <UseBackButton onBackPress={() => goBack()} />
      <NavBar title={'Driver Details Edit'} onBackPress={() => goBack()} />
      <ScrollView>
        <DriverVehiclesDetails isEdit={true}/>
      </ScrollView>
    </View>
  );
};

export default EditDriverVehicleDetails;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
