import { StyleSheet, View } from 'react-native'
import React from 'react'
import { useStackScreenStore } from '../../../common/store/useStackScreenStore'
import { Colors } from '../../../common/constants/constants'
import { useTranslation } from 'react-i18next'
import DriverEntry from '../DriverDocumentCenter/DriverEntry'

const DriverPersonalInfo = () => {
    const { t } = useTranslation()
    const {goBack} = useStackScreenStore()

    const onBackPress = () => {
        goBack()
    }

  return (
    <View style={styles.container}>
        {/* <NavBar title={t('personal_information')} onBackPress={onBackPress}/>
        <UseBackButton onBackPress={onBackPress} /> */}
        {/* <View style={styles.personalInfoContainer}>  */}
            <DriverEntry isEdit={true}/>
        {/* </View> */}
    </View>
  )
}

export default DriverPersonalInfo

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: Colors.white,
    },
    personalInfoContainer:{
        width:'90%',
        alignSelf:'center'
    }
})