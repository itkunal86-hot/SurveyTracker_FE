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
  useCatastrophes,
  useDevices,
  usePipelines,
  useValves,
  useCreateCatastrophe,
  useUpdateCatastrophe,
} from "@/hooks/useApiQueries";
import apiClient, { Catastrophe as APICatastrophe } from "@/lib/api";
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
  // API hooks
  const {
    data: catastrophesResponse,
    isLoading: loadingCatastrophes,
    error: catastrophesError,
    refetch: refetchCatastrophes,
  } = useCatastrophes({ limit: 100 });
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

  // Transform API data to component format
  const catastrophes = useMemo(() => {
    if (!Array.isArray(catastrophesResponse?.data)) return [];

    return catastrophesResponse.data.map(
      (cat: APICatastrophe): Catastrophe => ({
        id: cat.id,
        segmentId: cat.pipelineId || "Unknown",
        type: cat.type.toLowerCase().replace("_", "-"),
        description: cat.description || "No description provided",
        location: {
          lat: cat.coordinates.lat,
          lng: cat.coordinates.lng,
          address: `${cat.coordinates.lat.toFixed(4)}, ${cat.coordinates.lng.toFixed(4)}`,
        },
        reportedDate: new Date(cat.reportedAt),
      }),
    );
  }, [catastrophesResponse]);

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
          // Only enforce show when API explicitly marks it as non-survey element
          setShowAddButton(true);
        }
      } catch {
        // Ignore errors; keep previous behavior (button visible)
      }
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
        // Update existing
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
          },
        });
        toast.success("Catastrophe updated successfully");
      } else {
        // Add new
        await createCatastropheMutation.mutateAsync({
          type: catastropheData.type.toUpperCase().replace("-", "_") as any,
          coordinates: {
            lat: catastropheData.location.lat,
            lng: catastropheData.location.lng,
          },
          description: catastropheData.description,
          pipelineId: catastropheData.segmentId,
          severity: "MEDIUM",
          status: "REPORTED",
        });
        toast.success("Catastrophe created successfully");
      }
      setShowForm(false);
      setEditingCatastrophe(null);
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
    refetchCatastrophes();
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
