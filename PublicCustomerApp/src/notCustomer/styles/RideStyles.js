import { StyleSheet } from "react-native";
import { colors, Fonts } from "../constants/constants";

export const rideStyles = StyleSheet.create({
    containerMain: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
    },
    container:{
      backgroundColor: colors.white,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -3,
      },
      shadowOpacity: 0.50,
      shadowRadius: 5,

    },
    title: {
      backgroundColor: colors.white,
      marginTop:10,
      flexDirection:"column",
      gap:5,
      paddingVertical: 10,
      width: '90%',
      alignSelf: 'center',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleTxt: {
      margin:0,
      color: colors.black,
      fontFamily: Fonts.regular,
      fontSize: 16,
    },
    statusBox: {
      paddingHorizontal: 10,
      borderRadius: 15,
    },
    contentContianer: {
      backgroundColor: colors.white,
      width: '100%',
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
    },
    carDetailsCard: {
      backgroundColor: colors.white,
      marginTop: 10,
      width: '90%',
      alignSelf: 'center',
      justifyContent:'center',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      alignItems: 'center',
      marginBottom:10,
      borderWidth:0.3,
    },
    vehicleNum: {
      fontFamily: Fonts.semi_bold,
      fontSize: 24,
      color: colors.black,
    },
    vehicleType: {
      fontFamily: Fonts.light,
      fontSize: 14,
      color: colors.grey_xxdark,
    },
    driverDetails: {
      width: '90%',
      alignSelf: 'center',
      justifyContent:'center',
      paddingVertical: 10,
      flexDirection: 'row',
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      resizeMode: 'cover',
      borderWidth:1,
      borderColor:colors.grey_dark,
      marginBottom:10,
      alignSelf:'center'
    },
    profileContainer: {
      width: '20%',
      alignItems: 'center',
      overflow: 'hidden',
    },
    rating: {
      backgroundColor: colors.white,
      bottom: 10,
      alignSelf: 'center',
      paddingHorizontal: 10,
      borderRadius: 5,
      elevation: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    profileNameContainer: {
      width: '50%',
      justifyContent: 'center',
      paddingLeft: 10,
      gap: 5,
    },
    driverName: {
      fontFamily: Fonts.medium,
      color: colors.black,
      fontSize: 16,
    },
    driverratingTxt: {
      fontFamily: Fonts.regular,
      color: colors.grey_xxdark,
      fontSize: 12,
    },
    otpContainer: {
      width: '30%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    otpTitle: {
      fontFamily: Fonts.semi_bold,
      fontSize: 12,
      color: colors.black,
    },
    otpNum: {
      fontFamily: Fonts.medium,
      fontSize: 20,
      color: colors.black,
      borderWidth:1,
      backgroundColor:colors.yellow_light,
      borderRadius:5,
      borderColor:colors.white,
      paddingHorizontal:5,
      alignItems:'center'   
    },
    vehicleDetails:{
      borderWidth:0.3,
      width:'25%',
      flex:1,
      alignItems:'center',
      paddingVertical:10,
      gap:10,
      borderColor:colors.grey_dark,
      
    },
    callBtn:{
      flex:1,
      flexDirection:'row',
      width:'65%',
      backgroundColor:colors.call_green,
      alignItems:'center',
      borderRadius:10,
      paddingVertical:15,
      justifyContent:'center',
      gap:10
    },
    msgBtn:{
      backgroundColor:colors.message_blue,
      width:'15%',
      alignItems:'center',
      justifyContent:'center',
      borderRadius:15,
      marginLeft:10,
    },
    closeBtn:{
      backgroundColor:colors.cance_red,
      width:'15%',
      alignItems:'center',
      justifyContent:'center',
      borderRadius:15,
      marginLeft:10,
    },
    callTxt:{
      fontFamily:Fonts.medium,
      fontSize:12,
      color:colors.white
    },
    driverDetailsB:{
      width:'90%',
      paddingHorizontal:10,
      alignSelf:'center'
    },
    OnRideText:{
      backgroundColor:colors.message_blue,
      alignSelf:'flex-end',
      top:10,
      width:'28%',
      textAlign:'center',
      paddingVertical:5,
      color:colors.white,
      fontFamily:Fonts.regular,
      borderRadius:15
    },
    profilePic:{
      width: 80,
      height: 80,
      borderRadius: 40,
      resizeMode: 'cover',
      alignSelf:'center'
    },
    profileName:{
      fontFamily:Fonts.medium,
      color:colors.black,
      fontSize:20,
      textAlign:'center',
      marginTop:10
    },
    carType:{
      fontFamily:Fonts.regular,
      color:colors.black,
      fontSize:12,
      textAlign:'center',
      marginTop:10
    },
    endRideContainer:{
      flex:1,
      backgroundColor:'rgba(0, 0, 0, 0.3)',
      zIndex:9
    },
    rideCompleteTxt:{
      fontFamily:Fonts.regular,
      fontSize:16,
      color:colors.grey_xxdark,
      textAlign:'center',
      marginTop:20
    }
  });


