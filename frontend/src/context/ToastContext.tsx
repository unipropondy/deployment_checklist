import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.toastContainer, { pointerEvents: 'box-none' as any }]}>
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[
              styles.toast,
              toast.type === 'success' && styles.toastSuccess,
              toast.type === 'error' && styles.toastError,
              toast.type === 'info' && styles.toastInfo,
            ]}
          >
            {toast.type === 'success' && <CheckCircle size={18} color="#10B981" style={styles.icon} />}
            {toast.type === 'error' && <AlertCircle size={18} color="#EF4444" style={styles.icon} />}
            {toast.type === 'info' && <Info size={18} color="#FF7A00" style={styles.icon} />}
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    left: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 6,
    // @ts-ignore
    boxShadow: '0px 4px 16px rgba(15, 23, 42, 0.15)',
    maxWidth: 500,
    width: '100%',
  },
  toastSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  toastError: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  toastInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF7A00',
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
