import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Platform, TextInput, BackHandler, Vibration } from 'react-native';
import Contacts from 'react-native-contacts';
import { RequestContactsPermission, checkContactsPermission } from '../../../controllers/PermissionHandler';
import { useEmergencyContactsStore } from '../store/useEmergencyContactsStore';
import { addEmergencyContacts, removeEmergencyContact } from '../services/api';
import NavBar from '../../../components/NavBar';
import { useTranslation } from 'react-i18next';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { firebaselog_ridePlanning } from '../../../../common/utils/FirebaseAnalytics';

type PhoneContact = {
  id: string;
  name: string;
  phone: string;
};

const MAX_SELECTION = 5;

type Props = {
  onBack?: () => void;
};

const AddEmergencyContactScreen = ({ onBack }: Props) => {
  const { t } = useTranslation();
  const addContact = useEmergencyContactsStore((s) => s.addContact);
  const existingContacts = useEmergencyContactsStore((s) => s.contacts);
  const setStoreContacts = useEmergencyContactsStore((s) => s.setContacts);
  const goBack = useStackScreenStore((s) => s.goBack);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  const selectedCount = selectedIds.size;
  const canSubmit = selectedCount > 0 && selectedCount <= MAX_SELECTION && !submitting;

  const requestPermissionAndLoad = useCallback(async () => {
    try {
      setIsLoading(true);

      // Prefer using central permission handler (Android). On iOS, also ensure Contacts permission.
      const grantedFromHandler = await RequestContactsPermission();
      if (!grantedFromHandler) {
        setIsLoading(false);
        return;
      }

      if (Platform.OS === 'ios') {
        const iosPerm = await Contacts.requestPermission();
        if (iosPerm !== 'authorized') {
          setIsLoading(false);
          return;
        }
      }

      const deviceContacts = await Contacts.getAll();
      const simplified: PhoneContact[] = deviceContacts
        .map((c) => {
          const name = [c.givenName, c.middleName, c.familyName].filter(Boolean).join(' ').trim() || 'Unknown';
          const firstNumber = Array.isArray(c.phoneNumbers) && c.phoneNumbers.length > 0 ? c.phoneNumbers[0].number : '';
          return {
            id: c.recordID ?? `${name}-${firstNumber}`,
            name,
            phone: (firstNumber || '').replace(/\s+/g, ''),
          } as PhoneContact;
        })
        .filter((c) => !!c.phone);

      // Deduplicate by phone
      const uniqueByPhone = new Map<string, PhoneContact>();
      for (const c of simplified) {
        if (!uniqueByPhone.has(c.phone)) uniqueByPhone.set(c.phone, c);
      }

      const list = Array.from(uniqueByPhone.values()).sort((a, b) => {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        if (an < bn) return -1; if (an > bn) return 1; return 0;
      });
      setContacts(list);
    } catch (err) {
      console.error('Failed to load contacts', err);
      Alert.alert('Unable to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestPermissionAndLoad();
  }, [requestPermissionAndLoad]);

  // Preselect already saved contacts (match by phone)
  useEffect(() => {
    if (contacts.length === 0 || existingContacts.length === 0) return;
    setSelectedIds((prev) => {
      if (prev.size > 0) return prev;
      const phoneToId = new Map(contacts.map((c) => [c.phone, c.id] as const));
      const next = new Set<string>();
      for (const ec of existingContacts) {
        const id = phoneToId.get(ec.phone);
        if (id) next.add(id);
        if (next.size >= MAX_SELECTION) break;
      }
      return next;
    });
  }, [contacts, existingContacts]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_SELECTION) {
        Alert.alert(`You can select up to ${MAX_SELECTION} contacts`);
        return next;
      }
      next.add(id);
      return next;
    });
  }, []);

  const selectedContacts: PhoneContact[] = useMemo(() => {
    if (selectedIds.size === 0) return [];
    const map = new Map(contacts.map((c) => [c.id, c] as const));
    return Array.from(selectedIds).map((id) => map.get(id)!).filter(Boolean);
  }, [contacts, selectedIds]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? contacts.filter((c) =>
          c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
        )
      : contacts;

    // Sort so that selected contacts appear first, then by name
    return base.slice().sort((a, b) => {
      const aSelected = selectedIds.has(a.id);
      const bSelected = selectedIds.has(b.id);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      const an = (a.name || '').toLowerCase();
      const bn = (b.name || '').toLowerCase();
      if (an < bn) return -1; if (an > bn) return 1; return 0;
    });
  }, [contacts, query, selectedIds]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) onBack();
      else goBack();
      return true;
    });

    return () => subscription.remove();
  }, [goBack, onBack]);

  const submit = useCallback(async () => {
    try {
      // Vibration.vibrate(100);
      setSubmitting(true);

      const normalize = (p: string) => (p || '').replace(/\s+/g, '');

      const selectedByPhone = new Map<string, { name: string; phone: string }>();
      for (const c of selectedContacts) {
        selectedByPhone.set(normalize(c.phone), { name: c.name, phone: normalize(c.phone) });
      }

      const existingByPhone = new Map<string, typeof existingContacts[number]>();
      for (const c of existingContacts) {
        existingByPhone.set(normalize(c.phone), c);
      }

      const toRemovePhones: string[] = [];
      for (const [phone] of existingByPhone) {
        if (!selectedByPhone.has(phone)) toRemovePhones.push(phone);
      }

      const toAddContacts = Array.from(selectedByPhone.values()).filter((c) => !existingByPhone.has(c.phone));

      if (toRemovePhones.length > 0) {
        await Promise.allSettled(toRemovePhones.map((p) => removeEmergencyContact(p)));
      }

      if (toAddContacts.length > 0) {
        await addEmergencyContacts({ contactsData: toAddContacts });
      }

      const kept = existingContacts.filter((c) => selectedByPhone.has(normalize(c.phone)));
      setStoreContacts(kept);
      for (const c of toAddContacts) {
        addContact({ name: c.name, phone: c.phone, relation: 'Emergency' });
      }

      Alert.alert('Emergency contacts added');
      firebaselog_ridePlanning('RP_Emergency_Contact(RP_EC)','RP_EC:contact_added')
      setSelectedIds(new Set());
      if (onBack) onBack(); else goBack();
    } catch (err) {
      console.log('Failed to submit emergency contacts', err);
      Alert.alert('Failed to add contacts');
    } finally {
      setSubmitting(false);
    }
  }, [addContact, existingContacts, selectedContacts, setStoreContacts]);

  const renderItem = useCallback(({ item }: { item: PhoneContact }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity style={[styles.item, isSelected && styles.itemSelected]} onPress={() => toggleSelect(item.id)}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPhone} numberOfLines={1}>{item.phone}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]} />
      </TouchableOpacity>
    );
  }, [selectedIds, toggleSelect]);

  return (
    <View style={styles.container}>
      <NavBar withBg onBackPress={() => (onBack ? onBack() : goBack())} title={t('emergency_select_contacts_title')} />

      {isLoading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.loadingText}>Loading contacts…</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.searchWrapper}>
              <TextInput
                value={query}
                onChangeText={setQuery}
              placeholder={t('emergency_search_placeholder')}
                placeholderTextColor="#999"
                style={[styles.search, query ? { paddingRight: 36 } : null]}
              />
              {!!query && (
                <TouchableOpacity accessibilityRole="button" onPress={() => setQuery('')} style={styles.clearBtn}>
                  <Text style={styles.clearText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.title}>{t('emergency_select_up_to_contacts', { count: MAX_SELECTION })}</Text>
            <Text style={styles.subtitle}>{t('emergency_selected_count', { count: selectedCount })}</Text>
            {selectedCount >= MAX_SELECTION && (
              <Text style={styles.maxText}>{t('emergency_maximum_selected', { count: MAX_SELECTION })}</Text>
            )}
          </View>

          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            initialNumToRender={20}
            windowSize={10}
            keyboardShouldPersistTaps="handled"
          />

          <TouchableOpacity
            activeOpacity={canSubmit ? 0.8 : 1}
            disabled={!canSubmit}
            onPress={submit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{t('emergency_add_contacts_cta')}</Text>
        )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default AddEmergencyContactScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  search: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    color: '#222',
    backgroundColor: '#fafafa',
    marginBottom: 10,
  },
  searchWrapper: {
    position: 'relative',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  clearText: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: -2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  maxText: {
    marginTop: 4,
    color: '#999',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 88,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  itemSelected: {
    backgroundColor: '#f5f5f5',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  itemPhone: {
    color: '#555',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#111',
  },
  checkboxSelected: {
    backgroundColor: '#111',
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#bbb',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
  },
});
