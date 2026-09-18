import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

export interface User {
  UserId: number;
  Name: string;
  Email?: string;
  IsActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@deploycheck_token');
        const storedUser = await AsyncStorage.getItem('@deploycheck_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          try {
            const meRes: any = await authService.getMe();
            if (meRes && meRes.success && meRes.data) {
              setUser(meRes.data);
              await AsyncStorage.setItem('@deploycheck_user', JSON.stringify(meRes.data));
            }
          } catch (e) {
            console.log('Token validation failed, clearing stored auth.');
            await AsyncStorage.removeItem('@deploycheck_token');
            await AsyncStorage.removeItem('@deploycheck_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Error loading stored auth from AsyncStorage:', e);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res: any = await authService.login(credentials);
      if (res && res.success && res.data) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        await AsyncStorage.setItem('@deploycheck_token', newToken);
        await AsyncStorage.setItem('@deploycheck_user', JSON.stringify(newUser));
      } else {
        throw new Error(res?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('@deploycheck_token');
      await AsyncStorage.removeItem('@deploycheck_user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
