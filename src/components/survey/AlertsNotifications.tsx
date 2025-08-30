import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Battery, Wifi, WifiOff, Check, Download, Clock, Smartphone, HardDrive, Activity } from "lucide-react";

export const AlertsNotifications = () => {
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  // Mock data - replace with actual API calls
  const alerts = [
    {
      id: 1,
      type: "DA2 Battery Critical",
      instrument: "INS-001",
      deviceType: "DA2",
      message: "DA2 Battery level below 15% (12%)",
      severity: "critical",
      zone: "Zone A",
      surveyor: "John Doe",
      timestamp: "2024-01-20 14:30",
      batteryLevel: 12,
      healthStatus: "Critical",
      resolved: false
    },
    {
      id: 2,
      type: "Android Battery Warning",
      instrument: "INS-001",
      deviceType: "Android",
      message: "Android Controller battery below 25% (22%)",
      severity: "warning",
      zone: "Zone A",
      surveyor: "John Doe",
      timestamp: "2024-01-20 14:30",
      batteryLevel: 22,
      healthStatus: "Fair",
      resolved: false
    },
    {
      id: 3,
      type: "DA2 Health Critical",
      instrument: "INS-045",
      deviceType: "DA2",
      message: "DA2 device health critical - immediate attention required",
      severity: "critical",
      zone: "Zone B",
      surveyor: "Jane Smith",
      timestamp: "2024-01-20 14:25",
      batteryLevel: 45,
      healthStatus: "Critical",
      resolved: false
    },
    {
      id: 4,
      type: "Android Overheating",
      instrument: "INS-045",
      deviceType: "Android",
      message: "Android Controller overheating detected",
      severity: "warning",
      zone: "Zone B",
      surveyor: "Jane Smith",
      timestamp: "2024-01-20 14:25",
      batteryLevel: 78,
      healthStatus: "Warning",
      resolved: false
    },
    {
      id: 5,
      type: "DA2 Battery Critical",
      instrument: "INS-078",
      deviceType: "DA2",
      message: "DA2 Battery level below 10% (8%)",
      severity: "critical",
      zone: "Zone A",
      surveyor: "Mike Johnson",
      timestamp: "2024-01-20 14:20",
      batteryLevel: 8,
      healthStatus: "Critical",
      resolved: false
    },
    {
      id: 6,
      type: "Android Memory Warning",
      instrument: "INS-078",
      deviceType: "Android",
      message: "Android Controller memory usage high",
      severity: "warning",
      zone: "Zone A",
      surveyor: "Mike Johnson",
      timestamp: "2024-01-20 14:20",
      batteryLevel: 56,
      healthStatus: "Fair",
      resolved: false
    },
    {
      id: 7,
      type: "DA2 Battery Warning",
      instrument: "INS-023",
      deviceType: "DA2",
      message: "DA2 Battery level below 20% (18%)",
      severity: "warning",
      zone: "Zone C",
      surveyor: "Sarah Wilson",
      timestamp: "2024-01-20 13:45",
      batteryLevel: 18,
      healthStatus: "Fair",
      resolved: true
    },
    {
      id: 8,
      type: "Android Battery Good",
      instrument: "INS-023",
      deviceType: "Android",
      message: "Android Controller battery restored",
      severity: "info",
      zone: "Zone C",
      surveyor: "Sarah Wilson",
      timestamp: "2024-01-20 13:45",
      batteryLevel: 85,
      healthStatus: "Good",
      resolved: true
    },
  ];

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = alertTypeFilter === "all" ||
      alert.type.toLowerCase().includes(alertTypeFilter.toLowerCase()) ||
      alert.deviceType.toLowerCase().includes(alertTypeFilter.toLowerCase());
    const matchesZone = zoneFilter === "all" || alert.zone === zoneFilter;
    return matchesType && matchesZone;
  });

  const unresolvedAlerts = filteredAlerts.filter(alert => !alert.resolved);
  const resolvedAlerts = filteredAlerts.filter(alert => alert.resolved);

  const getAlertIcon = (deviceType: string) => {
    switch (deviceType) {
      case "DA2":
        return <HardDrive className="w-4 h-4 text-blue-500" />;
      case "Android":
        return <Smartphone className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge variant="secondary" className="text-orange-700 bg-orange-100">Warning</Badge>;
      case "info":
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const handleMarkResolved = (alertId: number) => {
    // In real implementation, this would call an API
    console.log(`Marking alert ${alertId} as resolved`);
  };

  const handleExportAlerts = () => {
    // In real implementation, this would generate and download a CSV
    console.log("Exporting alerts to CSV");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Monitor and manage system alerts</p>
        </div>
        <Button onClick={handleExportAlerts}>
          <Download className="w-4 h-4 mr-2" />
          Export Alerts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{filteredAlerts.length}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredAlerts.filter(a => a.severity === 'critical').length}
                </p>
              </div>
              <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredAlerts.filter(a => a.severity === 'warning').length}
                </p>
              </div>
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</p>
              </div>
              <Check className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DA2">DA2 Device</SelectItem>
                <SelectItem value="Android">Android Controller</SelectItem>
                <SelectItem value="battery">Battery Issues</SelectItem>
                <SelectItem value="health">Health Issues</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="Zone A">Zone A</SelectItem>
                <SelectItem value="Zone B">Zone B</SelectItem>
                <SelectItem value="Zone C">Zone C</SelectItem>
                <SelectItem value="Zone D">Zone D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Unresolved Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Active Alerts
            <Badge variant="destructive">{unresolvedAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unresolvedAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.deviceType)}
                      <Badge variant="outline" className="text-xs">
                        {alert.deviceType}
                      </Badge>
                    </div>
                    {getSeverityBadge(alert.severity)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{alert.instrument}</span>
                      <Badge variant="secondary" className="text-xs">{alert.zone}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{alert.message}</p>

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Battery className="w-3 h-3" />
                        <span className={alert.batteryLevel < 20 ? 'text-red-500' : alert.batteryLevel < 50 ? 'text-yellow-500' : 'text-green-500'}>
                          {alert.batteryLevel}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span className={alert.healthStatus === 'Critical' ? 'text-red-500' : alert.healthStatus === 'Warning' || alert.healthStatus === 'Fair' ? 'text-yellow-500' : 'text-green-500'}>
                          {alert.healthStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkResolved(alert.id)}
                        className="text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Resolved Alerts
              <Badge variant="secondary">{resolvedAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resolvedAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-green-500 opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getAlertIcon(alert.deviceType)}
                        <Badge variant="outline" className="text-xs">
                          {alert.deviceType}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        Resolved
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{alert.instrument}</span>
                        <Badge variant="secondary" className="text-xs">{alert.zone}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{alert.message}</p>

                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <Battery className="w-3 h-3" />
                          <span className={alert.batteryLevel < 20 ? 'text-red-500' : alert.batteryLevel < 50 ? 'text-yellow-500' : 'text-green-500'}>
                            {alert.batteryLevel}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span className={alert.healthStatus === 'Critical' ? 'text-red-500' : alert.healthStatus === 'Warning' || alert.healthStatus === 'Fair' ? 'text-yellow-500' : 'text-green-500'}>
                            {alert.healthStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-xs text-muted-foreground pt-2 border-t">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>Resolved: {alert.timestamp}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
