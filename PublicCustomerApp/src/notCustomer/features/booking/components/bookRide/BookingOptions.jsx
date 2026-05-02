import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

const BookingOptions = ({ label, onPress }) => {
  return (
    <></>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
 
    borderRadius: 8,
    marginVertical: 4,
   
  },
  label: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
    marginRight: 10,
  },
});

export default BookingOptions;
