import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Determine the backend base URL to use for API calls.
 * Priority:
 * 1. `process.env.BACKEND_URL` if set (useful for dev env overrides)
 * 2. Expo manifest debuggerHost (extract IP) when running via Expo on a device
 * 3. Android emulator host `10.0.2.2`
 * 4. default to `localhost`
 */
export function getBackendBaseUrl(port = 5001) {
  // Allow explicit override via environment (e.g., with dotenv or metro config)
  // Note: process.env may not be available in all Expo setups; keep as optional.
  // eslint-disable-next-line no-undef
  const envUrl = (typeof process !== 'undefined' && (process.env as any)?.BACKEND_URL) as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // Try to use the debugger host from Expo manifest (useful when running on a physical device)
  const manifest = (Constants as any).manifest || (Constants as any).expoConfig || null;
  const debuggerHost = manifest?.debuggerHost || manifest?.hostUri || null;
  if (debuggerHost && typeof debuggerHost === 'string') {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:${port}`;
  }

  // Android emulator special host
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }

  // Default to localhost for iOS simulator / web
  return `http://localhost:${port}`;
}

export default getBackendBaseUrl;
