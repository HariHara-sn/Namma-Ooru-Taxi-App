import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Fonts } from '../constants/constants';

const CustomDropdown = ({
  data = [],
  labelField = 'label',
  valueField = 'value',
  placeholder = 'Select item',
  onChange = () => {},
  isEnableSearch= false,
  initialValue = null, 
  style,
  dropdownStyle,
  ...props
}) => {
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  useEffect(() => {
    if (data.length > 0) {
      const defaultValue = initialValue ?? data[0][valueField];
      setValue(defaultValue);

      // Trigger onChange with the initial item
      // const selectedItem = data.find(item => item[valueField] === defaultValue);
      // if (selectedItem) {
      //   onChange(selectedItem);
      // }
    }
  }, [data, initialValue]);

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label,  { color: isFocus ? 'blue' : 'gray' },{ paddingHorizontal:10}]}>
          {placeholder}
        </Text>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {renderLabel()}
      <Dropdown
        style={[styles.dropdown, dropdownStyle, { borderColor:  isFocus  ?'blue' : 'gray' }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        search={isEnableSearch}
        maxHeight={300}
        labelField={labelField}
        valueField={valueField}
        placeholder={!isFocus ? placeholder : '...'}
        searchPlaceholder="Search..."
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        itemTextStyle={{color:'black', fontFamily:Fonts.regular}}
        onChange={item => {
          setValue(item[valueField]);
          onChange(item);
          setIsFocus(false);
        }}
        {...props}
      />
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 10,
    top: -5,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 12,
    fontFamily: Fonts.light,
  },
  placeholderStyle: {
    fontSize: 16,
    color: 'gray',
    fontFamily: Fonts.light,
  },
  selectedTextStyle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color:'black'
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    fontFamily: Fonts.light,
    color:'black'
  },
});
