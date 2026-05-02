import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../../constants/constants';
import PickLocationIcon from "../../../assets/icons/PickLocationIcon.svg"
import { useTranslation } from 'react-i18next';
import AdaptiveText from '../../../components/Common/AdaptiveText';
const PickLocationButton = ({ 
  icon, 
  text, 
  onPress, 
  iconColor = colors.black,
  textColor = colors.black,
  backgroundColor = 'transparent',
  style = {}
}) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor }, style]} 
      onPress={onPress}
    >
      <PickLocationIcon height={20} width={20}/>
      <AdaptiveText style={[styles.text, { color: textColor }]}>{t('locate_on_map')}</AdaptiveText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
   
    width:"100%",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#e0e0e0'   ,
    
  },
  text: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#212121',
  },
});

PickLocationButton.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  iconColor: PropTypes.string,
  textColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  style: PropTypes.object,
};

export default PickLocationButton;
