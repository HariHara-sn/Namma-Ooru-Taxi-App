import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';

const PrivacyPolicy = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={styles.container}>
      {isLoading && <FullScreenLoader />}
      <WebView
        source={{ uri: 'https://nammaoorutaxi.com/notdriver/legal/privacypolicy' }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default PrivacyPolicy;
