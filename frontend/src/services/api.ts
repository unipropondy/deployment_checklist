import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

declare const __DEV__: boolean;

const RAILWAY_API_URL = 'https://deploymentchecklist-production.up.railway.app/api';

const getBaseURL = (): string => {
  const envApiUrl = (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Check if running on web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // If testing on local browser, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Remote / Production web deployment
    return RAILWAY_API_URL;
  }

  // Native / Android / iOS: Default to Railway HTTPS backend so Expo Go on physical phones & emulators connect cleanly
  return RAILWAY_API_URL;
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
