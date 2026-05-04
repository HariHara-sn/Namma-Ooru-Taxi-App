import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { colors, Fonts } from '../../../constants/constants';
import useLocationStore from '../../../store/useLocationStore';

const MOCK_DESTINATIONS = [
  { id: '1', name: 'Nexus Mall', address: 'Hosur Rd, Chikku Lakshmaiah Layout, Korama...', icon: 'time-outline' },
  { id: '2', name: 'Phoenix Marketcity', address: 'Whitefield Main Rd, Devasandra Industrial Est...', icon: 'star-outline' },
  { id: '3', name: 'Coimbatore International Airport', address: 'Airport Road, Peelamedu, Coimbatore', icon: 'airplane-outline' },
  { id: '4', name: 'Gandhipuram Central Bus Stand', address: 'Cross Cut Rd, Gandhipuram, Coimbatore', icon: 'bus-outline' },
];

const getLocationLabel = (locationName, fallback = 'Current Location') => {
  if (!locationName) return fallback;
  if (typeof locationName === 'string') return locationName;
  return (
    locationName.placeName ||
    locationName.name ||
    (Array.isArray(locationName.address) ? locationName.address.filter(Boolean).join(', ') : locationName.address) ||
    fallback
  );
};

const HireDriversLocationSearchScreen = ({ params }) => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  const { setSelectedInput, currentLocationName, directions } = useLocationStore();
  const [source, setSource] = useState(
    directions[0]?.locationName || getLocationLabel(currentLocationName, t('current_location', 'Current Location')),
  );
  const [destination, setDestination] = useState('');
  const [activeInput, setActiveInput] = useState('End');
  const destinationInputRef = useRef(null);
  
  const tripType = params?.tripType || 'One Way';

  useEffect(() => {
    // Auto-focus the destination input when screen opens
    if (destinationInputRef.current) {
      setTimeout(() => {
        destinationInputRef.current.focus();
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (directions[0]?.locationName) {
      setSource(directions[0].locationName);
      return;
    }
    setSource(getLocationLabel(currentLocationName, t('current_location', 'Current Location')));
  }, [currentLocationName, directions, t]);

  const handleSelectLocation = (item) => {
    // In a real app, we would update a store or pass back params
    setDestination(item.name);
    goBack();
  };

  const onLocateOnMap = () => {
    setSelectedInput(activeInput);
    goBack();
  };

  const clearDestination = () => {
    setDestination('');
    destinationInputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1f222b" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t(tripType.toLowerCase().replace(' ', '_'), tripType)}</Text>
      </View>

      <View style={styles.container}>
        {/* Search Card */}
        <View style={styles.searchCard}>
          <View style={styles.locationContainer}>
            {/* Icons Column */}
            <View style={styles.iconColumn}>
              <TouchableOpacity onPress={() => setActiveInput('Start')}>
                <View style={[
                  styles.dot,
                  styles.touchableDot,
                  { backgroundColor: colors.green || '#4CAF50' },
                  activeInput === 'Start' && styles.activeDot,
                ]} />
              </TouchableOpacity>
              <View style={styles.dottedLine} />
              <TouchableOpacity onPress={() => setActiveInput('End')}>
                <View style={[
                  styles.dot,
                  styles.touchableDot,
                  { backgroundColor: colors.red || '#F44336' },
                  activeInput === 'End' && styles.activeDot,
                ]} />
              </TouchableOpacity>
            </View>

            {/* Inputs Column */}
            <View style={styles.inputColumn}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={source}
                  onChangeText={setSource}
                  onFocus={() => setActiveInput('Start')}
                  placeholder={t('pickup_location', 'Pickup location')}
                  placeholderTextColor="#999"
                />
                {source.length > 0 && (
                  <TouchableOpacity onPress={() => setSource('')}>
                    <Ionicons name="close" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.separator} />

              <View style={styles.inputWrapper}>
                <TextInput
                  ref={destinationInputRef}
                  style={styles.input}
                  value={destination}
                  onChangeText={setDestination}
                  onFocus={() => setActiveInput('End')}
                  placeholder={t('enter_drop_location', 'Enter drop location')}
                  placeholderTextColor="#999"
                />
                {destination.length > 0 && (
                  <TouchableOpacity onPress={clearDestination}>
                    <Ionicons name="close" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Suggestions List */}
        <FlatList
          data={MOCK_DESTINATIONS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectLocation(item)}>
              <View style={styles.suggestionIconWrapper}>
                <Ionicons name={item.icon} size={22} color="#666" />
              </View>
              <View style={styles.suggestionTextWrapper}>
                <Text style={styles.suggestionName}>{item.name}</Text>
                <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Bottom Button */}
        <TouchableOpacity style={styles.mapButton} onPress={onLocateOnMap}>
          <Ionicons name="location" size={20} color={colors.red || '#F44336'} />
          <Text style={styles.mapButtonText}>
            {activeInput === 'Start'
              ? t('locate_pickup_on_map', 'Locate Pickup On Map')
              : t('locate_drop_on_map', 'Locate Drop On Map')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1f222b',
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#1f222b',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Offset for back button to center title
  },
  searchCard: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 12,
  },
  locationContainer: {
    flexDirection: 'row',
  },
  iconColumn: {
    alignItems: 'center',
    width: 24,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  touchableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    borderWidth: 2,
    borderColor: colors.black,
  },
  dottedLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  inputColumn: {
    flex: 1,
    marginLeft: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: colors.black,
    padding: 0,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIconWrapper: {
    width: 40,
    alignItems: 'center',
  },
  suggestionTextWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionName: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  suggestionAddress: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: colors.white,
  },
  mapButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
    marginLeft: 8,
  },
});

HireDriversLocationSearchScreen.propTypes = {
  params: PropTypes.shape({
    tripType: PropTypes.string,
  }),
};

export default HireDriversLocationSearchScreen;
