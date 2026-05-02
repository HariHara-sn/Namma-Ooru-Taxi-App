import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {Colors, Fonts} from '../../common/constants/constants';
import SosIcon from '../../common/assets/icons/sos_icon.svg';

const ModalFooter = props => {
  const {setCancelRideModalVisible, activeTripData} = props;
  const {t} = useTranslation();

  const callEmergency = async () => {
    await Linking.openURL(`tel:112`);
  };

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity style={styles.sosBtn} onPress={() => callEmergency()}>
        <View style={{top: 3}}>
          <SosIcon width={34} height={34} />
        </View>
        <Text style={styles.sosBtnTxt}>SOS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelTripBtn}
        onPress={() => setCancelRideModalVisible(true)}>
        <Text style={styles.cancelTripBtnTxt}>
          {activeTripData?.[0]?.status === 'PICKEDUP'
            ? t('end_trip')
            : t('cancel_trip')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ModalFooter;

const styles = StyleSheet.create({
  footerContainer: {
    width: '92%',
    backgroundColor: Colors.white,
    elevation: 5,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  cancelTripBtn: {
    width: '40%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#b74645',
    backgroundColor: '#fff',
    elevation: 2,
  },
  cancelTripBtnTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#b74645',
  },
  sosBtn: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    elevation: 4,
    flexDirection: 'row',
    width: '25%',
    marginVertical: 10,
    height: 40,
  },
  sosBtnTxt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#b74645',
  },
});
