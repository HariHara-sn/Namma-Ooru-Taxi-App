import { StyleSheet } from 'react-native';
import { Colors, colors, Fonts } from '../constants/constants';


export const nabBarAStyles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.periwinkle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: 15,
    minHeight: 100,
  },
  titleContainer: {
    flexDirection: 'row',
  },
  titleText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.white,
  },
  subTitleText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 24,
    color: Colors.white,
  },
});

export const navStyles = StyleSheet.create({
  navContainer: {
    width: '100%',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  leftIcon: {
    width: '20%',
    padding: 10,
    alignItems: 'center',
  },
  leftBtn: {
    borderRadius: 50,
    backgroundColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    padding: 6,
  },
  rightIcon: {
    width: '20%',
    padding: 13,
  },
  content: {
    width: '60%',
    padding: 10,
    alignItems: 'center',
  },
  contentTxt: {
    fontFamily: Fonts.regular,
    color: Colors.black,
    fontSize: 16,
    textAlign: 'center',
  },
});


