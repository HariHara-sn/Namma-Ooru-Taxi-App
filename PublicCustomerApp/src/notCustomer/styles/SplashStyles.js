import {StyleSheet} from 'react-native';
import {colors, Fonts} from '../constants/constants';
import {height, width} from '../utils/Utils';

export const SplashStyles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#01041D',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.15,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 0.35,
  },
  splashTitle: {
    fontFamily: Fonts.bold,
    color: colors.white,
    fontSize: 24,
    marginTop: 15,
    textAlign: 'center',
  },
  versionTxt: {
    fontFamily: Fonts.regular,
    marginTop: 10,
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
  },
  loader: {
    marginBottom: 24,
  },
  
  splashBg: {
    position: 'absolute',
    bottom: 40,
    overflow: 'hidden',
    width: '100%',
    alignItems: 'center',
  },
  bottomAnimation: {
    alignSelf: 'center',
    height: height * 0.4,
    width: width,
  },
});



export const onBoardingStyles = StyleSheet.create({
  onboardContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  slide: {
    width: width,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: Fonts.semi_bold,
    color: colors.black,
    textAlign: 'center',
    width: '80%',
    marginTop:20
  },
  slideSubtitle: {
    fontFamily: Fonts.regular,
    color: colors.black,
    width: '90%',
    textAlign: 'center',
    marginTop:20
  },
  pagination: {
    width: '50%',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: colors.white,
    top: 5,
    alignSelf: 'center',
  },

  carousel: {flex: 1, backgroundColor: colors.white},
  nextBtn: {
    alignSelf: 'center',
    padding: 10,
    width: width * 0.8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nextText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
    backgroundColor:colors.blue_xxdark,
    width:'100%',
    paddingVertical:10,
    borderRadius:50
  },
  skipBtn: {
    width: width * 0.94,
    alignSelf: 'center',
    padding:15,
    alignItems: 'flex-end',
  },
  skipBtnText: {
    fontFamily: Fonts.regular,
    color: colors.warm_grey,
  },
  paginationSliderInactive: {
    width: '100%',
    height: 5,
    backgroundColor: colors.white_Two,
    justifyContent: 'center',
    borderRadius: 10,
  },
  paginationSliderActive: {
    height: 5,
    backgroundColor: colors.bright_orange,
    borderRadius: 10,
  },
});
