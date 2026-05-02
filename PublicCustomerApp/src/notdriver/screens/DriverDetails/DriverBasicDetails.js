import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Modal } from 'react-native'
import React, { useContext, useState } from 'react'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import StarRating from 'react-native-star-rating-widget'
import { useStackScreenStore } from '../../../common/store/useStackScreenStore'
import usePublicDriverStore from '../../store/usePublicDriverStore'
import publicrideDriverApi from '../../api/publicrideDriverApi'
import useUserStore from '../../../common/store/useUserStore'
import APIRequest from '../../../common/APIRequest'
import BGLocationTask from '../../../common/controllers/BGLocationTask'
import { showNotification } from '../../../common/components/Alerts/showNotification'
import { Colors, Fonts } from '../../../common/constants/constants'
import FullScreenLoader from '../../../common/loaders/FullScreenLoader'
import NavBar from '../../../common/components/NavBar'
import UseBackButton from '../../../common/hooks/UseBackButton'
import { vehicleList } from '../../../common/constants/jsonData'
import { useTranslation } from 'react-i18next'


// import Idcard from '../../../Assets/driverIcons/idcard.svg'

const DriverBasicDetails = () => {
   const {t} = useTranslation()
   const {goBack, setStackScreen} = useStackScreenStore();
   const {vehicleInfo} = usePublicDriverStore();
   const [isModalVisible, setIsModalVisible] = useState(false);
   const {userInfo} = useUserStore()
   const [isLoading, setIsLoading] = useState(false)
   const {userRole} = useUserStore();
   const { driverRatings, razorpayLinkedAccountDetails, setRazorpayLinkedAccountDetails, razorpayUpdated} = usePublicDriverStore();
   
    const onBackPress = () => {
        goBack()
    }

    const handleEditDocuments = () => {
        // setIsModalVisible(true);
         setStackScreen('EditDocCenter');
                BGLocationTask.stopDriverBgTask();
    }

    const handleEditDocumentsAPI = async () => {
        setIsLoading(true)
        const api = new APIRequest();
        const url = `/publicrides/driver/v2/requestEditDocuments`;
        try {
            const res = await api.request(url, 'GET', {}, userInfo?.token);
            if(res.success){
                setIsModalVisible(false);
                setStackScreen('DocumentCenter');
                BGLocationTask.stopDriverBgTask();
            } else {
                showNotification(res?.message || 'Something went wrong', 'error')
                setIsModalVisible(false);
            }        setIsLoading(false)
        } catch (error) {
            console.log(error, 'error in handleEditDocumentsAPI')
            showNotification(error?.message || 'Something went wrong', 'error')
            setIsModalVisible(false);
            setIsLoading(false)
        } 
    }

    const handleConfirmEdit = () => {
        // if (driverDue && driverDue > 0)  {
        //     showNotification('You have pending due ammount','Please clear all due before editing documents', 'error')
        //     setIsModalVisible(false);
        //     return
        // }
        handleEditDocumentsAPI()
    }

    const handleCancelEdit = () => {
        setIsModalVisible(false);
    }

    const handleCheckStatus = async () => {
        try {
            setIsLoading(true);
            const res = await publicrideDriverApi.getDriverDetails(userInfo?.token);
            if (res?.success) {
                const details = res?.driver?.razorpayLinkedAccountDetails || null;
                setRazorpayLinkedAccountDetails(details);
                showNotification(details?.accountDetails?.activation_status?.toUpperCase()?.replace('_', ' '), '', 'success');
            } else {
                showNotification(res?.message || t('something_went_wrong', { defaultValue: 'Something went wrong. Try again.' }), '', 'danger');
            }
        } catch (e) {
            showNotification(e?.message || t('something_went_wrong', { defaultValue: 'Something went wrong. Try again.' }), '', 'danger');
        } finally {
            setIsLoading(false);
        }
    }

    const menuItems = [
        // {
        //     id: 1,
        //     title: 'ID Card',
        //     icon: <Idcard width={24} height={26} />,
        //     onPress: () => setStackScreen('DriverIDCard')
        // },
        {
            id: 2,
            title: t('personal_information'),
            icon: <MaterialIcons name="person" size={24} color={Colors.black} />,
            onPress: () => setStackScreen('DriverPersonalInfo')
        },
        {
            id: 3,
            title: t('proof_documents'),
            icon: <MaterialIcons name="description" size={24} color={Colors.black} />,
            onPress: () => setStackScreen('DriverProofDocuments')
        },
        // {
        //     id: 4,
        //     title: 'Address Details',
        //     icon: <MaterialIcons name="home" size={24} color={Colors.black} />,
        //     onPress: () => console.log('Address Details')
        // },
        // {
        //     id: 5,
        //     title: 'Office Ride',
        //     icon: <MaterialIcons name="business" size={24} color={Colors.black} />,
        //     onPress: () => console.log('Office Ride')
        // },
        {
            id: 6,
            title: t('bank_account'),
            icon: <MaterialIcons name="account-balance" size={24} color={Colors.black} />,
            onPress: () => setStackScreen('BankAccountDetails'),
        },
        // {
        //     id: 7,
        //     title: 'Link Payment Gateway',
        //     icon: <Image source={require('../../../Assets/razorpay.png')} style={styles.upiIcon} />,
        //     onPress: () => setStackScreen('LinkPaymentGateway')
        // }
    ]

    const getImage = (key) => {
        return vehicleList?.find(item => item.name === key)?.image
      }

    const renderMenuItem = (item) => (
        <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem}
            onPress={item.onPress}
        >
            <View style={{flexDirection:'row', width:'100%'}}>

          
            <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                    {item.icon}
                </View>
                <View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
            </View>
            
            <View style={styles.menuItemRight}>
                <Ionicons name="chevron-forward" size={20} color={Colors.warm_grey} />
            </View>
            </View>
            {item.id === 6 && (
                <View style={{ marginTop: 10 , alignItems:'center'}}>
                    
               {razorpayUpdated ? (
                         razorpayLinkedAccountDetails?.accountDetails?.activation_status === 'activated' ? (
                        <Text style={[styles.VerifyText,{color:'green'}]} capitalize>{razorpayLinkedAccountDetails?.accountDetails?.activation_status?.toUpperCase()?.replace('_', ' ')}</Text>
                    ) : (
                        <View style={styles.statusWithButton}>
                            <Text style={[styles.VerifyText,{color:'red'}]} capitalize>{razorpayLinkedAccountDetails?.accountDetails?.activation_status?.toUpperCase()?.replace('_', ' ') || "UNDER VERIFICATION"}</Text>
                            <TouchableOpacity style={styles.checkStatusInlineBtn} onPress={handleCheckStatus}>
                                <Text style={styles.checkStatusBtnText}>{t('check_status', { defaultValue: 'Check Status' })}</Text>
                            </TouchableOpacity>
                        </View>
                    )
               ) :(
              <Text style={styles.VerifyText}>{'Verify Now'}</Text>
               )}
                </View>

            )}
              
        </TouchableOpacity>
    )

    const _driverRatings = driverRatings?.currentrating?.toFixed(1) || 0;
    const parsedRating = parseFloat(_driverRatings);

  return (
    <View style={styles.container}>
        {isLoading && <FullScreenLoader />}
        <NavBar title={t('basic_details')} onBackPress={onBackPress} />
        <UseBackButton onBackPress={onBackPress} />
        <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
            {driverRatings && (
            <View style={[styles.vehicleCard,{alignItems:'center', justifyContent:'center', flexDirection:'column'}]}>
                {/* <View style={styles.starRatingContainer}></View> */}
                
                     <StarRating
                     rating={parsedRating || 0}
                     onChange={()=>{}}
                    //  starStyle={styles.starRating}
                      /> 
                      <Text style={styles.starRatingText}>{(driverRatings?.currentrating).toFixed(1)}<Text style={styles.starRatingTextSub}>/5</Text></Text>
                      <Text style={styles.starRatingTextSub}>{t('reviews')} {driverRatings?.count}</Text>
      
                     
            </View>
                  )}
            {/* Vehicle Card */}
            {userRole ==='driver' && 
            <View style={styles.vehicleCard}>
                <View style={styles.vehicleCardLeft}>
                    <Text style={styles.vehicleName}>{vehicleInfo?.make} - {vehicleInfo?.model}</Text>
                    <Text style={styles.vehicleNumber}>{vehicleInfo?.regNo}</Text>
                    <Text style={styles.vehicleNumber}>{vehicleInfo?.type ? (vehicleInfo?.type).replaceAll('_', ' ') : ''}</Text>
                   
                </View>
                <View style={styles.vehicleCardRight}>
                    <View style={styles.vehicleImageContainer}>
                         <View style={styles.vehicleImageContainer}>
                {getImage(vehicleInfo?.type)}
                {vehicleInfo?.type?.includes('ELECTRIC') && <MaterialIcons name="electric-bolt" size={14} color={Colors.green} />}
                </View>
                    </View>
                </View>
            </View> }
            {/* Menu Items */}
            <View style={styles.menuContainer}>
                {menuItems.map(renderMenuItem)}
            </View>
            <TouchableOpacity style={[styles.deleteAccountBtn,{borderColor:Colors.periwinkle}]} onPress={handleEditDocuments}> 
                <Text style={[styles.deleteAccountBtnText,{color:Colors.periwinkle}]}>{t('edit_documents')}</Text>
                </TouchableOpacity>
            <TouchableOpacity style={styles.deleteAccountBtn} onPress={()=>setStackScreen('DeleteAccount')}> 
                <Text style={styles.deleteAccountBtnText}>{t('delete_account')}</Text>
                </TouchableOpacity>
        </ScrollView>

        {/* Edit Documents Confirmation Modal */}
        <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('edit_documents')}</Text>
                    </View>
                    
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>
                            {t('are_you_sure_you_want_to_edit_documents')}
                        </Text>
                        
                        <View style={styles.warningContainer}>
                            <MaterialIcons name="warning" size={20} color={Colors.orange} />
                            <Text style={styles.warningText}>
                                {t('once_edit_started_your_account_will_be_on_hold_till_documents_are_verified_and_approved')}
                            </Text>
                        </View>
                        
                        <View style={styles.warningContainer}>
                            <MaterialIcons name="block" size={20} color={Colors.red} />
                            <Text style={styles.warningText}>
                                {t('you_cannot_take_trips_till_that')}
                            </Text>
                        </View>
                        
                        <View style={styles.warningContainer}>
                            <MaterialIcons name="payment" size={20} color={Colors.red} />
                            <Text style={styles.warningText}>
                                {t('if_you_have_pending_due_amount_please_clear_all_due_before')}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]} 
                            onPress={handleCancelEdit}
                        >
                            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.confirmButton]} 
                            onPress={handleConfirmEdit}
                        >
                            <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </View>
  )
}

export default DriverBasicDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        // flex: 1,
        paddingHorizontal: 20,
        paddingBottom:100,
    },
    vehicleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginVertical:10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'relative',
        overflow: 'hidden',
    },
    vehicleCardLeft: {
        flex: 1,
        paddingRight: 20,
    },
    vehicleName: {
        fontSize: 18,
        fontFamily: Fonts.semi_bold,
        color: Colors.black,
        marginBottom: 8,
    },
    vehicleNumber: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.warm_grey,
        marginBottom: 12,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.green,
    },
    vehicleCardRight: {
        position: 'relative',
    },
    vehicleImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F4FF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    vehicleImage: {
        width: 60,
        height: 60,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItem: {
        // flexDirection: 'row',
        // alignItems: 'center',
        // justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.pale_grey_two,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        marginRight: 16,
        width: 24,
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.black,
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.warm_grey,
    },
    progressCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.grey_light,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.green,
    },
    upiIcon: {
        width: 24,
        height: 24,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upiText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    deleteAccountBtn: {
       borderWidth:1,
       borderColor:Colors.red,
       borderRadius:10,
       marginTop:20,
       alignSelf:'flex-start',
       padding:10,
       paddingHorizontal:20,
       paddingVertical:10,
       alignItems:'center',
       justifyContent:'center',
       flexDirection:'row',
    },
    deleteAccountBtnText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: Colors.red,
        textAlign:'left',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '80%',
        padding: 20,
        alignItems: 'center',
    },
    modalHeader: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: Colors.black,
    },
    modalContent: {
        width: '100%',
        marginBottom: 20,
    },
    modalText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.black,
        marginBottom: 15,
        textAlign: 'center',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    warningText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: Colors.warm_grey,
        marginLeft: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: Colors.grey_light,
        borderWidth: 1,
        borderColor: Colors.grey_light,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.black,
    },
    confirmButton: {
        backgroundColor: Colors.periwinkle,
        borderWidth: 1,
        borderColor: Colors.periwinkle,
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.white,
    },
    starRatingContainer:{
        zIndex:9,
        backgroundColor:'transparent',
        position:'absolute',
        width:'100%',
        height:100
    },
    starRatingText:{
        fontSize:22,
        fontFamily:Fonts.semi_bold,
        color:Colors.periwinkle,
        marginTop:5,
    },
    starRatingTextSub:{
        fontFamily:Fonts.regular,
        color:Colors.periwinkle,
        fontSize:12,
        marginLeft:5,
    },
    VerifyText:{
        fontSize:12,
        fontFamily:Fonts.medium,
        color:Colors.red,
        marginRight:10,
    },
    checkStatusContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
        statusWithButton: {
            // alignItems: 'flex-start',
            gap: 6,
        },
        checkStatusInlineBtn: {
            // alignSelf: 'flex-start',
            backgroundColor: Colors.periwinkle,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: Colors.periwinkle,
            alignItems: 'center',
        },
    checkStatusBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: 14,
    }
})