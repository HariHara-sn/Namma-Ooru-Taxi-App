import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, FlatList, ActivityIndicator, Modal, SafeAreaView, Platform } from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { colors, Fonts } from '../../../../constants/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useUserInfoStore from '../../../../../common/store/useUserInfoStore';
import useRideBookingInfo from '../../store/useRideBookingInfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import { height } from '../../../../utils/Utils';
import AdaptiveText from '../../../../components/Common/AdaptiveText';
import Contacts from 'react-native-contacts';
import { RequestContactsPermission } from '../../../../controllers/PermissionHandler';
import { firebase } from '@react-native-firebase/analytics';
import { firebaselog_ridePlanning } from '../../../../../common/utils/FirebaseAnalytics';

const Contactsheet = ({ onConfirm }) => {
  const { t } = useTranslation();
  const { userdetails } = useUserInfoStore();
  const { rideBookMode, setPassangerDetails, setRideBookMode,passangerDetails } = useRideBookingInfo();
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [contactDetails, setContactDetails] = useState([]);
  const [contactsPickerVisible, setContactsPickerVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [loadingDeviceContacts, setLoadingDeviceContacts] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  

  // Load contacts from local storage on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Update selected contact when rideBookMode changes
  useEffect(() => {
    if (rideBookMode === 'MYSELF' && userdetails) {
      setPassangerDetails({
        name: userdetails.name,
        phone: userdetails.phone
      });
    } 
  }, [rideBookMode, userdetails]);

  const loadContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem('savedContacts');
      if (savedContacts) {
        setContactDetails(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const saveContacts = async (contacts) => {
    try {
      await AsyncStorage.setItem('savedContacts', JSON.stringify(contacts));
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const normalizeToIndianMobile = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D+/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return digits;
  };

  const isFormValid = () => {
    return newContact.name.trim() !== '' && validatePhoneNumber(newContact.phone);
  };

  const isPhoneInvalid = newContact.phone !== '' && !validatePhoneNumber(newContact.phone);

  const handleAddContact = () => {
    if (!isFormValid()) {
      Alert.alert(t('invalid_input'), t('invalid_mobile_number'));
      return;
    }

    const alreadyExists = contactDetails.some(c => c.phone === newContact.phone );
    if(newContact.phone === userdetails.phone){
      Alert.alert(t('contact_exists'), t('contact_already_exists'));
      return;
    }
    
    if (alreadyExists) {
      Alert.alert(t('contact_exists'), t('contact_already_exists'));
      return;
    }

    const updatedContacts = [...contactDetails, newContact];
    setContactDetails(updatedContacts);
    saveContacts(updatedContacts);
    setNewContact({ name: '', phone: '' });
    setShowAddContact(false);
  };

  const openContactsPicker = async () => {
    try {
      setContactsPickerVisible(true);
      setLoadingDeviceContacts(true);
      let granted = true;
      try {
        granted = await RequestContactsPermission();
      } catch (e) {
        granted = Platform.OS === 'ios';
      }
      if (!granted) {
        setLoadingDeviceContacts(false);
        setContactsPickerVisible(false);
        return;
      }
      if (Platform.OS === 'ios') {
        const iosPerm = await Contacts.requestPermission();
        if (iosPerm !== 'authorized') {
          setLoadingDeviceContacts(false);
          setContactsPickerVisible(false);
          return;
        }
      }
      const all = await Contacts.getAll();
      const simplified = all
        .map((c) => {
          const name = [c.givenName, c.middleName, c.familyName].filter(Boolean).join(' ').trim() || 'Unknown';
          const firstNumber = Array.isArray(c.phoneNumbers) && c.phoneNumbers.length > 0 ? c.phoneNumbers[0].number : '';
          return {
            id: c.recordID || `${name}-${firstNumber}`,
            name,
            phone: (firstNumber || '').replace(/\s+/g, ''),
          };
        })
        .filter((c) => !!c.phone);

      const uniqueByPhone = new Map();
      for (const c of simplified) {
        const key = c.phone;
        if (!uniqueByPhone.has(key)) uniqueByPhone.set(key, c);
      }
      const list = Array.from(uniqueByPhone.values()).sort((a, b) => {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        if (an < bn) return -1; if (an > bn) return 1; return 0;
      });
      setDeviceContacts(list);
      setPickerQuery('');
    } catch (e) {
      console.error('Failed to load contacts', e);
      Alert.alert('Unable to load contacts');
    } finally {
      setLoadingDeviceContacts(false);
    }
  };

  const handlePickDeviceContact = (item) => {
    const normalized = normalizeToIndianMobile(item.phone);
    setNewContact({ name: item.name, phone: normalized });
    setContactsPickerVisible(false);
  };

  const filteredDeviceContacts = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return deviceContacts;
    return deviceContacts.filter((c) => {
      return (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
    });
  }, [deviceContacts, pickerQuery]);

  const isPhoneAlreadySaved = (phone) => {
    const normalized = normalizeToIndianMobile(phone);
    return contactDetails.some((c) => normalizeToIndianMobile(c.phone) === normalized);
  };

  const handleSelectContact = (contact) => {
    
    setPassangerDetails(contact);
    setRideBookMode('OTHERS');
    firebaselog_ridePlanning('RP_Book_For(RP_BF)', `RP_BF:others`);
    onConfirm();
  };

  const handleSelectMyself = () => {
    if (!userdetails?.name || !userdetails?.phone) {
      Alert.alert(t('user_details'), t('user_details_not_available'));
      return;
    }

    const contact = {
      name: userdetails.name,
      phone: userdetails.phone
    };

    setPassangerDetails(contact);
    setRideBookMode('MYSELF');
    firebaselog_ridePlanning('RP_Book_For(RP_BF)', `RP_BF:myself`);
    onConfirm();
  };

  const handleDeleteContact = (contactToDelete) => {
    Alert.alert(
      t('delete_contact'),
      `${t('delete_contact_confirm')} ${contactToDelete.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            const updatedContacts = contactDetails.filter(c => c.phone !== contactToDelete.phone);
            setContactDetails(updatedContacts);
            saveContacts(updatedContacts);
            
            // If the deleted contact was selected, clear the selection
            if (passangerDetails?.phone === contactToDelete.phone) {
              setPassangerDetails(null);
              setRideBookMode('MYSELF');
            }
          }
        }
      ]
    );
  };

  // Check if "Myself" is selected
  const isMyselfSelected = rideBookMode === 'MYSELF' && userdetails && 
    passangerDetails?.phone === userdetails.phone;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AdaptiveText style={styles.title}>{t('book_for')}</AdaptiveText>
      </View>
      <ScrollView style={{maxHeight:height*0.6}} showsVerticalScrollIndicator={false}>
     
      <TouchableOpacity 
        style={styles.myselfButton}
        onPress={handleSelectMyself}
      >
        <View style={styles.contactImageContainer}> 
            <Ionicons name="person" size={24} color={colors.black} />
          </View>
        <View style={styles.myselfInfo}>
          <AdaptiveText style={styles.myselfText}>{t('myself')}</AdaptiveText>
          {userdetails && (
            <AdaptiveText style={styles.myselfDetails}>
              {userdetails.name} - {userdetails.phone}
            </AdaptiveText>
          )}
        </View>
        {isMyselfSelected && <Ionicons name="checkmark-circle" size={24} color={colors.black} />}
      </TouchableOpacity>
      {contactDetails.length > 0 && <View style={styles.divider} />}

      {contactDetails.map((contact, index) => (
        <>
        {index !== 0 && <View style={styles.divider} />}
        <TouchableOpacity 
          key={index}
          style={styles.contactItem}
          onPress={() => handleSelectContact(contact)}
        >
          <View style={styles.contactImageContainer}> 
            <Ionicons name="person" size={24} color={colors.black} />
          </View>
          <View style={styles.contactInfo}>
            <AdaptiveText numberOfLines={1} style={styles.contactName} ellipsizeMode="tail">{contact.name}</AdaptiveText>
            <AdaptiveText style={styles.contactPhone}>{contact.phone}</AdaptiveText>
          </View>
          <View style={styles.contactActions}>
            {passangerDetails?.phone === contact.phone && rideBookMode === 'OTHERS' && (
              <Ionicons name="checkmark-circle-sharp" size={30} color={colors.black} />
            )}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteContact(contact)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.red} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        </>
      ))}
      </ScrollView>
      {!showAddContact ? (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddContact(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.black} />
          <AdaptiveText style={styles.addButtonText}>{t('add_new_contact')}</AdaptiveText>
        </TouchableOpacity>
      ) : (
        <View style={styles.addContactForm}>
          <TextInput
            style={styles.input}
            placeholder={t('enter_name')}
            placeholderTextColor="grey"
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
          />
          <View style={[styles.input, {flexDirection:'row',gap:10}, isPhoneInvalid && styles.inputError]}>
            <Text style={{fontFamily:Fonts.medium,fontSize:16,color:colors.black}}>+91</Text>
            <TextInput
              style={{flex: 1,color:colors.black}}
              placeholder={t('enter_mobile_number')}
              placeholderTextColor="grey"
              keyboardType="phone-pad"
              value={newContact.phone}
              maxLength={10}
              onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
            />
          </View>
          {isPhoneInvalid && (
            <Text style={styles.errorText}>{t('invalid_mobile_number')}</Text>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.importButton}
              onPress={openContactsPicker}
              accessibilityLabel="Import from contacts"
            >
              {/* <Ionicons name="book-outline" size={20} color={colors.black} /> */}
              <AdaptiveText style={styles.importButtonText}>{t('import_from_contacts') || 'Import from contacts'}</AdaptiveText>
            </TouchableOpacity>
            <View style={styles.buttonSeparator}> 
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                !isFormValid() && styles.disabledButton
              ]}
              disabled={!isFormValid()}
              onPress={handleAddContact}
            >
              <AdaptiveText style={styles.confirmText}>{t('add_contact')}</AdaptiveText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setNewContact({ name: '', phone: '' });
                setShowAddContact(false);
              }}
            >
              <Ionicons name="close" style={{ color: colors.grey_dark }} size={20} />
            </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <Modal
        visible={contactsPickerVisible}
        onRequestClose={() => setContactsPickerVisible(false)}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.pickerScreen}>
          <View style={styles.pickerHeaderBar}>
            <TouchableOpacity onPress={() => setContactsPickerVisible(false)} style={styles.headerIconBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.black} />
            </TouchableOpacity>
            <AdaptiveText style={styles.pickerHeaderTitle}>{t('import_contact') || 'Import contact'}</AdaptiveText>
            <View style={styles.headerIconBtn} />
          </View>
          {/* <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.grey_dark} />
            <AdaptiveText style={styles.infoBannerText}>{t('contact_privacy_note') || 'Your contact’s name will not be shared with the driver.'}</AdaptiveText>
          </View> */}
          <View style={styles.pickerSearchWrapper}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.pickerSearchIcon} />
            <TextInput
              value={pickerQuery}
              onChangeText={setPickerQuery}
              placeholder={t('search_contacts_placeholder') || t('search') || 'Search'}
              placeholderTextColor="#999"
              style={styles.pickerSearch}
              autoFocus
            />
            {!!pickerQuery && (
              <TouchableOpacity accessibilityRole="button" onPress={() => setPickerQuery('')} style={styles.pickerClearBtn}>
                <Text style={styles.pickerClearText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingDeviceContacts ? (
            <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
              <ActivityIndicator size="large" color={colors.black} />
            </View>
          ) : (
            <FlatList
              data={filteredDeviceContacts}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => {
                const alreadySaved = isPhoneAlreadySaved(item.phone);
                const initials = (item.name || '')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase() || '?';
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, alreadySaved && styles.pickerRowDisabled]}
                    onPress={() => {
                      if (alreadySaved) {
                        Alert.alert(t('contact_exists'), t('contact_already_exists'));
                        return;
                      }
                      handlePickDeviceContact(item);
                    }}
                    // accessibilityState={{ disabled: alreadySaved }}
                  >
                    <View style={styles.pickerAvatar}>
                      <Text style={styles.pickerAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.pickerTextCol}>
                      <Text style={styles.pickerName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.pickerPhone} numberOfLines={1}>{item.phone}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.pickerListContent}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={36} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>{t('no_contacts_found') || 'No contacts found'}</Text>
                  <Text style={styles.emptySubtitle}>{t('try_different_name_or_number') || 'Try a different name or number'}</Text>
                </View>
              )}
              initialNumToRender={20}
              windowSize={10}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </SafeAreaView>
      </Modal>
      
    </View>
  );
};

Contactsheet.propTypes = {
  onConfirm: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black
  },
  myselfButton: {
    paddingVertical:15,
    gap:15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  myselfInfo: {
    flex: 1
  },
  myselfText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black
  },
  myselfDetails: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_dark,
    marginTop: 4
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical:15,
    gap:15
  },
  contactImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grey_light,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contactInfo: {
    flex: 1
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  contactName: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black
  },
  contactPhone: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_dark,
    marginTop: 4
  },
  deleteButton: {
    padding: 5
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
    backgroundColor:colors.grey_light,
    marginTop:15,
    borderRadius:10
  },
  addButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black
  },
  addContactForm: {
    marginTop: 50
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    alignItems:'center',
    paddingHorizontal:10, 
    marginBottom: 16,
    fontFamily: Fonts.regular,
    height: 50,
    color:"black",
    placeholderTextColor:'black'
  },
  inputError: {
    borderColor: colors.red
  },
  errorText: {
    color: colors.red,
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8
  },
  confirmButton: {
    backgroundColor: colors.black,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: colors.grey_light,
    opacity: 0.7
  },
  confirmText: {
    color: colors.white,
    fontFamily: Fonts.medium,
    fontSize: 16
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  buttonSeparator: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10
  },
  importButton: {
     paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: colors.grey_light,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  importButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.commonBlack
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey_light,
   
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 12
  },
  infoBannerText: {
    flex: 1,
    color: '#4B5563',
    fontFamily: Fonts.regular,
    fontSize: 12
  },
  pickerScreen: {
    flex: 1,
    backgroundColor: colors.white
  },
  pickerHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE'
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerHeaderTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black
  },
  pickerSearchWrapper: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6
  },
  pickerSearch: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 40,
    paddingRight: 36,
    backgroundColor: '#F9FAFB',
    color: '#111827',
    fontFamily: Fonts.regular
  },
  pickerSearchIcon: {
    position: 'absolute',
    left: 22,
    top: 22
  },
  pickerClearBtn: {
    position: 'absolute',
    right: 22,
    top: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB'
  },
  pickerClearText: {
    color: '#111827',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: -2
  },
  pickerListContent: {
    paddingHorizontal: 8,
    paddingBottom: 16
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  pickerRowDisabled: {
    opacity: 0.5
  },
  pickerSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEE',
    marginLeft: 64
  },
  pickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  pickerAvatarText: {
    color: '#3730A3',
    fontFamily: Fonts.semi_bold
  },
  pickerTextCol: {
    flex: 1
  },
  pickerName: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.black
  },
  pickerPhone: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.grey_dark,
    marginTop: 2
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48
  },
  emptyTitle: {
    marginTop: 8,
    fontFamily: Fonts.medium,
    color: '#111827'
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#6B7280'
  }
});

export default Contactsheet;


