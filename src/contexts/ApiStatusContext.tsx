import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface ApiStatusContextType {
  isUsingMockData: boolean;
  setIsUsingMockData: (value: boolean) => void;
  serverStatus: 'checking' | 'online' | 'offline' | 'error';
  setServerStatus: (status: 'checking' | 'online' | 'offline' | 'error') => void;
}

const ApiStatusContext = createContext<ApiStatusContextType | undefined>(undefined);

interface ApiStatusProviderProps {
  children: ReactNode;
}

const DISABLE_API_HEALTH = (import.meta as any)?.env?.VITE_DISABLE_API_HEALTH === '1' || (import.meta as any)?.env?.VITE_DISABLE_API_HEALTH === 'true';

export const ApiStatusProvider: React.FC<ApiStatusProviderProps> = ({ children }) => {
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');

  useEffect(() => {
    if (DISABLE_API_HEALTH) {
      setServerStatus('online');
      setIsUsingMockData(false);
      return;
    }

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      setServerStatus('checking');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const rawApi = ((import.meta as any)?.env?.VITE_API_URL ?? '').toString().trim();
      const cleanedApi = rawApi.replace(/^['"]|['"]$/g, '');
      const apiBase = cleanedApi || '/api';
      const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

      const response = await fetch(`${base}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setServerStatus('online');
        setIsUsingMockData(false);
      } else {
        setServerStatus('offline');
        setIsUsingMockData(true);
      }
    } catch (error) {
      // Only log non-abort errors to reduce console noise
      if ((error as any).name !== 'AbortError') {
        console.warn('API health check failed:', (error as any).message);
      }
      setServerStatus('offline');
      setIsUsingMockData(true);
    }
  };

  return (
    <ApiStatusContext.Provider value={{
      isUsingMockData,
      setIsUsingMockData,
      serverStatus,
      setServerStatus
    }}>
      {children}
    </ApiStatusContext.Provider>
  );
};

export const useApiStatus = () => {
  const context = useContext(ApiStatusContext);
  if (!context) {
    throw new Error('useApiStatus must be used within an ApiStatusProvider');
  }
  return context;
};
