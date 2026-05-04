import {StyleSheet} from 'react-native';
import { colors, Fonts } from '../constants/constants';

export const navStyles = StyleSheet.create({
  navContainer: {
    width: '100%',
    zIndex: 3,
    minHeight:50,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignSelf: 'center',
   
  },
  leftIcon: {
    
    
    minHeight:50,
    position:"absolute",
    justifyContent:"center",
    alignItems:"center",
    zIndex:5,
    

    
    
  },
  leftBtn: {
    padding:5,
    marginLeft:10,
    alignItems:'center',
    backgroundColor:'white',
    borderRadius:50,
    
    
    
  
   
  },
  rightIcon: {
    position:"absolute",
    right:0,
    zIndex:100000,
    width: '20%',
    padding: 13,
    alignItems:'center',
    justifyContent:'center',
  
  },
  content: {
    flex:1,
    alignItems: 'center',
  },
  leftcontent: {
    alignItems: 'flex-start',
  },
  contentTxt: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 17,
    textAlign:'center'
  },
  leftcontentTxt: {
    fontFamily: Fonts.regular,
    color: colors.black,
    fontSize: 16,
    textAlign:'left',
    paddingLeft:0
  },
});


