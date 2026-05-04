import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import useCurrentScreenStore from '../../../common/store/useCurrentScreenStore';
import UseBackButton from '../../../common/hooks/UseBackButton';
import { Fonts } from '../../../common/constants/constants';
import { useTranslation } from 'react-i18next';

const PaymentsScreen = () => {
    const {setCurrentScreen} = useCurrentScreenStore();
    const {t} = useTranslation()

    const onBackPress = () => {
      setCurrentScreen('Map');
    }

  return (
    <View style={styles.screen}>
        <UseBackButton onBackPress={onBackPress} />
         <View style={styles.headerContainer}>
           <Text style={styles.headerContainerText}>{t('payments')}</Text>
         </View>
    </View>
  )
}

export default PaymentsScreen

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  headerContainer:{
    justifyContent:'center',
    paddingVertical:20,
    backgroundColor:'white',
    elevation:5,
    paddingHorizontal:30
  },
  headerContainerText:{
    fontSize:18,
    fontFamily:Fonts.medium
  }
})
