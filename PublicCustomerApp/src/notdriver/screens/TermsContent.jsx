import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';

const TermsAndConditions = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      {isLoading && (
        <FullScreenLoader />
      )}
      <WebView
        source={{ uri: 'https://nammaoorutaxi.com/notdriver/legal/term' }}
        style={{ flex: 1 }}
        onLoadEnd={() => setIsLoading(false)}
      />
    </View>
  );
};

export default TermsAndConditions;
