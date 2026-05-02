import { openFeedbackSheet, closeFeedbackSheet } from '../store/useFeedbackSheetStore';

export const openFeedback = (config) => openFeedbackSheet(config);
export const closeFeedback = () => closeFeedbackSheet();



