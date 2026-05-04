import { StyleSheet } from "react-native";
import { Colors, colors, Fonts } from "../../common/constants/constants";


export const driverDetailStyles = StyleSheet.create({
    tabContainer: {
        width: '90%',
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 20,
      },
      titleText: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: Colors.grey_dark,
      },
      selectedtitleText: {
        color: Colors.yellow,
        fontFamily: Fonts.medium,
        fontSize: 16,
        textDecorationLine: 'underline',
      },
      tabBtns: {
        width: '50%',
        alignItems: 'center',
      },
      subConatiner:{
        width:'90%',
        alignSelf:'center',
        marginTop:10
      },
      GenderLabel: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.black,
        alignSelf: 'flex-start',
        marginTop: 18,
        marginBottom: 6,
      },
      GenderContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingBottom: 15,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
      },
      GenderBtn: {
        width: '48%',
        borderWidth: 1.5,
        borderColor: Colors.grey_light,
        backgroundColor: Colors.grey_light,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        shadowColor: '#00000020',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
      GenderTxt: {
        fontFamily: Fonts.medium,
        color: Colors.black,
        fontSize: 16,
      },
      nextBtn: {
        width: '100%',
        alignSelf: 'center',
        backgroundColor: Colors.periwinkle,
        padding:15,
        gap: 8,
        borderRadius:10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      },
      nextTxt: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: Fonts.semi_bold,
      },
      container: {
        flex: 1,
        backgroundColor: Colors.white,
      },
      infoContainer: {
        backgroundColor: Colors.periwinkle_light,
        marginTop: 10,
        width: '90%',
        alignSelf: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 5,
      },
      infoText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.black,
      },
      imageuploadContainer:{
        width:'90%',
        alignSelf:'center',
        alignItems:'center',
        justifyContent:'center',
        borderWidth:0.3,
        backgroundColor:Colors.white_dirt,
        marginVertical:10,
        borderRadius:8,
        gap:5,
        paddingVertical:20
      },
      imageContainer:{
        width:'90%',
        alignItems:'center',
        marginVertical:10,
        alignSelf:'center'
      },
      browseBtn:{
        backgroundColor:Colors.black,
        paddingVertical:10,
        width:'45%',
        borderRadius:8,
        alignItems:'center',
        marginVertical:10,
        paddingHorizontal:10
      },
      browseBtnTt:{
        fontFamily:Fonts.medium,
        fontSize:16,
        color:Colors.white
      },
      uploadText:{
        color:Colors.black,
        fontSize:16,
        fontFamily:Fonts.light,
        marginTop:5
      },
      btnContainer:{
       
        flexDirection:'column',
        alignSelf:'center',
        justifyContent:'center',
        gap:10
      }
  });

