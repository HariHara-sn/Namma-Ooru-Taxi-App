import { create } from "zustand";
import useConfigStore from "./useConfigStore";

type ControlState = {
  enabled: boolean;
  intervalMs: number;   // runtime-adjustable
  lat: number | null;
  lon: number | null;
  start: () => void;
  stop: () => void;
  setIntervalMin: (min: number) => void;
  setTarget: (lat: number, lon: number) => void;
};

export const useNearbyPollingControl = create<ControlState>((set, get) => {
  // Get appConfig at initialization time
  const { appConfig } = useConfigStore.getState();
  return {
    enabled: true,
    intervalMs: Math.max(
      2_000,
      (Number(appConfig?.DRIVER_LOCATION_UPDATE_INTERVAL) || 5) * 1_000
    ),
    lat: null,
    lon: null,
    start: () => set({ enabled: true }),
    stop: () => set({ enabled: false }),
    setIntervalMin: (min) =>
      set({ intervalMs: Math.max(2_000, min * 1_000) }),
    setTarget: (lat, lon) => set({ lat, lon }),
  };
});
