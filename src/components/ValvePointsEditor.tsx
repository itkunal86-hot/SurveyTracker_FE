import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, AlertTriangle } from "lucide-react";
import { useTable } from "@/hooks/use-table";

// Dynamic row type for arbitrary property names
type DynamicRow = Record<string, any>;

// Map view expects these fields only
interface MapValve {
  id: string;
  type: "control" | "emergency" | "isolation";
  status: "open" | "closed" | "maintenance";
  segmentId: string;
}

export const ValvePointsEditor = () => {
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback demo layers for map (devices/pipelines)
  const demoDevices = [
    { id: "VLV-MON-001", name: "Valve Monitor 1", lat: 40.7589, lng: -73.9851, status: "active" as const, lastPing: "20 sec ago" },
    { id: "VLV-MON-002", name: "Valve Monitor 2", lat: 40.7614, lng: -73.9776, status: "active" as const, lastPing: "35 sec ago" },
    { id: "VLV-MON-003", name: "Valve Monitor 3", lat: 40.7505, lng: -73.9934, status: "active" as const, lastPing: "50 sec ago" },
  ];
  const demoPipelines = [
    { id: "PS-001", diameter: 200, depth: 1.5, status: "normal" as const },
    { id: "PS-002", diameter: 150, depth: 2.0, status: "normal" as const },
    { id: "PS-003", diameter: 300, depth: 1.8, status: "warning" as const },
  ];

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Use provided endpoint. If you have an env/base URL, you can swap it here safely.
        const url = `https://localhost:7215/api/AssetProperties/ByType/valve`;
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

        // Normalize keys minimally (keep original keys for header labels)
        const normalized = arr.map((item) => ({ ...item }));
        setRows(normalized);
        const cols = normalized.length > 0 ? Object.keys(normalized[0]) : [];
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

  // Derive valves for map layer from dynamic rows
  const mapValves: MapValve[] = useMemo(() => {
    return rows.map((r) => {
      const rawType = String(r["Type"] ?? r["type"] ?? "").toLowerCase();
      const mappedType: MapValve["type"] = rawType === "emergency" ? "emergency" : rawType === "isolation" ? "isolation" : "control";
      const status: MapValve["status"] = mappedType === "emergency" ? "closed" : rawType === "safety" ? "maintenance" : "open";
      const segment = String(r["Linked Segment"] ?? r["segmentId"] ?? r["Segment"] ?? "Unknown");
      const id = String(r["id"] ?? r["ID"] ?? "");
      return { id, type: mappedType, status, segmentId: segment };
    });
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Valve Points Viewer</h1>
          <p className="text-muted-foreground">View valve metadata and placement on pipeline segments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Valve Points ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 pb-0">
             
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
            <CardTitle>Valve Network Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <LeafletMap
                devices={demoDevices}
                pipelines={demoPipelines}
                valves={mapValves}
                showDevices={true}
                showPipelines={true}
                showValves={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
