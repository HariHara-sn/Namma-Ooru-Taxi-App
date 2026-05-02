import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';
import {addLocation} from '../../../../styles/AddLocationStyles';
import {colors} from '../../../../constants/constants';
import {rideType} from '../../../../constants/JsonData';
import { useTranslation } from 'react-i18next'; 

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { firebaselog_ridePlanning } from '../../../../../common/utils/FirebaseAnalytics';

const TripType = props => {
  const {onTripSelect, selectedRide} = props;
  const { t } = useTranslation();
  
  const handleTripSelect = (item) => {
    if (item.disabled) {
      // Show coming soon message or handle disabled state
      return;
    }
    onTripSelect(item);

    firebaselog_ridePlanning('RP_Type(RP_T)', `RP_T:${item.translationKey}`);

    console.log('Selected Trip Type:', item);
  };

  return (
    <View style={addLocation.rideOptionBottom}>
     
      {rideType.map(item => {
        const isDisabled = item.disabled;
        return (
          <TouchableOpacity
            style={isDisabled ? addLocation.tripSelectionBtnDisabled : addLocation.tripSelectionBtn}
            key={item.id}
            onPress={() => handleTripSelect(item)}
            disabled={isDisabled}>
            <View style={{flexDirection: 'row', gap: 15, alignItems: 'center', flex: 1}}>
              {item.icon}
              <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                <Text style={isDisabled ? addLocation.tripSelectionBtnTxtDisabled : addLocation.tripSelectionBtnTxt}>
                  {t(item.translationKey)}
                </Text>
                {item.comingSoon && (
                  <View style={addLocation.comingSoonBadge}>
                    <Text style={addLocation.comingSoonText}>{t('coming_soon')}</Text>
                  </View>
                )}
              </View>
            </View>
            <MaterialCommunityIcons
              name={
                selectedRide?.value === item.value
                  ? 'circle-slice-8'
                  : 'circle-outline'
              }
              color={isDisabled ? colors.grey_dark : colors.black}
              size={20}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

TripType.propTypes = {
  onTripSelect: PropTypes.func.isRequired,
  selectedRide: PropTypes.object,
};

export default TripType;
