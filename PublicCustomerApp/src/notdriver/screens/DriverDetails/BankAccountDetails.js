import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useStackScreenStore } from '../../../common/store/useStackScreenStore'
import NavBar from '../../../common/components/NavBar'
import UseBackButton from '../../../common/hooks/UseBackButton'
import { Colors } from '../../../common/constants/constants'
import usePublicDriverStore from '../../store/usePublicDriverStore'
import BankDetails from '../DriverDocumentCenter/BankDetails'


const BankAccountDetails = () => {
    const {goBack} = useStackScreenStore()
    const {razorpayLinkedAccountDetails} = usePublicDriverStore();

    // console.log("Razorpay Linked Account Details:", razorpayLinkedAccountDetails);

    const onBackPress = () => {
        goBack()
    }

    const editView = razorpayLinkedAccountDetails ? true : false
  return (
    <View style={styles.container}>
        {/* <NavBar title={'Bank Account Details'} onBackPress={onBackPress}/> */}
        <UseBackButton onBackPress={onBackPress} />
        <View style={styles.documentsListContainer}>
         <BankDetails isView={editView} isEdit={editView} isUploadRequired={editView}/>
        </View>
    </View>
  )
}

export default BankAccountDetails

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: Colors.white,
    },
    documentsListContainer:{
        alignSelf:'center',
        flex:1
    }
})