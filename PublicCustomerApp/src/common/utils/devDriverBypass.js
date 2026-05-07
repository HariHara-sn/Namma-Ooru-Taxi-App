import Config from 'react-native-config';

export const DEV_DRIVER_PHONE = '9999999999';
export const DEV_DRIVER_OTP = '112233';

const isTruthy = value => value === true || String(value).toLowerCase() === 'true';

export const isDevDriverBypassEnabled = () =>
  (typeof globalThis !== 'undefined' && globalThis.__DEV__ === true) ||
  isTruthy(Config.DEV);

export const normalizePhoneNumber = phone => {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const isDevDriverBypassPhone = phone =>
  isDevDriverBypassEnabled() && normalizePhoneNumber(phone) === DEV_DRIVER_PHONE;

export const isDevDriverBypassOtp = (phone, otp) =>
  isDevDriverBypassPhone(phone) && String(otp || '') === DEV_DRIVER_OTP;

export const isDevDriverBypassUser = user =>
  isDevDriverBypassPhone(user?.phone);
