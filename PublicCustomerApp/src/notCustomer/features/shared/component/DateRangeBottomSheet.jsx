import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import AnimatedBottomSheetWrapper from './AnimatedBottomSheetWrapper';
import { colors, Fonts } from '../../../constants/constants';

export default function DateRangeBottomSheet({
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
  onCancel,
  onConfirm,
}) {
  if (!visible) return null;

  return (
    <AnimatedBottomSheetWrapper onClose={onClose} zIndex={100000}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
        <Text style={{ fontSize: 18, fontFamily: Fonts.medium, color: colors.black, textAlign: 'center', marginBottom: 16 }}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingHorizontal: 0 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: Fonts.medium, color: colors.black, marginBottom: 8 }}>{fromLabel}</Text>
            <TouchableOpacity onPress={onPressFrom} style={{ borderWidth: 1, borderColor: colors.grey_light, borderRadius: 8, padding: 12, backgroundColor: colors.white }}>
              <Text style={{ fontSize: 16, fontFamily: Fonts.regular, color: colors.black }}>{new Date(startDate).toDateString()}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black }}>{toLabel}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: Fonts.medium, color: colors.black, marginBottom: 8 }}>{toLabel}</Text>
            <TouchableOpacity onPress={onPressTo} style={{ borderWidth: 1, borderColor: colors.grey_light, borderRadius: 8, padding: 12, backgroundColor: colors.white }}>
              <Text style={{ fontSize: 16, fontFamily: Fonts.regular, color: colors.black }}>{new Date(endDate).toDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onCancel} style={{ flex: 1, backgroundColor: colors.grey_light, borderRadius: 8, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.black }}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={{ flex: 1, backgroundColor: colors.black, borderRadius: 8, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: Fonts.medium, color: colors.white }}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedBottomSheetWrapper>
  );
}

DateRangeBottomSheet.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  fromLabel: PropTypes.string,
  toLabel: PropTypes.string,
  startDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.number, PropTypes.string]).isRequired,
  endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.number, PropTypes.string]).isRequired,
  onPressFrom: PropTypes.func.isRequired,
  onPressTo: PropTypes.func.isRequired,
  cancelLabel: PropTypes.string,
  confirmLabel: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
}; 