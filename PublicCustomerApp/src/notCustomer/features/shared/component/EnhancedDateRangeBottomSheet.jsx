import React from 'react';
import { View, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import PropTypes from 'prop-types';
import AnimatedBottomSheetWrapper from './AnimatedBottomSheetWrapper';
import { colors, Fonts } from '../../../constants/constants';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { useTranslation } from 'react-i18next';

export default function EnhancedDateRangeBottomSheet({
  visible,
  onClose,
  title,
  fromLabel,
  toLabel,
  startDate,
  endDate,
  onPressFrom,
  onPressTo,
  cancelLabel,
  confirmLabel,
  clearLabel,
  onCancel,
  onConfirm,
  onClear,
  selectedStatus,
  onStatusChange,
  isDateRangeEnabled,
  onDateRangeToggle,
  statusOptions = [
    { value: '', label: 'all_status' },
    { value: 'COMPLETED', label: 'completed' },
    // { value: 'DIVERGED', label: 'diverged' },
    { value: 'CANCELLED', label: 'cancelled' }
  ]
}) {
  if (!visible) return null;
  const { t } = useTranslation();
  const startTime = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
  const endTime = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;
  const isSameDay = !!(startTime && endTime) && startTime === endTime;
  const isDateRangeValid = !isDateRangeEnabled || (startTime && endTime && startTime < endTime);
  const isConfirmEnabled = isDateRangeValid;
  
  // Check if any filters are applied
  const hasActiveFilters = selectedStatus !== '' || (isDateRangeEnabled && startDate && endDate);

  React.useEffect(() => {
    if (visible && isDateRangeEnabled && isSameDay) {
      Alert.alert('Invalid date range', 'From and To dates cannot be the same.');
    }
  }, [visible, isDateRangeEnabled, isSameDay]);

  return (
    <AnimatedBottomSheetWrapper onClose={onClose} zIndex={9999} overlay={false}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
        <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black, textAlign: 'center', marginBottom: 16 }} color={colors.black}>{title}</AdaptiveText>
          {/* Status Filter Section */}
          <View style={{ marginBottom: 30, marginTop: 20}}>
          <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black, marginBottom: 12,marginLeft: 8 }} color={colors.black}>{t('status_filter')}</AdaptiveText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onStatusChange(option.value)}
                  style={{
                    borderWidth: 1,
                    borderColor: selectedStatus === option.value ? colors.black : colors.grey_light,
                    borderRadius: 20,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    backgroundColor: selectedStatus === option.value ? colors.black : colors.white,
                  }}
                >
                  <AdaptiveText style={{ 
                    fontSize: 14, 
                    fontFamily: Fonts.medium, 
                    color: selectedStatus === option.value ? colors.white : colors.black 
                  }} color={selectedStatus === option.value ? colors.white : colors.black}>
                    {t(option.label)}
                  </AdaptiveText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Date Range Section */}
        <View style={{ marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black,marginLeft: 8 }} color={colors.black}>{t('date_range')}</AdaptiveText>
              <Switch
                value={isDateRangeEnabled}
                onValueChange={onDateRangeToggle}
                trackColor={{ false: colors.grey_light, true: colors.black }}
                thumbColor={isDateRangeEnabled ? colors.white : colors.grey}
                ios_backgroundColor={colors.grey_light}
              />
            </View>
           
          </View>
                     {isDateRangeEnabled && (
             <View>
               <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                 <View style={{ flex: 1,paddingRight: 8 }}>
                   <AdaptiveText style={{ fontSize: 14, fontFamily: Fonts.medium, color: colors.grey_xxdark, marginBottom: 8,marginLeft: 8 }} color={colors.grey_xxdark}>{fromLabel}</AdaptiveText>
                   <TouchableOpacity onPress={onPressFrom} style={{ borderWidth: 1, borderColor: colors.grey_light, borderRadius: 8, padding: 12, backgroundColor: colors.white }}>
                     <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.regular, color: startDate ? colors.black : colors.grey_xxdark }} color={startDate ? colors.black : colors.grey_xxdark}>
                      {startDate ? new Date(startDate).toDateString() : 'Select Date'}
                     </AdaptiveText>
                   </TouchableOpacity>
                 </View>
                 <View style={{ flex: 1,paddingLeft: 8 }}>
                   <AdaptiveText style={{ fontSize: 14, fontFamily: Fonts.medium, color: colors.grey_xxdark, marginBottom: 8,marginLeft: 8 }} color={colors.grey_xxdark}>{toLabel}</AdaptiveText>
                   <TouchableOpacity onPress={onPressTo} style={{ borderWidth: 1, borderColor: colors.grey_light, borderRadius: 8, padding: 12, backgroundColor: colors.white }}>
                     <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.regular, color: endDate ? colors.black : colors.grey_xxdark }} color={endDate ? colors.black : colors.grey_xxdark}>
                       {endDate ? new Date(endDate).toDateString() : 'Select Date'}
                     </AdaptiveText>
                   
                   </TouchableOpacity>
                 </View>
               </View>
              {/* Invalid date range warning */}
              {isDateRangeEnabled && startTime && endTime && startTime > endTime && (
                 <View style={{ marginTop: 8, paddingHorizontal: 8 }}>
                   <AdaptiveText style={{ fontSize: 12, fontFamily: Fonts.regular, color: '#EF4444', textAlign: 'center' }} color={colors.black}>
                     From date cannot be after To date
                   </AdaptiveText>
                 </View>
               )}
              {isDateRangeEnabled && isSameDay && (
                <View style={{ marginTop: 8, paddingHorizontal: 8 }}>
                  <AdaptiveText style={{ fontSize: 12, fontFamily: Fonts.regular, color: '#EF4444', textAlign: 'center' }} color={colors.black}>
                    From and To dates cannot be the same
                  </AdaptiveText>
                </View>
              )}
             </View>
           )}
        </View>

      

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
         {!hasActiveFilters && <TouchableOpacity onPress={onCancel} style={{ flex: 1, backgroundColor: colors.grey_light, borderRadius: 8, padding: 12, alignItems: 'center' }}>
            <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black }} color={colors.black}>{cancelLabel}</AdaptiveText>
          </TouchableOpacity>}
          
          {hasActiveFilters && (
            <TouchableOpacity onPress={onClear} style={{ flex: 1, backgroundColor: colors.grey_light, borderRadius: 8, padding: 12, alignItems: 'center' }}>
              <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black }} color={colors.black}>{clearLabel}</AdaptiveText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={onConfirm} 
            disabled={!isConfirmEnabled}
            style={{ 
              flex: hasActiveFilters ? 1 : 2, 
              backgroundColor: isConfirmEnabled ? colors.black : colors.black+80, 
              borderRadius: 8, 
              padding: 12, 
              alignItems: 'center',
              opacity: isConfirmEnabled ? 1 : 0.6
            }}
          >
            <AdaptiveText style={{ fontSize: 16, fontFamily: Fonts.medium, color: isConfirmEnabled ? colors.white : colors.white+90 }} color={colors.white}>{confirmLabel}</AdaptiveText>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedBottomSheetWrapper>
  );
}

EnhancedDateRangeBottomSheet.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  fromLabel: PropTypes.string,
  toLabel: PropTypes.string,
  startDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.number, PropTypes.string, PropTypes.oneOf([null])]),
  endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.number, PropTypes.string, PropTypes.oneOf([null])]),
  onPressFrom: PropTypes.func.isRequired,
  onPressTo: PropTypes.func.isRequired,
  cancelLabel: PropTypes.string,
  confirmLabel: PropTypes.string,
  clearLabel: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  selectedStatus: PropTypes.string,
  onStatusChange: PropTypes.func.isRequired,
  isDateRangeEnabled: PropTypes.bool,
  onDateRangeToggle: PropTypes.func.isRequired,
  statusOptions: PropTypes.array,
};
