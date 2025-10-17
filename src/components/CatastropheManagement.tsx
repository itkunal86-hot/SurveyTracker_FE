import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Edit,
  MapPin,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { LeafletMap } from "@/components/LeafletMap";
import { CatastropheForm } from "./CatastropheForm";
import { CatastropheList } from "./CatastropheList";
import {
  useDevices,
  usePipelines,
  useValves,
  useCreateCatastrophe,
  useUpdateCatastrophe,
} from "@/hooks/useApiQueries";
import apiClient from "@/lib/api";
import { toast } from "sonner";

export interface Catastrophe {
  id: string;
  segmentId: string;
  type: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  reportedDate: Date;
}

const CatastropheManagement = () => {
  // External data for grid (AssetProperties/ByType/Catastrophe)
  const [catastrophes, setCatastrophes] = useState<Catastrophe[]>([]);
  const [loadingCatastrophes, setLoadingCatastrophes] = useState(false);
  const [catastrophesError, setCatastrophesError] = useState<Error | null>(null);

  const { data: devicesResponse, isLoading: loadingDevices } = useDevices({
    limit: 50,
  });
  const { data: pipelinesResponse, isLoading: loadingPipelines } = usePipelines(
    { limit: 50 },
  );
  const { data: valvesResponse, isLoading: loadingValves } = useValves({
    limit: 50,
  });
  const createCatastropheMutation = useCreateCatastrophe();
  const updateCatastropheMutation = useUpdateCatastrophe();

  // Fetch catastrophe rows from provided endpoint and map to grid model
  const fetchCatastrophes = async () => {
    setLoadingCatastrophes(true);
    setCatastrophesError(null);
    try {
      const res = await apiClient.getAssetPropertiesByType("Catastrophe");
      const rows = Array.isArray(res?.data) ? res.data : [];
      const mapped: Catastrophe[] = rows.map((r: any, idx: number) => {
        const id = String(
          r?.id ?? r?.ID ?? r?.Id ?? r?.apId ?? r?.AP_ID ?? r?.code ?? `ROW_${idx}`,
        );
        const seg = String(
          r?.["Linked Segment"] ?? r?.linkedSegment ?? r?.LinkedSegment ?? r?.segmentId ?? r?.Segment ?? r?.pipelineId ?? r?.PipelineId ?? "Unknown",
        );
        const rawType = r?.type ?? r?.Type ?? r?.Category ?? r?.category ?? "other";
        const type = String(rawType).toLowerCase().replace(/[_\s]+/g, "-");
        const desc = r?.description ?? r?.Description ?? r?.remarks ?? r?.Remarks ?? "No description provided";
        const locationString = r.Location;
        let safeLat = 0;
        let safeLng =0;
        if (locationString) {
          const [latStr, lngStr] = locationString.split(",").map(s => s.trim());
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          safeLat = Number.isFinite(lat) ? lat : 0;
          safeLng = Number.isFinite(lng) ? lng : 0;
          console.log("Latitude:", lat);
          console.log("Longitude:", lng);
        }

        //const latRaw = r?.lat ?? r?.latitude ?? r?.Latitude ?? r?.coordinates?.lat;
        //const lngRaw = r?.lng ?? r?.longitude ?? r?.Longitude ?? r?.coordinates?.lng;
        //const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
        //const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);
        //const safeLat = Number.isFinite(lat) ? lat : 0;
        //const safeLng = Number.isFinite(lng) ? lng : 0;

        const dateRaw = r?.ReportedDate ?? r?.reportedDate ?? r?.reportedAt ?? r?.ReportedAt ?? r?.createdAt ?? r?.CreatedAt ?? r?.timestamp ?? r?.Timestamp ?? new Date().toISOString();
        const reportedDate = new Date(String(dateRaw));

        return {
          id,
          segmentId: seg,
          type,
          description: String(desc),
          location: {
            lat: safeLat,
            lng: safeLng,
            address: `${safeLat.toFixed(4)}, ${safeLng.toFixed(4)}`,
          },
          reportedDate,
        } as Catastrophe;
      });
      setCatastrophes(mapped);
    } catch (e: any) {
      setCatastrophes([]);
      setCatastrophesError(e instanceof Error ? e : new Error(String(e?.message || e)));
    } finally {
      setLoadingCatastrophes(false);
    }
  };

  useEffect(() => {
    fetchCatastrophes();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingCatastrophe, setEditingCatastrophe] =
    useState<Catastrophe | null>(null);
  const [showAddButton, setShowAddButton] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.getAssetTypes({ limit: 50 });
        const items = Array.isArray(res?.data) ? res.data : [];
        const catastropheType = items.find((a) => {
          const name = (a.name || "").toLowerCase();
          const menu = (a.menuName || "").toLowerCase();
          return name === "catastrophe" || menu.includes("catastrophe");
        });
        if (mounted && catastropheType && !catastropheType.isSurveyElement) {
          setShowAddButton(true);
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddNew = () => {
    setEditingCatastrophe(null);
    setShowForm(true);
  };

  const handleEdit = (catastrophe: Catastrophe) => {
    setEditingCatastrophe(catastrophe);
    setShowForm(true);
  };

  const handleSave = async (catastropheData: Omit<Catastrophe, "id">) => {
    try {
      if (editingCatastrophe) {
        await updateCatastropheMutation.mutateAsync({
          id: editingCatastrophe.id,
          catastrophe: {
            type: catastropheData.type.toUpperCase().replace("-", "_") as any,
            coordinates: {
              lat: catastropheData.location.lat,
              lng: catastropheData.location.lng,
            },
            description: catastropheData.description,
            pipelineId: catastropheData.segmentId,
            reportedDate: new Date(catastropheData.reportedDate),
            location: catastropheData.location.lat + "," + catastropheData.location.lng,
            segment: catastropheData.segmentId,
          },
        });
        toast.success("Catastrophe updated successfully");
      } else {
        await createCatastropheMutation.mutateAsync({
          type: catastropheData.type.toUpperCase().replace("-", "_") as any,
          location: catastropheData.location.lat + "," + catastropheData.location.lng,
          coordinates: {
            lat: catastropheData.location.lat,
            lng: catastropheData.location.lng,
          },
          description: catastropheData.description,
          pipelineId: catastropheData.segmentId,
          segment: catastropheData.segmentId,
          severity: "MEDIUM",
          status: "REPORTED",
          reportedDate: new Date(catastropheData.reportedDate),
        });
        toast.success("Catastrophe created successfully");
      }
      setShowForm(false);
      setEditingCatastrophe(null);
      // After save, refresh grid
      fetchCatastrophes();
    } catch (error) {
      toast.error("Failed to save catastrophe");
      console.error("Error saving catastrophe:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCatastrophe(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  // Transform API data for map
  const mapDevices = useMemo(() => {
    if (!Array.isArray(devicesResponse?.data)) return [];
    return devicesResponse.data.map((device) => ({
      id: device.id,
      name: device.name,
      lat: device.coordinates.lat,
      lng: device.coordinates.lng,
      status:
        device.status === "ACTIVE" ? ("active" as const) : ("offline" as const),
      lastPing: device.lastSeen
        ? new Date(device.lastSeen).toLocaleString()
        : "Unknown",
    }));
  }, [devicesResponse]);

  const mapPipelines = useMemo(() => {
    if (!Array.isArray(pipelinesResponse?.data)) return [];
    return pipelinesResponse.data.map((pipeline) => ({
      id: pipeline.id,
      diameter: pipeline.diameter,
      depth: pipeline.depth || 1.5,
      status:
        pipeline.status === "OPERATIONAL"
          ? ("normal" as const)
          : pipeline.status === "MAINTENANCE"
            ? ("warning" as const)
            : pipeline.status === "DAMAGED"
              ? ("critical" as const)
              : ("normal" as const),
    }));
  }, [pipelinesResponse]);

  const mapValves = useMemo(() => {
    if (!Array.isArray(valvesResponse?.data)) return [];
    return valvesResponse.data.map((valve) => ({
      id: valve.id,
      type:
        valve.type === "GATE"
          ? ("control" as const)
          : valve.type === "BALL"
            ? ("control" as const)
            : valve.type === "BUTTERFLY"
              ? ("control" as const)
              : valve.type === "CHECK"
                ? ("isolation" as const)
                : valve.type === "RELIEF"
                  ? ("emergency" as const)
                  : ("control" as const),
      status:
        valve.status === "OPEN"
          ? ("open" as const)
          : valve.status === "CLOSED"
            ? ("closed" as const)
            : valve.status === "PARTIALLY_OPEN"
              ? ("open" as const)
              : valve.status === "FAULT"
                ? ("maintenance" as const)
                : ("closed" as const),
      segmentId: valve.pipelineId || "Unknown",
    }));
  }, [valvesResponse]);

  const handleRefresh = () => {
    fetchCatastrophes();
  };

  const isLoading =
    loadingCatastrophes || loadingDevices || loadingPipelines || loadingValves;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h1 className="text-2xl font-bold">Catastrophe Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          {showAddButton && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Catastrophe
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {catastrophesError && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Error loading catastrophe data</p>
                <p className="text-sm text-muted-foreground">
                  {catastrophesError.message ||
                    "Failed to fetch catastrophes. Please try again."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Catastrophes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{catastrophes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active This Month
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  catastrophes.filter((cat) => {
                    const now = new Date();
                    const monthAgo = new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      1,
                    );
                    return cat.reportedDate >= monthAgo;
                  }).length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Common Type
              </CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {catastrophes.length > 0
                  ? (catastrophes.reduce(
                    (acc, cat) => {
                      acc[cat.type] = (acc[cat.type] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ).hasOwnProperty &&
                    Object.entries(
                      catastrophes.reduce(
                        (acc, cat) => {
                          acc[cat.type] = (acc[cat.type] || 0) + 1;
                          return acc;
                        },
                        {} as Record<string, number>,
                      ),
                    ).sort(([, a], [, b]) => b - a)[0]?.[0]) ||
                  "N/A"
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form or List */}
          <div>
            {showForm ? (
              <CatastropheForm
                catastrophe={editingCatastrophe}
                onSave={handleSave}
                onCancel={handleCancel}
                selectedLocation={selectedLocation}
              />
            ) : (
              <CatastropheList
                catastrophes={catastrophes}
                onEdit={handleEdit}
              />
            )}
          </div>

          {/* Map View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Catastrophe Locations Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <LeafletMap
                  devices={mapDevices}
                  pipelines={mapPipelines}
                  valves={mapValves}
                  showDevices={true}
                  showPipelines={true}
                  showValves={true}
                  onMapClick={handleMapClick}
                  selectedLocation={selectedLocation}
                  disableAutoFit={!!selectedLocation}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CatastropheManagement;
