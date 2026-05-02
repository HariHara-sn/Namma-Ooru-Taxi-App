import { useMemo } from 'react';
import { debounce } from 'lodash';

/**
 * Custom hook for creating debounced functions
 * @param {Function} callback - The function to debounce
 * @param {number} delay - The delay in milliseconds (default: 500)
 * @returns {Function} - The debounced function
 */
export const useDebounce = (callback, delay = 500) => {
  return useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );
};

/**
 * Custom hook specifically for debounced API calls
 * @param {Function} apiCall - The API function to debounce
 * @param {number} delay - The delay in milliseconds (default: 500)
 * @returns {Function} - The debounced API function
 */
export const useDebouncedAPICall = (apiCall, delay = 500) => {
  return useMemo(
    () => debounce(apiCall, delay),
    [apiCall, delay]
  );
};

/**
 * Hook for debouncing search input
 * @param {Function} searchFunction - The search function to debounce
 * @param {number} delay - The delay in milliseconds (default: 300)
 * @returns {Function} - The debounced search function
 */
export const useDebouncedSearch = (searchFunction, delay = 300) => {
  return useMemo(
    () => debounce(searchFunction, delay),
    [searchFunction, delay]
  );
}; 