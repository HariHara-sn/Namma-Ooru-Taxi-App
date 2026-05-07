import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, Fonts } from '../../../constants/constants';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import useLocationStore from '../../../store/useLocationStore';
import CarSelectionBottomSheet from '../components/CarSelectionBottomSheet';

const MOCK_DESTINATIONS = [
  { id: '1', name: 'Coimbatore International Airport', address: 'Airport Road, Peelamedu, Coimbatore', icon: 'airplane' },
  { id: '2', name: 'PROZONE MALL', address: 'SF 201, Sivanandapuram, Sathy Rd, Coimbatore', icon: 'star' },
  { id: '3', name: 'Gandhipuram Central Bus Stand', address: 'Cross Cut Rd, Gandhipuram, Coimbatore', icon: 'bus' },
];

const OneWayTrip = () => {
  const { t } = useTranslation();
  const { setStackScreen } = useStackScreenStore();
  const { directions } = useLocationStore();
  const [destination, setDestination] = useState('');
  const [showCarSelection, setShowCarSelection] = useState(false);
  
  const displayDestination = directions[1]?.locationName || destination;

  const filteredDestinations = MOCK_DESTINATIONS.filter(d => 
    d.name.toLowerCase().includes(destination.toLowerCase()) || 
    d.address.toLowerCase().includes(destination.toLowerCase())
  );

  const handleSelectDestination = (item) => {
    setDestination(item.name);
    setShowCarSelection(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.searchContainer} 
        activeOpacity={0.8}
        onPress={() => setStackScreen('HireDriversLocationSearchScreen', {})}
      >
        <Ionicons name="search" size={24} color="#5e626a" style={styles.searchIcon} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.dummyInput, !displayDestination && { color: '#5e626a' }]}>
            {displayDestination || t('where_to', 'Where to?')}
          </Text>
        </View>
        <TouchableOpacity style={styles.nowButton}>
          <Ionicons name="flash" size={16} color={colors.black} />
          <Text style={styles.nowText}>{t('now', 'Now')}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.black} />
        </TouchableOpacity>
      </TouchableOpacity>

      <FlatList
        data={filteredDestinations}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectDestination(item)}>
            <View style={styles.iconContainer}>
              {item.icon === 'airplane' ? (
                <Ionicons name="airplane" size={20} color="#5e626a" />
              ) : item.icon === 'star' ? (
                <Ionicons name="star" size={20} color="#5e626a" />
              ) : (
                <Ionicons name="location" size={20} color="#5e626a" />
              )}
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <CarSelectionBottomSheet 
        visible={showCarSelection} 
        onClose={() => setShowCarSelection(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 54,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  dummyInput: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
  },
  nowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d8eadb', // Light green background
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  nowText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.black,
    marginHorizontal: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  suggestionAddress: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#888',
  },
});

export default OneWayTrip;


