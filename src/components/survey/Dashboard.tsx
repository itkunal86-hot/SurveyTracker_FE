import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Battery, MapPin, Users, Wifi, Smartphone, HardDrive } from "lucide-react";
import { LocationHeatmapAnalytics } from "@/components/analytics/LocationHeatmapAnalytics";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useState } from "react";
import { useDeviceAlerts } from "@/hooks/useApiQueries";

export const SurveyDashboard = () => {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    surveyors: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ✅ Fetch smId (Survey ID) from localStorage
  // const smId = localStorage.getItem("activeSurveyId");
  // ✅ Track active survey ID as state (reactive)
  const [smId, setSmId] = useState(localStorage.getItem("activeSurveyId"));

// ✅ Listen for changes to localStorage (from other tabs or in-app updates)
useEffect(() => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === "activeSurveyId") {
      setSmId(event.newValue);
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Optional: also support same-tab changes
  const checkLocalChange = () => {
    const currentId = localStorage.getItem("activeSurveyId");
    setSmId(currentId);
  };
  const interval = setInterval(checkLocalChange, 1000); // check every second

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    clearInterval(interval);
  };
}, []);

// ✅ Fetch summary data from API whenever smId changes
useEffect(() => {
  const fetchStats = async () => {
    if (!smId) {
      console.warn("No activeSurveyId found in localStorage");
      return;
    }

    try {
      setLoadingStats(true);
      const response = await fetch(`https://localhost:7215/api/DeviceAssignments/summary/${smId}`);
      if (!response.ok) throw new Error("Failed to fetch summary data");
      const data = await response.json();

      setStats({
        totalDevices: data.totalDevices ?? 0,
        activeDevices: data.activeDevices ?? 0,
        inactiveDevices: data.inactiveDevices ?? 0,
        surveyors: data.surveyors ?? 0
      });
    } catch (error) {
      console.error("Error fetching device summary:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  fetchStats();
}, [smId]);

// export const SurveyDashboard = () => {
//   const [selectedLocation, setSelectedLocation] = useState("all");

  // Location/Zone filter options
  const locationOptions = [
    { value: "all", label: "All Zones" },
    { value: "zone-a", label: "Zone A - Main Pipeline" },
    { value: "zone-b", label: "Zone B - Distribution" },
    { value: "zone-c", label: "Zone C - Terminal" },
    { value: "zone-d", label: "Zone D" },
    { value: "godown", label: "Godown" }
  ];

  // Mock data - replace with actual API calls
  // const stats = {
  //   totalInstruments: 156,
  //   activeInstruments: 142,
  //   inactiveInstruments: 14,
  //   inGodown: 23,
  //   withSurveyors: 133
  // };

  // Usage data for the last 7 days
  const usageData = [
    { day: 'Mon', surveys: 45, instruments: 120, efficiency: 85 },
    { day: 'Tue', surveys: 52, instruments: 135, efficiency: 88 },
    { day: 'Wed', surveys: 38, instruments: 98, efficiency: 79 },
    { day: 'Thu', surveys: 61, instruments: 145, efficiency: 92 },
    { day: 'Fri', surveys: 55, instruments: 142, efficiency: 89 },
    { day: 'Sat', surveys: 29, instruments: 87, efficiency: 76 },
    { day: 'Sun', surveys: 23, instruments: 65, efficiency: 71 },
  ];

  // Alerts from API
  const { data: alertsResp, isLoading: alertsLoading } = useDeviceAlerts({ limit: 100 });
  const alerts = Array.isArray(alertsResp?.data) ? alertsResp!.data : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">Survey Dashboard</h1>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select location/zone" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Wifi className="w-4 h-4 text-green-500" />
          <span>Last sync: 2 mins ago</span>
        </div>
      </div>

      {/* Top Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instruments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">{stats.totalInstruments}</div> */}
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold text-green-600">{stats.activeInstruments}</div> */}
            <div className="text-2xl font-bold text-green-600">{stats.activeDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold text-red-600">{stats.inactiveInstruments}</div> */}
            <div className="text-2xl font-bold text-red-600">{stats.inactiveDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Godown</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">{stats.inGodown}</div> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Surveyors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* <div className="text-2xl font-bold">{stats.withSurveyors}</div> */}
            <div className="text-2xl font-bold">{stats.surveyors}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Heatmap Panel */}
        <Card>
          <CardContent className="p-0">
            <LocationHeatmapAnalytics />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Alerts Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Alerts
              <Badge variant="destructive">{alertsLoading ? "..." : alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertsLoading ? (
                <div className="text-sm text-muted-foreground">Loading alerts...</div>
              ) : (
                alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {alert.deviceType === 'DA2' ? (
                        <HardDrive className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-green-500" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{alert.instrument}</p>
                          <Badge variant="outline" className="text-xs">
                            {alert.deviceType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <Battery className="w-3 h-3" />
                            <span className={`text-xs ${Number(alert.batteryLevel ?? 0) < 20 ? 'text-red-500' : Number(alert.batteryLevel ?? 0) < 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                              {Number(alert.batteryLevel ?? 0)}%
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span className={`text-xs ${alert.healthStatus === 'Critical' ? 'text-red-500' : alert.healthStatus === 'Warning' || alert.healthStatus === 'Fair' ? 'text-yellow-500' : 'text-green-500'}`}>
                              {alert.healthStatus ?? ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant={(String(alert.severity || '').toLowerCase() === 'critical') ? 'destructive' : 'secondary'}>
                      {String(alert.severity || '').toLowerCase() || 'info'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Graph */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="surveys"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Surveys Completed"
                />
                <Line
                  type="monotone"
                  dataKey="instruments"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Instruments Used"
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#ffc658"
                  strokeWidth={2}
                  name="Efficiency %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Last Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Global Sync</span>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Successful Sync</span>
                <span className="text-sm">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Instruments Synced</span>
                <span className="text-sm">142/156</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
