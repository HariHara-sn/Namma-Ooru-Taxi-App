
import {StyleSheet} from 'react-native';
import {colors, Fonts} from '../constants/constants';
import {height, width} from '../utils/Utils';
import { AutoScroll } from 'recyclerlistview';

export const vehicleDetailsStyles = StyleSheet.create({
    detailsContainer:{
        flexDirection:'row',
        backgroundColor:colors.white_dirt,
        width:'90%',
        alignSelf:'center',
        borderRadius:10,
        marginTop:10,
        paddingVertical:10,
        gap:10,
        paddingHorizontal:10,
        alignItems:'center'
        
    },
    vehicleImageContainer:{
        width: "50%",
        alignItems:'center',
        justifyContent:'center'
    },
    vehicleImageBg:{
        position:'absolute',
        left:0,
        width: '40%',
        height: '100%',
        borderRadius:10,
        borderTopRightRadius:50,
        borderBottomRightRadius:50,
        backgroundColor: colors.yellow,
    },
    vehicleImage:{
        width: 170,
        height: 150,
        resizeMode: 'contain'
    },
    durationContainer:{
        flexDirection:'row',
        gap:10
    },
    name:{
        fontFamily:Fonts.semi_bold,
        color:colors.black,
        fontSize:24
    },
    durationTxt:{
        fontFamily:Fonts.light,
        color:colors.black,
        fontSize:14,
        marginVertical:3
    },
    fareTxt:{
        fontFamily:Fonts.medium,
        color:colors.green,
        fontSize:24,
        marginVertical:3
    },
    locationContainer:{
        backgroundColor:colors.white_dirt,
        width:'90%',
        alignSelf:'center',
        borderRadius:10,
        marginTop:10,
        paddingVertical:5,
        paddingHorizontal:10,
        display:'flex',
        flexDirection:'column',
        gap:10
    },
    locationNames:{
        flexDirection:'row',
        gap:10,
        alignItems:'center'
        
    },
    locationTxtContainer:{
        flex:1,
        paddingHorizontal:10,
        paddingVertical:5
    },
    locationTxt:{
        fontFamily:Fonts.regular,
        fontSize:14,
        color:colors.black,
       
    },
    paymentContainer:{
        backgroundColor:colors.white_dirt,
        width:'90%',
        alignSelf:'center',
        borderRadius:10,
        marginTop:10,
        paddingVertical:10,
        paddingHorizontal:10,
        flexDirection:'row',
        justifyContent:'space-between'
    },
    paymentTxt:{
        fontFamily:Fonts.regular,
        fontSize:16,
        color:colors.black,
        flexDirection:'row',
        alignItems:'center',
        gap:10
    },
    cnfrmBtn:{
        backgroundColor:colors.green,
        width:'90%',
        alignSelf:'center',
        borderRadius:10,
        marginTop:20,
        paddingVertical:10,
        paddingHorizontal:10,
        alignItems:'center'
    },
    paymentOptionsContainer:{
        backgroundColor:colors.white_dirt,
        width:'90%',
        alignSelf:'center',
        borderRadius:10,
        borderTopRightRadius:0,
        borderTopLeftRadius:0,
        paddingVertical:10,
        paddingHorizontal:10,
     
    },
    paymentOption:{
        paddingVertical:10,
        paddingHorizontal:10,
       
    },
    
    
    cnfrmBtnTxt:{
        color:colors.white,
        fontFamily:Fonts.medium,
        fontSize:16
    },
    dateTimeText:{
        width:'70%',
        color:colors.black,
        fontSize:16,
        fontFamily:Fonts.regular
    },
    changeBtn:{
        color:colors.violet,
        fontSize:16,
        fontFamily:Fonts.regular
    },
    successMsg:{
        fontFamily:Fonts.regular,
        fontSize:14,
        color:colors.black,
        width:'60%'
    },
    successMsgDriver:{
        fontFamily:Fonts.light,
        fontSize:14,
        color:colors.grey_dark,
        width:'60%'
    },
    priceContainer:{
        backgroundColor:colors.yellow_light,
        width:'90%',
        alignSelf:'center',
        marginVertical:10,
        alignItems:'center',
        justifyContent:'space-evenly',
        flexDirection:'row',
        paddingVertical:10,
        borderRadius:10,
    },
    priceContainerTxt:{
        fontFamily:Fonts.light,
        fontSize:16,
        color:colors.black,
        textAlign:'center'
    },
    priceTxt:{
        fontFamily:Fonts.medium,
        fontSize:24,
        color:colors.black
    }
});