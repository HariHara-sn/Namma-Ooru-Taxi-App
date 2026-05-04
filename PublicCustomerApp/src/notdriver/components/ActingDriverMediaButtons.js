import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useActingDriverMediaStore from '../store/useActingDriverMediaStore';
import useTripsStore from '../store/useTripsStore';
import { useTranslation } from 'react-i18next';

const MENU_ITEMS = [
  {
    key: 'DriverVehiclePhotosScreen',
    label: 'upload_vehicle_photos',
    icon: 'car-outline',
    doneKey: 'photos',
  },
  {
    key: 'DriverBillsExpensesScreen',
    label: 'upload_bills_and_expenses',
    icon: 'receipt-outline',
    doneKey: 'bills',
  },
];

const ActingDriverMediaButtons = () => {
  const setStackScreen = useStackScreenStore(state => state.setStackScreen);
  const { preTripDone, postTripDone, bills } = useActingDriverMediaStore();
  const { activeTripData } = useTripsStore();
  const {t} = useTranslation()

  const serverBills = activeTripData?.[0]?.bills;
  const photosUploaded = preTripDone || postTripDone || !!(serverBills?.preTripVehiclePhotos?.front) || !!(serverBills?.postTripVehiclePhotos?.front);
  const billsUploaded = bills.length > 0 || !!(serverBills?.bills?.length);

  const isDone = { photos: photosUploaded, bills: billsUploaded };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>{t('upload_photos_and_bills')}</Text>
      <View style={styles.menuList}>
        {MENU_ITEMS.map((item, idx) => {
          const done = isDone[item.doneKey];
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuRow, idx < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
              onPress={() => setStackScreen(item.key)}
              activeOpacity={0.7}>
              <View style={[styles.iconWrap, done && styles.iconWrapDone]}>
                <Ionicons name={item.icon} size={20} color={done ? Colors.white : Colors.periwinkle} />
              </View>
              <Text style={styles.menuLabel}>{t(item.label)}</Text>
              {/* {done && (
                <View style={styles.doneBadge}>
                  <MaterialCommunityIcons name="check-circle" size={13} color="#43A047" />
                  <Text style={styles.doneTxt}>Done</Text>
                </View>
              )} */}
              <MaterialCommunityIcons name="chevron-right" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default ActingDriverMediaButtons;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 16,
  },
  headerText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.black,
    marginBottom: 10,
  },
  menuList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDone: {
    backgroundColor: Colors.periwinkle,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.black,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  doneTxt: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#43A047',
  },
});


