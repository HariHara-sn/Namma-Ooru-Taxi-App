import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import useRideVehicleStore from '../../store/useRideVehicleStore';
import { getAvaliableCoupons } from '../../../../API/EndPoints/EndPoints';
import { Fonts } from '../../../../constants/constants';
import useRideBookingInfo from '../../store/useRideBookingInfo';
import { utils } from '../../../../utils/Utils';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdaptiveText from '../../../../components/Common/AdaptiveText';
const CouponContainer = ({ onApply }) => {
  const { t } = useTranslation();
  const [allCoupons, setAllCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedVehicle } = useRideVehicleStore();
  const { couponCode, setCouponCode,regionOfficeCode } = useRideBookingInfo();


  const handleApply = (coupon) => {
    setCouponCode(coupon.code);
    if (onApply) {
      onApply(coupon);
    }
  };

  const handleRemove = () => {
    setCouponCode('');
    if (onApply) {
      onApply(null);
    }
  };

  const fetchCoupons = async () => {
    
    setIsLoading(true);
    const payload = {
      fare: selectedVehicle?.minFare || 0,
      regionCode:regionOfficeCode,
    };
    
    try {
      const response = await getAvaliableCoupons(payload);
      if (response.success) {
        if (response?.coupons?.data?.dynamicCoupons) {
          setAllCoupons(response.coupons.data.dynamicCoupons);
          
        } else {
          setAllCoupons([]);
        }
      } else {
        setAllCoupons([]);
      }
    } catch (e) {
      setAllCoupons([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, [selectedVehicle]);

  const renderDiscount = (item) => {
    if (item.type === 'percentage') {
      return `${item.value}% off${item.maxDiscount ? ` (up to ₹${item.maxDiscount})` : ''}`;
    }
    if (item.type === 'fixed') {
      return `Flat ₹${item.value} off`;
    }
    return '';
  };

  // console.log(allCoupons);

  const renderCoupon = ({ item }) => (
    <View style={styles.couponCard}>
      <View style={styles.couponInfo}>
        <AdaptiveText style={styles.couponCode}>{item.code}</AdaptiveText>
        <AdaptiveText style={styles.couponDesc}>{item.description}</AdaptiveText>
        <AdaptiveText style={styles.couponDiscount}>{renderDiscount(item)}</AdaptiveText>
      </View>
      <View style={styles.couponValidity}>
        {couponCode === item.code ? (
          <View style={styles.appliedRow}>
            <View style={[styles.applyButton, styles.appliedButton, { flexDirection: 'row', alignItems: 'center', paddingRight: 10 }]}>
              <AdaptiveText style={styles.applyButtonText}>{t('coupon_applied')}</AdaptiveText>
              <TouchableOpacity
                onPress={handleRemove}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleApply(item)}
          >
            <AdaptiveText style={styles.applyButtonText}>{t('apply_coupon')}</AdaptiveText>
          </TouchableOpacity>
        )}
        <AdaptiveText style={styles.couponValidityText}>{t('expiring_on')}</AdaptiveText>
        <AdaptiveText style={[styles.couponValidityText, { fontSize: 12 }]}>
          {utils.formatISOToHumanReadable(item.validTo)}
        </AdaptiveText>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdaptiveText style={styles.header}>{t('available_coupons')}</AdaptiveText>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      ) : allCoupons.length === 0 ? (
        <AdaptiveText style={styles.noCouponsText}>{t('no_coupons_available')}</AdaptiveText>
      ) : (
        <FlatList
          data={allCoupons}
          keyExtractor={(item) => item.code}
          renderItem={renderCoupon}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

CouponContainer.propTypes = {
  onApply: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    minHeight: 300,
  },
  header: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 20,
    color: '#222',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  couponValidityText: {
    fontSize: 10,
    color: '#888',
    fontFamily: Fonts.regular,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  couponInfo: {
    flex: 1,
    marginRight: 10,
  },
  couponCode: {
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
    color: '#1A73E8',
    marginBottom: 4,
  },
  couponDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
    fontFamily: Fonts.regular,
  },
  couponDiscount: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 2,
    fontFamily: Fonts.regular,
  },
  couponCondition: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  couponValidity: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  applyButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginBottom: 5,
   
  },
  appliedButton: {
    backgroundColor: '#4CAF50',
  },
  applyButtonText: {
    color: '#fff',
    fontFamily: Fonts.regular,
    fontSize: 15,
  
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  closeButton: {
    marginLeft: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
    marginTop: -2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  noCouponsText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 30,
  },
});

export default CouponContainer;
