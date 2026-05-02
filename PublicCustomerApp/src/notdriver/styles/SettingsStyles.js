import {StyleSheet} from 'react-native';
import { height, moderateScale, scale, verticalScale, width } from '../../common/utils/scalingutils';
import { Colors, Fonts } from '../../common/constants/constants';


export const termsAndConditionsScreen = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  nextBtn: {
    alignSelf: 'center',
    padding: scale(10),
    width: width * 0.8,
    backgroundColor: Colors.bright_orange,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: scale(20),
  },
  header: {
    width: width,
    backgroundColor: Colors.bright_orange,
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(50),
  },
  nextText: {
    fontFamily: Fonts.medium,
    fontSize: moderateScale(16),
    color: Colors.white,
  },
});

export const settingsScreen = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  settingHeader: {
    width: width * 0.9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  headerText: {
    fontFamily: Fonts.regular,
    fontSize: moderateScale(18),
    color: Colors.black,
  },
  settingText: {
    marginLeft: scale(20),
  },
  overlay: {
    backgroundColor: Colors.white,
    position: 'absolute',
    width: width,
    height: height,
  },
  modalHeader: {
    justifyContent: 'flex-start',
    height: 50,
  },
  buttons: {
    width: width * 0.9,
    margin: 5,
    alignSelf: 'center',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonsTxt: {
    fontFamily: Fonts.regular,
    color: Colors.black,
    marginLeft: 10,
    fontSize: 16,
    width: '80%',
  },
  settingsBg: {
    width: '100%',
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subContentCircle: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: '70%',
    backgroundColor: 'blue',
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  subContentDetails: {
    width: '41%',
    justifyContent: 'center',
  },
  activeText: {
    backgroundColor: Colors.green_sub,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.white,
    borderRadius: 5,
    paddingVertical: 5,
    width: '50%',
  },
  subscriptionTitle: {
    fontFamily: Fonts.medium,
    color: Colors.white,
    fontSize: 14,
    marginTop: 5,
  },
  renewalTxt: {
    fontFamily: Fonts.light,
    color: Colors.white,
    fontSize: 10,
    marginTop: 5,
  },
  renewalData: {
    fontFamily: Fonts.medium,
    color: Colors.white,
    fontSize: 12,
  },
  subContentProgress: {
    width: 100,
    gap: 10,
  },
  progressDevice: {
    width: '55%',
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  progressDays: {
    width: '55%',
    aspectRatio: 1,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  progressDevicenumber: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.white,
  },
  progressDeviceText: {
    fontFamily: Fonts.regular,
    fontSize: 8,
    color: Colors.white,
  },
  logoutButton: {
    // width: '100%',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'tomato',
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  logoutButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: 'white',
  },
  supportBg: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.4,
  },
  infoContainer: {
    width: '90%',
    alignSelf: 'center',
    gap: 30,
  },
  infoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  infoTitle: {
    fontFamily: Fonts.regular,
    color:'black',
    fontSize: 14,
  },
  infoTxt: {
    fontFamily: Fonts.medium,
    color: Colors.black,
    fontSize: 16,
  },
  btnContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    alignSelf: 'center',
    marginTop: 30,
  },
  actionBtns: {
    alignItems: 'center',
    justifyContent: 'center',
    gap:10
  },
  actionBtnsBg: {
    backgroundColor: Colors.periwinkle,
    width: 55,
    height: 55,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt:{
    fontFamily:Fonts.regular,
    color:"#212121",
    fontSize:12
  },
  profileContainer:{
    flexDirection:'row',
    width:'90%',
    alignSelf:'center',
    marginVertical:20,
    alignItems:'center',
    gap:10
  },
  profileImageContainer:{
    width:"23%",
    padding:10,
    height:70,
  },
  passangerImg:{
    position:'absolute',
  },
  companyImg :{
    position:'absolute',
    bottom:-9,
    right:0,    
  },
  helloTxt:{
    fontFamily:Fonts.regular,
    color:Colors.black,
    fontSize:14
  },
  nameTxt:{
    fontFamily:Fonts.medium,
    color:Colors.black,
    fontSize:20
  },
  imageView:{
    width:"100%",
    borderWidth:1,
    borderRadius:50,
    borderColor:Colors.white
  }
});

export const settingStyle = StyleSheet.create({
    title:{ 
        fontWeight: 'bold', 
        color: Colors.periwinkle, 
        fontSize: 16 
    },
    jstfy:{
        textAlign:'justify',
        color:"#212121"
    },
    screen:{
       flex:1,
       alignItems:'center'
    },
    preferenceCard:{
        width:'90%',
        padding:10,
        marginTop:10,
        backgroundColor:Colors.white,
        borderRadius:5,
        shadowColor: 'rgba(0,0,0,0.5s)',
        shadowOffset: {width: 3, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 3,
        paddingVertical:20
    },
    cardTitle:{
        fontSize:18,
        textAlign:'center',
        fontFamily:Fonts.medium,
        color:Colors.black
    },
    optionsCard:{
        flexDirection:'row',
        justifyContent:'space-evenly',
        marginTop:15,
        width:'100%',
    },
    optionsBtn:{
        alignItems:'center',
        justifyContent:'center',
        borderWidth:0.3,
        borderColor:Colors.cool_grey,
        padding:10,
        borderRadius:10,
        width:'40%'
    },
    optionsTitle:{
        fontFamily:Fonts.regular,
        fontSize:14,
        marginBottom:5,
        color:Colors.black
    },
    optionsSubTxt:{
        fontFamily:Fonts.light,
        fontSize:12,
    },
    permissionList:{
        flexDirection:'row',
        width:'90%',
        justifyContent:'space-between',
        marginTop:20,
        borderBottomWidth:1,
        borderBottomColor:Colors.pale_grey_two,
        paddingBottom:10
    },
    listView:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginVertical:10
    },
    listTitle:{
        fontFamily:Fonts.regular,
        fontSize:14,
        color:Colors.black
    },
    helpCategoryBtn:{
        backgroundColor:Colors.white,
        borderRadius:30,
        borderWidth:0.3,
        borderColor:Colors.black,
        marginRight:10,
        minWidth:50,
        paddingHorizontal:15,
        paddingVertical:5,
        alignItems:'center',
        height:30
    },
    helpCategoryTxt:{
        fontFamily:Fonts.light,
        fontSize:14,
        color:Colors.black
    }
})