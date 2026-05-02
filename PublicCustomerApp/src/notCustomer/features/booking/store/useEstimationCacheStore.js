import { create } from 'zustand';

const TTL_MS_DEFAULT = 5 * 60 * 1000; // 5 minutes

const roundCoord = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(5);
};

const serializePoint = (point) => {

  if (!point || typeof point !== 'object') return '';
  const { longitude, latitude} = point;
  const finalLon = longitude;
  const finalLat = latitude;
  if (finalLon == null || finalLat == null) return '';
  return `${finalLon},${finalLat}`;
};

const serializeWaypoints = (waypoints) => {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return '';
  return waypoints
    .map((wp) => serializePoint(wp))
    .filter(Boolean)
    .join(';');
};

export const useEstimationCacheStore = create((set, get) => ({
  ttlMs: TTL_MS_DEFAULT,
  entries: {}, // key -> { data, expiresAt }

  buildKey: ({ start, end, waypoints }) => {
    const s = serializePoint(start);
    const e = serializePoint(end);
    const w = serializeWaypoints(waypoints);
    return `s:${s}|e:${e}|w:${w}`;
  },

  prune: () => {
    const now = Date.now();
    const current = get().entries;
    const next = {};
    Object.keys(current).forEach((key) => {
      const entry = current[key];
      if (entry && typeof entry.expiresAt === 'number' && entry.expiresAt > now) {
        next[key] = entry;
      }
    });
    set({ entries: next });
  },

  getFromCache: (key) => {
    if (!key) return null;
    const { entries } = get();
    const entry = entries[key];
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      // lazy delete expired
      set((state) => {
        const copy = { ...state.entries };
        delete copy[key];
        return { entries: copy };
      });
      return null;
    }
    return entry.data;
  },

  setInCache: (key, data) => {
    if (!key) return;
    const ttlMs = get().ttlMs;
    set((state) => ({
      entries: {
        ...state.entries,
        [key]: { data, expiresAt: Date.now() + ttlMs },
      },
    }));
  },

  clear: () => set({ entries: {} }),
}));

// Helper exports to mirror previous util API
export const buildKey = (args) => useEstimationCacheStore.getState().buildKey(args);
export const prune = () => useEstimationCacheStore.getState().prune();
export const getFromCache = (key) => useEstimationCacheStore.getState().getFromCache(key);
export const setInCache = (key, data) => useEstimationCacheStore.getState().setInCache(key, data); 