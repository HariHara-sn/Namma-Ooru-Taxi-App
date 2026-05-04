import React, { useRef, useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  View,
} from 'react-native';
import { Colors, colors, Fonts } from '../constants/constants';

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingRight:10
    // paddingHorizontal:10
    // marginVertical: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontFamily: Fonts.regular,
    color: Colors.black,
    fontSize: 16,
    height: 50,
  },
  labelContainer: {
    // marginBottom: 5,
    paddingLeft: 4,
  },
  label: {
    fontFamily: Fonts.light,
    fontSize: 14,
    color: Colors.black,
  },
  error: {
    fontSize: 12,
    color: Colors.danger_red,
    fontFamily: Fonts.light,
    bottom: 8,
  },
});

const InputField = ({
  label,
  errorText,
  value,
  style,
  onBlur,
  onFocus,
  onChangeText,
  icon,
  keyboardType = 'default',
  isRequired = false,
  noSpaces = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const borderColor = isFocused ? Colors.periwinkle : Colors.grey;
  const bgColor = value || isFocused ? Colors.white : Colors.white_dirt;

  const handleTextChange = (text) => {
    const processedText = noSpaces ? text.replace(/\s/g, '') : text;
    onChangeText?.(processedText);
  };

  return (
    <>
      {label ? (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}{isRequired ? ' *' : ''}
          </Text>
        </View>
      ) : <></>}
      <View style={[styles.inputContainer, { borderColor, backgroundColor: bgColor }, style]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          keyboardType={keyboardType}
          placeholder=""
          {...rest}
        />
        {icon}
      </View>
      {!!errorText && <Text style={styles.error}>{errorText}</Text>}
    </>
  );
};

export default InputField;


