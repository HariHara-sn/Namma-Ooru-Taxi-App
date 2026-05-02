import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import UseBackButton from '../../common/hooks/UseBackButton';
import NavBar from '../../common/components/NavBar';
import SupportScreen from './SupportScreen';


const DriverHelpSupport = () => {
    const {goBack} = useStackScreenStore();
    const onBackPress = () => { goBack(); }

  return (
    <View style={{flex:1, backgroundColor:'white'}}>
        <UseBackButton onBackPress={onBackPress}/>
        <NavBar title={'Help & Support'} onBackPress={onBackPress}/>
        <SupportScreen showBg={true}/>
    </View>
  )
}

export default DriverHelpSupport
