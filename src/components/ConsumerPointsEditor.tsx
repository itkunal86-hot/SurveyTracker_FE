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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { MapPin, AlertTriangle, Loader2, X, ChevronDown, ChevronRight } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { useDeviceLogs } from "@/hooks/useApiQueries";
import { apiClient } from "@/lib/api";
import { formatColumnHeader, formatDateCell, isDateColumn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Dynamic row type for arbitrary property names
type DynamicRow = Record<string, any>;

type Consumer = {
  name: string
  code: string
  mobile: string
}

interface ConsumerPoint {
  id: string;
  name?: string;
  code?: string;
  mobile?: string;
  status?: string;
  coordinates: { lat: number; lng: number };
  consumers: Consumer[];
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
}

export const ConsumerPointsEditor = () => {
  const { toast } = useToast();
  const [showRGIS, setShowRGIS] = useState(true);
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [pointConsumers, setPointConsumers] = useState<DynamicRow[]>([]);
  const [loadingConsumers, setLoadingConsumers] = useState(false);
  const [consumerModalOpen, setConsumerModalOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // Handle map point click to show consumers at that point
  // const handleMapPointClick = (lat: number, lng: number) => {
  //   setSelectedPoint({ lat, lng });
  //   setLoadingConsumers(true);

  //   // Filter consumers at the clicked point (with small tolerance for floating point)
  //   const tolerance = 0.0001; // ~10 meters at equator
  //   const consumersAtPoint = rows.filter(
  //     (row) => {
  //       const rowLat = Number(row.lat || row.CONSUMER_LAT || 0);
  //       const rowLng = Number(row.lng || row.CONSUMER_LNG || 0);
  //       return (
  //         Math.abs(rowLat - lat) < tolerance &&
  //         Math.abs(rowLng - lng) < tolerance
  //       );
  //     }
  //   );

  //   setPointConsumers(consumersAtPoint);
  //   setLoadingConsumers(false);
  //   setConsumerModalOpen(true);
  // };

  // Load consumers from survey-geojson endpoint
  useEffect(() => {
    const controller = new AbortController();
    async function loadConsumers() {
      setLoading(true);
      setError(null);
      try {
        const json = await apiClient.getSurveyGeoJson("Consumer");
        
        let featureCollection: any = { type: "FeatureCollection", features: [] };
        if (typeof json?.data === 'string') {
          try {
            featureCollection = JSON.parse(json.data);
          } catch (e) {
            console.error("Failed to parse GeoJSON string:", e);
          }
        } else if (json?.data?.type === 'FeatureCollection') {
          featureCollection = json.data;
        } else if (json?.type === 'FeatureCollection') {
            featureCollection = json;
        }

        const features = Array.isArray(featureCollection?.features) ? featureCollection.features : [];
        
        const normalized = features.map((f: any) => ({
          ...f.properties,
          id: f.properties?.SE_ID || f.properties?.Consumer_Code || Math.random().toString(),
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0]
        }));

        setRows(normalized);
        if (normalized.length > 0) {
          // Filter out complex objects and arrays from columns (like consumers array and Plot object)
          const allKeys = Object.keys(normalized[0]);
          const primitiveColumns = allKeys.filter((key) => {
            // Explicitly exclude Plot object, coordinates, and plot-related properties
            // Exclude id/ID since SE_ID is the actual API field (avoid duplication)
            // Exclude LAT/LNG (API fields) and keep only lat/lng (from geometry - source of truth)
            if (['Plot', 'coordinates', 'PLOT_COLOR', 'PLOT_COLOR_INACTIVE', 'PLOT_TYPE', 'id', 'ID', 'LAT', 'LNG'].includes(key)) return false;

            const value = normalized[0][key];
            return (
              value === null ||
              value === undefined ||
              typeof value !== "object" ||
              value instanceof Date
            );
          });
          setColumns(primitiveColumns);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load consumer data");
        setRows([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    }
    loadConsumers();
    return () => controller.abort();
  }, []);

  const defaultSortKey = (columns.includes("id") ? "id" : columns[0]) as keyof DynamicRow | undefined;
  const { tableConfig, sortedAndPaginatedData } = useTable<DynamicRow>(rows, 10, defaultSortKey as any);

  // Derive map points
  const mapConsumers: ConsumerPoint[] = useMemo(() => {
    return rows.map((r) => {
      // Extract Plot sub-object properties (new structure)
      const plotData = r["Plot"] || {};

      return {
        id: String(r.id || r.SE_ID || ""),
        name: String(r.Consumer_Name || "Consumer"),
        code: String(r.Consumer_Code || ""),
        mobile: String(r.Mobile || ""),
        status: String(r.SE_VALUE || ""),
        coordinates: {
          lat: Number(r.lat || r.CONSUMER_LAT || 0),
          lng: Number(r.lng || r.CONSUMER_LNG || 0),
        },
        consumers: r.consumers || [],
        isActive: r["IsActive"] !== undefined ? r["IsActive"] : true,
        plotColor: plotData.PLOT_COLOR || r["PLOT_COLOR"] || "#10b981",
        plotColorInactive: plotData.PLOT_COLOR_INACTIVE || r["PLOT_COLOR_INACTIVE"] || "#9ca3af",
        plotType: (plotData.PLOT_TYPE || r["PLOT_TYPE"]) as "line" | "round" | "square" | undefined,
      };
    });
  }, [rows]);

  // Devices from DeviceLog for context
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

  const handleToggleIsActive = async (seId: number, currentIsActive: boolean) => {
    setTogglingIds(prev => new Set(prev).add(seId));
    try {
      const result = await apiClient.updateSurveyEntryIsActive(seId, !currentIsActive);
      if (result.success) {
        toast({
          title: "Success",
          description: `Consumer marked as ${!currentIsActive ? "Active" : "Inactive"}`,
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
    <div className="p-0 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consumer Points Viewer</h1>
          <p className="text-muted-foreground">View and manage consumer survey points</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumer Points Map</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-rgis-consumers"
                checked={showRGIS}
                onCheckedChange={setShowRGIS}
              />
              <Label htmlFor="show-rgis-consumers">Show RGIS Map</Label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              {showRGIS ? (
                <RGISMap
                  devices={[]}
                  pipelines={[]}
                  valves={[]}
                  consumers={mapConsumers}
                  showDevices={false}
                  showPipelines={false}
                  showValves={false}
                  showConsumers={mapConsumers.length > 0}
                  //onMapClick={handleMapPointClick}
                />
              ) : (
                <LeafletMap
                  devices={[]}
                  pipelines={[]}
                  valves={[]}
                  consumers={mapConsumers}
                  showDevices={false}
                  showPipelines={false}
                  showValves={false}
                  showConsumers={mapConsumers.length > 0}
                  //onMapClick={handleMapPointClick}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Consumer Points ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 pb-0 overflow-x-auto">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading consumers...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Expand column header */}
                      {sortedAndPaginatedData.some((row) => Array.isArray(row.consumers) && row.consumers.length > 0) && (
                        <TableHead className="w-10"></TableHead>
                      )}
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
                    {sortedAndPaginatedData.flatMap((row, idx) => {
                      const rowId = String(row.id ?? idx);
                      const isExpanded = expandedRowId === rowId;
                      const hasConsumers = Array.isArray(row.consumers) && row.consumers.length > 0;
                      const mainRowCells: JSX.Element[] = [];

                      // Main row
                      if (hasConsumers) {
                        mainRowCells.push(
                          <TableCell
                            key={`expand-${rowId}`}
                            className="w-10 p-2 text-center cursor-pointer hover:bg-muted"
                            onClick={() => setExpandedRowId(isExpanded ? null : rowId)}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                        );
                      }

                      columns.forEach((col) => {
                        const value = row[col];
                        // Special rendering for isActive column
                        if (col.toLowerCase() === 'isactive') {
                          mainRowCells.push(
                            <TableCell key={col} className="whitespace-nowrap">
                              <Badge variant={value ? "default" : "outline"}>
                                {value ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                          );
                        } else if (isDateColumn(col)) {
                          // Format date columns
                          mainRowCells.push(
                            <TableCell key={col} className="whitespace-nowrap">
                              {formatDateCell(value)}
                            </TableCell>
                          );
                        } else {
                          mainRowCells.push(
                            <TableCell key={col} className="whitespace-nowrap">
                              {value === null || value === undefined || value === "" ? "-" : String(value)}
                            </TableCell>
                          );
                        }
                      });

                      // Add toggle button as last cell
                      const seId = Number(row.SE_ID ?? row.id);
                      const isActive = row.IsActive ?? true;
                      const isTogglingThisRow = togglingIds.has(seId);
                      mainRowCells.push(
                        <TableCell key="toggle" className="whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleIsActive(seId, isActive)}
                            disabled={isTogglingThisRow || loading}
                          >
                            {isTogglingThisRow ? "Updating..." : isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      );

                      const result: JSX.Element[] = [
                        <TableRow key={rowId}>
                          {mainRowCells}
                        </TableRow>
                      ];

                      // Expanded consumer row
                      if (isExpanded && hasConsumers) {
                        result.push(
                          <TableRow key={`expanded-${rowId}`} className="bg-muted/30">
                            <TableCell colSpan={columns.length + (hasConsumers ? 1 : 0)} className="p-4">
                              <div className="space-y-3">
                                <p className="font-semibold text-sm">Consumers ({row.consumers.length})</p>
                                <div className="overflow-x-auto rounded-md border">
                                  <Table className="text-xs">
                                    <TableHeader>
                                      <TableRow className="bg-background hover:bg-background">
                                        <TableHead className="whitespace-nowrap h-8">Code</TableHead>
                                        <TableHead className="whitespace-nowrap h-8">Name</TableHead>
                                        <TableHead className="whitespace-nowrap h-8">Mobile</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {row.consumers.map((consumer: any, consumerIdx: number) => (
                                        <TableRow key={consumerIdx} className="hover:bg-muted/50">
                                          <TableCell className="whitespace-nowrap py-2">
                                            {consumer.code || "-"}
                                          </TableCell>
                                          <TableCell className="whitespace-nowrap py-2">
                                            {consumer.name || "-"}
                                          </TableCell>
                                          <TableCell className="whitespace-nowrap py-2">
                                            {consumer.mobile || "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return result;
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            {!loading && (
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
            )}
          </CardContent>
        </Card>
      </div>

    
    </div>
  );
};
