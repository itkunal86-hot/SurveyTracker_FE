import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Battery, Activity, RefreshCw, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_PATH } from "@/lib/api";

interface DeviceLog {
  id: string;
  name: string;
  type?: string;
  status: string;
  batteryLevel?: number;
  lastSeen?: string;
  coordinates?: { lat: number; lng: number };
  surveyor?: string;
  serialNumber?: string;
  modelName?: string;
  currentLocation?: string;
  location?: string;
  surveyCount?: string;
}

interface DeviceLogGridProps {
  summaryType?: string;
  selectedTime?: string;
  selectedZone?: string;
}

export const DeviceLogGrid = ({ summaryType = "", selectedTime = "5", selectedZone = "all" }: DeviceLogGridProps) => {
  const navigate = useNavigate();
  const [deviceLogs, setDeviceLogs] = useState<DeviceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Calculate date range based on timeRange value
  const getDateRange = (timeValue: string) => {
    const endDate = new Date();
    let startDate = new Date();

    if (timeValue === "today") {
      // Set start date to beginning of today
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Time value represents last N minutes from selectedTime dropdown
      const minutes = parseInt(timeValue, 10);
      if (!isNaN(minutes) && minutes > 0) {
        startDate.setMinutes(startDate.getMinutes() - minutes);
      }
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  // Fetch device logs
  const fetchDeviceLogs = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get date range for the selected time
      const { startDate, endDate } = getDateRange(selectedTime);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        startDate,
        endDate,
        zone: selectedZone,
        ...(summaryType && { summaryType }),
      });

      const response = await fetch(
        `${API_BASE_PATH}/DeviceLog/getdeviceactivelog?${params.toString()}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch device logs: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle various response formats
      const rawItems = Array.isArray(data?.data?.items)
        ? data.data.items
        : Array.isArray(data?.data?.data)
          ? data.data.data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

      const normalizeStatus = (val: any): string => {
        const s = String(val || "").toUpperCase();
        if (s === "ONLINE" || s === "CONNECTED") return "ACTIVE";
        if (s === "OFFLINE" || s === "DISCONNECTED") return "INACTIVE";
        if (s === "MAINTENANCE" || s === "SERVICE") return "MAINTENANCE";
        if (s === "ERROR" || s === "FAULT") return "ERROR";
        return val || "UNKNOWN";
      };

      const mapped: DeviceLog[] = rawItems.map((item: any) => ({
        id: String(
          item.id ??
            item.ID ??
            item.deviceId ??
            item.DeviceId ??
            item.device_id ??
            item.instrumentId ??
            item.InstrumentId ??
            `device-${Date.now()}`
        ),
        name: String(
          item.name ??
            item.Name ??
            item.deviceName ??
            item.DeviceName ??
            item.instrument ??
            item.Instrument ??
            "Unknown"
        ),
        type: String(
          item.type ??
            item.Type ??
            item.deviceType ??
            item.DeviceType ??
            item.model ??
            item.Model ??
            "DEVICE"
        ),
        status: normalizeStatus(
          item.status ?? item.Status ?? item.state ?? item.State
        ),
        batteryLevel: Number(item.battery ?? item.Battery ?? item.batteryLevel ?? item.BatteryLevel) || undefined,
        lastSeen: String(
          item.lastUpdate ??
            item.LastUpdated ??
            item.lastUpdate ??
            item.LastUpdate ??
            item.lastSeen ??
            item.LastSeen ??
            item.lastPing ??
            item.LastPing ??
            item.timestamp ??
            item.Timestamp ??
            item.logTime ??
            item.LogTime ??
            ""
        ) || undefined,
        coordinates:
          item.coordinates && typeof item.coordinates.lat === "number"
            ? { lat: item.coordinates.lat, lng: item.coordinates.lng }
            : undefined,
        surveyor: item.surveyor ?? item.Surveyor ?? undefined,
        serialNumber: String(item.serialNumber ?? item.SerialNumber ?? item.serial_no ?? item.SERIAL_NO ?? "") || undefined,
        modelName: item.modelName ?? item.ModelName ?? undefined,
        currentLocation: item.currentLocation  ?? undefined,
        location: item.location  ?? undefined,
        surveyCount: item.surveyCount ?? undefined,
      }));

      setDeviceLogs(mapped);
      setPagination({
        page,
        limit: pagination.limit,
        total: data?.data?.pagination?.total || mapped.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load device logs";
      setError(message);
      console.error("Error fetching device logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on component mount and when time selection, summaryType, or zone changes
  useEffect(() => {
    fetchDeviceLogs(1);
  }, [selectedTime, summaryType, selectedZone]);

  const getBatteryColor = (battery?: number) => {
    if (battery === undefined) return "text-muted-foreground";
    if (battery < 20) return "text-red-500";
    if (battery < 50) return "text-orange-500";
    return "text-green-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "INACTIVE":
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-orange-100 text-orange-800">Maintenance</Badge>;
      case "ERROR":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatLastSeen = (dateString?: string): string => {
    if (!dateString) return "-";

    try {
      // Parse the ISO timestamp
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }

      // Calculate time difference from now
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Return relative time if recent
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;

      // Otherwise return formatted date: DD/MM/YYYY HH:MM:SS
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Device Logs</CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDeviceLogs(pagination.page)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Name</TableHead>
                {/* <TableHead>Type</TableHead> */}
                <TableHead>Initial Location</TableHead>
                <TableHead>Current Location</TableHead>
                <TableHead>Survey Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Surveyor</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    Loading device logs...
                  </TableCell>
                </TableRow>
              ) : deviceLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No device logs found for the selected time range
                  </TableCell>
                </TableRow>
              ) : (
                deviceLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>{log.name}</TableCell>
                    {/* <TableCell className="text-sm">{log.type}</TableCell> */}
                    <TableCell className="text-sm">{log.location}</TableCell>
                    <TableCell className="text-sm">{log.currentLocation}</TableCell>
                    <TableCell className="text-sm">{log.surveyCount}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      {log.batteryLevel !== undefined ? (
                        <div className="flex items-center space-x-1">
                          <Battery className={`w-4 h-4 ${getBatteryColor(log.batteryLevel)}`} />
                          <span className={`text-sm ${getBatteryColor(log.batteryLevel)}`}>
                            {log.batteryLevel}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.lastSeen ? (
                        <div className="flex items-center space-x-1">
                          {log.lastSeen.toLowerCase().includes("mins") || log.lastSeen.toLowerCase().includes("ago") || log.lastSeen.toLowerCase().includes("just now") ? (
                            <Wifi className="w-3 h-3 text-green-500" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-red-500" />
                          )}
                          <span className="text-sm">{formatLastSeen(log.lastSeen)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.surveyor || "-"}</TableCell>
                    <TableCell className="text-sm">{log.serialNumber || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/daily-personal-maps")}
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Analytics
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!isLoading && deviceLogs.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)} ({pagination.total} total logs)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDeviceLogs(pagination.page - 1)}
                disabled={isLoading || pagination.page === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">Page</span>
                <input
                  type="number"
                  min="1"
                  max={Math.ceil(pagination.total / pagination.limit)}
                  value={pagination.page}
                  onChange={(e) => {
                    const pageNum = Math.max(1, Math.min(parseInt(e.target.value) || 1, Math.ceil(pagination.total / pagination.limit)));
                    fetchDeviceLogs(pageNum);
                  }}
                  className="w-12 px-2 py-1 border rounded text-center text-sm"
                  disabled={isLoading}
                />
                <span className="text-sm text-muted-foreground">of {Math.ceil(pagination.total / pagination.limit)}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDeviceLogs(pagination.page + 1)}
                disabled={isLoading || pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
