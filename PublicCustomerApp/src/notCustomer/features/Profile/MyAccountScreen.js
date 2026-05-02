import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import { DataStore } from '../../controllers/DataStore';
import useUserInfoStore from '../../../common/store/useUserInfoStore';
import { utils } from '../../utils/Utils';
import { deleteAccountMutation, fetchPassengerTripStats } from '../../API/APICalls/UserAPICalls';
import { showNotification } from '../../components/NotificationManger';
import DeleteAccountModal from '../../components/DeleteAccountModal';

import Mobile from '../../assets/image/account/mobile.svg';
import Card from '../../assets/image/account/card.svg';
import MainProfile from '../../assets/image/account/MainProfile.svg';
import Profile from '../../assets/image/account/profile.svg';

import Ionicons from 'react-native-vector-icons/Ionicons';
import SettingsDropdown from '../../components/Profile/SettingsDropdown';
import MyAccountProfileImage from '../../components/Profile/MyAccountProfileImage';
import MyAccountInfo from '../../components/Profile/MyAccountInfo';
import MyAccountStats from '../../components/Profile/MyAccountStats';
import SwipeBtn from '../../components/SwipeBtn';
import { useStackScreenStore } from '../../store/useStackScreenStore'; 
import { GlobalContext } from '../../../context/GlobalContext';

const MyAccountScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { goBack,reset } = useStackScreenStore();
  const { userdetails ,ratingData  ,totalSpend,cancelledTrips,completedTrips,totalTrips,resetUserInfo, setTotalSpend, setTotalTrips, setCancelledTrips, setCompletedTrips } = useUserInfoStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { removeListener } = useContext(GlobalContext);


  const [Info_Items] = useState([
    // {
    //   key: t('full_name'),
    //   value: utils.toTitleCase(userdetails?.name) || '',
    //   image: <MainProfile width={'25'} height={'25'} />,
    //   imageType: 'svg',
    // },
    {
      key: t('gender'),
      value: userdetails.gender ? utils.toTitleCase(userdetails?.gender) : '',
      image: <Profile width={'25'} height={'25'} />,
      imageType: 'svg',
    },
    {
      key: t('phone_number'),
      value: userdetails.phone || '',
      image: <Mobile width={'25'} height={'25'} />,
      imageType: 'svg',
    },
    {
      key: t('email_address'),
      value: userdetails.email || '',
      image: <Card width={'25'} height={'25'} />,
      imageType: 'svg',
    },
    // {
    //   key: 'Home',
    //   value: userdetails.homeAddress || '',
    //   image: <HomeLocation width={'25'} height={'25'} />,
    //   imageType: 'svg',
    // },
    // {
    //   key: 'Work',
    //   value: userdetails.workAddress || '',
    //   image: <OfficeLocation width={'25'} height={'25'} />,
    //   imageType: 'svg',
    // },
  ]);

  const HandleBackBtn = () => {
    goBack();
  };

  const Logout = async () => {
    await DataStore.storeData('access_token', null);
    await DataStore.storeData('refresh_token', null);
    await DataStore.storeData('userdetails', null);
    reset()
    resetUserInfo();
    await removeListener();
    navigation.reset({
      index: 0,
      routes: [{ name: 'WelcomeScreen' }],
    });

  };

  // Delete account mutation
  const deleteAccount = deleteAccountMutation(async () => {
    showNotification(t('account_deletion_requested'), t('account_deletion_message'), 'success');
    await Logout();
  });

  // Fetch passenger trip stats on mount (single call, no refetch)
  const tripStatsQuery = fetchPassengerTripStats((resp) => {
    const payload = resp?.data ?? resp;
    console.log('tripStatsQuery data:', payload);
    if (!payload) return;
    const spend = typeof payload.totalSpends !== 'undefined' ? payload.totalSpends : payload.totalSpend;
    if (typeof spend !== 'undefined') setTotalSpend(spend);
    if (typeof payload.totalTrips !== 'undefined') setTotalTrips(payload.totalTrips);
    if (typeof payload.cancelledTrips !== 'undefined') setCancelledTrips(payload.cancelledTrips);
    if (typeof payload.completedTrips !== 'undefined') setCompletedTrips(payload.completedTrips);
  });

  const { isLoading: isTripStatsLoading } = tripStatsQuery;

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (reason) => {
    try {
      await deleteAccount.mutateAsync({ reason });
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const toggleSettingsDropdown = () => {
    setShowSettingsDropdown(!showSettingsDropdown);
  };
  const closeSettingsDropdown = () => {
    setShowSettingsDropdown(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={HandleBackBtn}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: 'black' }}>{t('my_account')}</Text>
        <TouchableOpacity onPress={toggleSettingsDropdown}>
          <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="settings-outline" size={20} color="black" />
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
        <MyAccountProfileImage
          name={utils.toTitleCase(userdetails?.name || '')}
          id={userdetails?._id || ''}
          ratingData={ratingData}
        />
        <MyAccountInfo infos={Info_Items} />
        <MyAccountStats stats={{totalSpend,cancelledTrips,completedTrips,totalTrips}} loading={tripStatsQuery.isFetching} />
        <View style={{alignContent:'center',justifyContent:'center',marginTop:30,marginBottom:30}}>
          <SwipeBtn name={t('swipe_to_logout')} onHandleSwipeEnd={Logout} />
        </View>
      </ScrollView>

      <SettingsDropdown
        visible={showSettingsDropdown}
        onClose={closeSettingsDropdown}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAccount.isLoading}
      />
    </View>
  );
};

export default MyAccountScreen;
