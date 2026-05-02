import { create } from 'zustand';

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
};

type EmergencyContactsState = {
  contacts: EmergencyContact[];
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  updateContact: (id: string, updates: Partial<Omit<EmergencyContact, 'id'>>) => void;
  removeContact: (id: string) => void;
  setContacts: (contacts: EmergencyContact[]) => void;
  reset: () => void;
};

export const useEmergencyContactsStore = create<EmergencyContactsState>((set, get) => ({
  contacts: [],

  addContact: (contact) => {
    const sanitizedPhone = (contact.phone || '').replace(/\s+/g, '');
    const existing = get().contacts;
    if (existing.some((c) => c.phone === sanitizedPhone)) {
      return; // skip duplicates by phone
    }
    const newContact: EmergencyContact = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...contact,
      phone: sanitizedPhone,
    };
    set({ contacts: [...existing, newContact] });
  },

  updateContact: (id, updates) => {
    set({
      contacts: get().contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  },

  removeContact: (id) => {
    set({ contacts: get().contacts.filter((c) => c.id !== id) });
  },

  setContacts: (contacts) => {
    // normalize phones and dedupe by phone
    const map = new Map<string, EmergencyContact>();
    for (const c of contacts) {
      const phone = (c.phone || '').replace(/\s+/g, '');
      const normalized: EmergencyContact = { ...c, phone };
      if (!map.has(phone)) map.set(phone, normalized);
    }
    set({ contacts: Array.from(map.values()) });
  },

  reset: () => set({ contacts: [] }),
}));

export default useEmergencyContactsStore;


