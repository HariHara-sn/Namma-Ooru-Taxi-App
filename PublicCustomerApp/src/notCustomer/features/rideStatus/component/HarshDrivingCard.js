import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Fonts } from '../../../constants/constants';
import { useStackScreenStore } from '../../../store/useStackScreenStore';

const ALL_TYPES = ['harshBreaking', 'harshAcceleration', 'harshCornering', 'overspeeding'];

const hardAccel = require('../../../../common/assets/images/hard_acceleration.webp')
const hardBrake = require('../../../../common/assets/images/hardBreak.webp')
const hardCorner = require('../../../../common/assets/images/hard_corner.webp')
const overSpeed = require('../../../../common/assets/images/over_speed.webp')

const EVENT_TYPES = [
  { key: 'harshBreaking',     label: 'Hard\nBrake',  color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', image: hardBrake },
  { key: 'harshAcceleration', label: 'Hard\nAccel',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', image: hardAccel },
  { key: 'harshCornering',    label: 'Hard\nCorner', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', image: hardCorner },
  { key: 'overspeeding',      label: 'Over\nSpeed',  color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3', image: overSpeed },
];

const HarshDrivingCard = ({ stats, onViewOnMap, showingOnMap, onFilterChange }) => {
  const { setStackScreen } = useStackScreenStore();
  const [selectedTypes, setSelectedTypes] = useState(ALL_TYPES);

  useEffect(() => {
    if (!showingOnMap) {
      setSelectedTypes(ALL_TYPES);
    }
  }, [showingOnMap]);

  const toggleType = (key) => {
    const updated = selectedTypes.includes(key)
      ? selectedTypes.filter(t => t !== key)
      : [...selectedTypes, key];
    setSelectedTypes(updated);
    onFilterChange?.(updated);
  };

  if (!stats) return null;

  return (
    <View style={styles.harshDrivingCard}>
      <View style={styles.statsRow}>
        {EVENT_TYPES.map((type, index) => {
          const value = stats[type.key] ?? 0;
          const isSelected = selectedTypes.includes(type.key);
          const isAlert = type.key === 'overspeeding' && value > 0;
          const Wrapper = showingOnMap ? TouchableOpacity : View;
          return (
            <React.Fragment key={type.key}>
              {index > 0 && !showingOnMap && <View style={styles.statDivider} />}
              <Wrapper
                style={[
                  styles.statItem,
                  showingOnMap && styles.statItemSelectable,
                  showingOnMap && isSelected && { backgroundColor: type.bg, borderColor: type.border },
                  showingOnMap && !isSelected && styles.statItemDeselected,
                ]}
                onPress={() => toggleType(type.key)}
                activeOpacity={0.7}
              >
                {showingOnMap && (
                  <View style={[styles.typeIndicator, { backgroundColor: isSelected ? type.color : '#D1D5DB' }]} />
                )}
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                <View style={[
                  styles.imgCircle,
                  { backgroundColor: isSelected || !showingOnMap ? type.bg : '#F3F4F6' },
                ]}>
                  <Image
                    source={type.image}
                    style={[
                      styles.statImg,
                      showingOnMap && !isSelected && styles.statImgMuted,
                    ]}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[
                  styles.statValue,
                  isAlert && styles.statValueAlert,
                  showingOnMap && !isSelected && styles.statValueMuted,
                ]}>
                  {value}
                </Text>
                  </View>
                <Text style={[
                  styles.statLabel,
                  showingOnMap && !isSelected && styles.statLabelMuted,
                ]}>
                  {type.label}
                </Text>
              </Wrapper>
            </React.Fragment>
          );
        })}
      </View>
      <View style={styles.harshDrivingFooter}>
        <TouchableOpacity
          style={[styles.mapBtn, showingOnMap && styles.mapBtnActive]}
          onPress={onViewOnMap}
          activeOpacity={0.7}>
          <Icon name="map" size={14} color={showingOnMap ? '#fff' : '#15803D'} />
          <Text style={[styles.mapBtnText, showingOnMap && styles.mapBtnTextActive]}>
            {showingOnMap ? 'Hide on Map' : 'View on Map'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.timelineBtn}
          onPress={() => setStackScreen('TripTimelineScreen')}
          activeOpacity={0.7}>
          <Icon name="timeline" size={14} color="#1D4ED8" />
          <Text style={styles.timelineBtnText}>View Timeline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  harshDrivingCard: {
    width: '90%',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 10,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statItemSelectable: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginHorizontal: 2,
  },
  statItemDeselected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.55,
  },
  typeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 1,
  },
  imgCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statImg: {
    width: 18,
    height: 18,
  },
  statImgMuted: {
    opacity: 0.35,
  },
  statValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: '#1E3A8A',
  },
  statValueAlert: {
    color: '#DC2626',
  },
  statValueMuted: {
    color: '#9CA3AF',
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  statLabelMuted: {
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E7FF',
  },
  harshDrivingFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  mapBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#15803D',
  },
  mapBtnActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  mapBtnTextActive: {
    color: '#fff',
  },
  timelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  timelineBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#1D4ED8',
  },
});

export default HarshDrivingCard;
