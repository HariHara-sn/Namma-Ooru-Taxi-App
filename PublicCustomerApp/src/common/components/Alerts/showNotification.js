import { Toast, Dialog } from 'react-native-alert-notification';
import { Fonts } from '../../constants/constants';

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

const showNotification = (title, message, type = 'success', duration = 3000, toastType = "toast", closebtnText = 'Close') => {
  const safeTitle = normalizeText(title);
  const safeMessage = normalizeText(message);
  const safeType = (type || 'success').toString().toUpperCase();

  if (toastType === "toast") {
    Toast.show({
      type: safeType,
      title: safeTitle,
      textBody: safeMessage,
      autoClose: duration,
      titleStyle: {
        fontFamily: Fonts.semi_bold,
      },
      textBodyStyle: {
        fontFamily: Fonts.regular,
      },
    });
  } else {
    Dialog.show({
      type: safeType,
      title: safeTitle,
      textBody: safeMessage,
      button: normalizeText(closebtnText) || 'Close',
      autoClose: duration,
      titleStyle: 'center',
    });
  }
};

export { showNotification };
