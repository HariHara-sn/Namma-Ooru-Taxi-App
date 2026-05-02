import APIRequest from '../controllers/APIRequest';
import { useMutation, useQueryClient } from 'react-query';
import { DataStore } from '../controllers/DataStore';

const usePostQuery = ({ onSuccess, onError }) => {
    const queryClient = useQueryClient();


    const postQuery = async ({ queryKey, url, payload }) => {

        const access_token = await DataStore.loadData('access_token');
        
        const apiRequest = new APIRequest();
        const res = await apiRequest.request(url, 'POST', payload, access_token.data);
     
        queryClient.invalidateQueries(queryKey);

        return res;

    }

    return useMutation(postQuery, {
        onSuccess: (data) => onSuccess(data),
        onError: (error) => onError(error)
    });

}

const useGetQuery = ({ onSuccess, onError }) => {
    const queryClient = useQueryClient();

    const getQuery = async ({ queryKey, url, payload = null, query = null }) => {

        const access_token = await DataStore.loadData('access_token');

        const apiRequest = new APIRequest();
        const res = await apiRequest.request(url, 'GET', payload, access_token.data, query);

        console.log(res, 'res');


        queryClient.invalidateQueries(queryKey);

        return res;

    }

    return useMutation(getQuery, {
        onSuccess: (data) => onSuccess(data),
        onError: (error) => onError(error)
    });
}

export { usePostQuery, useGetQuery };