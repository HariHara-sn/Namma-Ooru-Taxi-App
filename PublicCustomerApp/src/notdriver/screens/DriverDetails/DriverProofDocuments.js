import { StyleSheet, Text, View } from 'react-native'
import React, { use } from 'react'
import { useStackScreenStore } from '../../../common/store/useStackScreenStore'
import NavBar from '../../../common/components/NavBar'
import UseBackButton from '../../../common/hooks/UseBackButton'
import DocumentsListScreen from '../DriverVehicleDetails/DocumentsListScreen'
import { Colors } from '../../../common/constants/constants'
import { useTranslation } from 'react-i18next'
import DriverProofDoc from '../DriverDocumentCenter/DriverProofDoc'

const DriverProofDocuments = () => {
    const {t} = useTranslation()
    const {goBack} = useStackScreenStore()

    const onBackPress = () => {
        goBack()
    }

  return (
    <View style={styles.container}>
        {/* <NavBar title={t('proof_documents')} onBackPress={onBackPress}/>
        <UseBackButton onBackPress={onBackPress} />
        <View style={styles.documentsListContainer}> */}
        <DriverProofDoc isEdit={true}/>
        {/* </View> */}
       
    </View>
  )
}

export default DriverProofDocuments

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: Colors.white,
    },
    documentsListContainer:{
        width:'90%',
        alignSelf:'center'
    }
})