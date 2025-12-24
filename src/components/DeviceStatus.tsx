import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";
import { Pagination } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTable } from "@/hooks/use-table";
import {
  Monitor,
  Search,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Filter,
  MapPin,
  User,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeafletMap } from "@/components/LeafletMap";
import { useDeviceLogs } from "@/hooks/useApiQueries";
import { Device } from "@/lib/api";

interface ExtendedDevice extends Omit<Device, 'surveyor'> {
  location?: string;
  serialNumber?: string;
  surveyor?: string | {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
}

export const DeviceStatus = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const {
    data: devicesResponse,
    isLoading,
    error,
    refetch,
  } = useDeviceLogs({ limit: 100 });

  // Transform API data to match component interface
  const devices: ExtendedDevice[] = useMemo(() => {
    if (!Array.isArray(devicesResponse?.data)) return [];

    return devicesResponse.data.map((device) => ({
      ...device,
      location: `Zone ${device.name.split(" ")[0]} - ${device.type}`,
      serialNumber: device.serialNumber,
      surveyor: device.surveyor
        ? {
            id: device.surveyor,
            name: device.surveyor,
            phone: "+1-555-0123",
            email: `${device.surveyor.toLowerCase().replace(" ", ".")}@company.com`,
          }
        : undefined,
    }));
  }, [devicesResponse]);


  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.serialNumber &&
          device.serialNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (device.surveyor && typeof device.surveyor === "string"
          ? device.surveyor.toLowerCase().includes(searchTerm.toLowerCase())
          : typeof device.surveyor === "object" && device.surveyor?.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));

      const normalizedStatus =
        device.status === "ACTIVE"
          ? "active"
          : device.status === "INACTIVE"
            ? "offline"
            : device.status === "MAINTENANCE"
              ? "maintenance"
              : device.status === "ERROR"
                ? "offline"
                : device.status;

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [devices, searchTerm, statusFilter]);

  // Table functionality
  const { tableConfig, sortedAndPaginatedData } = useTable(
    filteredDevices,
    10,
    "name",
  );

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    const csvData = devices
      .map(
        (device) =>
          `${device.id},${device.name},${device.type},${device.serialNumber || "N/A"},${device.status},${device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "N/A"},"${device.coordinates ? `${device.coordinates.lat.toFixed(4)}, ${device.coordinates.lng.toFixed(4)}` : "N/A"}",${device.batteryLevel || "N/A"}%,${typeof device.accuracy === "number" ? device.accuracy : "N/A"}`,
      )
      .join("\n");

    const csvHeader =
      "Device ID,Name,Type,Serial Number,Status,Last Update,Coordinates (Lat/Lng),Battery Level,Accuracy\n";
    const csvContent = csvHeader + csvData;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `device-status-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus =
      status === "ACTIVE"
        ? "active"
        : status === "INACTIVE"
          ? "offline"
          : status === "MAINTENANCE"
            ? "maintenance"
            : status === "ERROR"
              ? "offline"
              : status;

    switch (normalizedStatus) {
      case "active":
        return <Wifi className="w-4 h-4 text-success" />;
      case "offline":
        return <WifiOff className="w-4 h-4 text-destructive" />;
      case "maintenance":
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Monitor className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus =
      status === "ACTIVE"
        ? "active"
        : status === "INACTIVE"
          ? "offline"
          : status === "MAINTENANCE"
            ? "maintenance"
            : status === "ERROR"
              ? "offline"
              : status;

    switch (normalizedStatus) {
      case "active":
        return "bg-success text-success-foreground";
      case "offline":
        return "bg-destructive text-destructive-foreground";
      case "maintenance":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-success";
    if (level > 20) return "text-warning";
    return "text-destructive";
  };

  const handleSurveyorClick = (
    surveyor: string | { id: string; name: string; phone: string; email: string; },
    deviceId: string,
  ) => {
    if (surveyor) {
      const surveyorId = typeof surveyor === "string" ? surveyor : surveyor.id;
      // Navigate to the main app with daily-maps tab active and URL parameters
      navigate(
        `/?tab=daily-maps&surveyor=${surveyorId}&device=${deviceId}&date=${new Date().toISOString().split("T")[0]}`,
      );
    }
  };

  const statusCounts = useMemo(() => {
    const normalizeStatus = (status: string) => {
      return status === "ACTIVE"
        ? "active"
        : status === "INACTIVE"
          ? "offline"
          : status === "MAINTENANCE"
            ? "maintenance"
            : status === "ERROR"
              ? "offline"
              : status;
    };

    return {
      total: devices.length,
      active: devices.filter(
        (d) => normalizeStatus(d.status) === "active",
      ).length,
      offline: devices.filter(
        (d) => normalizeStatus(d.status) === "offline",
      ).length,
      maintenance: devices.filter(
        (d) => normalizeStatus(d.status) === "maintenance",
      ).length,
    };
  }, [devices]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Status</h1>
          <p className="text-muted-foreground">
            Monitor all connected Trimble survey devices
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Error loading device data</p>
                <p className="text-sm text-muted-foreground">
                  {error.message ||
                    "Failed to fetch devices. Please try again."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Location Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Device Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-lg overflow-hidden">
            <LeafletMap
              devices={devices.map((device) => ({
                id: device.id,
                name: device.name,
                lat: device.coordinates.lat,
                lng: device.coordinates.lng,
                status:
                  device.status === "MAINTENANCE"
                    ? "offline"
                    : device.status === "ACTIVE"
                      ? "active"
                      : "offline",
                lastPing: device.lastSeen || "Unknown",
              }))}
              pipelines={[]}
              valves={[]}
              showDevices={true}
              showPipelines={false}
              showValves={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-sm text-muted-foreground">Total Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">
                  {statusCounts.active}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {statusCounts.offline}
                </p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">
                  {statusCounts.maintenance}
                </p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by device name, ID, serial number, or surveyor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Device Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device List ({filteredDevices.length} devices)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  sortKey="name"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Device
                </SortableTableHead>
                <SortableTableHead
                  sortKey="type"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Type
                </SortableTableHead>
                <SortableTableHead
                  sortKey="serialNumber"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Serial Number
                </SortableTableHead>
                <SortableTableHead
                  sortKey="status"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Status
                </SortableTableHead>
                <SortableTableHead
                  sortKey="surveyor"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                  sortable={false}
                >
                  Surveyor
                </SortableTableHead>
                <SortableTableHead
                  sortKey="lastSeen"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Last Update
                </SortableTableHead>
                <SortableTableHead
                  sortKey="location"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                  sortable={false}
                >
                  Location (Coordinates)
                </SortableTableHead>
                <SortableTableHead
                  sortKey="batteryLevel"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Battery
                </SortableTableHead>
                <SortableTableHead
                  sortKey="accuracy"
                  currentSortKey={tableConfig.sortConfig.key}
                  sortDirection={tableConfig.sortConfig.direction}
                  onSort={tableConfig.handleSort}
                >
                  Accuracy
                </SortableTableHead>
                {/* <TableHead>Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndPaginatedData.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(device.status)}
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {device.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {device.serialNumber || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(device.status)}>
                      {device.status === "ACTIVE"
                        ? "active"
                        : device.status === "INACTIVE"
                          ? "offline"
                          : device.status === "MAINTENANCE"
                            ? "maintenance"
                            : device.status === "ERROR"
                              ? "offline"
                              : device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.surveyor ? (
                      <div className="flex items-center space-x-2">
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-left hover:text-primary"
                          >
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <div>
                                <p className="font-medium text-sm">
                                  {typeof device.surveyor === "string"
                                    ? device.surveyor
                                    : device.surveyor.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {typeof device.surveyor === "string"
                                    ? "+1-555-0123"
                                    : device.surveyor.phone}
                                </p>
                              </div>
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </div>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not assigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {device.lastSeen.toLocaleString()
                      ? new Date(device.lastSeen).toLocaleString()
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {device.coordinates
                      ? `${device.coordinates.lat.toFixed(4)}, ${device.coordinates.lng.toFixed(4)}`
                      : "Unknown"}
                  </TableCell>
                  <TableCell>
                    <span className={getBatteryColor(device.batteryLevel || 0)}>
                      {device.batteryLevel || 0}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {typeof device.accuracy === "number" ? device.accuracy.toFixed(2) : "N/A"}
                  </TableCell>
                  {/* <TableCell>
                    <Button size="sm" onClick={() => navigate(`/daily-personal-maps?device=${encodeURIComponent(device.id)}`)}>
                      Instrument
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Pagination
              config={tableConfig.paginationConfig}
              onPageChange={tableConfig.setCurrentPage}
              onPageSizeChange={tableConfig.setPageSize}
              onFirstPage={tableConfig.goToFirstPage}
              onLastPage={tableConfig.goToLastPage}
              onNextPage={tableConfig.goToNextPage}
              onPreviousPage={tableConfig.goToPreviousPage}
              canGoNext={tableConfig.canGoNext}
              canGoPrevious={tableConfig.canGoPrevious}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
