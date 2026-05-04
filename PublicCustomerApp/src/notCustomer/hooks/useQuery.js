import Config from 'react-native-config';
import {useMutation, useQueryClient} from 'react-query';
import APIRequest from '../controllers/APIRequest';
import {DataStore} from '../controllers/DataStore';

const usePostQuery = ({onSuccess, onError}) => {
  const queryClient = useQueryClient();

  const postQuery = async ({queryKey, url, payload}) => {
    try {
      console.log('[usePostQuery] Starting POST request to:', url);
      const access_token = await DataStore.loadData('access_token');
      console.log('[usePostQuery] Token data retrieved:', {
        status: access_token?.status,
        hasToken: !!access_token?.data,
        tokenLength: access_token?.data?.length || 0,
      });

      const apiRequest = new APIRequest(Config.ROOT_API_URL);
      const token = access_token?.data;

      const res = await apiRequest.request(url, 'POST', payload, token);
      console.log('[usePostQuery] Response received:', {
        success: res?.success,
        hasError: !!res?.error,
      });

      queryClient.invalidateQueries(queryKey);

      return res;
    } catch (error) {
      console.error('[usePostQuery] Error in POST request:', error);
      throw error;
    }
  };

  return useMutation(postQuery, {
    onSuccess: data => onSuccess(data),
    onError: error => onError(error),
  });
};

const useGetQuery = ({onSuccess, onError}) => {
  const queryClient = useQueryClient();

  const getQuery = async ({queryKey, url, payload = null, query = null}) => {
    const access_token = await DataStore.loadData('access_token');

    const apiRequest = new APIRequest(Config.ROOT_API_URL);
    const res = await apiRequest.request(
      url,
      'GET',
      payload,
      access_token.data,
      query,
    );

    console.log(res, 'res');

    queryClient.invalidateQueries(queryKey);

    return res;
  };

  return useMutation(getQuery, {
    onSuccess: data => onSuccess(data),
    onError: error => onError(error),
  });
};

export {useGetQuery, usePostQuery};
