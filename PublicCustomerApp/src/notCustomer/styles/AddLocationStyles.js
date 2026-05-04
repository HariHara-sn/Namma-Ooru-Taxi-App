import { StyleSheet } from 'react-native';
import { colors, Fonts } from '../constants/constants';

export const addLocation = StyleSheet.create({
  container: {
    width: '95%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    alignSelf: 'center',
  },
  backButton: {
    width: '12%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    aspectRatio: 1,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addLocationContainer: {
    width: '95%',
    padding: 10,
    paddingBottom:0,
    backgroundColor: colors.white,
    alignSelf: 'center',
    borderWidth: 0.4,
    borderRadius: 10,
    elevation: 5,
    flexDirection:'row',
    borderColor:colors.grey_light,
   
  },
  inputHeader: {
    width: '100%',
    top: 10,
    left: 20,
    fontFamily: Fonts.regular,
    color: '#757575',
    fontSize: 12,
    paddingLeft:5
  },
  divider: {height: 1, backgroundColor: colors.grey_light, marginBottom: 5,marginTop:0},
  draggableCard: {
    flexDirection: 'row',
    width: '100%',
    
    // backgroundColor:'yellow'
  },
  dragIcons: {
    marginTop: 5,
    
  },
  draggableInput: {
    width: '94%',
    paddingLeft:5,
    marginLeft: 5,
    paddingTop:8,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color:colors.black,
   
    // backgroundColor:'red'
  },
  dragIcon: {
    position: 'absolute',
    right: 5,
  },
  searchResults: {
    fontFamily: Fonts.regular,
    color: colors.black,
    paddingVertical: 8,
    borderBottomWidth: 0.3,
  },
  confirmBtn: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: colors.black,
    paddingVertical: 10,
    borderRadius: 10,
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  confirmBtnTxtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmBtnTxt: {
    fontFamily: Fonts.medium,
    color: colors.white,
    fontSize: 16,
  }, 
  rideSelectionContainer: {
    width: '95%',
    paddingVertical: 10,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
    gap:10
  },
  rideSelection: {
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '46%',
    paddingHorizontal: 15,
    borderRadius: 15,
    padding: 10,
    display: 'flex',
    justifyContent: 'center',
  },
  forMeContainer: {
    padding: 7,
    position: 'absolute',
    top: 10,
    right: 15,
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    gap:5,
    zIndex:10
  },
  forMeText: {
    color: colors.black,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  rideSelectionTxt: {
    color: colors.white,
    fontFamily: Fonts.regular,
    fontSize: 14,
    display: 'flex',
    paddingLeft:5,
    

  },
  rideOptionContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(79, 65, 65, 0)',
    width: '100%',
    height: '100%',
    zIndex: 5
  },
  rideOptionBottom: {
    position: 'absolute',
    width:'100%',
    bottom: 0,
    backgroundColor: colors.white,
  
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    padding: 10
  },
  tripSelectionBtn: {
    flexDirection: 'row',
    margin: 10,
    gap: 10,
    backgroundColor: colors.white_dirt,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tripSelectionBtnTxt: {
    fontFamily: Fonts.light,
    color: colors.black,
    fontSize: 16,
  },
  tripSelectionBtnDisabled: {
    flexDirection: 'row',
    margin: 10,
    gap: 10,
    backgroundColor: colors.grey_light,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.6,
  },
  tripSelectionBtnTxtDisabled: {
    fontFamily: Fonts.light,
    color: colors.grey_dark,
    fontSize: 16,
  },
  comingSoonBadge: {
    backgroundColor: colors.yellow_xxlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  comingSoonText: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 10,
  },
  closeBtn: {
    paddingRight: 20,
    marginVertical: 10,
    alignSelf: 'flex-end',
    padding: 10,
    alignItems: 'center',
  },
  waypointsbtn:{
    alignSelf:'center', 
    width:'10%', 
  }
});

export const scheduleContainerStyles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.white,
    position: 'absolute',
    bottom: 0,
    zIndex: 6,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 10,
  },
  containerTitle: {
    fontFamily: Fonts.light,
    color: colors.black,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  selectedDateContainer: {
    width: '70%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.yellow_xxlight,
    marginTop: 15,
    borderRadius: 10,
    paddingBottom: 10,
  },
  yearTxt: {
    textAlign: 'center',
    marginTop: 10,
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
  },
  timeTxt: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 12,
  },
  btnComponent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  confrmBtn: {
    width: '40%',
    backgroundColor: colors.grey_xdark,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confrmBtnTxt: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
  },
  listCards: {
    backgroundColor: colors.grey_xdark,
    marginHorizontal: 5,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    borderRadius: 15,
  },
  listCardsTxt: {
    fontFamily: Fonts.light,
    color: colors.black,
    fontSize: 14,
  },
  datePickerContainer: {
    backgroundColor: colors.white_dirt,
    marginVertical: 15,
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
    borderRadius: 10,
  },
});

export const vehicleList = StyleSheet.create({
  cards: {
    width: '100%',
    marginVertical: 5,
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 10,
    backgroundColor: '#FAFAFA',
  },
  imageContainer: {
    width: '27%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBg: {
    position:'absolute',
    left:0,
    width: '50%',
    height: '70%',
    backgroundColor: colors.yellow,
    borderRadius: 10,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
  },
  vehicleDetails: {
    display:'flex',
    justifyContent:'center',
    flex:1,
    borderRightWidth: 0.3,
    paddingHorizontal:5
  },

  vehicleName: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  vehicleDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
    marginTop: 5,
  },
  confirmBtn: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.black,
    paddingVertical: 10,
    marginTop:10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnTxtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmBtnTxt: {
    fontFamily: Fonts.medium,
    color: colors.white,
    fontSize: 16,
  },
  vehicleDetailsTxt: {
    display: 'flex',
    flexDirection: 'row',
    gap: 3,
    fontFamily: Fonts.light,
    color: colors.grey_xdark,
    fontSize: 14,
    alignItems: 'center',
  },
  priceDetails: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
  },
  totalPrice: {
    fontFamily: Fonts.medium,
    fontSize: 20,
    color: colors.black,
  },
  discountPrice: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.grey_xdark,
  },
});


