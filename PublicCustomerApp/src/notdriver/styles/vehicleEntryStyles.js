import { StyleSheet } from "react-native";
import { Colors, colors, Fonts } from "../../common/constants/constants";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.white,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 20,
    },
    marginBottom10: {
      marginBottom: 10,
    },
    vehicleIconContainer: {
      gap: 5,
    },
    GenderContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'center',
    },
    GenderBtn: {
      width: '48%',
      borderWidth: 1,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
    },
    GenderTxt:{
      fontFamily:Fonts.regular,
      color:Colors.black,
      fontSize:16
    },
    vehileList:{
      flexDirection:'row',
      flexWrap:'wrap',
      gap:10,
      alignItems:'center',
      justifyContent:'space-between',
      marginBottom:10
    },
    vehileListCard:{
      backgroundColor:Colors.white_dirt,
      width:'48%',
      borderWidth:1,
      borderRadius:8,
      flexDirection:'row',
      minHeight:90,
      paddingVertical:10,
      paddingHorizontal:10
    },
    vehicleName:{
      fontFamily:Fonts.regular,
      fontSize:16,
      color:Colors.black
    },
    textField: {
      marginBottom: 10
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '90%',
      backgroundColor: Colors.white,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
    },
    modalHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    modalTitle: {
      fontFamily: Fonts.medium,
      fontSize: 18,
      color: Colors.black
    },
    colorPickerContainer: {
      width: '100%',
      height: 300,
      marginBottom: 20
    },
    colorPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20
    },
    colorSample: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      elevation: 2,
    },
    colorItem:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'center',
      marginVertical:10,
      gap:20
    },
    colorName: {
      fontFamily: Fonts.regular,
      fontSize: 16,
      color: Colors.black
    },
    selectColorBtn: {
      backgroundColor: Colors.violet,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center'
    },
    selectColorBtnText: {
      fontFamily: Fonts.medium,
      fontSize: 16,
      color: Colors.white
    },
    yearPickerContainer: {
      width: '100%',
      maxHeight: 300,
    },
    yearItem: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.grey_light,
      width: '100%',
    },
    selectedYearItem: {
      backgroundColor: Colors.periwinkle_light,
    },
    yearText: {
      fontFamily: Fonts.regular,
      fontSize: 16,
      color: Colors.black,
      textAlign: 'center',
    },
    selectedYearText: {
      fontFamily: Fonts.medium,
      color: Colors.violet,
    },
    searchContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.grey,
      borderRadius: 8,
      marginBottom: 15,
      paddingHorizontal: 10,
      position: 'relative',
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontFamily: Fonts.regular,
      fontSize: 16,
      color: Colors.black,
    },
    clearSearch: {
      padding: 5,
    },
    bottomButtonContainer: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.grey_light,
      backgroundColor: Colors.white,
      
    },
    documentContainer:{
      width:'100%',
      height:100,
      backgroundColor:Colors.white_dirt,
      borderRadius:8,
      padding:10,
      marginBottom:10
    },
    uploadBtn:{
      backgroundColor:Colors.periwinkle,
      padding:10,
      borderRadius:8,
      alignItems:'center',
      justifyContent:'center'
    },
    uploadBtnText:{
      fontFamily:Fonts.medium,
      fontSize:16,
      color:Colors.white
    },vehicleImageContainer:{
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'center',
      gap:10
    },
    radioButtonContainer:{
      flexDirection:'row',
      alignItems:'center',
      gap:10
    },
    radioButton:{
     
      borderColor:Colors.grey,
      alignItems:'center',
      justifyContent:'center'
    },
    radioButtonWrapper:{
      width:'40%',
      paddingVertical:10,
       borderRadius:10,
      borderWidth:1,
      marginVertical:10
    },
    radioButtonTxt:{
      fontFamily:Fonts.regular,
      fontSize:14,
      color:Colors.black,
    }
  });

