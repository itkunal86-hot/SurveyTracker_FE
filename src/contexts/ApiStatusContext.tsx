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

export const ApiStatusProvider: React.FC<ApiStatusProviderProps> = ({ children }) => {
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');

  useEffect(() => {
    // Check API status on component mount
    checkApiStatus();
    
    // Set up periodic health checks every 60 seconds
    const interval = setInterval(checkApiStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      setServerStatus('checking');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout

      const response = await fetch('/api/health', {
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
      if (error.name !== 'AbortError') {
        console.warn('API health check failed:', error.message);
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
