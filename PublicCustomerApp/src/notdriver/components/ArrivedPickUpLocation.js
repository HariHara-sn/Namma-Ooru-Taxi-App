import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {Colors, Fonts} from '../../common/constants/constants';
import {useTranslation} from 'react-i18next';
import Bell from '../../notdriver/assets/icons/bell.svg'

const ArrivedPickUpLocation = props => {
  const {
    pickUpAlertLoading,
    isAlertSent,
    onReachedPickupAlert,
    onReachedPickup,
  } = props;

  const {t} = useTranslation();

  return (
    <View style={styles.card}>
      {/* Title */}
      <Text style={styles.title}>
        {t('arrived_at_pickup_location')}
      </Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {t('verify_customer_to_start_trip')}
      </Text>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {/* SECONDARY CTA */}
        <TouchableOpacity
          disabled={isAlertSent || pickUpAlertLoading}
          activeOpacity={0.85}
          onPress={onReachedPickupAlert}
          style={[
            styles.secondaryButton,
            isAlertSent && {opacity: 0.6},
          ]}>
          {pickUpAlertLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View style={{flexDirection:'row',alignItems:'center',gap:6}}>

            <Bell width={20} height={20} />
            <Text style={styles.secondaryButtonText}>
              {t('alert')}
            </Text>
               </View>
          )}
        </TouchableOpacity>

        {/* PRIMARY CTA */}
          <TouchableOpacity
          activeOpacity={0.85}
          onPress={onReachedPickup}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {t('enter_otp')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ArrivedPickUpLocation;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },

  title: {
    fontSize: 18,
    color: Colors.black,
    fontFamily:Fonts.semi_bold
  },

  subtitle: {
    fontSize: 14,
    color: Colors.grey_dark,
    marginTop: 4,
    marginBottom: 16,
    fontFamily:Fonts.regular
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },

  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.periwinkle, // blue / brand color
    justifyContent: 'center',
    alignItems: 'center',
    elevation:5
  },

  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily:Fonts.regular
  },

  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 0.4,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    elevation:5
  },

  secondaryButtonText: {
    color: Colors.black,
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
});