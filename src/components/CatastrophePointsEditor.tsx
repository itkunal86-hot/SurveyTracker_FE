import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertTriangle, Layers, RefreshCw, AlertCircle } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { useEffect, useMemo, useState } from "react";
import { useSurveyMapCache } from "@/hooks/useSurveyMapCache";
import { refreshSurveyMapCache } from "@/lib/surveyMapCache";
import { SurveyAssetMap } from "@/components/SurveyAssetMap";
import { API_BASE_PATH } from "@/lib/api";
import {
  parseGeoJSON,
  transformPipelineFeatures,
  transformValveFeatures,
  transformConsumerFeatures,
  transformCngStationFeatures,
} from "@/lib/geoJsonParser";
import { formatColumnHeader, formatDateCell, isDateColumn } from "@/lib/utils";

// Dynamic row type for arbitrary property names
type DynamicRow = Record<string, any>;

// Optional map valve type to reuse LeafletMap rendering contract
interface MapValve {
  id: string;
  type: "control" | "emergency" | "isolation";
  status: "open" | "closed" | "maintenance";
  segmentId: string;
}

// Map pipeline segment shape expected by LeafletMap
interface MapPipelineSegment {
  id: string;
  name?: string;
  type?: string;
  diameter: number;
  depth: number;
  status: "normal" | "warning" | "critical" | "maintenance";
  material?: string;
  coordinates?: Array<{ lat: number; lng: number; elevation?: number }>;
}

interface MapCatastrophe {
  id: string;
  name?: string;
  severity?: string;
  status?: string;
  coordinates?: { lat: number; lng: number };
}

interface PipelineSegment {
  id: string;
  name?: string;
  type?: string;
  diameter: number;
  depth: number;
  status: "normal" | "warning" | "critical" | "maintenance";
  material?: string;
  coordinates?: Array<{ lat: number; lng: number; elevation?: number }>;
}

interface ValvePoint {
  id: string;
  name?: string;
  type: "control" | "emergency" | "isolation" | "station";
  status: "open" | "closed" | "maintenance" | "fault";
  segmentId: string;
  coordinates?: { lat: number; lng: number; elevation?: number };
  criticality?: string;
}

interface ConsumerPoint {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  coordinates: { lat: number; lng: number };
  type: string;
  category?: string;
  status?: "active" | "inactive";
  estimatedConsumption?: number;
  consumptionUnit?: string;
  consumerCode?: string;
  mobile?: string;
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
  consumers?: any[];
}

export const CatastrophePointsEditor = () => {
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Map type and layer controls
  const [showRGIS, setShowRGIS] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showValves, setShowValves] = useState(true);
  const [showConsumerPoints, setShowConsumerPoints] = useState(true);

  const mapCache = useSurveyMapCache();


  // Devices from DeviceLog for the active survey
  // const { data: deviceLogsResponse } = useDeviceLogs({ limit: 100 });
  // const mapDevices = useMemo(() => {
  //   const items = Array.isArray(deviceLogsResponse?.data) ? deviceLogsResponse!.data : [];
  //   return items.map((device: any) => ({
  //     id: device.id,
  //     name: device.name,
  //     lat: Number(device.coordinates?.lat) || 0,
  //     lng: Number(device.coordinates?.lng) || 0,
  //     status:
  //       String(device.status).toUpperCase() === "ACTIVE"
  //         ? ("active" as const)
  //         : String(device.status).toUpperCase() === "MAINTENANCE"
  //           ? ("maintenance" as const)
  //           : String(device.status).toUpperCase() === "ERROR"
  //             ? ("error" as const)
  //             : ("offline" as const),
  //     lastPing: device.lastSeen || "Unknown",
  //   }));
  // }, [deviceLogsResponse]);

  // Transform pipeline GeoJSON data

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch actual catastrophe records with coordinates
        const url = `${API_BASE_PATH}/AssetProperties/ByType/catastrophes`;
        //const url = `https://localhost:7215/api/catastrophes`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = await res.json();
        const arr: DynamicRow[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];

        const normalized = arr.map((item) => ({ ...item }));
        setRows(normalized);
        const cols = normalized.length > 0
          ? Object.keys(normalized[0]).filter(col =>
              !['Plot', 'coordinates', 'PLOT_COLOR', 'PLOT_COLOR_INACTIVE', 'PLOT_TYPE', 'LAT', 'LNG', 'lat', 'lng', 'id', 'ID'].includes(col)
            )
          : [];
        setColumns(cols);
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
        setRows([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const defaultSortKey = (columns.includes("id") ? "id" : columns[0]) as keyof DynamicRow | undefined;
  const { tableConfig, sortedAndPaginatedData } = useTable<DynamicRow>(rows, 5, defaultSortKey as any);

  const handleRefresh = () => {
    void refreshSurveyMapCache();
  };

  const isLoading = mapCache.status === "loading";
  const hasError = mapCache.status === "error";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "normal":
      case "open":
      case "ACTIVE":
      case "OPERATIONAL":
      case "OPEN":
        return "bg-success text-success-foreground";
      case "warning":
      case "maintenance":
      case "MAINTENANCE":
      case "PARTIALLY_OPEN":
        return "bg-warning text-warning-foreground";
      case "offline":
      case "critical":
      case "closed":
      case "error":
      case "INACTIVE":
      case "DAMAGED":
      case "CLOSED":
      case "ERROR":
      case "FAULT":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };


  return (
    <div className="flex h-screen bg-background">
      {/* Layer Controls Sidebar */}
      <div className="w-80 border-r border-border bg-card p-4 space-y-4 overflow-y-auto max-h-screen">
        {/* Error State */}
        {hasError && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">API Connection Issue</p>
                  <p className="text-xs text-muted-foreground">
                    Data may be incomplete or unavailable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Type Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              Infrastructure Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Map Type Control */}
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <Label htmlFor="rgis-map" className="text-base font-semibold">
                Map Type
              </Label>
              <Switch
                id="rgis-map"
                checked={showRGIS}
                onCheckedChange={setShowRGIS}
              />
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {showRGIS ? "RGIS Map" : "Leaflet Map"}
            </div>

            {/* Satellite View Control */}
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <Label htmlFor="show-satellite-catastrophe" className="text-base font-semibold">
                Satellite View
              </Label>
              <Switch
                id="show-satellite-catastrophe"
                checked={showSatellite}
                onCheckedChange={setShowSatellite}
              />
            </div>

            {/* Pipeline Controls */}
            <div className="flex items-center justify-between">
              <Label htmlFor="pipelines" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Pipeline Network</span>
              </Label>
              <Switch
                id="pipelines"
                checked={showPipelines}
                onCheckedChange={setShowPipelines}
              />
            </div>

            {/* Valve Controls */}
            <div className="flex items-center justify-between">
              <Label htmlFor="valves" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Valve Stations & Isolation Points</span>
              </Label>
              <Switch
                id="valves"
                checked={showValves}
                onCheckedChange={setShowValves}
              />
            </div>

            {/* Consumer Points Controls */}
            <div className="flex items-center justify-between">
              <Label
                htmlFor="consumer-points"
                className="flex items-center space-x-2"
              >
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Consumer Points</span>
              </Label>
              <Switch
                id="consumer-points"
                checked={showConsumerPoints}
                onCheckedChange={setShowConsumerPoints}
              />
            </div>

            <Button
              onClick={handleRefresh}
              className="w-full"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Loading..." : "Refresh Map"}
            </Button>
          </CardContent>
        </Card>

        {/* Pipeline Network Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Pipeline Network ({mapCache.counts.pipeline})
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Geo-referenced
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {mapCache.counts.pipeline === 0 ? (
              <p className="text-xs text-muted-foreground">No pipelines available</p>
            ) : (
              <p className="text-xs text-muted-foreground">{mapCache.counts.pipeline.toLocaleString()} segments are drawn on the map.</p>
            )}
            {false && ([] as any[]).map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{pipeline.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ⌀{pipeline.diameter}mm • {pipeline.depth}m deep
                    </p>
                    {pipeline.material && (
                      <p className="text-xs text-muted-foreground">
                        {pipeline.material}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(pipeline.status)}>
                    {pipeline.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Valve & Isolation Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Valves & Isolation Points ({mapCache.counts.valve})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {mapCache.counts.valve === 0 ? (
              <p className="text-xs text-muted-foreground">No valves available</p>
            ) : (
              <p className="text-xs text-muted-foreground">{mapCache.counts.valve.toLocaleString()} valves are drawn on the map.</p>
            )}
            {false && ([] as any[]).map((valve) => (
                <div
                  key={valve.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{valve.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {valve.type} • {valve.criticality} criticality
                    </p>
                  </div>
                  <Badge className={getStatusColor(valve.status)}>
                    {valve.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Consumer Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Consumer Points ({mapCache.counts.consumer})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {mapCache.counts.consumer === 0 ? (
              <p className="text-xs text-muted-foreground">No consumer points available</p>
            ) : (
              <p className="text-xs text-muted-foreground">{mapCache.counts.consumer.toLocaleString()} consumer points are drawn on the map.</p>
            )}
            {false && ([] as any[]).map((consumer) => (
                <div
                  key={consumer.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{consumer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {consumer.category}
                    </p>
                    {consumer.consumerCode && (
                      <p className="text-xs text-muted-foreground">
                        Code: {consumer.consumerCode}
                      </p>
                    )}
                    {consumer.mobile && (
                      <p className="text-xs text-muted-foreground">
                        {consumer.mobile}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(consumer.status || "active")}>
                    {consumer.status?.toUpperCase() || "ACTIVE"}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-6">
          <h1 className="text-3xl font-bold">Catastrophe Points Viewer</h1>
          <p className="text-muted-foreground">View catastrophe metadata and related pipeline segments</p>
        </div>

        {/* Table and Map Container */}
        <div className="flex-1 overflow-auto space-y-6 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Catastrophe Points ({rows.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 pb-0">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.length === 0 ? (
                          <TableHead>No data</TableHead>
                        ) : (
                          columns.map((col) => (
                            <SortableTableHead
                              key={col}
                              sortKey={col}
                              currentSortKey={tableConfig.sortConfig.key as unknown as string}
                              sortDirection={tableConfig.sortConfig.direction}
                              onSort={(k) => tableConfig.handleSort(k as keyof DynamicRow)}
                            >
                              {formatColumnHeader(col)}
                            </SortableTableHead>
                          ))
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndPaginatedData.map((row, idx) => (
                        <TableRow key={String(row.id ?? idx)}>
                          {columns.map((col) => {
                            const value = row[col];
                            // Special rendering for isActive column
                            if (col.toLowerCase() === 'isactive') {
                              return (
                                <TableCell key={col}>
                                  <Badge variant={value ? "default" : "outline"}>
                                    {value ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                              );
                            }
                            // Format date columns
                            if (isDateColumn(col)) {
                              return (
                                <TableCell key={col}>
                                  {formatDateCell(value)}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={col}>
                                {value === null || value === undefined || value === "" ? "-" : String(value)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
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
                pageSizeOptions={[5, 10, 20]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Map</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 w-full">
                <SurveyAssetMap
                  showRGIS={showRGIS}
                  showSatellite={showSatellite}
                  hiddenLayers={[
                    ...(!showPipelines ? ["pipeline" as const] : []),
                    ...(!showValves ? ["valve" as const] : []),
                    ...(!showConsumerPoints ? ["consumer" as const] : []),
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CatastrophePointsEditor;
