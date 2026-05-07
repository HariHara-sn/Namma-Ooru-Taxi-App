import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, Fonts } from '../../../constants/constants';

const { height } = Dimensions.get('window');

const MOCK_CARS = [
  { id: '1', name: 'Mini', type: 'Hatchback', capacity: 4, price: 150 },
  { id: '2', name: 'Sedan', type: 'Sedan', capacity: 4, price: 200 },
  { id: '3', name: 'SUV', type: 'SUV', capacity: 6, price: 300 },
];

const CarSelectionBottomSheet = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const [selectedCar, setSelectedCar] = useState(null);

  const handleBook = () => {
    if (!selectedCar) return;
    // Handle booking logic here
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.sheetContainer}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          <Text style={styles.title}>{t('select_car_type', 'Select Car Type')}</Text>
          
          <FlatList
            data={MOCK_CARS}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedCar === item.id;
              return (
                <TouchableOpacity 
                  style={[styles.carCard, isSelected && styles.carCardSelected]}
                  onPress={() => setSelectedCar(item.id)}
                  activeOpacity={0.8}
                >
                  {/* Since we might not have the actual car image, using an icon as fallback */}
                  <View style={styles.imagePlaceholder}>
                     <Ionicons name="car-sport" size={40} color={colors.periwinkle || '#666'} />
                  </View>
                  
                  <View style={styles.carInfo}>
                    <Text style={styles.carName}>{item.name}</Text>
                    <Text style={styles.carType}>{item.type} • {item.capacity} {t('seats', 'Seats')}</Text>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>₹{item.price}</Text>
                    <Text style={styles.priceUnit}>/trip</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.bookButton, !selectedCar && styles.disabledButton]} 
              onPress={handleBook}
              disabled={!selectedCar}
            >
              <Text style={styles.bookButtonText}>{t('book_driver', 'Book Driver')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

CarSelectionBottomSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  carCardSelected: {
    borderColor: colors.periwinkle || '#4A90E2',
    backgroundColor: '#F0F8FF',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    marginRight: 12,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.black,
    marginBottom: 4,
  },
  carType: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.grey_dark,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.black,
  },
  priceUnit: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: colors.grey_dark,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bookButton: {
    backgroundColor: colors.periwinkle || '#4A90E2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  bookButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.white,
  }
});

export default CarSelectionBottomSheet;


