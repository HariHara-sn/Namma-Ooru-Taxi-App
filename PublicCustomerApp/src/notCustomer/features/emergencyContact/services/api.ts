// Placeholder API service for emergency contacts
// Wire to real endpoints when available

import apiClient from '../../../API/APIClient';
import type { EmergencyContact } from '../store/useEmergencyContactsStore';

export type AddEmergencyContactsPayload = {
  contactsData: Array<{
    name: string;
    phone: string;
  }>;
};

export async function addEmergencyContacts(payload: AddEmergencyContactsPayload): Promise<any> {
  const { data } = await apiClient.post('/publicrides/customer/v2/addEmergencyContact', payload);
  return data;
}

export async function fetchEmergencyContacts(): Promise<EmergencyContact[]> {
  const { data } = await apiClient.get('/publicrides/customer/v2/getEmergencyContacts');
  // Response shape example:
  // { "success": true, "message": "Emergency Contacts", "emergencyContacts": [{ name, phone }] }
  const list = Array.isArray(data?.emergencyContacts) ? data.emergencyContacts : [];
  return list.map((c: any, idx: number) => ({
    id: String(c.id ?? c._id ?? idx),
    name: String(c.name ?? ''),
    phone: String(c.phone ?? ''),
    relation: 'Emergency',
  }));
}

export async function removeEmergencyContact(phone: string): Promise<{ success: boolean; message?: string }> {
  const payload = { phone };
  const { data } = await apiClient.post('/publicrides/customer/v2/removeEmergencyContact', payload);
  return data;
}


