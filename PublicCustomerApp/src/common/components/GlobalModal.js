import React, { useContext, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GlobalContext } from '../../context/GlobalContext';
import { useTranslation } from 'react-i18next';

const modalImages = {
  cancelled_auto: require('../assets/images/cancelled_auto.webp'),
  cancelled_customer: require('../assets/images/cancelled_customer.webp'),
  rideFareBackground: require('../assets/images/rideFareBackground.webp'),
};

const getImageSource = imageName => {
  if (!imageName) {
    return null;
  }

  const normalizedKey = imageName.replace(/\.webp$/i, '');
  return modalImages[normalizedKey] ?? null;
};

const GlobalModal = () => {
  const { modalVisible, modalTitle, modalMessage, modalImage, hideModal } = useContext(GlobalContext);
  const imageSource = getImageSource(modalImage);
  const { t  } = useTranslation();
  const textColor = '#111111';

  useEffect(() => {
    if (!modalVisible) {
      return undefined;
    }
    const timerId = setTimeout(() => {
      hideModal();
    }, 3000);
    return () => clearTimeout(timerId);
  }, [modalVisible, hideModal]);

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={modalVisible}
      onRequestClose={hideModal}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} resizeMode="contain" />
          ) : null}
          <Text style={[styles.modalTitle, { color: textColor }]}>{t(modalTitle)}</Text>
          {modalMessage ? <Text style={[styles.modalMessage, { color: textColor }]}>{t(modalMessage)}</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={hideModal}
          >
            <Text style={styles.textStyle}>{t('ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalMessage: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
  image: {
    width: '70%',
    height: 200,
    marginBottom: 20,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    width: '90%',
    backgroundColor: '#000000',
  },
  textStyle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GlobalModal;
