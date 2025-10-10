import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeafletMap } from "@/components/LeafletMap";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useTable } from "@/hooks/use-table";
import {
  Calendar as CalendarIcon,
  Download,
  MapPin,
  Clock,
  Gauge,
  Filter,
  RefreshCw,
  User,
  Activity,
  Layers,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useSurveyContext } from "@/contexts/SurveyContext";

interface Device {
  id: string;
  name: string;
  type: string;
}

// Dynamic snapshot row from API
type SnapshotRow = Record<string, any>;

// Flexible survey data structure
interface SurveyDataDynamic {
  snapshots: SnapshotRow[];
  totalDataPoints?: number;
  startTime?: string;
  endTime?: string;
  pipeDiameters?: number[];
  averageDepth?: number;
  locationsCovered?: string[];
  pipelineEntries?: number;
  valveOperations?: number;
  totalPerimeterSurveyed?: number;
}

export const DailyPersonalMaps = () => {
  const [searchParams] = useSearchParams();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyDataDynamic | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isDevicesLoading, setIsDevicesLoading] = useState(false);
  const { currentSurvey } = useSurveyContext();

  // Table functionality for survey snapshots
  const snapshots = useMemo<SnapshotRow[]>(() => surveyData?.snapshots || [], [surveyData]);
  const selectedDeviceInfo = useMemo(() => {
    if (!selectedDevice) return undefined;
    return devices.find((device) => device.id === selectedDevice);
  }, [devices, selectedDevice]);
  const selectedDeviceLabel = selectedDeviceInfo?.name || selectedDevice || "";
  const selectedDeviceType = selectedDeviceInfo?.type;

  // Compute dynamic columns from snapshot keys
  const snapshotKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of snapshots) {
      Object.keys(s || {}).forEach((k) => keys.add(k));
    }
    const preferredOrder = [
      "timestamp",
      "time",
      "date",
      "entryDate",
      "entryTime",
      "activity",
      "pipelineName",
      "pipelineId",
      "valveName",
      "valveId",
      "coordinates",
      "lat",
      "lng",
    ];
    const ordered = preferredOrder.filter((k) => keys.has(k));
    const remaining = Array.from(keys).filter((k) => !ordered.includes(k)).sort();
    const combined = [...ordered, ...remaining];
    if (combined.includes("id")) {
      return ["id", ...combined.filter((key) => key !== "id")];
    }
    return combined;
  }, [snapshots]);

  const initialSortKey = useMemo(() => {
    return (snapshotKeys.find((k) => /timestamp|time|date/i.test(k)) || snapshotKeys[0]) as keyof SnapshotRow | undefined;
  }, [snapshotKeys]);

  const { tableConfig, sortedAndPaginatedData, allSortedData } = useTable<SnapshotRow>(
    snapshots,
    10,
    (initialSortKey as any) ?? undefined,
  );

  // Read URL parameters and set initial values
  useEffect(() => {
    const deviceParam = searchParams.get("device");
    const dateParam = searchParams.get("date");

    if (deviceParam) {
      setSelectedDevice(deviceParam);
    }

    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }

    // Auto-load data if both device and date are provided
    if (deviceParam && dateParam) {
      setTimeout(() => {
        handleLoadSurveyData(deviceParam, new Date(dateParam));
      }, 500);
    }
  }, [searchParams]);

  // Ensure a sensible default sort when data loads
  useEffect(() => {
    if (snapshots.length && !tableConfig.sortConfig.key && initialSortKey) {
      tableConfig.setSortConfig({ key: initialSortKey as any, direction: "asc" });
    }
  }, [snapshots, initialSortKey]);

  // Load devices for current survey
  useEffect(() => {
    const loadDevices = async () => {
      setIsDevicesLoading(true);
      try {
        const surveyId = currentSurvey?.id || undefined;
        const res = await apiClient.getDeviceLogs({ surveyId });
        const items: Device[] = (res.data || []).map((d: any) => ({
          id: String(d.id),
          name: String(d.name || d.serialNumber || d.modelName || d.id),
          type: String(d.type || "DEVICE"),
        }));
        const selected = selectedDevice || searchParams.get("device") || "";
        let merged = items;
        if (selected && !items.find(x => x.id === selected)) {
          merged = [{ id: selected, name: selected, type: "DEVICE" }, ...items];
        }
        setDevices(merged);
        if (!selected && merged.length > 0) {
          setSelectedDevice(merged[0].id);
        }
      } catch (e) {
        const selected = selectedDevice || searchParams.get("device") || "";
        const fallback: Device[] = selected ? [{ id: selected, name: selected, type: "DEVICE" }] : [];
        setDevices(fallback);
      } finally {
        setIsDevicesLoading(false);
      }
    };
    loadDevices();
  }, [currentSurvey?.id]);

  // Devices are loaded from API based on selected survey

  const handleLoadSurveyData = async (deviceId?: string, date?: Date) => {
    const targetDevice = deviceId || selectedDevice;
    const targetDate = date || selectedDate;

    if (!targetDevice || !targetDate) return;

    setIsLoading(true);
    try {
      const resp = await apiClient.getAssetPropertyEntriesByDevice({ deviceId: targetDevice, entryDate: targetDate });
      const snapshots = Array.isArray(resp.snapshots) ? resp.snapshots : [];

      // Derive simple summary fields if possible
      const keys = new Set<string>();
      snapshots.forEach((s) => Object.keys(s || {}).forEach((k) => keys.add(k)));
      const timeKey = ["timestamp", "time", "date", "entryDate", "entryTime"].find((k) => keys.has(k));

      let startTime: string | undefined;
      let endTime: string | undefined;
      if (timeKey) {
        const times = snapshots
          .map((s) => s?.[timeKey!])
          .filter((v) => v != null)
          .map((v) => new Date(v))
          .filter((d) => !Number.isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());
        if (times.length) {
          startTime = format(times[0], "p");
          endTime = format(times[times.length - 1], "p");
        }
      }

      const diameterKey = ["pipeDiameter", "diameter"].find((k) => keys.has(k));
      const pipeDiameters = diameterKey
        ? Array.from(new Set(snapshots.map((s) => s?.[diameterKey]).filter((v) => typeof v === "number")))
        : [];

      const depthKey = ["pipeDepth", "depth"].find((k) => keys.has(k));
      const avgDepthVals = depthKey
        ? snapshots.map((s) => s?.[depthKey]).filter((v) => typeof v === "number")
        : [];
      const averageDepth = avgDepthVals.length
        ? Number((avgDepthVals.reduce((a: number, b: number) => a + b, 0) / avgDepthVals.length).toFixed(2))
        : undefined;

      setSurveyData({
        snapshots,
        totalDataPoints: snapshots.length,
        startTime,
        endTime,
        pipeDiameters,
        averageDepth,
      });
    } catch (e) {
      setSurveyData({ snapshots: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    // Mock PDF export
    const blob = new Blob(
      ["PDF export functionality would be implemented here"],
      { type: "application/pdf" },
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-trail-${selectedDevice}-${selectedDate ? format(selectedDate, "yyyy-MM-dd") : "unknown"}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportShapefile = () => {
    // Mock Shapefile export
    const blob = new Blob(
      ["Shapefile export functionality would be implemented here"],
      { type: "application/zip" },
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-trail-${selectedDevice}-${selectedDate ? format(selectedDate, "yyyy-MM-dd") : "unknown"}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const canLoadData = selectedDevice && selectedDate;
  const hasData = !!(surveyData && surveyData.snapshots && surveyData.snapshots.length);

  // Demo data for map
  const demoDevices = [
    {
      id: "T001",
      name: "Trimble R12i Unit 1",
      lat: 40.7589,
      lng: -73.9851,
      status: "active" as const,
      lastPing: "2 min ago",
    },
    {
      id: "T002",
      name: "Trimble R12i Unit 2",
      lat: 40.7614,
      lng: -73.9776,
      status: "active" as const,
      lastPing: "1 min ago",
    },
    {
      id: "T003",
      name: "Trimble TSC7 Controller",
      lat: 40.7505,
      lng: -73.9934,
      status: "offline" as const,
      lastPing: "15 min ago",
    },
  ];

  const demoPipelines = [
    { id: "PS-001", diameter: 200, depth: 1.5, lat: 40.7589,
      lng: -73.9851, status: "normal" as const },
    { id: "PS-002", diameter: 150, depth: 2.0, lat: 40.7614,
      lng: -73.9776, status: "normal" as const },
    { id: "PS-003", diameter: 300, depth: 1.8,  lat: 40.7505,
      lng: -73.9934, status: "normal" as const },
  ];

  const demoValves = [
    {
      id: "VLV-001",
      type: "control" as const,
      status: "open" as const,
      segmentId: "PS-001",
    },
    {
      id: "VLV-002",
      type: "emergency" as const,
      status: "closed" as const,
      segmentId: "PS-002",
    },
    {
      id: "VLV-003",
      type: "isolation" as const,
      status: "maintenance" as const,
      segmentId: "PS-003",
    },
  ];

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "enter_pipeline":
        return <Layers className="w-4 h-4 text-primary" />;
      case "exit_pipeline":
        return <Layers className="w-4 h-4 text-muted-foreground" />;
      case "valve_operation":
        return <Settings className="w-4 h-4 text-warning" />;
      case "depth_measurement":
        return <Gauge className="w-4 h-4 text-success" />;
      case "perimeter_survey":
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (activity: string) => {
    switch (activity) {
      case "enter_pipeline":
        return "Pipeline Entry";
      case "exit_pipeline":
        return "Pipeline Exit";
      case "valve_operation":
        return "Valve Operation";
      case "depth_measurement":
        return "Depth Measurement";
      case "perimeter_survey":
        return "Perimeter Survey";
      default:
        return "Unknown Activity";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Instrument Details
          </h1>
          <p className="text-muted-foreground">
            View detailed survey activity trails for any Trimble device
            {searchParams.get("surveyor") && (
              <span className="ml-2">
                • Surveyor: <strong>{searchParams.get("surveyor")}</strong>
              </span>
            )}
          </p>
        </div>
        {hasData && (
          <div className="flex space-x-2">
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleExportShapefile} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Shapefile
            </Button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter & Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Device Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Name</label>
              <div className="rounded-md border border-input bg-background px-3 py-2">
                {isDevicesLoading ? (
                  <span className="text-sm text-muted-foreground">Loading devices...</span>
                ) : selectedDeviceLabel ? (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-foreground">{selectedDeviceLabel}</span>
                    {selectedDeviceType && (
                      <span className="text-xs text-muted-foreground">{selectedDeviceType}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No device information available</span>
                )}
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Load Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Load</label>
              <Button
                onClick={() => handleLoadSurveyData()}
                disabled={!canLoadData || isLoading}
                className="w-full"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Loading..." : "Load Survey Data"}
              </Button>
            </div>
          </div>

          {!canLoadData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {isDevicesLoading
                  ? "Loading device information..."
                  : selectedDevice
                    ? "Please pick a date to load survey trail data."
                    : "No device information available for this survey."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Survey Trail Map
                {selectedDevice && selectedDate && (
                  <Badge variant="secondary" className="ml-2">
                    {(selectedDeviceLabel || selectedDevice)} - {format(selectedDate, "MMM dd, yyyy")}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <LeafletMap
                  devices={demoDevices}
                  pipelines={demoPipelines}
                  valves={demoValves}
                  showDevices={true}
                  showPipelines={hasData}
                  showValves={hasData}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Survey Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasData ? (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Data Points
                    </span>
                    <span className="font-semibold text-lg">
                      {surveyData.totalDataPoints ?? surveyData.snapshots.length}
                    </span>
                  </div>

                  {surveyData.startTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Start Time</span>
                      <span className="font-medium">{surveyData.startTime}</span>
                    </div>
                  )}

                  {surveyData.endTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">End Time</span>
                      <span className="font-medium">{surveyData.endTime}</span>
                    </div>
                  )}

                  {typeof surveyData.pipelineEntries !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pipeline Entries</span>
                      <span className="font-medium">{surveyData.pipelineEntries}</span>
                    </div>
                  )}

                  {typeof surveyData.valveOperations !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valve Operations</span>
                      <span className="font-medium">{surveyData.valveOperations}</span>
                    </div>
                  )}

                  {typeof surveyData.averageDepth !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Depth</span>
                      <span className="font-medium">{surveyData.averageDepth}m</span>
                    </div>
                  )}

                  {typeof surveyData.totalPerimeterSurveyed !== "undefined" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Perimeter</span>
                      <span className="font-medium">{surveyData.totalPerimeterSurveyed}m</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {hasData && surveyData.pipeDiameters && surveyData.pipeDiameters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="w-5 h-5 mr-2" />
                  Pipe Diameters Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {surveyData.pipeDiameters.map((diameter, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Diameter {index + 1}</span>
                      <Badge variant="outline">{diameter}mm</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Survey Activity Log */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Survey Activity Log
              <Badge variant="secondary" className="ml-2">
                {surveyData.snapshots.length} snapshots
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {snapshotKeys.map((key) => {
                    const firstVal = snapshots[0]?.[key];
                    const isComplex = firstVal && (typeof firstVal === "object");
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/_/g, " ")
                      .replace(/^\w/, (c) => c.toUpperCase());
                    return (
                      <SortableTableHead
                        key={key}
                        sortKey={key}
                        currentSortKey={tableConfig.sortConfig.key as any}
                        sortDirection={tableConfig.sortConfig.direction}
                        onSort={(k) => tableConfig.handleSort(k as any)}
                        sortable={!isComplex}
                      >
                        {label}
                      </SortableTableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndPaginatedData.map((row, idx) => (
                  <TableRow key={row.id ?? idx}>
                    {snapshotKeys.map((key) => {
                      const val = row[key];
                      const renderValue = () => {
                        if (key === "activity") {
                          return (
                            <div className="flex items-center space-x-2">
                              {getActivityIcon(String(val) as any)}
                              <span className="text-sm">{getActivityLabel(String(val) as any)}</span>
                            </div>
                          );
                        }
                        if (key === "coordinates" && Array.isArray(val) && val.length >= 2 && typeof val[0] === "number" && typeof val[1] === "number") {
                          return (
                            <span className="font-mono text-xs text-muted-foreground">
                              {val[0].toFixed(4)}, {val[1].toFixed(4)}
                            </span>
                          );
                        }
                        if (typeof val === "number") {
                          return <span className="font-mono text-sm">{Number.isInteger(val) ? val : Number(val.toFixed(2))}</span>;
                        }
                        if (val instanceof Date) {
                          return <span className="font-mono text-sm">{format(val, "Pp")}</span>;
                        }
                        if (typeof val === "string") {
                          const dt = new Date(val);
                          if (!Number.isNaN(dt.getTime()) && /time|date/i.test(key)) {
                            return <span className="font-mono text-sm">{format(dt, "Pp")}</span>;
                          }
                          return <span className="text-sm">{val}</span>;
                        }
                        if (Array.isArray(val)) {
                          return <span className="text-xs text-muted-foreground">{JSON.stringify(val)}</span>;
                        }
                        if (val && typeof val === "object") {
                          return <span className="text-xs text-muted-foreground">{JSON.stringify(val)}</span>;
                        }
                        return <span className="text-sm text-muted-foreground">—</span>;
                      };

                      return (
                        <TableCell key={key}>
                          {renderValue()}
                        </TableCell>
                      );
                    })}
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
      )}
    </div>
  );
};
