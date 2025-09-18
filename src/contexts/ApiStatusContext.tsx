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
const RAW_API_URL = (import.meta as any)?.env?.VITE_API_URL ? String((import.meta as any).env.VITE_API_URL).trim() : "";
const CLEANED_API_URL = RAW_API_URL.replace(/^['"]|['"]$/g, "");
const API_ROOT = CLEANED_API_URL
  ? (CLEANED_API_URL.replace(/\/$/, "").endsWith("/api")
      ? CLEANED_API_URL.replace(/\/$/, "")
      : `${CLEANED_API_URL.replace(/\/$/, "")}/api`)
  : "/api";

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
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout

      const base = API_ROOT.replace(/\/$/, "");
      const candidates = Array.from(new Set([
        `${base}/health`,
        `${base}/api/health`,
        `/api/health`,
      ]));

      let response: Response | null = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
          });
          if (res.ok) {
            response = res;
            break;
          }
        } catch (_) {
          // try next
        }
      }

      clearTimeout(timeoutId);

      if (response && response.ok) {
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
