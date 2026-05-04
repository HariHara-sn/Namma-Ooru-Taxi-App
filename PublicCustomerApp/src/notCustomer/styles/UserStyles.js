import { StyleSheet } from 'react-native';
import { colors, Fonts } from '../constants/constants';

export const loginStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerTxt: {
    fontFamily: Fonts.bold,
    color: colors.black,
    fontSize: 24,
    marginLeft: 10,
  },
  contectContainer: {
    width: '90%',
    alignSelf: 'center',
    paddingTop: 10,
  },
  signInTxt: {
    fontFamily: Fonts.light,
    color: colors.black,
    fontSize: 16,
  },
  inputConatiner: {
    width: '100%',
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
  },
  countryPicker: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRightWidth: 0.3,
  },
  input: {
    width: '60%',
    paddingLeft: 10,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
  },
  phoneIcon: {
    width: '10%',
    alignItems: 'center',
  },
  callingCode: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
    marginLeft: 10,
  },
  otpBtn: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: colors.blue_xxdark,
    width: '80%',
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'center',
  },
  otptxt: {
    fontFamily: Fonts.medium,
    color: colors.white,
    fontSize: 14,
  },
  errTxt: {
    color: colors.danger_red,
    fontFamily: Fonts.light,
    fontSize: 14,
    marginTop: 10,
  },
  otpHeaderTxt: {
    textAlign: 'center',
    marginTop: 20,
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'center',
    fontSize: 24,
    color: colors.black,
  },
  headerContent: {
    fontFamily: Fonts.light,
    fontSize: 16,
    color: colors.black,
    
    textAlign: 'center',
  },
  phoneTxt: {
    fontFamily: Fonts.medium,
    color: colors.black,
    textAlign: 'center',
    marginTop: 5
  },
  otpContainer: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 25
  },
  resendOTP:{
    color:colors.grey_dark,
    fontFamily:Fonts.light,
    textAlign:'center',
    marginTop:15
  },
  newUserBtn: {
    paddingVertical:10,
    paddingLeft: 20,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
  },
  registerPageBtn:{
    paddingLeft:10,
    color:colors.black,
    fontWeight:'bold'
  }
});

export const registerationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
    width: "100%",
    justifyContent: 'space-between'
  },
  sizedBox: {
    padding: 3,
    width: 50,
    marginTop: 10,
    marginBottom: 20,

    backgroundColor: 'blue',
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  PhoneinputConatiner: {
    width: '100%',
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
  },
  countryPicker: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRightWidth: 0.3,
  },
  input: {
    width: '60%',
    paddingLeft: 10,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
  },
  phoneIcon: {
    width: '10%',
    alignItems: 'center',
  },
  callingCode: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
  },
  inputContianer: {
    width: "100%",
    height: 48,
    borderColor: colors.black,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingLeft: 22
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 12,
    marginVertical: 8,
    color: colors.black
  },
  requestBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 130,
    alignItems: 'center',
    backgroundColor: colors.black,
    padding: 10,
    color: colors.white,
    borderRadius: 5
  },
  requestBtnDisabe: {
    opacity: 0.5
  },
  titleStyle: {
    fontWeight: 'bold',
    fontSize: 24,
    color: colors.black
  },
  stepperTitleStyle: {
    fontWeight: 'bold',
    fontSize: 34,
    color: colors.black
  },
  stepperInputContianer: {
    width: "100%",
    height: 48,
    borderColor: `#4b48ab`,
    borderWidth: 0,
    borderBottomWidth: 1.5,
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingLeft: 10
  },
  stepperInputError: {
    borderColor: colors.danger_red
  },
  stepperInputErrorMessage: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.danger_red
  }
});


