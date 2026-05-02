import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import AddEmergencyContactScreen from './AddEmergencyContactScreen'
import { useEmergencyContactsStore } from '../store/useEmergencyContactsStore';
import { fetchEmergencyContacts, removeEmergencyContact } from '../services/api';
import SkeletonLoader from '../../../components/Loaders/SkeletonLoader';
const EmergencyHomeScreen = () => {
  const { t } = useTranslation();
  const { goBack, setStackScreen } = useStackScreenStore();
  const contacts = useEmergencyContactsStore((s) => s.contacts);
  const setContacts = useEmergencyContactsStore((s) => s.setContacts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchEmergencyContacts();
        if (mounted) setContacts(list);
      } catch (e) {
        if (mounted) setError('Failed to load contacts');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [setContacts]);
  const [currentScreen, setCurrentScreen] = useState('EmergencyHomeScreen');

 
  const handleAddEmergencyContact = () => {
    setCurrentScreen('AddEmergencyContactScreen');
  };

  const handleBackBtn = () => {
    goBack();
  };




  if (currentScreen === 'AddEmergencyContactScreen') {
    return <AddEmergencyContactScreen onBack={() => setCurrentScreen('EmergencyHomeScreen')} />;
  }

  

  return (
    <View style={styles.container}>
      <NavBar withBg onBackPress={handleBackBtn} title={t('emergency_contacts_title')} />
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={{ width: '100%', paddingHorizontal: 16 }}>
            <SkeletonLoader height={20} width={'60%'} borderRadius={6} />
            <View style={{ height: 12 }} />
            {[...Array(4)].map((_, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <SkeletonLoader height={16} width={'40%'} borderRadius={6} />
                <View style={{ height: 8 }} />
                <SkeletonLoader height={12} width={'70%'} borderRadius={6} />
              </View>
            ))}
          </View>
        ) : contacts.length === 0 ? (
          <>
            <View style={styles.emptyCenter}>
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>{t('emergency_empty_title')}</Text>
                <Text style={styles.infoSubText}>
                  {t('emergency_empty_subtitle')}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.fixedButton} onPress={handleAddEmergencyContact}>
              <Text style={styles.fixedButtonText}>{t('emergency_add_contact')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.contactItem}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(item.name || '?').trim().charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.contactPhone} numberOfLines={1}>{item.phone}</Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
                    onPress={() => {
                      Alert.alert(
                        t('emergency_remove_contact'),
                        t('emergency_remove_contact_message', { name: item.name }),
                        [
                          { text: t('emergency_cancel'), style: 'cancel' },
                          {
                            text: t('emergency_delete'),
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await removeEmergencyContact(item.phone);
                                setContacts(contacts.filter((c) => c.phone !== item.phone));
                              } catch (e) {
                                // Optionally show error toast
                              }
                            },
                          },
                        ]
                      );
                    }}
                    style={styles.deleteBtn}
                  >
                    <Icon name="delete" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
              style={[styles.fixedButton, contacts.length >= 5 && styles.fixedButtonDisabled]}
              onPress={handleAddEmergencyContact}
              disabled={contacts.length >= 5}
            >
              <Text style={styles.fixedButtonText}>
                {contacts.length >= 5 ? t('emergency_edit_contacts') : t('emergency_add_contact')}
              </Text>
            </TouchableOpacity>
            {contacts.length >= 5 && (
              <Text style={styles.limitText}>{t('emergency_limit_reached', { count: 5 })}</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default EmergencyHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 96, // leave room for fixed bottom button
    backgroundColor: '#fff',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 18,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  contactPhone: {
    color: '#555',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 18,
    color: '#222',
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoSubText: {
    color: '#757575',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#111',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.6,
    fontSize: 16,
  },
  limitText: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  fixedButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  fixedButtonDisabled: {
    backgroundColor: '#bbb',
  },
  fixedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
