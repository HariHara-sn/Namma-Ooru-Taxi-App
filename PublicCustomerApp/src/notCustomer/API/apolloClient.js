// apolloClient.js
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import Config from "react-native-config";

const grapqlEndPoint = '/publicrides/customer/v2/graphql/location';

const httpLink = new HttpLink({
  uri: Config.ROOT_API_URL + grapqlEndPoint,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;
