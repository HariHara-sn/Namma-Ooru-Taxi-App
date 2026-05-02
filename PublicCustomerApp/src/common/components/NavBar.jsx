import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import PropTypes from 'prop-types';

import { Icons } from '../constants/constants';
import { navStyles } from '../styles/NavStyles';
import { useTranslation } from 'react-i18next';

const NavBar = props => {
  const {title, rightIcon, onBackPress, onrightIconPress, withBg=false, rightBtnStyles} = props;

  const {t} = useTranslation()

  return (
    <View style={[navStyles.navContainer, {backgroundColor: withBg ? 'white' : 'transparent'}]}>
      <TouchableOpacity accessibilityLabel='Back' style={navStyles.leftIcon} onPress={onBackPress}>
        <View style={navStyles.leftBtn}>{Icons.back_arrow}</View>
      </TouchableOpacity>
      <TouchableOpacity style={navStyles.content}>
        <Text style={navStyles.contentTxt}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={navStyles.rightIcon} onPress={onrightIconPress}>
        {rightIcon && (
          <View style={[navStyles.leftBtn, {...rightBtnStyles}]}>
            <Text>{rightIcon}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default NavBar;

NavBar.propTypes = {
  title: PropTypes.string,
  rightIcon: PropTypes.string,
  onBackPress: PropTypes.func,
  onrightIconPress: PropTypes.func,
};

NavBar.defaultProps = {
  rightIcon: null,
  onrightIconPress: () => {},
  title:'',
  onBackPress: ()=> {},
};
