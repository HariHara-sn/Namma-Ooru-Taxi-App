import {StyleSheet} from 'react-native';
import { Colors, Fonts } from '../constants/constants';
import { height, scale, verticalScale, width } from '../utils/scalingutils';


export const ReportsScreenStyles = StyleSheet.create({
  Screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  inputBox: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: Colors.white_Two,
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputText: {
    color: Colors.black,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  modalView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: height,
    width: width,
    zIndex: 20000,
  },
  modalContainer: {
    width: '100%',
    // height: height * 0.75,
    position: 'absolute',
    backgroundColor: Colors.white,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginRight: 10,
    marginVertical: 10,
  },
  dateView: {
    marginHorizontal: 10,
    marginVertical: 20,
  },
  dateTxt: {
    color: Colors.black,
    fontSize: 18,
    fontFamily: Fonts.medium,
    marginTop: 5,
  },
  submitBtn: {
    position: 'absolute',
    width: '80%',
    paddingVertical: 10,
    backgroundColor: Colors.periwinkle,
    borderRadius: 10,
    bottom: verticalScale(30),
    alignSelf: 'center',
    alignItems: 'center',
  },
  submitBtnTxt: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.white,
  },
  reportDetails: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
  },
  reportsBoldTxt: {
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
    fontSize: scale(16),
    marginTop: 20,
  },
  reportsgeneratedTxt: {
    fontFamily: Fonts.regular,
    color: Colors.warm_grey,
    fontSize: scale(12),
    marginTop: 10,
  },
  deviceCard: {
    width: '90%',
    backgroundColor: Colors.white,
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {width: 3, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
    borderRadius: 5,
    padding: 10,
  },
  vehicleNum: {
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
    fontSize: scale(18),
  },
  detailsText: {
    marginTop: 5,
    fontFamily: Fonts.regular,
    color: Colors.black,
    fontSize: scale(14),
  },
  detailsCard:{
    width:"48%"
  },
  flexwrap: {
    flexDirection: 'row',
    width: '90%',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerContainer: {
    width: '90%',
    alignSelf: 'center',
  },
  pickerComp: {
    width: '100%',
    top: 10,
    borderRadius: 10,
    backgroundColor: Colors.white_Two,
    overflow:'hidden'
  },
});
