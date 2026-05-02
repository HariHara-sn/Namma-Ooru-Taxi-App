import { Platform } from 'react-native';
import InAppReview from 'react-native-in-app-review';

let isTriggering = false;

export const triggerInAppReview = async () => {
  if (isTriggering) return false;

  try {
    isTriggering = true;

    // Early platform guard (optional, in case isAvailable has quirks)
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      console.log('In-App Review not supported on this platform');
      return false;
    }

    const isAvailable = InAppReview.isAvailable();
    console.log('In-App Review availability:', isAvailable);

    if (!isAvailable) {
      console.log('In-App Review not available on this device');
      return false;
    }

    const hasFlowFinishedSuccessfully = await InAppReview.RequestInAppReview();
    console.log('In-App Review flow finished successfully:', hasFlowFinishedSuccessfully);

    // Note: On Android, this can resolve true even if the dialog didn't show.
    return !!hasFlowFinishedSuccessfully;
  } catch (error) {
    // Keep error surface minimal but useful
    console.log('Error during In-App Review process:', error?.message || error);
    return false;
  } finally {
    isTriggering = false;
  }
};
