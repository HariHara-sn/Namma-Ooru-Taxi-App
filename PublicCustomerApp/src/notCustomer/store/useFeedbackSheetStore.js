import { create } from 'zustand';

export const useFeedbackSheetStore = create((set, get) => ({
  isVisible: false,
  screenName: null,
  params: null,
  values: {},
  submitting: false,
  onSubmit: null,

  open: ({ screenName, params = null, initialValues = {}, onSubmit = null }) => {
    set({
      isVisible: true,
      screenName,
      params,
      values: initialValues || {},
      onSubmit,
      submitting: false,
    });
  },

  close: () => {
    set({
      isVisible: false,
      screenName: null,
      params: null,
      values: {},
      submitting: false,
      onSubmit: null,
    });
  },

  setValue: (name, value) => {
    const current = get().values;
    set({ values: { ...current, [name]: value } });
  },

  setValues: (vals) => {
    const current = get().values;
    set({ values: { ...current, ...(vals || {}) } });
  },

  setSubmitting: (flag) => set({ submitting: !!flag }),

  submit: async () => {
    const { values, onSubmit } = get();
    try {
      set({ submitting: true });
      if (typeof onSubmit === 'function') {
        await onSubmit(values);
      }
      set({ submitting: false });
      get().close();
      return { ok: true };
    } catch (e) {
      set({ submitting: false });
      return { ok: false, error: e?.message || 'Submission failed' };
    }
  },
}));

export const openFeedbackSheet = (config) => {
  useFeedbackSheetStore.getState().open(config);
};

export const closeFeedbackSheet = () => {
  useFeedbackSheetStore.getState().close();
};


