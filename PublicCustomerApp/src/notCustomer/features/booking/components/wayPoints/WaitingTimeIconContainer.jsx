import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../../../constants/constants';

const WaitingTimeIconContainer = ({ 
  value, 
  onPress, 
  iconName = 'more-time', 
  iconSize = 25, 
  iconColor = colors.grey_xxdark,
  textStyle,
  containerStyle,
  activeOpacity = 0.7 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, containerStyle]} 
      onPress={onPress}
      activeOpacity={activeOpacity}
    >
      {value === null || value === undefined || value === 0 ? (
        <MaterialIcons 
          name={iconName} 
          size={iconSize} 
          color={iconColor} 
        />
      ) : (
        <View style={styles.valueContainer}>
           <MaterialIcons name="timer" size={16} color="white" />
          <Text style={styles.valueText}>{value} Mins</Text>
         
        </View>
      )}
    </TouchableOpacity>
  );
};

  WaitingTimeIconContainer.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onPress: PropTypes.func.isRequired,
  iconName: PropTypes.string,
  iconSize: PropTypes.number,
  iconColor: PropTypes.string,
  textStyle: PropTypes.object,
  containerStyle: PropTypes.object,
  activeOpacity: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  valueContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "black",
    borderRadius: 6, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  valueText: {
  
    fontSize: 11,
    color: "white",
    fontFamily: Fonts.medium,
  },
});

export default WaitingTimeIconContainer;
