import {View, TouchableOpacity } from 'react-native';
import React from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import UseBackButton from '../hooks/UseBackButton';
import { ReportsScreenStyles } from '../styles/ReportsScreenStyles';

const BottomSheetPopup = ({children, onClose, closBtn, bgTransparent=false, driverStyles=null}) => {
  const _driver = {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  }
  const _driverStyles = driverStyles ? _driver : ReportsScreenStyles.modalContainer;
  return (
    <View
        style={[
          ReportsScreenStyles.modalView,
          bgTransparent ? {backgroundColor: 'transparent'} : {}
        ]}>
          <UseBackButton onBackPress={onClose} />
        <View style={[_driverStyles]}>
          {
            children
          }
        </View>
      </View>
  )
}

export default BottomSheetPopup