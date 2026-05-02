import { StyleSheet } from 'react-native';
import { height } from '../utils/Utils';

const RideNowTripsStyles = StyleSheet.create({
  ridenowTripCreateContainer: {
    position: 'relative',
    flex: 1,
  },
  ridenowTopSelectContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    position: 'absolute',
    top: 75,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  ridenowTopSelectOption: {
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-between',
    // flexDirection: 'row',
    gap: 10,
  },
  ridenowTopSelectOptionIcon: {
    width: 15,
    height: 15,
    objectFit: 'contain',
  },
  ridenowTopSelectDropdownIcon: {
    width: 15,
    height: 20,
    objectFit: 'contain',
  },
  ridenowTripCreateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 15,
    width: '100%',
    paddingLeft: 25,
    paddingRight: 25,
  },
  ridenowTripCreateHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
  mapStyle: {
    flex: 1,
    width: '100%',
  },
  ridenowTripLocationInputsMain: {
    position: 'absolute',
    top: 150,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ridenowTripLocationInputsContainer: {
    position: 'relative',
    width: '90%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'column',
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  ridenowTripLocationInputContainer: {
    width: '100%',

    position: 'relative',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    position: 'relative',
    borderWidth: 0,
    borderTopColor: '#eeeeee',
    borderTopWidth: 1,
  },
  ridenowTripCreateHeaderInput: {
    color: 'black',
    width: '80%',
    paddingLeft: 10,
    paddingTop: 20,
    paddingBottom: 0,
  },
  ridenowTripCreateConfirmBtn: {
    position: 'absolute',
    bottom: 20,
    right: 50,
    left: 50,

    backgroundColor: '#212121',
    justifyContent: 'center',
    color: 'white',

    width: 'auto',
    height: 'auto',
    paddingTop: 15,
    paddingBottom: 15,
  },

  ridenowTripCreateInputIcon: {
    height: 20,
    width: 18,
    paddingRight: 10,
  },

  inputLabel: {
    position: 'absolute',
    top: 10,
    left: 40,
  },

  addWaypointbutton: {
    position: 'absolute',
    // top: '46%',
    top: 45,
    right: 12,
    zIndex: 1000,
    flex: 1,
    flexDirection: 'row',
  },

  addWaypointbuttonIcon: {
    height: 35,
    width: 35,
    objectFit: 'contain',
  },

  deleteWaypointbutton: {
    position: 'absolute',
    top: '46%',
    right: 5,
    zIndex: 1000,
    flex: 1,
    flexDirection: 'row',
  },

  deleteWaypointbuttonIcon: {
    height: 15,
    width: 15,
    objectFit: 'contain',
  },

  dropdownContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',

    width: '100%',
    height: height,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  dropdownContent: {
    width: '100%',
    height: 350,
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    padding: 10,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  dropdownOptions: {
    width: '100%',
  },
  scheduleTripTodayContainer: {
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffe6',
  },
  scheduleTripDateContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    height: 100,
  },
  scheduleTripDateItem: {
    padding: 5,
    width: 50,
    height: 50,
    marginLeft: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    gap: 1,
    backgroundColor: '#eeeeee',
  },
  scheduleTripButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  scheduleTripButton: {
    width: 150,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eeeeee',
    borderRadius: 10,
  },
});

const searchStyle = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginLeft: 25,
    marginRight: 25,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },

  searchItem: {
    padding: 10,
  },
});

const searchForDriverStyle = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 250,
    backgroundColor: 'white',
    zIndex: 200,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subText: {
    color: 'black',
    fontSize: 14,
    marginBottom: 50,
  },
});

const textStyle = StyleSheet.create({
  textnormal: {
    color: '#212121',
    fontSize: 16,
  },
  textbold: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 18,
  },
  textsmall: {
    color: '#757575',
    fontSize: 12,
  },
  text_extrabold: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 22,
  },
});

const img_iconStyle = StyleSheet.create({
  locIcon: {
    width: 16,
    height: 16,
    objectFit: 'contain',
    marginTop: 5,
  },
  iconContainer_large: {
    width: '25%',
    height: 40,
    alignItems: 'center',
  },
  iconLarge: {
    width: '25%',
    height: 40,
  },
  iconContainer_xlarge: {
    width: '15%',
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon_xLarge: {
    width: '100%',
    aspectRatio: 1,
    objectFit: 'contain',
  },
  locIconContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  iconsmall: {
    width: 13,
    height: 13,
    objectFit: 'contain',
    margin: 4,
  },
  image_container: {
    width: '20%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalfare_bg: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const commonStyles = StyleSheet.create({
  subContainerBlack: {
    width: '94%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  timeContinaer: {
    alignItems: 'center',
    gap: 5,
  },
  tripDetailsContainer: {
    marginTop: 14,
    borderTopWidth: 0.3,
    width: '94%',
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderColor: '#757575',
  },
  carDriver_details: {
    width: '90%',
    gap: 8,
  },
  conatinerRow: {
    position: 'relative',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardSmall: {
    width: '28%',
    padding: 10,
    margin: 4,
  },
  cardscontainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '94%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  inputstyles: {
    backgroundColor: '#fafafa',
    width: '100%',
    height: 80,
    borderRadius: 10,
  },
  submitBtnContainer: {
    width: '94%',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#237b53',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  getHelpContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    width: '94%',
    alignSelf: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
  },
  homeBtn: {
    width: '80%',
    alignSelf: 'center',
    backgroundColor: '#212121',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
  location: {
    width: '100%',
    gap: 20,
    borderRadius: 15,
    padding: 15,
    position: 'relative',
  },
  locContent: {
    width: '100%',
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  locIconContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  call_button: {
    width: '60%',
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#329782',
  },
  modalContent: {
    width: '80%',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    padding: 10,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 10,
  },
  buttonComponent: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
  },
  priceDetails: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 10
  },
  priceDetails_container: {
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 30,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
  },

  carDetailsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    paddingTop: 10,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  carImage: {
    width: 200,
    height: 150,
    objectFit: 'contain',
  },
  carDetailsTextContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  carName: {
    fontWeight: 'bold',
    fontSize: 24,
    color: 'red',
  },
  carDistanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  carCapacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  carPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  carPriceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c9a18',
  },
  successContainer: {
    width: '94%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  successImage: {
    width: 100,
    height: 80,
    objectFit: 'contain',
  },
  successTextContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  boldText: {
    width: '60%',
    fontSize: 12,
    color: 'red',
  },
  successDescription: {
    width: '60%',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c9a18',
  },
  cancelButton: {
    backgroundColor: 'red',
  },
  cancelButtonText: {
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20
  },
  modalText: {
    color: 'black',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: 'red',
    width: '40%'
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  confirmButton: {
    width: '80%',
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#212121',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  optimizeButtonContainer: {
    width: '15%',
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1e1',
  },
  locationTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  changePaymentContainer: {
    backgroundColor: '#f5f5f5',
  },
  changePaymentText: {
    color: '#189a76',
  },
  location_Icon: {
    width: 16,
    height: 16,
    objectFit: 'contain',
  }
});

const bottomSheetView = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.6,
  },
  sosButton: {
    padding: 2,
    backgroundColor: 'red',
    borderRadius: 40,
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginRight: 20,
  },
  sosButtonContent: {
    borderWidth: 1,
    borderColor: 'white',
    padding: 15,
    borderRadius: 40,
  },
  sosButtonText: {
    color: 'white',
  },
  otpButton: {
    backgroundColor: 'blue',
    alignSelf: 'flex-end',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginRight: 20,
  },
  otpButtonText: {
    color: 'white',
  },
  otpText: {
    color: 'white',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'white',
    shadowColor: 'red',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 10,
  },
})

const vehicleListStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 350,
  },
  scrollViewContent: {
    paddingBottom: 60,
    paddingHorizontal: 10,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: 'white',
  },
  vehicleInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleColorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 70,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
  },
  vehicleImage: {
    // Adjust image styles as needed
  },
  vehicleDetailsContainer: {
    flexDirection: 'column',
    gap: 5,
  },
  vehicleLabel: {
    fontWeight: 'bold',
    color: 'black',
  },
  vehicleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailsIconContainer: {
    // Add styles for icon container if needed
  },
  detailsIcon: {
    width: 13,
    height: 13,
    objectFit: 'contain',
  },
  detailsText: {
    fontSize: 13,
    color: 'gray',
  },
  fareContainer: {
    paddingLeft: 25,
    borderLeftColor: '#eeeeee',
    borderLeftWidth: 1,
  },
  fareText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'black',
  },
});

module.exports = {
  RideNowTripsStyles,
  searchForDriverStyle,
  searchStyle,
  textStyle,
  img_iconStyle,
  commonStyles,
  bottomSheetView,
  vehicleListStyles
};
