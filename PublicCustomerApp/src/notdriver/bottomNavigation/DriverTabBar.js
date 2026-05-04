import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import analytics from '@react-native-firebase/analytics';

import { Colors, colors, Fonts } from '../../common/constants/constants';
import useUserStore from '../../common/store/useUserStore';
import useCurrentScreenStore from '../../common/store/useCurrentScreenStore';
import { flexStyle } from '../../common/styles/flexStyle';
import { useTranslation } from 'react-i18next';

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  menuName: {
    fontSize: 12,
    fontFamily:Fonts.light
  },
  menu: {
    padding: 10,
  },
  container: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  bottomBar: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fafafa',
    paddingVertical: 3,
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 10000,
    flex: 1,
    flexDirection: 'row',
  },
  notification: {
    backgroundColor: 'orange',
    // padding: 5,
    borderRadius: 50, // Changed to make it round
    position: 'absolute',
    top: 0,
    right: 20,
    height: 20,
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default function DriverTabBar({ menus }) {
  const { currentScreen, setCurrentScreen, showBottomTabs, setShowBottomTabs } = useCurrentScreenStore();
  const activeIndex = menus.findIndex(menu => menu.name === currentScreen);
  const { selectedLanguage } = useUserStore();
  const {t} = useTranslation()

  const onMenuClick = async (name) => {
    setCurrentScreen(name);
    try {
      await analytics().logScreenView({
        screen_name: name,
        screen_class: name,
      });
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    const menu = menus.find(m => m.name === currentScreen)
    if (menu.hidden) {
      setShowBottomTabs(false)
    } else {
      setShowBottomTabs(true)
    }
  }, [currentScreen])

  return (
    <>
      {menus[activeIndex].component}
      {showBottomTabs && <View style={styles.bottomBar}>
        {menus.map(menu => {
          if (menu.hidden) {
            return null;
          }
          const notification = menu.notificationData?.content
          return (
            <View style={{ flex: 1 }} key={menu.id}>
              {
                <TouchableOpacity
                  accessibilityLabel={menu.name}
                  style={[styles.menu, flexStyle.acjc, flexStyle.g5]}
                  key={menu.id}
                  testID={menu.name}
                  onPress={() => onMenuClick(menu.name)}>
                  {currentScreen === menu.name ? menu.iconHighlight : menu.icon}
                  <Text
                    style={[
                      styles.menuName,
                      {
                        color:
                          currentScreen === menu.name ?Colors.periwinkle : '#757575',
                          fontFamily:currentScreen === menu.name ?  Fonts.medium:  Fonts.light,
                        fontSize: selectedLanguage === "en" ? 12 : 10,
                        textAlign:"center",
                      },
                    ]}>
                    {t(menu.title)} 
                  </Text>
                  {notification ? <View style={styles.notification}>
                    <Text style={{fontSize:10,fontWeight: 'bold'}}>{notification}</Text>
                  </View> : null}
                </TouchableOpacity>
              }
            </View>
          );
        })}
      </View>}
    </>
  );
}

DriverTabBar.propTypes = {
  menus: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.any.isRequired,
      component: PropTypes.element.isRequired,
    }),
  ).isRequired,
};

DriverTabBar.defaultProps = {
  menus: [],
};


