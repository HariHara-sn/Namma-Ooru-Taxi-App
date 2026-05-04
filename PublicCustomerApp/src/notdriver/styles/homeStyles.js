import {StyleSheet} from 'react-native';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { moderateScale, verticalScale, width } from '../../common/utils/scalingutils';



export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  userdetails: {
    padding: 8,
    marginTop: 10,
    zIndex: 1,
    position: 'absolute',
  },
  detailBtns: {
    flexDirection: 'row',
  },
  bellIcon: {
    backgroundColor: Colors.warm_grey_two,
    borderRadius: 50,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTxt: {
    color: Colors.black,
    fontFamily: Fonts.light,
    fontSize: moderateScale(16),
  },
  userName: {
    color: Colors.black,
    fontFamily: Fonts.medium,
    fontSize: moderateScale(24),
    marginTop: 6,
  },
  detailBtn: {
    backgroundColor: Colors.warm_grey_two,
    marginRight: 5,
    borderRadius: 15,
    alignItems: 'center',
    height: verticalScale(40),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  detailBtnTxt: {
    fontFamily: Fonts.light,
    color: Colors.white,
    fontSize: moderateScale(14),
  },
  alertContainer: {
    backgroundColor: Colors.white,
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mapScreenSearchComponent: {
    width: '80%',
    backgroundColor: Colors.pale_grey,
    borderWidth: 2,
    borderColor: Colors.white_three,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    overflow: 'hidden',
    alignSelf:'flex-end',
    marginRight:10,
    zIndex:99,
    height:50,
  },
  mapScreenSearchbox: {
    width: '95%',
    marginLeft: 10,
    fontFamily: Fonts.light,
    color: Colors.black,
    fontSize: 14,
    zIndex:999,
  },
  liveStatsContainer: {
    width: '92%',
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
    height: 40,
  },
  liveStatsSubContainer: {
    flexDirection: 'row',
    width: '40%',
  },
  vehicleCountContainer: {
    backgroundColor: Colors.white,
    minWidth: '38%',
    maxWidth: '40%',
    elevation: 3,
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    overflow: 'hidden',
    shadowColor:Colors.black,
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.25,
    shadowRadius:3.84,
  },
  vehicleCount: {
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  mapIconsContainer: {
    height: 100,
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: width * 0.06,
    zIndex:-1
  },
  mapIconBtns: {
    backgroundColor: Colors.white,
    borderRadius: 50,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 3, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 5,
  },
  bottomCardContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 75,
  },
  mobileDetailsContainer:{
    backgroundColor:Colors.white,
    // position:'absolute',
    padding:10,
    borderRadius:10,
    shadowColor:Colors.black,
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.25,
    shadowRadius:3.84,
    elevation:5,
  },
  deviceCountText:{
    fontFamily:Fonts.regular,
    color:Colors.black,
    fontSize:14,
  }
});


