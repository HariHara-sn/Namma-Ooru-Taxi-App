import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Colors} from '../../common/constants/constants';
import useConfigStore from '../../notCustomer/store/useConfigStore';
import SocialMediaModalImg from '../assets/image/SocialMedia.webp';
import { height, width } from '../utils/Utils';
import { Fonts } from '../constants/constants';

const ICONS = {
  facebook: {name: 'logo-facebook', color: '#1877F2'},
  twitter: {name: 'logo-twitter', color: '#1DA1F2'},
  instagram: {name: 'logo-instagram', color: '#E1306C'},
  linkedin: {name: 'logo-linkedin', color: '#0A66C2'},
  youtube: {name: 'logo-youtube', color: '#FF0000'},
  tiktok: {name: 'logo-tiktok', color: '#000000'},
};

const LABELS = {
  facebook: 'Facebook',
  twitter: 'X / Twitter',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

const SocialMediaModal = ({visible, onClose}) => {
  const {appConfig} = useConfigStore();
  const socialMediaLinks = appConfig?.SOCIAL_MEDIA_LINKS || {};

  const items = useMemo(() => {
    return Object.entries(socialMediaLinks)
      .filter(([key, url]) => !!url && !!ICONS[key])
      .map(([key, url]) => ({key, url, ...ICONS[key], label: LABELS[key] || key}));
  }, [socialMediaLinks]);

  const open = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (e) {
      // Optional: show toast/snackbar
      // console.log('Failed to open url:', e);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        {/* Backdrop (tap outside to close) */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Card */}
        <View style={styles.card}>
          {/* Header image */}
          <View style={styles.header}>
            <Image source={SocialMediaModalImg} style={styles.headerImage} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Follow us</Text>
          <Text style={styles.subtitle}>
            Stay updated with news, releases, tutorials and tips.
          </Text>

          <View style={styles.grid}>
            {items.map((it) => (
              <TouchableOpacity
                key={it.key}
                onPress={() => open(it.url)}
                activeOpacity={0.8}
                style={styles.socialTile}>
                <View style={styles.iconWrap}>
                  <Ionicons name={it.name} size={26} color={it.color} />
                </View>
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {it.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },

  header: {
    alignItems: 'center',
    
  },
  headerImage: {
    width: "100%",
    height: height * 0.25,
  },

  title: {
    textAlign: 'center',
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#111',
    marginTop: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 14,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12, // RN 0.71+; if not supported, replace with margins
  },
  socialTile: {
    width: '48%',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignContent: 'center',
    borderColor: '#eef2f7',
    backgroundColor: '#fbfdff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef2f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tileLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#111',
  },

  footer: {
    marginTop: 5,
  },
  closeBtn: {
    backgroundColor: 'black',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
  },
});

export default SocialMediaModal;
