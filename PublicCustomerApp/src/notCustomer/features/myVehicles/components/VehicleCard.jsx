import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../constants/constants';
import { VEHICLE_TYPE_OPTIONS, VEHICLE_TYPE_ICON } from '../constants/vehicleData';
import styles from '../styles/vehicleStyles';

const VehicleCard = ({ vehicle, onEdit, onDelete }) => {
  const iconName = VEHICLE_TYPE_ICON[vehicle.type] || 'car-outline';
  const typeLabel =
    VEHICLE_TYPE_OPTIONS.find((o) => o.value === vehicle.type)?.label || vehicle.type || '';
  const meta = [typeLabel, vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <Ionicons name={iconName} size={28} color={colors.black} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardRegNo}>{vehicle.regNo}</Text>
        {!!meta && <Text style={styles.cardMeta}>{meta}</Text>}
        {vehicle.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.green} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => onEdit(vehicle)} style={styles.cardActionBtn} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color={colors.black} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(vehicle)} style={styles.cardActionBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={colors.danger_red} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VehicleCard;
