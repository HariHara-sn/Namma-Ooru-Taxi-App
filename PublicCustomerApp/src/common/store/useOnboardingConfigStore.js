import { create } from 'zustand';
import APIRequest from '../APIRequest';

const useOnboardingConfigStore = create((set, get) => ({
  config: null,
  loading: false,

  fetchConfig: async (token, userRole) => {
    if (get().config) return;
    set({ loading: true });
    try {
      const api = new APIRequest();
      const endpoint =
        userRole === 'driver' || userRole === 'acting_driver'
          ? '/publicrides/driver/v2/getOnboardingConfig'
          : '/publicrides/customer/v2/getOnboardingConfig';
      const res = await api.request(endpoint, 'GET', null, token);
      if (res?.success && res?.data) {
        set({ config: res.data });
      }
    } catch (e) {
      console.log('Error fetching onboarding config:', e);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useOnboardingConfigStore;
