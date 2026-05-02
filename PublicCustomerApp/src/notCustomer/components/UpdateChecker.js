import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Compare build number or version (x.x.x.x).
 * Ignores all characters and special characters except '.' in VERSION strings.
 * Payload example:
 * versions: {
 *   ANDROID: { BUILD_NUMBER: 120, VERSION: "1.2.3.4" },
 *   IOS: { BUILD_NUMBER: 120, VERSION: "1.2.3.4" }
 * }
 */
export async function checkUpdateStatus(versions) {
  try {
    const latest = Platform.select({
      android: versions?.ANDROID,
      ios: versions?.IOS,
    }) || {};

    const currentBuildRaw = DeviceInfo.getBuildNumber(); // e.g. "120"
    const currentVersionRaw = DeviceInfo.getVersion();   // e.g. "1.2.3" or "1.2.3.4"

    const stripNonDigits = (v) => String(v ?? '').replace(/[^0-9]/g, '');
    const sanitizeVersion = (v) => {
      // keep only digits and dots, collapse multiple dots, trim leading/trailing dots
      const s = String(v ?? '').replace(/[^0-9.]/g, '').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
      return s;
    };

    const normalizeInt = (v) => {
      const cleaned = stripNonDigits(v);
      if (!cleaned) return NaN;
      const n = parseInt(cleaned, 10);
      return Number.isNaN(n) ? NaN : n;
    };

    const compareVersion = (a, b) => {
      // tolerant: pads/truncates to 4 parts, ignores non-digit chars except '.'
      const toParts = (v) => {
        const s = sanitizeVersion(v);
        const parts = s.split('.').slice(0, 4);
        const nums = parts.map(x => {
          const n = normalizeInt(x);
          return Number.isFinite(n) ? n : NaN;
        });
        // pad to 4
        while (nums.length < 4) nums.push(0);
        return nums.slice(0, 4);
      };

      const A = toParts(a);
      const B = toParts(b);

      // if latest version is absent or invalid, return null to fall back
      if (!b || B.every(x => x === 0) || B.some(x => !Number.isFinite(x))) return null;

      // treat invalid current parts as 0
      for (let i = 0; i < 4; i++) {
        if (!Number.isFinite(A[i])) A[i] = 0;
        if (A[i] < B[i]) return -1;
        if (A[i] > B[i]) return 1;
      }
      return 0;
    };

    const latestBuild = normalizeInt(latest?.BUILD_NUMBER);
    const currentBuild = normalizeInt(currentBuildRaw);

    const latestVersion = latest?.VERSION;
    const currentVersion = currentVersionRaw;

    // Prefer VERSION comparison when latest VERSION is provided and valid
    const versionCmp = compareVersion(currentVersion, latestVersion);
    if (versionCmp !== null) {
      return versionCmp < 0 ? 'force' : 'none';
    }

    // Fallback to BUILD_NUMBER comparison
    if (!Number.isFinite(latestBuild)) {
      console.warn('[UpdateCheck] Invalid latest payload:', versions);
      return 'none';
    }

    const buildOutdated = Number.isFinite(currentBuild) && currentBuild < latestBuild;
    return buildOutdated ? 'force' : 'none';
  } catch (e) {
    console.log('checkUpdateStatus error:', e);
    return 'none';
  }
}
