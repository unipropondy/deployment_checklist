import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android emulator, fallback to 10.0.2.2 if localhost is specified
let baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

if (Platform.OS === 'android' && baseURL.includes('localhost')) {
  baseURL = baseURL.replace('localhost', '10.0.2.2');
}

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
