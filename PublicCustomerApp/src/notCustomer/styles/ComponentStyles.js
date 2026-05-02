import {StyleSheet} from 'react-native';
import {Fonts} from '../Constants/Contants';
import {reponsiveFont} from '../Constants/Metrics';
import Colors from '../Constants/Theme/Colors';

export const componentStyle = (theme) => StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    margin: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  inputBox: {
    flexDirection: 'row',
    width: '86%',
    overflow: 'hidden',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 0.3,
    backgroundColor:Colors[theme].grey_xlight
  },
  input: {
    width: '68%',
    color:Colors[theme].font_black
  },
  inputIcons: {
    alignItems: 'center',
    width: '10%',
  },
  searchCancelBtn: {
    width: '12%',
    margin: 4,
    borderRadius: 40,
    borderWidth: 0.3,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors[theme].grey_xlight,
    borderColor: Colors[theme].grey,
    color:'black'
  },
});

export const AddressCards =(theme)=> StyleSheet.create({
  cardContainer: {
    width: '95%',
    borderRadius: 8,
  },
  searchCancelBtn: {
    width: '14%',
    margin: 4,
    borderRadius: 40,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  m5: {
    marginLeft: 5,
  },
  cardViewAllBtn: {
    textAlign: 'center',
    marginVertical: 10,
    color: Colors[theme].blue,
    fontSize: reponsiveFont(12),
    fontFamily: Fonts.light,
  },
  titleTxt: {
    fontFamily: Fonts.regular,
    fontSize: reponsiveFont(16),
    color: Colors[theme].black,
    width:'88%'
  },
  addressTxt: {
    fontFamily: Fonts.light,
    fontSize: reponsiveFont(14),
    color: Colors[theme].grey,
    width:'80%'
  },
  colorOrange: {
    color: Colors[theme].orange,
  },
  cardTitle: {
    fontFamily: Fonts.regular,
    fontSize: reponsiveFont(16),
    color: Colors[theme].black,
    marginBottom: 8,
  },
  flexRow: {
    flexDirection: 'row',
  },
  statusTxt: {
    fontFamily: Fonts.light,
    fontSize: reponsiveFont(12),
  },
  colorGreen: {
    color: Colors[theme].green,
  },
  colorViolet: {
    color: Colors[theme].violet,
  },
  resultName: {
    fontFamily: Fonts.light,
    fontSize: reponsiveFont(16),
    color: Colors[theme].black,
  },
});
