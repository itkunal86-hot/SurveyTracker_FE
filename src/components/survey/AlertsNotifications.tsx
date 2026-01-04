import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Battery, Wifi, WifiOff, Check, Download, Clock, Smartphone, HardDrive, Activity, X } from "lucide-react";
import { useDeviceAlerts } from "@/hooks/useApiQueries";
import { API_BASE_PATH, apiClient, type Zone } from "@/lib/api";
import { getBatteryColor, getBatteryBorderColor, getAlertSeverityBorderColor } from "@/utils/batteryUtils";

export const AlertsNotifications = () => {
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);

  const { data: alertsResp, isLoading } = useDeviceAlerts({ limit: 100 });
  const alerts = Array.isArray(alertsResp?.data) ? alertsResp!.data : [];

  // ✅ Fetch zones from API
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const response = await apiClient.getZones({ limit: 100 });
        setZones(response.data || []);
      } catch (error) {
        console.error("Error fetching zones:", error);
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, []);

  const filteredAlerts = alerts.filter((alert: any) => {
    // Match device type (Android or DA2)
    const matchesDeviceType = deviceTypeFilter === "all" ||
      alert.deviceType === deviceTypeFilter;

    // Match zone by comparing alert zone (name or id) with selected zone id
    const matchesZone = zoneFilter === "all" ||
      (alert.zone && (
        alert.zone.toLowerCase() === zoneFilter.toLowerCase() ||
        zones.some(z => z.id === zoneFilter && (z.name.toLowerCase() === alert.zone.toLowerCase() || z.id === alert.zone))
      ));

    return matchesDeviceType && matchesZone;
  });

  const unresolvedAlerts = filteredAlerts.filter((alert: any) => !(alert.resolved ?? false));
  const resolvedAlerts = filteredAlerts.filter((alert: any) => (alert.resolved ?? false));

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

  const handleMarkResolved = (alertId: string) => {
    console.log(`Marking alert ${alertId} as resolved`);
  };

  // const handleExportAlerts = () => {
  //   console.log("Exporting alerts to CSV");
  // };

//   const handleExportAlerts = async () => {
//   try {
//     // ✅ Use your proxy route to avoid CORS issues
//     const response = await fetch("/api/proxy/device-alerts/export", {
//       method: "GET",
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to export alerts: ${response.statusText}`);
//     }

//     // ✅ Get the response as a Blob (for CSV or Excel)
//     const blob = await response.blob();

//     // ✅ Create a downloadable URL
//     const url = window.URL.createObjectURL(blob);

//     // ✅ Create an <a> element to trigger download
//     const a = document.createElement("a");
//     a.href = url;

//     // Try to infer filename from headers or fallback
//     const contentDisposition = response.headers.get("content-disposition");
//     let filename = "device-alerts-export.csv";
//     if (contentDisposition && contentDisposition.includes("filename=")) {
//       filename = contentDisposition.split("filename=")[1].replace(/['"]/g, "");
//     }

//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();

//     // ✅ Cleanup
//     a.remove();
//     window.URL.revokeObjectURL(url);
//   } catch (error) {
//     console.error("Error exporting alerts:", error);
//     alert("Failed to export alerts. Please try again later.");
//   }
// };

const handleExportAlerts = async () => {
  try {
    console.log("Exporting alerts to CSV...");

    // Use your .NET API directly
    //const apiUrl = "https://localhost:7215/api/Device/alerts/export";
    const apiUrl = `${API_BASE_PATH}/Device/alerts/export`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "text/csv",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export alerts: ${response.statusText}`);
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `device_alerts_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("Alerts exported successfully.");
  } catch (error: any) {
    console.error("Error exporting alerts:", error);
    alert(`Failed to export alerts: ${error.message}`);
  }
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
                <p className="text-2xl font-bold">{isLoading ? "..." : filteredAlerts.length}</p>
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
                  {isLoading ? "..." : filteredAlerts.filter((a: any) => a.severity === 'critical').length}
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
                <p className="text-sm font-medium text-muted-foreground">Fair</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? "..." : filteredAlerts.filter((a: any) => a.severity === 'fair').length}
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
                {/* <p className="text-2xl font-bold text-green-600">{isLoading ? "..." : resolvedAlerts.length}</p> */}
              <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : filteredAlerts.filter((a: any) => a.severity === 'good').length}
                </p>
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
            <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="DA2">DA2 Device</SelectItem>
                <SelectItem value="Android">Android Device</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter} disabled={loadingZones}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={loadingZones ? "Loading zones..." : "Zone"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
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
            <Badge variant="destructive">{isLoading ? "..." : unresolvedAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-sm text-muted-foreground">Loading alerts...</div>
            ) : (
              unresolvedAlerts.map((alert: any) => (
                <Card key={alert.id} className={`border-l-4 ${getAlertSeverityBorderColor(alert.severity)}`}>
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
                        <Badge variant="secondary" className="text-xs">{alert.zone || ""}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{alert.message}</p>

                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <Battery className="w-3 h-3" />
                          <span className={getBatteryColor(Number(alert.batteryLevel ?? 0))}>
                            {alert.batteryLevel ?? 0}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span className={alert.healthStatus === 'Critical' ? 'text-red-500' : alert.healthStatus === 'Warning' || alert.healthStatus === 'Fair' ? 'text-yellow-500' : 'text-green-500'}>
                            {alert.healthStatus ?? ''}
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
                          onClick={() => handleMarkResolved(String(alert.id))}
                          className="text-xs"
                        >
                          {alert.resolved ? (
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <X className="w-3 h-3 mr-1 text-red-500" />
                          )}
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
              {isLoading ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-sm text-muted-foreground">Loading alerts...</div>
              ) : (
                resolvedAlerts.map((alert: any) => (
                  <Card key={alert.id} className={`border-l-4 ${getAlertSeverityBorderColor(alert.severity)} opacity-70`}>
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
                          <Badge variant="secondary" className="text-xs">{alert.zone || ""}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{alert.message}</p>

                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <Battery className="w-3 h-3" />
                            <span className={getBatteryColor(Number(alert.batteryLevel ?? 0))}>
                              {alert.batteryLevel ?? 0}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span className={alert.healthStatus === 'Critical' ? 'text-red-500' : alert.healthStatus === 'Warning' || alert.healthStatus === 'Fair' ? 'text-yellow-500' : 'text-green-500'}>
                              {alert.healthStatus ?? ''}
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
                            onClick={() => handleMarkResolved(String(alert.id))}
                            className="text-xs"
                            disabled
                          >
                            <Check className="w-3 h-3 mr-1 text-green-500" />
                            Resolved
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
