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
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import {
  usePipelineGeoJSON,
  useValveGeoJSON,
  useCatastropheGeoJSON,
  useConsumerGeoJSON,
} from "@/hooks/useApiQueries";
import { apiClient } from "@/lib/api";
import {
  parseGeoJSON,
  transformPipelineFeatures,
  transformValveFeatures,
  transformCatastropheFeatures,
  transformConsumerFeatures,
  transformCngStationFeatures,
} from "@/lib/geoJsonParser";
import { formatColumnHeader, formatDateCell, isDateColumn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type DynamicRow = Record<string, any>;

interface CngPoint {
  id: string;
  name?: string;
  code?: string;
  mobile?: string;
  status?: string;
  coordinates: { lat: number; lng: number };
  consumers: any[];
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
}

export const CngStationEditor = () => {
  const { toast } = useToast();
  const [showRGIS, setShowRGIS] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showConsumerPoints, setShowConsumerPoints] = useState(true);
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // API hooks - fetch GeoJSON for infrastructure
  const { data: pipelinesGeoJSON } = usePipelineGeoJSON();
  const { data: valvesGeoJSON } = useValveGeoJSON();
  const { data: catastropheGeoJSON } = useCatastropheGeoJSON();
  const { data: consumerGeoJSON } = useConsumerGeoJSON();

  // Load CNG Stations from survey-geojson endpoint
  useEffect(() => {
    const controller = new AbortController();
    async function loadCngStations() {
      setLoading(true);
      setError(null);
      try {
        const json = await apiClient.getSurveyGeoJson("CNG Station");

        let featureCollection: any = { type: "FeatureCollection", features: [] };
        if (typeof json?.data === "string") {
          try {
            featureCollection = JSON.parse(json.data);
          } catch (e) {
            console.error("Failed to parse GeoJSON string:", e);
          }
        } else if (json?.data?.type === "FeatureCollection") {
          featureCollection = json.data;
        } else if (json?.type === "FeatureCollection") {
          featureCollection = json;
        }

        const features = Array.isArray(featureCollection?.features)
          ? featureCollection.features
          : [];

        const normalized = features.map((f: any) => ({
          ...f.properties,
          id: f.properties?.SE_ID || f.properties?.Code || Math.random().toString(),
          lat: f.geometry?.coordinates?.[1],
          lng: f.geometry?.coordinates?.[0],
        }));

        setRows(normalized);
        if (normalized.length > 0) {
          const allKeys = Object.keys(normalized[0]);
          const primitiveColumns = allKeys.filter((key) => {
            if ([
              "Plot",
              "coordinates",
              "PLOT_COLOR",
              "PLOT_COLOR_INACTIVE",
              "PLOT_TYPE",
              "id",
              "ID",
              "LAT",
              "LNG",
            ].includes(key))
              return false;

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
        setError(e?.message || "Failed to load CNG station data");
        setRows([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    }
    loadCngStations();
    return () => controller.abort();
  }, []);

  const defaultSortKey = (columns.includes("id") ? "id" : columns[0]) as
    | keyof DynamicRow
    | undefined;
  const { tableConfig, sortedAndPaginatedData } = useTable<DynamicRow>(
    rows,
    10,
    defaultSortKey as any
  );

  // Transform pipeline GeoJSON data
  const transformedPipelines = useMemo(() => {
    if (!pipelinesGeoJSON?.data) return [];
    const geoJsonString = pipelinesGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);
    if (!featureCollection || !featureCollection.features) return [];
    return transformPipelineFeatures(featureCollection.features);
  }, [pipelinesGeoJSON?.data]);

  // Transform valve GeoJSON data
  const transformedValves = useMemo(() => {
    if (!valvesGeoJSON?.data) return [];
    const geoJsonString = valvesGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);
    if (!featureCollection || !featureCollection.features) return [];
    return transformValveFeatures(featureCollection.features);
  }, [valvesGeoJSON?.data]);

  // Transform catastrophe GeoJSON data
  const transformedCatastrophes = useMemo(() => {
    if (!catastropheGeoJSON?.data) return [];
    const geoJsonString = catastropheGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);
    if (!featureCollection || !featureCollection.features) return [];
    const catastrophes = transformCatastropheFeatures(featureCollection.features);
    return catastrophes.map((c) => ({
      id: c.id,
      name: c.type,
      severity: c.severity,
      status: c.isActive ? "ACTIVE" : "INACTIVE",
      coordinates: { lat: c.lat, lng: c.lng },
      isActive: c.isActive,
      plotColor: c.plotColor,
      plotColorInactive: c.plotColorInactive,
      plotType: c.plotType,
    }));
  }, [catastropheGeoJSON?.data]);

  // Transform consumer GeoJSON data
  const transformedConsumerPoints = useMemo(() => {
    if (!consumerGeoJSON?.data) return [];
    const geoJsonString = consumerGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);
    if (!featureCollection || !featureCollection.features) return [];
    const consumers = transformConsumerFeatures(featureCollection.features);
    return consumers.map((c) => ({
      ...c,
      coordinates: { lat: c.lat, lng: c.lng },
      consumers: [],
    }));
  }, [consumerGeoJSON?.data]);

  // Derive map points
  const mapCngPoints: CngPoint[] = useMemo(() => {
    return rows.map((r) => {
      const plotData = r["Plot"] || {};

      return {
        id: String(r.id || r.SE_ID || ""),
        name: String(r["Station Name"] || r.Name || "CNG Station"),
        code: String(r.Code || r["SE_ID"] || ""),
        mobile: String(r.Mobile || ""),
        status: String(r.SE_VALUE || r.Status || ""),
        coordinates: {
          lat: Number(r.lat || r.LAT || 0),
          lng: Number(r.lng || r.LNG || 0),
        },
        consumers: [],
        isActive: r["IsActive"] !== undefined ? r["IsActive"] : true,
        plotColor: plotData.PLOT_COLOR || r["PLOT_COLOR"] || "purple",
        plotColorInactive:
          plotData.PLOT_COLOR_INACTIVE || r["PLOT_COLOR_INACTIVE"] || "grey",
        plotType: (plotData.PLOT_TYPE || r["PLOT_TYPE"]) as
          | "line"
          | "round"
          | "square"
          | undefined,
      };
    });
  }, [rows]);

  const handleToggleIsActive = async (seId: number, currentIsActive: boolean) => {
    setTogglingIds((prev) => new Set(prev).add(seId));
    try {
      const result = await apiClient.updateSurveyEntryIsActive(
        seId,
        !currentIsActive
      );
      if (result.success) {
        toast({
          title: "Success",
          description: `CNG Station marked as ${
            !currentIsActive ? "Active" : "Inactive"
          }`,
        });
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.SE_ID === seId || row.id === seId
              ? { ...row, IsActive: !currentIsActive }
              : row
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
      setTogglingIds((prev) => {
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
          <h1 className="text-3xl font-bold">CNG Station Viewer</h1>
          <p className="text-muted-foreground">
            View and manage CNG station survey points
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Map</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-rgis-cng"
                  checked={showRGIS}
                  onCheckedChange={setShowRGIS}
                />
                <Label htmlFor="show-rgis-cng">RGIS Map</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-satellite-cng"
                  checked={showSatellite}
                  onCheckedChange={setShowSatellite}
                />
                <Label htmlFor="show-satellite-cng">Satellite View</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-consumer-points-cng"
                  checked={showConsumerPoints}
                  onCheckedChange={setShowConsumerPoints}
                />
                <Label htmlFor="show-consumer-points-cng">Consumer Points</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              {showRGIS ? (
                <RGISMap
                  devices={[]}
                  pipelines={transformedPipelines}
                  valves={transformedValves}
                  consumers={transformedConsumerPoints as any}
                  showDevices={false}
                  showPipelines={transformedPipelines.length > 0}
                  showValves={transformedValves.length > 0}
                  showConsumers={showConsumerPoints && transformedConsumerPoints.length > 0}
                  showSatellite={showSatellite}
                />
              ) : (
                <LeafletMap
                  devices={[]}
                  pipelines={transformedPipelines}
                  valves={transformedValves}
                  consumers={transformedConsumerPoints as any}
                  showDevices={false}
                  showPipelines={transformedPipelines.length > 0}
                  showValves={transformedValves.length > 0}
                  showConsumers={showConsumerPoints && transformedConsumerPoints.length > 0}
                  showSatellite={showSatellite}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              CNG Stations ({rows.length})
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
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading CNG stations...
                  </span>
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
                            currentSortKey={
                              tableConfig.sortConfig.key as unknown as string
                            }
                            sortDirection={tableConfig.sortConfig.direction}
                            onSort={(k) =>
                              tableConfig.handleSort(k as keyof DynamicRow)
                            }
                          >
                            {formatColumnHeader(col)}
                          </SortableTableHead>
                        ))
                      )}
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndPaginatedData.map((row, idx) => {
                      const seId = Number(row.SE_ID ?? row.id);
                      const isActive = row.IsActive ?? true;
                      const isTogglingThisRow = togglingIds.has(seId);

                      return (
                        <TableRow key={row.id || idx}>
                          {columns.map((col) => {
                            const value = row[col];
                            if (col.toLowerCase() === "isactive") {
                              return (
                                <TableCell key={col} className="whitespace-nowrap">
                                  <Badge variant={value ? "default" : "outline"}>
                                    {value ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                              );
                            } else if (isDateColumn(col)) {
                              return (
                                <TableCell key={col} className="whitespace-nowrap">
                                  {formatDateCell(value)}
                                </TableCell>
                              );
                            } else {
                              return (
                                <TableCell key={col} className="whitespace-nowrap">
                                  {value === null ||
                                  value === undefined ||
                                  value === ""
                                    ? "-"
                                    : String(value)}
                                </TableCell>
                              );
                            }
                          })}
                          <TableCell className="whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleIsActive(seId, isActive)
                              }
                              disabled={isTogglingThisRow || loading}
                            >
                              {isTogglingThisRow
                                ? "Updating..."
                                : isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
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
