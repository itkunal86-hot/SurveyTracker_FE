import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SurveyAssetMap } from "@/components/SurveyAssetMap";
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
import { MapPin, AlertTriangle, Loader2, Power } from "lucide-react";
import { useTable } from "@/hooks/use-table";
import { API_BASE_PATH, apiClient } from "@/lib/api";
import { parseGeoJsonFeatures, readSurveyMapLayer } from "@/lib/surveyMapCache";
import { formatColumnHeader, formatDateCell, isDateColumn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const [showSatellite, setShowSatellite] = useState(false);
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // Load valves table from the shared map cache
  useEffect(() => {
    let cancelled = false;
    async function loadValves() {
      setLoading(true);
      setError(null);
      try {
        const features = parseGeoJsonFeatures(await readSurveyMapLayer("Valve"));
        if (cancelled) return;
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
        if (cancelled) return;
        setError(e?.message || "Failed to load data");
        setRows([]);
        setColumns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadValves();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultSortKey = (columns.includes("id") ? "id" : columns[0]) as keyof DynamicRow | undefined;
  const { tableConfig, sortedAndPaginatedData } = useTable<DynamicRow>(rows, 5, defaultSortKey as any);

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
            <CardTitle>Infrastructure Map</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-rgis-valves"
                  checked={showRGIS}
                  onCheckedChange={setShowRGIS}
                />
                <Label htmlFor="show-rgis-valves">RGIS Map</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-satellite-valves"
                  checked={showSatellite}
                  onCheckedChange={setShowSatellite}
                />
                <Label htmlFor="show-satellite-valves">Satellite View</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <SurveyAssetMap showRGIS={showRGIS} showSatellite={showSatellite} />
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
                        <>
                          {columns.map((col) => (
                            <SortableTableHead
                              key={col}
                              sortKey={col}
                              currentSortKey={tableConfig.sortConfig.key as unknown as string}
                              sortDirection={tableConfig.sortConfig.direction}
                              onSort={(k) => tableConfig.handleSort(k as keyof DynamicRow)}
                            >
                              {formatColumnHeader(col)}
                            </SortableTableHead>
                          ))}
                          <SortableTableHead sortable={false}>
                            Status
                          </SortableTableHead>
                          <SortableTableHead sortable={false} className="text-right">
                            Action
                          </SortableTableHead>
                        </>
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
                            <Badge variant={isActive ? "default" : "outline"}>
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleIsActive(seId, isActive)}
                              disabled={isTogglingThisRow || loading}
                              className="gap-1"
                            >
                              {isTogglingThisRow ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Updating...
                                </>
                              ) : (
                                isActive ? "Deactivate" : "Activate"
                              )}
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
