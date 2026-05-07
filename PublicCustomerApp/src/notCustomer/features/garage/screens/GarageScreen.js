import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import NavBar from '../../../components/NavBar';
import UseBackButton from '../../../../common/hooks/UseBackButton';
import DropdownField from '../../../../common/components/DropdownField';
import { colors, Fonts } from '../../../constants/constants';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
];

const FEATURES_OPTIONS = [
  { label: 'AC', value: 'ac' },
  { label: 'Music System', value: 'music' },
  { label: 'Airbags', value: 'airbags' },
  { label: 'GPS', value: 'gps' },
  { label: 'Bluetooth', value: 'bluetooth' }
];

const TRANSMISSION_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Automatic', value: 'automatic' },
  { label: 'Semi-Automatic', value: 'semi_automatic' }
];

const VEHICLE_TYPE_OPTIONS = [
  { label: 'Hatchback', value: 'hatchback' },
  { label: 'Sedan', value: 'sedan' },
  { label: 'SUV', value: 'suv' },
  { label: 'MUV', value: 'muv' },
  { label: 'Luxury', value: 'luxury' }
];

const FUEL_TYPE_OPTIONS = [
  { label: 'Petrol', value: 'petrol' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'CNG', value: 'cng' },
  { label: 'EV', value: 'ev' },
  { label: 'Hybrid', value: 'hybrid' }
];

const COLOR_OPTIONS = [
  { label: 'White', value: 'white' },
  { label: 'Black', value: 'black' },
  { label: 'Silver', value: 'silver' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' }
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'In Maintenance', value: 'maintenance' }
];

const DRIVER_ROLE_OPTIONS = [
  { label: 'Self', value: 'self' },
  { label: 'Hired Driver', value: 'hired_driver' },
  { label: 'Family Member', value: 'family' }
];

const GarageScreen = () => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  
  const [formData, setFormData] = useState({
    userName: "",
    phoneNumber: "",
    userEmail: "",
    userGender: "",
    regNo: "",
    vehicleType: "",
    make: "",
    vehicleName: "",
    features: [],
    transmission: [],
    maxSpeed: "50",
    model: "",
    year: "",
    fuelType: "hybrid",
    color: "",
    status: "active",
    driverRole: "self"
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // API logic to save to garage
    console.log("Saving garage data:", formData);
    goBack();
  };

  const renderInput = (field, label, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(text) => handleChange(field, text)}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <UseBackButton onBackPress={goBack} />
      <NavBar title={t('my_garage', 'My Garage')} onBackPress={goBack} withBg withShadow />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('owner_details', 'Owner Details')}</Text>
        
        {renderInput('userName', 'Name', 'Enter your name')}
        {renderInput('phoneNumber', 'Phone Number', 'Enter your phone number', 'phone-pad')}
        {renderInput('userEmail', 'Email', 'Enter your email', 'email-address')}
        
        <DropdownField 
          label="Gender" 
          options={GENDER_OPTIONS} 
          value={formData.userGender} 
          onSelect={(val) => handleChange('userGender', val)} 
          placeholder="Select Gender" 
        />

        <Text style={styles.sectionTitle}>{t('vehicle_details', 'Vehicle Details')}</Text>
        
        {renderInput('regNo', 'Registration Number', 'e.g. TN01AB1234')}
        {renderInput('make', 'Make / Brand', 'e.g. Hyundai')}
        {renderInput('vehicleName', 'Vehicle Name', 'e.g. i20')}
        {renderInput('model', 'Model', 'e.g. Asta')}
        {renderInput('year', 'Year of Manufacture', 'e.g. 2022', 'numeric')}
        {renderInput('maxSpeed', 'Max Speed (km/h)', 'e.g. 120', 'numeric')}

        <DropdownField 
          label="Vehicle Type" 
          options={VEHICLE_TYPE_OPTIONS} 
          value={formData.vehicleType} 
          onSelect={(val) => handleChange('vehicleType', val)} 
          placeholder="Select Vehicle Type" 
        />

        <DropdownField 
          label="Fuel Type" 
          options={FUEL_TYPE_OPTIONS} 
          value={formData.fuelType} 
          onSelect={(val) => handleChange('fuelType', val)} 
          placeholder="Select Fuel Type" 
        />

        <DropdownField 
          label="Color" 
          options={COLOR_OPTIONS} 
          value={formData.color} 
          onSelect={(val) => handleChange('color', val)} 
          placeholder="Select Color" 
        />

        <DropdownField 
          label="Transmission (Vehicle Specification)" 
          options={TRANSMISSION_OPTIONS} 
          value={formData.transmission} 
          onSelect={(val) => handleChange('transmission', val)} 
          placeholder="Select Transmission (Vehicle Specification)" 
          isMulti
        />

        <DropdownField 
          label="Features" 
          options={FEATURES_OPTIONS} 
          value={formData.features} 
          onSelect={(val) => handleChange('features', val)} 
          placeholder="Select Features" 
          isMulti
        />

        <DropdownField 
          label="Status" 
          options={STATUS_OPTIONS} 
          value={formData.status} 
          onSelect={(val) => handleChange('status', val)} 
          placeholder="Select Status" 
        />

        <DropdownField 
          label="Driver Role" 
          options={DRIVER_ROLE_OPTIONS} 
          value={formData.driverRole} 
          onSelect={(val) => handleChange('driverRole', val)} 
          placeholder="Select Driver Role" 
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('save_vehicle', 'Save Vehicle')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
    marginTop: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: colors.black,
  },
  saveButton: {
    backgroundColor: colors.periwinkle || '#4A90E2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: colors.white,
  }
});

export default GarageScreen;


