import { StyleSheet } from "react-native";
import { colors, Fonts } from "../constants/constants";

export const rideSummary = StyleSheet.create({
    priceContainer: {
      width: '90%',
      height: 120,
      alignSelf: 'center',
      borderRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageBg: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    rideFare: {
      fontFamily: Fonts.light,
      fontSize: 16,
      color: colors.white,
    },
    rideFareAmount: {
      fontFamily: Fonts.semi_bold,
      fontSize: 40,
      color: colors.white,
    },
    headerDate: {
      fontFamily: Fonts.medium,
      fontSize: 16,
      color: colors.black,
      textAlign: 'center',
      marginTop: 15,
    },
    headerTipId: {
      fontFamily: Fonts.light,
      fontSize: 14,
      color: colors.grey_xxdark,
      textAlign: 'center',
      marginTop: 10,
    },
    seperater: {
      borderWidth: 0.2,
      width: '90%',
      alignSelf: 'center',
      marginTop: 15,
      borderColor: colors.grey_dark,
    },
    titles: {
      fontFamily: Fonts.medium,
      color: colors.black,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 15,
    },
    rideDetails: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 15,
      width: '90%',
      alignSelf: 'center',
    },
    rideDetailsCards: {
      width: '30%',
      backgroundColor: 'red',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 10,
      gap: 5,
    },
    rideDetailsCardsText: {
      fontFamily: Fonts.light,
      fontSize: 14,
      color: colors.black,
      textAlign: 'center',
    },
    rideDetailsText: {
      fontFamily: Fonts.medium,
      fontSize: 16,
      color: colors.black,
      textAlign: 'center',
    },
    payBtn:{
      width:'90%',
      backgroundColor:colors.green,
      paddingVertical:12,
      marginVertical:10,
      alignSelf:'center',
      borderRadius:10,
      alignItems:'center'
    },
    payBtnTxt:{
      fontFamily:Fonts.medium,
      color:colors.white
    },
    billView:{
      width:'90%',
      alignSelf:'center',
      backgroundColor:colors.white_dirt,
      marginVertical:10
    },
    billContents:{
      flexDirection:'row',
      justifyContent:'space-between',
      width:'90%',
      alignSelf:'center',
      marginVertical:10
    },
    billTitle:{
      fontFamily:Fonts.light,
      color:colors.grey
    },
    billPrice:{
      fontFamily:Fonts.light,
      color:colors.grey_xxdark,
      fontSize:16
    },
    billTitleTotal:{
      fontFamily:Fonts.medium,
      color:colors.grey,
      fontSize:16
    },
    billPriceTotal:{
      fontFamily:Fonts.medium,
      color:colors.black,
      fontSize:16
    },
    input:{
      fontFamily:Fonts.regular,
      fontSize:12,
      minHeight:100,
      backgroundColor:colors.white_dirt,
      marginTop:10
    },
    submitBtn:{
      backgroundColor:colors.green,
      alignSelf:'flex-end',
      marginRight:15,
      flexDirection:'row',
      alignItems:'center',
      paddingVertical:10,
      paddingHorizontal:20,
      borderRadius:10,
      marginTop:10
    },
    submitBtnTxt:{
      fontFamily:Fonts.medium,
      fontSize:16,
      color:colors.white
    }
  });

