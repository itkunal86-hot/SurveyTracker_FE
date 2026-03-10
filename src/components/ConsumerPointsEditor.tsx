import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeafletMap } from "@/components/LeafletMap";
import { RGISMap } from "@/components/RGISMap";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { useDeviceLogs } from "@/hooks/useApiQueries";
import { apiClient } from "@/lib/api";

// Dynamic row type for arbitrary property names
type DynamicRow = Record<string, any>;

interface ConsumerPoint {
  id: string;
  name?: string;
  code?: string;
  mobile?: string;
  status?: string;
  coordinates: { lat: number; lng: number };
}

export const ConsumerPointsEditor = () => {
  const [showRGIS, setShowRGIS] = useState(true);
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
          // Filter out internal id or messy props if needed, but following ValvePointsEditor style
          setColumns(Object.keys(normalized[0]));
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
    return rows.map((r) => ({
      id: String(r.id || r.SE_ID || ""),
      name: String(r.Consumer_Name || "Consumer"),
      code: String(r.Consumer_Code || ""),
      mobile: String(r.Mobile || ""),
      status: String(r.SE_VALUE || ""),
      coordinates: {
        lat: Number(r.lat || r.CONSUMER_LAT || 0),
        lng: Number(r.lng || r.CONSUMER_LNG || 0),
      },
    }));
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
                            {col}
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
                          return (
                            <TableCell key={col} className="whitespace-nowrap">
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
