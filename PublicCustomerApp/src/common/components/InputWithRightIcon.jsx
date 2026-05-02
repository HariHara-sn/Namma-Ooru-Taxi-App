import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PropTypes from 'prop-types';
import { Colors } from '../constants/constants';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // Aligns TextInput and Icon horizontally
    alignItems: 'center', // Centers them vertically
    borderWidth: 1, // Border for the whole container
    borderColor: 'rgba(0,0,0,0.3)', // Border color
    borderRadius: 5, // Rounded corners
    marginVertical: 5,
  },
  input: {
    flex: 1, // TextInput takes up maximum space
    paddingLeft: 10, // Padding inside the TextInput
  },
  icon: {
    paddingRight: 15, // Padding to the right of the icon
  },
});

export default function InputWithRightIcon(props) {
  const {
    label,
    bgColor,
    value,
    keyboardType,
    iconName,
    imgType,
    onInputChange,
    animated,
    editable,
    mask,
    countryCode,
    testId,
    setCountryCode,
    placeholderTextColor,
    handleCountrySelect,
    ...additionalProps
  } = props;

  const [isFocused, setIsFocused] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const labelStyle = {
    position: 'absolute',
    left: 10,
    top: !isFocused ? 20 : 0,
    fontSize: !isFocused ? 18 : 14,
    color: !isFocused ? '#aaa' : '#000',
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => setIsFocused(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: isFocused ? Colors.bright_orange : 'rgba(0,0,0,0.3)',
        },
      ]}>
      {animated ? (
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
      ) : null}

      {
        countryCode && <TouchableOpacity onPress={() => handleCountrySelect()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, gap: 5 }}>
          <Icon name="caret-down" size={20} color={Colors.periwinkle} />
          <Text style={{ color: 'black', fontWeight: 'bold' }}>{countryCode}</Text>
        </TouchableOpacity>
      }

      <TextInput
        editable={editable ?? true}
        keyboardType={keyboardType}
        onChangeText={text => onInputChange(text)}
        style={[
          styles.input,
          { borderColor: isFocused ? '#ffd100' : 'rgba(0,0,0,0.3)' },
          { color: '#212121', minHeight: 50 }
        ]}
        placeholder={label}
        placeholderTextColor={placeholderTextColor ?? "#757575"}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={(mask && !isVisible) ?? false}
        {...additionalProps}
        testID={testId}
        autoCapitalize="none"
      />
      {mask && (
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setIsVisible(!isVisible)}>
          <Icon
            name={!isVisible ? 'eye' : 'eye-slash'}
            size={18}
            color={isFocused ? Colors.bright_orange : 'black'}
          />
        </TouchableOpacity>
      )}
      <View style={{ ...styles.icon, backgroundColor: 'transparent' }}>
        {imgType === 'svg' ? (
          iconName
        ) : (
          <Icon
            name={iconName || 'user'}
            size={18}
            color={isFocused ? Colors.bright_orange : 'black'}
          />
        )}
      </View>
    </View>
  );
}

InputWithRightIcon.propTypes = {
  label: PropTypes.string.isRequired,
  bgColor: PropTypes.string,
  value: PropTypes.string,
  keyboardType: PropTypes.string,
  iconName: PropTypes.string,
  imgType: PropTypes.string,
  onInputChange: PropTypes.func,
  animated: PropTypes.bool,
  editable: PropTypes.bool,
  mask: PropTypes.bool,
  countryCode: PropTypes.any,
  additionalProps: PropTypes.object,
  testId: PropTypes.string,
};

InputWithRightIcon.defaultProps = {
  label: '',
  bgColor: '',
  value: '',
  keyboardType: '',
  iconName: '',
  imgType: '',
  onInputChange: () => { },
  animated: false,
  editable: true,
  mask: false,
  countryCode: false,
  additionalProps: {},
  testId: '',
};
