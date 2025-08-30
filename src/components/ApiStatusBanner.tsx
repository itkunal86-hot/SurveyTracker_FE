import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useApiStatus } from '@/contexts/ApiStatusContext';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ApiStatusBanner: React.FC = () => {
  const { isUsingMockData, serverStatus } = useApiStatus();

  if (serverStatus === 'online' && !isUsingMockData) {
    return null; // Don't show banner when everything is working normally
  }

  const getStatusInfo = () => {
    switch (serverStatus) {
      case 'checking':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          title: 'Checking server connection...',
          variant: 'default' as const,
          badge: 'Connecting'
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          title: 'Server offline - Using comprehensive mock infrastructure data',
          variant: 'destructive' as const,
          badge: 'Mock Data'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Server connection error - Using comprehensive mock infrastructure data',
          variant: 'destructive' as const,
          badge: 'Mock Data'
        };
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          title: 'Connected to server',
          variant: 'default' as const,
          badge: 'Online'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Alert variant={statusInfo.variant} className="mb-4 border-l-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <AlertDescription className="font-medium">
            {statusInfo.title}
          </AlertDescription>
        </div>
        <Badge 
          variant={statusInfo.variant === 'destructive' ? 'destructive' : 'secondary'}
          className="ml-2"
        >
          {statusInfo.badge}
        </Badge>
      </div>
    </Alert>
  );
};
