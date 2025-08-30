import { useState } from "react";
import { Download, Search, Calendar, Filter, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SurveyHistoryLog as SurveyHistoryLogType } from "@/types/admin";

const mockHistoryLogs: SurveyHistoryLogType[] = [
  {
    id: "LOG_001",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 - Unit 1",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    fromDate: "2024-01-15",
    toDate: "2024-03-15",
    duration: 60,
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "LOG_002",
    deviceId: "TRIMBLE_002",
    deviceName: "Trimble SPS986 - Unit 2", 
    surveyId: "SUR_002",
    surveyName: "Fiber Network Expansion",
    fromDate: "2024-02-01",
    toDate: "2024-04-01",
    duration: 60,
    createdAt: "2024-02-01T09:30:00Z",
  },
  {
    id: "LOG_003",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 - Unit 1",
    surveyId: "SUR_003",
    surveyName: "Water Distribution Assessment",
    fromDate: "2023-11-01",
    toDate: "2023-12-31",
    duration: 61,
    createdAt: "2023-11-01T10:15:00Z",
  },
  {
    id: "LOG_004",
    deviceId: "TRIMBLE_003",
    deviceName: "Trimble SPS986 - Unit 3",
    surveyId: "SUR_004",
    surveyName: "Electrical Infrastructure Mapping",
    fromDate: "2023-09-15",
    toDate: "2023-10-30",
    duration: 45,
    createdAt: "2023-09-15T11:45:00Z",
  },
  {
    id: "LOG_005",
    deviceId: "TRIMBLE_002",
    deviceName: "Trimble SPS986 - Unit 2",
    surveyId: "SUR_005",
    surveyName: "Metro Pipeline Extension",
    fromDate: "2023-08-01",
    toDate: "2023-09-15",
    duration: 46,
    createdAt: "2023-08-01T08:30:00Z",
  },
];

export default function SurveyHistoryLog() {
  const [historyLogs] = useState<SurveyHistoryLogType[]>(mockHistoryLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  const uniqueDevices = Array.from(new Set(historyLogs.map(log => log.deviceId)))
    .map(deviceId => {
      const log = historyLogs.find(l => l.deviceId === deviceId);
      return { id: deviceId, name: log?.deviceName || deviceId };
    });

  const filteredLogs = historyLogs.filter((log) => {
    const matchesSearch = 
      log.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.surveyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDevice = deviceFilter === "ALL" || log.deviceId === deviceFilter;
    
    const matchesDateRange = 
      (!dateRangeFilter.fromDate || log.fromDate >= dateRangeFilter.fromDate) &&
      (!dateRangeFilter.toDate || log.toDate <= dateRangeFilter.toDate);
    
    return matchesSearch && matchesDevice && matchesDateRange;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExportCSV = () => {
    const headers = [
      "Log ID",
      "Device ID", 
      "Device Name",
      "Survey ID",
      "Survey Name", 
      "From Date",
      "To Date",
      "Duration (Days)",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => [
        log.id,
        log.deviceId,
        `"${log.deviceName}"`,
        log.surveyId,
        `"${log.surveyName}"`,
        log.fromDate,
        log.toDate,
        log.duration || "",
        new Date(log.createdAt).toISOString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `survey_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDeviceFilter("ALL");
    setDateRangeFilter({ fromDate: "", toDate: "" });
  };

  const getUtilizationStats = () => {
    const totalLogs = historyLogs.length;
    const totalDays = historyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgDuration = totalLogs > 0 ? Math.round(totalDays / totalLogs) : 0;
    
    const deviceUsage = uniqueDevices.map(device => ({
      ...device,
      usageCount: historyLogs.filter(log => log.deviceId === device.id).length,
      totalDays: historyLogs
        .filter(log => log.deviceId === device.id)
        .reduce((sum, log) => sum + (log.duration || 0), 0),
    })).sort((a, b) => b.usageCount - a.usageCount);

    return { totalLogs, totalDays, avgDuration, deviceUsage };
  };

  const stats = getUtilizationStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Survey History Log</CardTitle>
            <CardDescription>
              Track which device was used for which survey and when
            </CardDescription>
          </div>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">
                Historical records
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Usage Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDays}</div>
              <p className="text-xs text-muted-foreground">
                Device deployment time
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDuration}</div>
              <p className="text-xs text-muted-foreground">
                Days per assignment
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueDevices.length}</div>
              <p className="text-xs text-muted-foreground">
                Devices with history
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Utilization Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stats.deviceUsage.map((device) => (
                <div key={device.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{device.name}</span>
                    <Badge variant="outline">{device.id}</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Assignments:</span>
                      <span>{device.usageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Days:</span>
                      <span>{device.totalDays}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by device or survey name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Devices</SelectItem>
              {uniqueDevices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
                {(dateRangeFilter.fromDate || dateRangeFilter.toDate) && (
                  <Badge variant="secondary" className="ml-1">
                    Active
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={dateRangeFilter.fromDate}
                    onChange={(e) => setDateRangeFilter({
                      ...dateRangeFilter,
                      fromDate: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={dateRangeFilter.toDate}
                    onChange={(e) => setDateRangeFilter({
                      ...dateRangeFilter,
                      toDate: e.target.value
                    })}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setDateRangeFilter({ fromDate: "", toDate: "" })}
                  className="w-full"
                >
                  Clear Date Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* History Table */}
        {filteredLogs.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm || deviceFilter !== "ALL" || dateRangeFilter.fromDate || dateRangeFilter.toDate
                ? "No history logs found matching your filters." 
                : "No survey history logs found."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Survey</TableHead>
                  <TableHead>Assignment Period</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Log ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span>{log.deviceName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {log.deviceId}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{log.surveyName}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {log.surveyId}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.fromDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to {new Date(log.toDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">
                          {log.duration || "N/A"} days
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {log.id}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredLogs.length} of {historyLogs.length} history logs
          </span>
          <span>
            Admin Only Access
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
