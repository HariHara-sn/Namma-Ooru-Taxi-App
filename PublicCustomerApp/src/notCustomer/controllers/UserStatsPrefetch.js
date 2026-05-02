import { DataStore } from './DataStore';
import PREF from '../storage/PREF';
import { getUserStats } from '../API/EndPoints/EndPoints';

let started = false;
let prefetchPromise = null;
let prefetchedResult = null;

export const prefetchUserStats = async () => {
  try {
    if (started) return prefetchPromise;
    started = true;
    const currentTrip = await DataStore.loadData(PREF.CURRENT_TRIP);
    const currentTripId = currentTrip?.data || null;
    prefetchPromise = getUserStats(currentTripId)
      .then(res => {
        prefetchedResult = res;
        return res;
      })
      .catch(err => {
        prefetchedResult = { success: false, error: true, err };
        return prefetchedResult;
      });
    return prefetchPromise;
  } catch (e) {
    prefetchedResult = { success: false, error: true, err: e };
    return prefetchedResult;
  }
};

export const consumeUserStatsPrefetch = async () => {
  try {
    if (prefetchedResult) return prefetchedResult;
    if (prefetchPromise) {
      await prefetchPromise; // resolve if in-flight
      return prefetchedResult;
    }
    return null;
  } catch (_e) {
    return prefetchedResult || null;
  }
};

export const resetUserStatsPrefetch = () => {
  started = false;
  prefetchPromise = null;
  prefetchedResult = null;
};
