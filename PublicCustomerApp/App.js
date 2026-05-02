import React, { useMemo } from 'react';
import MainApp from './src/MainApp';
import { QueryClient, QueryClientProvider } from 'react-query'
import { I18nextProvider } from 'react-i18next';
import commonI18n from './src/common/i18n';
import useUserStore from './src/common/store/useUserStore';
import Config from "react-native-config";
import ErrorBoundary from "react-native-error-boundary";

import crashlytics from '@react-native-firebase/crashlytics';

import { ApolloProvider, HttpLink, ApolloClient, InMemoryCache } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FallbackComponent from './src/common/components/FallbackComponent';


const App = () => {
  const { userRole } = useUserStore();
const grapqlEndPoint = Config.ROOT_API_URL + '/publicrides/customer/v2/graphql/location';
const driverGraphqlEndPoint = Config.ROOT_API_URL +'/publicrides/driver/v2/graphql/location';

const httpLink = new HttpLink({
  uri: userRole === 'driver' ? driverGraphqlEndPoint : grapqlEndPoint,
});
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});




  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: 30000,
        cacheTime: 60000,
      },
    },
  }), []);

  const myErrorHandler = (error) => {
    crashlytics().recordError(error);
  };

  return (
    <ErrorBoundary onError={myErrorHandler} FallbackComponent={FallbackComponent}>
      <ApolloProvider client={client}>
      <I18nextProvider i18n={commonI18n}>
        <QueryClientProvider client={queryClient}>
           <SafeAreaProvider> 
            <MainApp />
            </SafeAreaProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ApolloProvider>
    </ErrorBoundary>

  );
};

export default App;
