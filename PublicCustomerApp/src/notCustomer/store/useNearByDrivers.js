import { create } from 'zustand';
import { getNearByDrivers } from '../API/EndPoints/EndPoints';
import useConfigStore from '../store/useConfigStore'; 

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const normalizeType = (type) => (type || 'driver').toLowerCase().replace(/\s+/g, '_');
const getId = (d) => d?.id ?? d?._id;

const buildByType = (driversArray) => {
    const byType = {};
    driversArray.forEach((d) => {
        const t = normalizeType(d.vehicleType);
        if (!byType[t]) byType[t] = [];
        byType[t].push(d);
    });
    return byType;
};

const useNearbyDrivers = create((set, get) => ({
    driversAll: [],
    driversByType: {},
    lastFetchTimestamp: 0,
    lastFetchParams: null,
    driverFetchInProgress: false,
    setDriverFetchInProgress: (inProgress) =>
        set(() => ({
            driverFetchInProgress: inProgress,
        })),
    setDrivers: (newDrivers = []) =>
        set(() => {
            const unique = [];
            const seen = new Set();
            newDrivers.forEach((d) => {
                const id = getId(d);
                if (d && id != null && !seen.has(id)) {
                    seen.add(id);
                    unique.push(d);
                }
            });
            return {
                driversAll: unique,
                driversByType: buildByType(unique),
            };
        }),
    addDriver: (driver) =>
        set((state) => {
            const id = getId(driver);
            if (!driver || id == null) return state;
            if (state.driversAll.some((d) => getId(d) === id)) return state;
            const driversAll = [...state.driversAll, driver];
            return {
                driversAll,
                driversByType: buildByType(driversAll),
            };
        }),
    updateDriver: (idOrObj, partial) =>
        set((state) => {
            // allow id or object with id/_id
            const targetId = typeof idOrObj === 'object' ? getId(idOrObj) : idOrObj;
            const driversAll = state.driversAll.map((d) =>
                getId(d) === targetId ? { ...d, ...(partial ?? {}) } : d
            );
            return {
                driversAll,
                driversByType: buildByType(driversAll),
            };
        }),
    removeDriver: (idOrObj) =>
        set((state) => {
            const targetId = typeof idOrObj === 'object' ? getId(idOrObj) : idOrObj;
            const driversAll = state.driversAll.filter((d) => getId(d) !== targetId);
            return {
                driversAll,
                driversByType: buildByType(driversAll),
            };
        }),
    clearDrivers: () =>
        set(() => ({
            driversAll: [],
            driversByType: {},
            lastFetchTimestamp: 0,
            lastFetchParams: null,
        })),
    fetchLatestDrivers: async ({
        latitude,
        longitude,
        radius = 10000,
        vehicleTypes = [],
    } = {}) => {
        if (latitude == null || longitude == null) {
            console.warn('fetchLatestDrivers requires latitude and longitude');
            return [];
        }

        let uniqueTypes = [...new Set(vehicleTypes.filter(Boolean))];
        if (uniqueTypes.length === 0) {
            uniqueTypes = ['AUTO', 'ELECTRIC_AUTO', 'SUV', 'ELECTRIC_SUV', 'ELECTRIC_BIKE', 'SEDAN', 'ELECTRIC_SEDAN', 'BIKE', 'HATCHBACK', 'ELECTRIC_HATCHBACK'];
        }

        const sortedTypes = [...uniqueTypes].sort();
        const cacheKey = JSON.stringify({ latitude, longitude, radius, vehicleTypes: sortedTypes });

        const { lastFetchTimestamp, lastFetchParams, driversAll } = get();
        const now = Date.now();
        if (
            typeof lastFetchTimestamp === 'number' &&
            lastFetchTimestamp > 0 &&
            now - lastFetchTimestamp < CACHE_TTL_MS &&
            lastFetchParams === cacheKey
        ) {
           
            return driversAll;
        }

        console.log('Fetching nearby drivers with params:', {
            latitude,
            longitude,
            radius,
            vehicleTypes: uniqueTypes,
        });
        console.log('Using radius from config store:');
        const appConfigRadius = useConfigStore.getState().appConfig?.SHOW_NEARBY_DRIVER_RADIUS;
        console.log('App Config Radius:', appConfigRadius);
        const radiusToUse =  appConfigRadius || radius;
        try {
            const response = await getNearByDrivers(
                latitude,
                longitude,
                radiusToUse,
                uniqueTypes
            );
            console.log('Fetched nearby drivers:', response);
            const drivers = Array.isArray(response?.drivers) ? response.drivers : [];
            get().setDrivers(drivers);
            set(() => ({
                lastFetchTimestamp: now,
                lastFetchParams: cacheKey,
            }));
            return drivers;
        } catch (error) {
            console.log('Error fetching nearby drivers:', error);
            throw error;
        }
    },
    getDriversByType: (type=null) => {
        if (!type) return get().driversAll;
        const key = normalizeType(type);
        return get().driversByType[key] || [];
    },
    getAutoDrivers: () => get().getDriversByType('AUTO'),
    getElectricAutoDrivers: () => get().getDriversByType('ELECTRIC_AUTO'),
    getSuvDrivers: () => get().getDriversByType('SUV'),
    getElectricSuvDrivers: () => get().getDriversByType('ELECTRIC_SUV'),
    getElectricBikeDrivers: () => get().getDriversByType('ELECTRIC_BIKE'),
    getSedanDrivers: () => get().getDriversByType('SEDAN'),
    getElectricSedanDrivers: () => get().getDriversByType('ELECTRIC_SEDAN'),
    getBikeDrivers: () => get().getDriversByType('BIKE'),
    getHatchbackDrivers: () => get().getDriversByType('HATCHBACK'),
    getElectricHatchbackDrivers: () => get().getDriversByType('ELECTRIC_HATCHBACK'),
    isFemaleDriverAvailable: () => {
        const list = get().driversAll || [];
        return list.some((d) => (d?.gender || '').toLowerCase() === 'female');
    },
    isTrustedDriverAvailable: () => {
        const list = get().driversAll || [];
        return list.some((d) => Boolean(d?.isTrusted));
    },
}));

export default useNearbyDrivers;
export { useNearbyDrivers as useNearbyDriversStore };
