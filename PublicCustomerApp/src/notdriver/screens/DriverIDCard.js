import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native';
import React, {useContext, useEffect, useMemo} from 'react';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import useUserStore from '../../common/store/useUserStore';
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl';
import NavBar from '../../common/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import { Colors, Fonts } from '../../common/constants/constants';


const DriverIDCard = () => {
  const {goBack} = useStackScreenStore();
  const driverInfo = usePublicDriverStore(state => state.driverInfo);
  const driverPhotoFile = usePublicDriverStore(
    state => state.documents?.find(doc => doc.id === 'driverPhoto')?.file,
  );
  const [imageFile, setImageFile] = React.useState(null);
  const [isImageLoading, setIsImageLoading] = React.useState(false);
  const {userInfo} = useUserStore()

  // Resolve driver photo URLs that require a presigned download before rendering.
  const fetchImageFromUrl = React.useCallback(
    async imageUrl => {
      if (!imageUrl) {
        setImageFile(null);
        return;
      }
      try {
        setIsImageLoading(true);
        const normalizedUrl =
          typeof imageUrl === 'string' ? imageUrl : String(imageUrl);
        const key = normalizedUrl.replace(/^https:\/\/[^/]+\/?/, '');
        if (!userInfo?.token) {
          setImageFile(normalizedUrl);
          return;
        }
        const response = await getPresignedImageUrl(key, userInfo.token);
        setImageFile(response || normalizedUrl);
      } catch (error) {
        const fallback =
          typeof imageUrl === 'string' ? imageUrl : String(imageUrl);
        setImageFile(fallback);
      } finally {
        setIsImageLoading(false);
      }
    },
    [userInfo?.token],
  );

  const getImage = React.useCallback(
    item => {
      const currentUri = typeof item === 'string' ? item : item?.uri;
      const isE2EImage = currentUri?.includes(
        'https://not-publicrides.objectstore.e2enetworks.net',
      );
      if (currentUri && isE2EImage) {
        fetchImageFromUrl(currentUri);
      } else if (currentUri) {
        setImageFile(currentUri);
      } else {
        setImageFile(null);
      }
    },
    [fetchImageFromUrl],
  );

  useEffect(() => {
    if (driverPhotoFile) {
      getImage(driverPhotoFile);
    } else {
      setImageFile(null);
    }
  }, [driverPhotoFile, getImage]);

  const driverName = useMemo(() => {
    return (
      driverInfo?.name ||
      userInfo?.name ||
      userInfo?.fullName ||
      'Driver Name'
    );
  }, [driverInfo?.name, userInfo?.fullName, userInfo?.name]);

  const driverId = userInfo?.driverId || 'ID unavailable';
  const issuedDate = useMemo(() => new Date().toLocaleDateString(), []);

  return (
    <View style={styles.screen}>
      <NavBar title={'ID Card'} onBackPress={() => goBack()} />
      <UseBackButton onBackPress={() => goBack()} />
      <View style={styles.content}>
        <View style={styles.cardContainer}>
          <View style={[styles.cardHeader, {justifyContent: 'space-evenly'}]}>
            {/* <View style={styles.logoWrapper}>
              <NOTlogo width={20} height={20} />
            </View> */}
            {/* <CompanyLogo width={50} height={35} /> */}
            {/* <View style={styles.logoWrapper}>
              <DriverLogo width={40} height={40} />
            </View> */}
          </View>

          <View style={styles.cardHeader}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Nammo Oru Taxi Driver</Text>
              <Text style={styles.companySubtitle}>Driver Identification</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.photoRow}>
            <View style={styles.photoContainer}>
              {isImageLoading ? (
                <ActivityIndicator color={Colors.bright_orange} />
              ) : imageFile ? (
                <Image
                  source={{uri: imageFile}}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderCircle}>
                  <Text style={styles.placeholderInitials}>
                    {driverName?.[0] || '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.label}>Driver Name</Text>
              <Text style={styles.value}>{driverName}</Text>
              <View style={styles.detailSpacer} />
              <Text style={styles.label}>Driver ID</Text>
              <Text style={styles.value}>{driverId}</Text>
            </View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Issued on</Text>
            <Text style={styles.footerValue}>{issuedDate}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DriverIDCard;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#ECEDED',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 80,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfo: {
    marginLeft: 12,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    color: Colors.bright_orange,
    fontFamily: Fonts.bold,
  },
  companySubtitle: {
    fontSize: 12,
    color: Colors.cool_grey,
    marginTop: 2,
    fontFamily: Fonts.semi_bold,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F2F5',
    marginVertical: 20,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E5EA',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DDE3EB',
  },
  placeholderInitials: {
    fontSize: 32,
    color: Colors.battleship_grey,
    fontFamily: Fonts.semi_bold,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 20,
  },
  label: {
    fontSize: 12,
    color: Colors.cool_grey,
    letterSpacing: 0.2,
    fontFamily: Fonts.semi_bold,
  },
  value: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: Fonts.medium,
  },
  detailSpacer: {
    height: 16,
  },
  footer: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontSize: 12,
    color: Colors.cool_grey,
    fontFamily: Fonts.regular,
  },
  footerValue: {
    fontSize: 14,
    color: Colors.battleship_grey,
    fontFamily: Fonts.semi_bold,
  },
});
