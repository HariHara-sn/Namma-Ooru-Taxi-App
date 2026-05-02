/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable react/react-in-jsx-scope */
import Bell from '../../common/assets/icons/bell_icon.svg';
import ArrowDown from '../../common/assets/icons/arrow_down.svg';
import TickWhite from '../../common/assets/icons/tickWhite.svg';
import CurrentLoc from '../../common/assets/icons/currentLoc.svg';
import FitToMarkers from '../../common/assets/icons/fittomarkers.svg';
import BackArrow from '../../common/assets/icons/backArrow.svg';

export const Icons = {
  bell: <Bell />,
  arrow_down: <ArrowDown />,
  tickWhite: <TickWhite/>,
  currentLoc: <CurrentLoc />,
  fitToMarkers:<FitToMarkers />,
  back_arrow: <BackArrow />,
};

// export const Images = {
//   home_bg: <HomeBg />,
//   phone_image: require('../Assets/phone_Image.png'),
//   settingsBG: require('../../common/assets/icons/settings/settingsBG.png')
// };

export const Fonts = {
  regular: 'Outfit-Regular',
  light: 'Outfit-Light',
  medium: 'Outfit-Medium',
  bold: 'Outfit-Bold',
  semi_bold: 'Outfit-SemiBold',
};



export const Colors = {
  white: '#ffffff',
  white_Two: '#eeeeee',
  white_three: '#e0e0e0',
  black: '#212121',
  cool_grey: '#adb5bd',
  warm_grey: '#757575',
  warm_grey_two: '#888',
  pale_grey: '#f8f9fa',
  pale_grey_two: '#edf2f7',
  battleship_grey: '#6c757d',
  light_grey: '#D6D6D6',
  silver: '#dee2e6',
  bright_orange: '#7d5fff',
  yellow_orange: '#ffaa2a',
  periwinkle: '#7d5fff',
  periwinkle_light: '#e8e6ff',
  home_bg: '#353348',
  dusk: '#5f5a7a',
  battery_green: '#0cb200',
  electric_blue: '#1751ff',
  green: '#128e0e',
  green_sub: '#08B402',
  red: '#ff0000',
  green_light:'#B9FFE3',
  green_dark:'#007546',
  grey_light:'#F5F5F5',
  pink_light:'#FFE9E9',
  green_xlight: '#D4FFD9',
  yellow_xlight:'#FFF6E9',
  blue_xxlight: '#E8F4FF',
  yellow_xxlight:'#FFF7E5',
  orange_xxlight: '#FFF0E8',
  red_xxxlight:'#FFF8F8',
  violet:'#4322cf',
  violet_disabled:'#e4dff9',
  dark: '#0A0A0A',
  yellow: '#FFD100',
  grey: '#EEEEEE',
  grey_dark: '#9E9E9E',
  grey_xxdark: '#757575',
  blue_xxdark: '#0F223C',
  danger_red: '#D83838',
  grey_xdark: '#D6D6D6',
  white_dirt: '#F5F5F5',
  green_online:'#299865',
  green_xxlight:'#2998650D',
  orange: '#FFA200',
  yellow_light: '#FFEDA7',
  call_green: '#329782',
  cance_red: '#FF6060',
  skyBlue:'#42A5F5',
  white_light:'#FCFCFC',
  light_black: "#888888"
};

export const light = {
  themeColor: '#FFFFFF',
  white: '#000000',
  sky: '#DE5E69',
  gray: 'gray',
  ...Colors,
};

export const dark = {
  themeColor: '#000000',
  white: '#FFFFFF',
  sky: '#831a23',
  gray: 'white',
  ...Colors,
};

export const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w\w+)+$/;
export const passwordLoginPattern = /^.*(?=.{8,})/;
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/ ;
export const simNoPattern = /^[0-9]+$/;
export const registrationNoPattern = /^[A-Z]{2}\s\d{1,2}\s[A-Z]{1,2}\s\d{4}$/
export const simNumberPattern = /^\d+U$/;
export const panNumberPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const aadhaarNumberPattern = /^[2-9]{1}[0-9]{11}$/;
export const licenseNumberPattern = /^[A-Z]{2}[0-9]{2}\s?[0-9]{4}[0-9]{7,8}$/;
export const vehicleNumberPattern = /^[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{0,2}[-\s]?[0-9]{4}$/;
export const upiIdPattern = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
export const phoneNumberPattern = /^\+91[6-9]\d{9}$/;
export const phoneNumberPatternIN = /^(?:\+91)?[6-9]\d{9}$/;

export const termsURL = 'https://nammaoorutaxi.com/notdriver/legal/term';
export const privacyPolicyURL = 'https://nammaoorutaxi.com/notdriver/legal/privacypolicy';
export const webPortalURL = 'https://tracker.vmmaps.com';
export const mapcopyrightURL = 'https://www.openstreetmap.org/copyright';

export const contactPhone = '+91 90921 90321'
export const contactMail = 'reachus@virtualmaze.co.in'
