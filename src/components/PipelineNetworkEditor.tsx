import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeafletMap } from "@/components/LeafletMap";
import { Label } from "@/components/ui/label";
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
import { useTable } from "@/hooks/use-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  MapPin,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { apiClient, PipelineSegment } from "@/lib/api";
import { useDeviceLogs } from "@/hooks/useApiQueries";

export const PipelineNetworkEditor = () => {
  const [segments, setSegments] = useState<PipelineSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<PipelineSegment | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    diameter: "",
    depth: "",
    material: "STEEL" as "STEEL" | "HDPE" | "PVC" | "CONCRETE" | "CAST_IRON" | "COPPER" | "POLYETHYLENE" | "OTHER",
    status: "OPERATIONAL" as
      | "OPERATIONAL"
      | "MAINTENANCE"
      | "DAMAGED"
      | "INACTIVE",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  type DynamicRow = Record<string, any>;
  const [propRows, setPropRows] = useState<DynamicRow[]>([]);
  const [propColumns, setPropColumns] = useState<string[]>([]);
  const [propLoading, setPropLoading] = useState<boolean>(false);
  const [propError, setPropError] = useState<string | null>(null);

  const [valveRows, setValveRows] = useState<DynamicRow[]>([]);
  const [valveError, setValveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setPropLoading(true);
      setPropError(null);
      try {
        const url = `https://localhost:7215/api/AssetProperties/ByType/pipeline`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const arr: DynamicRow[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        const normalized = arr.map((item) => ({ ...item }));
        setPropRows(normalized);
        const cols = normalized.length > 0 ? Object.keys(normalized[0]) : [];
        setPropColumns(cols);
      } catch (e: any) {
        setPropError(e?.message || "Failed to load data");
        setPropRows([]);
        setPropColumns([]);
      } finally {
        setPropLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  // Load valves from external endpoint for map layer
  useEffect(() => {
    const controller = new AbortController();
    async function loadValves() {
      setValveError(null);
      try {
        const url = `https://localhost:7215/api/AssetProperties/ByType/valve`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const arr: DynamicRow[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        setValveRows(arr.map((it) => ({ ...it })));
      } catch (e: any) {
        setValveRows([]);
        setValveError(e?.message || "Failed to load valve data");
      }
    }
    loadValves();
    return () => controller.abort();
  }, []);

  // Fetch pipeline segments from API
  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPipelines({ limit: 100 });
      setSegments(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch pipeline segments:", error);
      toast({
        title: "Error",
        description:
          "Failed to load pipeline segments. Please check if the server is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  // Devices for map from DeviceLog endpoint (selected survey)
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

  // Pipelines for map from AssetProperties/ByType/pipeline
  const mapPipelines = useMemo(() => {
    return propRows.map((r, idx) => {
      const id = String(r["id"] ?? r["ID"] ?? r["segmentId"] ?? r["SegmentId"] ?? `PS-${idx + 1}`);
      const diameterVal = Number(r["diameter"] ?? r["Diameter"] ?? r["pipeDiameter"] ?? r["PipeDiameter"] ?? 200);
      const depthVal = Number(r["depth"] ?? r["Depth"] ?? r["installationDepth"] ?? r["InstallationDepth"] ?? 1.5);
      return {
        id,
        diameter: Number.isFinite(diameterVal) ? diameterVal : 200,
        depth: Number.isFinite(depthVal) ? depthVal : 1.5,
        status: "normal" as const,
      };
    });
  }, [propRows]);

  const hasPipelineGeometry = useMemo(
    () => mapPipelines.some((pipeline) => (pipeline.coordinates?.length ?? 0) >= 2),
    [mapPipelines],
  );

  const mapValves = useMemo(
    () => {
      const valves: Array<{
        id: string;
        name?: string;
        type: "control" | "emergency" | "isolation" | "station";
        status: "open" | "closed" | "maintenance" | "fault";
        segmentId: string;
        coordinates?: { lat: number; lng: number; elevation?: number };
        criticality?: string;
      }> = [];

      segments.forEach((segment) => {
        (segment.coordinates ?? []).forEach((point, index) => {
          if (
            typeof point.pointType === "string" &&
            point.pointType.toUpperCase() === "VALVE" &&
            Number.isFinite(point.lat) &&
            Number.isFinite(point.lng)
          ) {
            const status: "open" | "closed" | "maintenance" | "fault" =
              segment.status === "OPERATIONAL"
                ? "open"
                : segment.status === "MAINTENANCE"
                  ? "maintenance"
                  : segment.status === "DAMAGED"
                    ? "fault"
                    : "closed";

            valves.push({
              id: `${segment.id}-valve-${index}`,
              name: point.description
                ? point.description
                : segment.name
                  ? `${segment.name} Valve`
                  : `Segment ${segment.id} Valve`,
              type: "control",
              status,
              segmentId: segment.id,
              coordinates: {
                lat: point.lat,
                lng: point.lng,
                elevation: point.elevation,
              },
            });
          }
        });
      });

      return valves;
    },
    [segments],
  );

  const showDevicesOnMap = mapDevices.length > 0;
  const showPipelinesOnMap = hasPipelineGeometry || mapPipelines.length > 0;
  const showValvesOnMap = mapValves.length > 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    const diameter = parseFloat(formData.diameter);
    if (!formData.diameter || isNaN(diameter) || diameter <= 0) {
      newErrors.diameter = "Diameter must be a positive number";
    }

    const depth = parseFloat(formData.depth);
    if (!formData.depth || isNaN(depth) || depth <= 0) {
      newErrors.depth = "Depth must be a positive number";
    }

    if (!formData.material) {
      newErrors.material = "Material is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const diameter = parseFloat(formData.diameter);
      const depth = parseFloat(formData.depth);

      const pipelineData = {
        name: formData.name,
        status: formData.status,
        specifications: {
          diameter: {
            value: diameter,
            unit: "MM" as const,
          },
          material: formData.material,
        },
        operatingPressure: {
          nominal: 10,
          minimum: 5,
          maximum: 15,
          unit: "BAR" as const,
        },
        installation: {
          installationYear: new Date().getFullYear(),
          depth: {
            value: depth,
            unit: "METERS" as const,
          },
        },
        coordinates: [{ 
          lat: 40.7589, 
          lng: -73.9851,
          pointType: "START" as const,
        }], // Default coordinates with proper GeolocationPoint format
      };

      if (editingSegment) {
        // Update existing segment
        await apiClient.updatePipeline(editingSegment.id, pipelineData);
        toast({ title: "Pipeline segment updated successfully" });
      } else {
        // Add new segment
        await apiClient.createPipeline(pipelineData);
        toast({ title: "Pipeline segment added successfully" });
      }

      await fetchSegments(); // Refresh the list
      setIsDialogOpen(false);
      setEditingSegment(null);
      setFormData({
        name: "",
        diameter: "",
        depth: "",
        material: "STEEL",
        status: "OPERATIONAL",
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to save pipeline segment:", error);
      toast({
        title: "Error",
        description: "Failed to save pipeline segment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (segment: PipelineSegment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      diameter: segment.specifications?.diameter?.value?.toString() || "",
      depth: segment.installation?.depth?.value?.toString() || "",
      material: segment.specifications?.material || "STEEL",
      status: segment.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (segmentId: string) => {
    if (!confirm("Are you sure you want to delete this pipeline segment?"))
      return;

    try {
      await apiClient.deletePipeline(segmentId);
      toast({ title: "Pipeline segment deleted successfully" });
      await fetchSegments(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete pipeline segment:", error);
      toast({
        title: "Error",
        description: "Failed to delete pipeline segment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingSegment(null);
    setFormData({
      name: "",
      diameter: "",
      depth: "",
      material: "STEEL",
      status: "OPERATIONAL",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleFileUpload = (segmentId: string) => {
    toast({ title: "Geo-data upload feature coming soon" });
  };

  // Use the table hook for sorting and pagination
  const defaultSortKey = (propColumns.includes("id") ? "id" : propColumns[0]) as keyof DynamicRow | undefined;
  const { tableConfig, sortedAndPaginatedData } = useTable<DynamicRow>(propRows, 5, defaultSortKey as any);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      OPERATIONAL: { label: "Operational", variant: "default" as const },
      MAINTENANCE: { label: "Maintenance", variant: "secondary" as const },
      DAMAGED: { label: "Damaged", variant: "destructive" as const },
      INACTIVE: { label: "Inactive", variant: "outline" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Network Viewer</h1>
          <p className="text-muted-foreground">
            View underground pipeline segments and geo-data
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Segments List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Valve Points ({propRows.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 pb-0">
              
              {propLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading asset properties...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {propColumns.length === 0 ? (
                        <TableHead>No data</TableHead>
                      ) : (
                        propColumns.map((col) => (
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
                      <TableRow key={String((row as any).id ?? idx)}>
                        {propColumns.map((col) => {
                          const value = (row as any)[col];
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

            {/* Pagination */}
            {!propLoading && (
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

        {/* Map View */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Network Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <LeafletMap
                devices={mapDevices}
                pipelines={mapPipelines}
                valves={mapValves}
                showDevices={showDevicesOnMap}
                showPipelines={showPipelinesOnMap}
                showValves={showValvesOnMap}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSegment
                ? "Edit Pipeline Segment"
                : "Add New Pipeline Segment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter segment name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="diameter">Diameter (mm)</Label>
              <Input
                id="diameter"
                type="number"
                placeholder="Enter diameter in millimeters"
                value={formData.diameter}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, diameter: e.target.value }))
                }
                className={errors.diameter ? "border-destructive" : ""}
              />
              {errors.diameter && (
                <p className="text-sm text-destructive">{errors.diameter}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depth">Depth (m)</Label>
              <Input
                id="depth"
                type="number"
                step="0.1"
                placeholder="Enter depth in meters"
                value={formData.depth}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, depth: e.target.value }))
                }
                className={errors.depth ? "border-destructive" : ""}
              />
              {errors.depth && (
                <p className="text-sm text-destructive">{errors.depth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Select
                value={formData.material}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    material: value as "STEEL" | "HDPE" | "PVC" | "CONCRETE" | "CAST_IRON" | "COPPER" | "POLYETHYLENE" | "OTHER",
                  }))
                }
              >
                <SelectTrigger
                  className={errors.material ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STEEL">Steel</SelectItem>
                  <SelectItem value="HDPE">HDPE</SelectItem>
                  <SelectItem value="PVC">PVC</SelectItem>
                  <SelectItem value="CONCRETE">Concrete</SelectItem>
                  <SelectItem value="CAST_IRON">Cast Iron</SelectItem>
                  <SelectItem value="COPPER">Copper</SelectItem>
                  <SelectItem value="POLYETHYLENE">Polyethylene</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.material && (
                <p className="text-sm text-destructive">{errors.material}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as
                      | "OPERATIONAL"
                      | "MAINTENANCE"
                      | "DAMAGED"
                      | "INACTIVE",
                  }))
                }
              >
                <SelectTrigger
                  className={errors.status ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingSegment ? "Update Segment" : "Add Segment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
