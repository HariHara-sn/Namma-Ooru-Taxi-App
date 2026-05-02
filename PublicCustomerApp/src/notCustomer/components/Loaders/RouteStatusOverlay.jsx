import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const RouteStatusOverlay = ({
  loading = false,
  error = null,
  onRetry,
  onBack,
  errorTitle = 'Failed to fetch route',
  errorDescription = '',
  renderIcon, // optional custom icon render function
  iconName = 'alert-circle-outline',
  iconColor = '#b00020',
  extraContent, // optional node to render additional info
  top = 0,
  left = 0,
  right = 0,
  bottom = 0,
}) => {
  const { t } = useTranslation();
  if (!loading && !error) return null;

  return (
    <>
      <Modal
        visible={!!error}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.fullscreenOverlay} pointerEvents="auto">
          <View style={styles.errorBox}>
            <View style={styles.iconWrapper}>
              {renderIcon ? (
                renderIcon()
              ) : (
                <MaterialCommunityIcons name={iconName} size={44} color={iconColor} />
              )}
            </View>
            <Text style={styles.errorText} numberOfLines={2}>
              {t('routeStatus_errorTitle', { defaultValue: errorTitle })}
            </Text>
            {!!errorDescription && (
              <Text style={styles.errorDesc} numberOfLines={3}>
                {t('routeStatus_errorDescription', { defaultValue: errorDescription })}
              </Text>
            )}
            <Text style={styles.helperText}>
              {t('routeStatus_helper', { defaultValue: 'Ensure your internet is stable and try again.' })}
            </Text>
            {extraContent}
            <View style={{ flexDirection: 'row-reverse', gap: 10 , marginTop:10}}>
            {onRetry && (
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryText}>{t('routeStatus_retry', { defaultValue: 'Try Again' })}</Text>
              </TouchableOpacity>
            )}
            {onBack && (
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backText}>{t('routeStatus_back', { defaultValue: 'Back' })}</Text>
              </TouchableOpacity>
            )}
            </View>
          </View>
        </View>
      </Modal>
      <View style={[styles.container, { top, left, right, bottom }]}> 
        {loading && (
          <View style={styles.contentRow}>
              <View style={styles.content}>
            <ActivityIndicator size="small" color="#0f223c" />
            <Text style={styles.message}>{t('routeStatus_fetching', { defaultValue: 'Fetching route' })}</Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9,
    alignSelf: 'stretch',
    paddingHorizontal: 12,
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 'auto',
   
  },
  content:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
     backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 4,
  },
  message: {
    marginLeft: 8,
    color: '#0f223c',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    width: '75%',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 4,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  errorText: {
    color: '#b00020',
    fontSize: 14,
    marginBottom: 8,
  },
  errorDesc: {
    color: '#495057',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  helperText: {
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#0f223c',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  backBtn: {
    minWidth: 90,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#0f223c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#0f223c',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RouteStatusOverlay;
