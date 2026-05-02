import {StyleSheet} from 'react-native';
import {colors, Fonts} from '../constants/constants';
import {height, width} from '../utils/Utils';

export const drawerStyles = StyleSheet.create({
  container: {backgroundColor: 'rgba(0, 0, 0, 0.5)', flex: 1, position:'absolute',zIndex:9999,height:"100%",width:"100%",display:"flex",flexDirection:"row",justifyContent:"flex-start",alignItems:"flex-start"},
  drawercontainer: {
    width: width * 0.75,
    backgroundColor: colors.white,
    height:400,
    width:"70%",
    height:"100%",
   
  },
  divider:{
    width:"90%",
    height:1,
    backgroundColor:colors.grey_xlight,
    alignSelf:"center"
  },
  closeBtnMainContainer:{
    width:"auto",
    height:"100%",


  },
  closeBtnContainer:{
    backgroundColor:"white",
    borderRadius:20,
    padding:10,
    margin:10,
    marginTop:40,
    marginLeft:30
   
  },
  profileContainer:{
    width:'90%',
    marginTop:20,
    flexDirection:'row',
    alignItems:'center',
    paddingVertical:10,
    alignSelf:'center',
    gap:15,
    padding:10,
    backgroundColor:colors.grey_xlight,
    borderRadius:10,
   
  },
  userName:{
    fontFamily:Fonts.semi_bold,
    fontSize:16,
    color:'white',
    width:"75%",
    textTransform:"capitalize"
  },
  ratingText:{
    fontFamily:Fonts.regular,
    fontSize:12,
    color:'white',
   
    textTransform:"capitalize",
    letterSpacing:1.5,
    width:"105%"
    
  },
  contentContainer:{
    marginTop:10,
    width:'100%',
    alignSelf:'center',
    padding:10,
    paddingBottom:height*0.15,
  },
  drawerBtns:{
    width:'100%',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    gap:10,
    paddingVertical:20,
    paddingHorizontal:5,
   
    
  },
  btnText:{
    fontFamily:Fonts.regular,
    fontSize:17,
    color:colors.black,
    textWrap:"wrap",
    maxWidth:'95%',
    
  }
});
