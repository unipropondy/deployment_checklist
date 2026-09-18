import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

declare const __DEV__: boolean;

const RAILWAY_API_URL = 'https://deploymentchecklist-production.up.railway.app/api';

const getBaseURL = (): string => {
  const envApiUrl = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL;

  // 1. Web Browser Environment Auto-Detection
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // If running on local computer browser (localhost / 127.0.0.1), ALWAYS point to local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Remote / Deployed production web site (Cloudflare Pages, Vercel, Railway, etc.)
    return envApiUrl || RAILWAY_API_URL;
  }

  // 2. Mobile / Native Platforms (Android & iOS)
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  if (isDev) {
    // If explicit env set for mobile dev, use it; otherwise fallback to Android Emulator or localhost
    if (envApiUrl && !envApiUrl.includes('localhost')) {
      return envApiUrl;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
  }

  // Production mobile standalone app build
  return envApiUrl || RAILWAY_API_URL;
};

let baseURL = getBaseURL();
console.log('[API] Initialized with baseURL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@deploycheck_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching auth token from AsyncStorage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
