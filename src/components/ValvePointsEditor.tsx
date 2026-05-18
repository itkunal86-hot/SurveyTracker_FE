import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeafletMap } from "@/components/LeafletMap";
import { RGISMap } from "@/components/RGISMap";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { MapPin, AlertTriangle } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { useDeviceLogs } from "@/hooks/useApiQueries";
import { API_BASE_PATH, apiClient } from "@/lib/api";
import { formatColumnHeader, formatDateCell, isDateColumn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Dynamic row type for arbitrary property names
type DynamicRow = Record<string, any>;

// Map view expects these fields only
interface MapValve {
  id: string;
  type: "control" | "emergency" | "isolation" | "station";
  status: "open" | "closed" | "maintenance" | "fault";
  segmentId: string;
  coordinates?: { lat: number; lng: number };
  name?: string;
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
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
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
}

export const ValvePointsEditor = () => {
  const { toast } = useToast();
  const [showRGIS, setShowRGIS] = useState(true);
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const [pipelineRows, setPipelineRows] = useState<DynamicRow[]>([]);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Load valves table from survey-geojson endpoint
  useEffect(() => {
    const controller = new AbortController();
    async function loadValves() {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE_PATH}/SurveyEntries/survey-geojson?atName=Valve`;
        //const url = `https://localhost:7215/api/SurveyEntries/survey-geojson?atName=Valve`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = await res.json();

        // Parse the GeoJSON from the data field
        let geojson: any = null;
        if (json?.data) {
          try {
            geojson = typeof json.data === 'string' ? JSON.parse(json.data) : json.data;
          } catch (parseError) {
            throw new Error("Failed to parse GeoJSON data");
          }
        }

        // Extract features from GeoJSON
        const features = geojson?.features || [];
        const normalized = features.map((feature: any, idx: number) => {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [0, 0];

          // Extract Plot sub-object properties (new structure)
          const plotData = props.Plot || {};

          return {
            SE_ID: props.SE_ID || idx,
            SE_VALUE: props.SE_VALUE || "",
            bulb_station: props["bulb station"] || "",
            SE_ENTRY_DATE: props.SE_ENTRY_DATE || "",
            isolation: props.isolation || "",
            service_point: props["service point"] || "",
            control_station: props["control station"] || "",
            SE_SURVEY_SESSION_ID: props.SE_SURVEY_SESSION_ID || "",
            SHAPE_LENGTH: props.SHAPE_LENGTH || "",
            IsActive: props.IsActive !== undefined ? props.IsActive : true,
            PLOT_COLOR: plotData.PLOT_COLOR || "",
            PLOT_COLOR_INACTIVE: plotData.PLOT_COLOR_INACTIVE || "",
            PLOT_TYPE: plotData.PLOT_TYPE || "",
            longitude: coords[0] || 0,
            latitude: coords[1] || 0,
          };
        });

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
    loadValves();
    return () => controller.abort();
  }, []);

  // Load pipelines for map layer from required endpoint
  useEffect(() => {
    const controller = new AbortController();
    async function loadPipelines() {
      setPipelineError(null);
      try {
        const url = `${API_BASE_PATH}/AssetProperties/ByType/pipeline`;
        //const url = `https://localhost:7215/api/AssetProperties/ByType/pipeline`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const arr: DynamicRow[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setPipelineRows(arr.map((it) => ({ ...it })));
      } catch (e: any) {
        setPipelineRows([]);
        setPipelineError(e?.message || "Failed to load pipeline data");
      }
    }
    loadPipelines();
    return () => controller.abort();
  }, []);

  const defaultSortKey = (columns.includes("id") ? "id" : columns[0]) as keyof DynamicRow | undefined;
  const { tableConfig, sortedAndPaginatedData } = useTable<DynamicRow>(rows, 5, defaultSortKey as any);

  // Derive valves for map layer from dynamic rows
  const mapValves: MapValve[] = useMemo(() => {
    return rows.map((r) => {
      const rawType = String(r["SE_VALUE"] ?? r["Type"] ?? r["type"] ?? "").toLowerCase();
      const mappedType: MapValve["type"] = rawType.includes("emergency") ? "emergency" : rawType.includes("isolation") ? "isolation" : "station";
      const status: MapValve["status"] = "open"; // Default status for valve stations
      const segment = String(r["SE_ID"] ?? r["Linked Segment"] ?? r["segmentId"] ?? "Unknown");
      const id = String(r["SE_ID"] ?? r["id"] ?? r["ID"] ?? "");
      const latitude = Number(r.latitude) || 0;
      const longitude = Number(r.longitude) || 0;
      const coordinates = latitude && longitude ? { lat: latitude, lng: longitude } : undefined;
      const name = r["bulb_station"] || `Valve ${id}`;
      const isActive = r["IsActive"] !== undefined ? r["IsActive"] : true;
      const plotColor = r["PLOT_COLOR"] || "#ef4444"; // Use API color, default to red
      const plotColorInactive = r["PLOT_COLOR_INACTIVE"] || "#9ca3af"; // Use API color, default to grey
      const plotType = r["PLOT_TYPE"] as "line" | "round" | "square" | undefined;
      return { id, type: mappedType, status, segmentId: segment, coordinates, name, isActive, plotColor, plotColorInactive, plotType };
    });
  }, [rows]);

  // Devices from DeviceLog for the selected survey (via hook)
  const { data: deviceLogsResponse } = useDeviceLogs({ limit: 100 });
  const mapDevices = useMemo(() => {
    const items = Array.isArray(deviceLogsResponse?.data) ? deviceLogsResponse!.data : [];
    return items.map((device: any) => ({
      id: device.id,
      name: device.name,
      lat: Number(device.coordinates?.lat) || 0,
      lng: Number(device.coordinates?.lng) || 0,
      status:
        String(device.status).toUpperCase() === "ACTIVE"
          ? ("active" as const)
          : String(device.status).toUpperCase() === "MAINTENANCE"
            ? ("maintenance" as const)
            : String(device.status).toUpperCase() === "ERROR"
              ? ("error" as const)
              : ("offline" as const),
      lastPing: device.lastSeen || "Unknown",
    }));
  }, [deviceLogsResponse]);

  // Pipelines mapped minimally for LeafletMap (geometry may fall back to defaults)
  const mapPipelines: MapPipelineSegment[] = useMemo(() => {
    return pipelineRows.map((r, idx) => {
      const id = String(r["id"] ?? r["ID"] ?? r["segmentId"] ?? r["SegmentId"] ?? `PS-${idx + 1}`);
      const diameterVal = Number(r["diameter"] ?? r["Diameter"] ?? r["pipeDiameter"] ?? r["PipeDiameter"] ?? 200);
      const depthVal = Number(r["depth"] ?? r["Depth"] ?? r["installationDepth"] ?? r["InstallationDepth"] ?? 1.5);
      const status: MapPipelineSegment["status"] = "normal";
      const isActive = r["IsActive"] !== undefined ? r["IsActive"] : true;
      const plotColor = r["PLOT_COLOR"] || "#3b82f6"; // Use API color, default to blue
      const plotColorInactive = r["PLOT_COLOR_INACTIVE"] || "#9ca3af"; // Use API color, default to grey
      const plotType = r["PLOT_TYPE"] as "line" | "round" | "square" | undefined;
      return {
        id,
        diameter: Number.isFinite(diameterVal) ? diameterVal : 200,
        depth: Number.isFinite(depthVal) ? depthVal : 1.5,
        status,
        isActive,
        plotColor,
        plotColorInactive,
        plotType,
      };
    });
  }, [pipelineRows]);

  const showDevices = mapDevices.length > 0;
  const showPipelines = mapPipelines.length > 0;
  const showValves = mapValves.length > 0;

  const handleToggleIsActive = async (seId: number, currentIsActive: boolean) => {
    setTogglingIds(prev => new Set(prev).add(seId));
    try {
      const result = await apiClient.updateSurveyEntryIsActive(seId, !currentIsActive);
      if (result.success) {
        toast({
          title: "Success",
          description: `Valve marked as ${!currentIsActive ? "Active" : "Inactive"}`,
        });
        // Update local state
        setRows(prevRows =>
          prevRows.map(row =>
            (row.SE_ID === seId || row.id === seId) ? { ...row, IsActive: !currentIsActive } : row
          )
        );
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating active status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(seId);
        return next;
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Valve Points Viewer</h1>
          <p className="text-muted-foreground">View valve metadata and placement on pipeline segments</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Valve Network Map</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-rgis-valves"
                checked={showRGIS}
                onCheckedChange={setShowRGIS}
              />
              <Label htmlFor="show-rgis-valves">Show RGIS Map</Label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {showRGIS ? (
                <RGISMap
                  devices={[]}
                  pipelines={mapPipelines}
                  valves={mapValves}
                  consumers={[]}
                  showDevices={false}
                  showPipelines={showPipelines}
                  showValves={showValves}
                  showConsumers={false}
                />
              ) : (
                <LeafletMap
                  devices={[]}
                  pipelines={mapPipelines}
                  valves={mapValves}
                  showDevices={false}
                  showPipelines={showPipelines}
                  showValves={showValves}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Valve Points ({rows.length})
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
                    {sortedAndPaginatedData.map((row, idx) => {
                      const seId = Number(row.SE_ID ?? row.id);
                      const isActive = row.IsActive ?? true;
                      const isTogglingThisRow = togglingIds.has(seId);
                      return (
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
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleIsActive(seId, isActive)}
                              disabled={isTogglingThisRow || loading}
                              className="w-full"
                            >
                              {isTogglingThisRow ? "Updating..." : isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
      </div>
    </div>
  );
};
