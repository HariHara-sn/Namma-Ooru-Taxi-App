import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image } from 'react-native';
import AdaptiveText from './Common/AdaptiveText';
import { Fonts } from '../constants/constants';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const OverdueTripModal = ({ visible, onClose, onSelect, TripId }) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      setShowMessageInput(false);
      setMessage('');
      setSubmitting(false);
    }
  }, [visible]);

  const handlePress = (nextStatus, note) => {
    if (submitting) return;
    setSubmitting(true);
    onSelect && onSelect(nextStatus, TripId, note);
  };

  const handleClose = () => {
    if (submitting) return;
    setShowMessageInput(false);
    setMessage('');
    onClose && onClose();
  };

  const handleStayOnTrip = () => {
    handlePress('ONGOING');
  };

  const handleEndTripPress = () => {
    if (submitting) return;
    setShowMessageInput(true);
  };

  const handleBackToOptions = () => {
    if (submitting) return;
    setShowMessageInput(false);
    setMessage('');
  };

  const handleSubmitCancellation = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || submitting) return;
    handlePress('CANCELLED', trimmedMessage);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={submitting ? undefined : handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Image
            source={require('../assets/image/distanceExceededTrip.webp')}
            style={styles.headerImage}
            resizeMode="contain"
            accessible
            accessibilityLabel={t('overdue_image_alt', 'Trip overdue illustration')}
          />
         
          <AdaptiveText style={styles.title}>
            {t('overdue_title')}
          </AdaptiveText>
          <Text style={styles.message}>
            {t('overdue_message')}
          </Text>
          {submitting && (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loaderText}>{t('loading') || 'Loading...'}</Text>
            </View>
          )}
          {showMessageInput ? (
            <>
              <TextInput
                style={styles.input}
                multiline
                editable={!submitting}
                placeholder={t('overdue_cancellation_note_placeholder', 'Tell us why you are ending the trip')}
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                maxLength={250}
              />
              <Text style={styles.helperText}>
                {t('overdue_cancellation_note_helper', 'We will share this note with support.')}
              </Text>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.btn, submitting && styles.btnDisabled]}
                  onPress={handleBackToOptions}
                  disabled={submitting}
                >
                  <AdaptiveText style={styles.btnText}>{t('common.back', 'Back')}</AdaptiveText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, (submitting || !message.trim()) && styles.btnDisabled]}
                  onPress={handleSubmitCancellation}
                  disabled={submitting || !message.trim()}
                >
                  <AdaptiveText style={styles.primaryBtnText}>{t('overdue_send_cancellation', 'Send & Cancel Trip')}</AdaptiveText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.buttons}>
              <TouchableOpacity style={[styles.btn, submitting && styles.btnDisabled]} disabled={submitting} onPress={handleStayOnTrip}>
                <AdaptiveText style={styles.btnText}>{t('overdue_no_im_on_ride', "No, I'm on ride")}</AdaptiveText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, submitting && styles.btnDisabled]} disabled={submitting} onPress={handleEndTripPress}>
                <AdaptiveText style={styles.primaryBtnText}>{t('overdue_end_trip', 'End Trip')}</AdaptiveText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '88%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  headerImage: {
    alignSelf: 'center',
    width: 200,
    height: 200,
  
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loaderText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  buttons: {
    gap: 10,
    marginTop: 12,
  },
  btn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'black',
  },
  primaryBtn: {
    backgroundColor: '#000000ff',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'white',
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
  closeText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#000',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default OverdueTripModal;

OverdueTripModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
  TripId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};


