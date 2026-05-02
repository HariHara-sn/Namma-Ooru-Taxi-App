import { Toast, Dialog } from 'react-native-alert-notification';

const normalizeText = (value) => {
  if (value == null) return '';
  const valueType = typeof value;
  if (valueType === 'string') return value;
  if (valueType === 'number' || valueType === 'boolean') return String(value);
  if (value instanceof Error) return value.message || String(value);
  if (valueType === 'object') {
    if (typeof value.message === 'string') return value.message;
    try {
      return JSON.stringify(value);
    } catch (_e) {
      return '[object]';
    }
  }
  return String(value);
};

const showNotification = (title, message, type = 'success', duration = 3000, toastType = "toast", closebtnText = 'close') => {
  const safeTitle = normalizeText(title);
  const safeMessage = normalizeText(message);
  const safeType = (type || 'success').toString().toUpperCase();

  toastType === "toast"
    ? Toast.show({
        type: safeType,
        title: safeTitle,
        textBody: safeMessage,
        autoClose: duration,
      })
    : Dialog.show({
        type: safeType,
        title: safeTitle,
        textBody: safeMessage,
        button: normalizeText(closebtnText) || 'close',
        autoClose: duration,
      });
};

export { showNotification };