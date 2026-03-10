import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LeafletMap } from "@/components/LeafletMap";
import {
  MapPin,
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  useAssetPropertiesByType,
  useConsumerPoints,
} from "@/hooks/useApiQueries";
import { useSurveyContext } from "@/contexts/SurveyContext";

// Legacy interfaces for backward compatibility with LeafletMap
interface DeviceLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "active" | "offline" | "maintenance" | "error";
  lastPing: string;
  type?: string;
  purpose?: string;
  batteryLevel?: number;
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
  lat: number;
  lng: number;
  type: string;
  category?: string;
  status?: "active" | "inactive";
  estimatedConsumption?: number;
  consumptionUnit?: string;
}

export const MapDashboard = () => {
  // Simplified layer controls
  const [showPipelines, setShowPipelines] = useState(true);
  const [showValves, setShowValves] = useState(true);
  const [showConsumerPoints, setShowConsumerPoints] = useState(true);

  // Get current survey context
  const { currentSurvey } = useSurveyContext();

  // API hooks - fetch from AssetProperties/ByType endpoint
  const {
    data: pipelinesResponse,
    isLoading: loadingPipelines,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = useAssetPropertiesByType("pipeline");

  const {
    data: valvesResponse,
    isLoading: loadingValves,
    error: valvesError,
    refetch: refetchValves,
  } = useAssetPropertiesByType("valve");

  const {
    data: consumerPointsResponse,
    isLoading: loadingConsumerPoints,
    error: consumerPointsError,
    refetch: refetchConsumerPoints,
  } = useConsumerPoints();

  // Transform pipeline data from API
  const transformedPipelines: PipelineSegment[] = useMemo(() => {
    if (!showPipelines) return [];

    const pipelines = Array.isArray(pipelinesResponse?.data)
      ? pipelinesResponse.data
      : [];

    return pipelines.map((pipeline: any) => ({
      id: pipeline.id,
      name: pipeline.name || `Pipeline ${pipeline.id}`,
      type: pipeline.type || "UNKNOWN",
      diameter: pipeline.specifications?.diameter?.value || 0,
      depth: pipeline.installation?.depthBelowGround || 0,
      status: pipeline.status === "OPERATIONAL"
        ? "normal"
        : pipeline.status === "MAINTENANCE"
        ? "maintenance"
        : pipeline.status === "DAMAGED"
        ? "critical"
        : "warning",
      material: pipeline.specifications?.material || "UNKNOWN",
      coordinates: (pipeline.coordinates || []).map((coord: any) => ({
        lat: typeof coord.lat === "number" ? coord.lat : 0,
        lng: typeof coord.lng === "number" ? coord.lng : 0,
        elevation: coord.elevation,
      })),
    }));
  }, [pipelinesResponse?.data, showPipelines]);

  // Transform valve data from API
  const transformedValves: ValvePoint[] = useMemo(() => {
    if (!showValves) return [];

    const valves = Array.isArray(valvesResponse?.data) ? valvesResponse.data : [];

    return valves.map((valve: any) => ({
      id: valve.id,
      name: valve.name || `Valve ${valve.id}`,
      type: valve.type === "ISOLATION" ? "isolation" : "station",
      status: valve.status === "OPEN"
        ? "open"
        : valve.status === "CLOSED"
        ? "closed"
        : valve.status === "MAINTENANCE"
        ? "maintenance"
        : "fault",
      segmentId: valve.pipelineId || "Unknown",
      coordinates: valve.coordinates
        ? {
            lat: typeof valve.coordinates.lat === "number" ? valve.coordinates.lat : 0,
            lng: typeof valve.coordinates.lng === "number" ? valve.coordinates.lng : 0,
            elevation: valve.coordinates.elevation,
          }
        : undefined,
      criticality: valve.criticality || "MEDIUM",
    }));
  }, [valvesResponse?.data, showValves]);

  // Transform consumer points data from API
  const transformedConsumerPoints: ConsumerPoint[] = useMemo(() => {
    if (!showConsumerPoints) return [];

    const consumers = Array.isArray(consumerPointsResponse?.data)
      ? consumerPointsResponse.data
      : [];

    return consumers
      .filter((consumer: any) => consumer.coordinates)
      .map((consumer: any) => ({
        id: consumer.id,
        name: consumer.name || `Consumer ${consumer.id}`,
        lat: typeof consumer.coordinates.lat === "number"
          ? consumer.coordinates.lat
          : 0,
        lng: typeof consumer.coordinates.lng === "number"
          ? consumer.coordinates.lng
          : 0,
        type: consumer.type || "DOMESTIC",
        category: consumer.consumerCategory?.type || "DOMESTIC",
        status: consumer.status || "active",
        estimatedConsumption:
          consumer.consumerCategory?.estimatedConsumption || 0,
        consumptionUnit: "m³/day",
      }))
      .filter((c) => c.lat !== 0 && c.lng !== 0); // Filter out points with invalid coordinates
  }, [consumerPointsResponse?.data, showConsumerPoints]);

  // Use transformed data as display data
  const displayPipelines = transformedPipelines;
  const displayValves = transformedValves;
  const displayConsumerPoints = transformedConsumerPoints;

  const handleRefresh = () => {
    refetchPipelines();
    refetchValves();
    refetchConsumerPoints();
  };

  const isLoading =
    loadingPipelines || loadingValves || loadingConsumerPoints;
  const hasError = pipelinesError || valvesError || consumerPointsError;

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
      {/* Layer Controls Panel */}
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
                Pipeline Network ({displayPipelines.length})
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Geo-referenced
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayPipelines.length === 0 ? (
              <p className="text-xs text-muted-foreground">No pipelines available</p>
            ) : (
              displayPipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{pipeline.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ⌀{pipeline.diameter}mm • {pipeline.depth}m deep
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pipeline.material}
                    </p>
                  </div>
                  <Badge className={getStatusColor(pipeline.status)}>
                    {pipeline.status.toUpperCase()}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Valve & Isolation Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Valves & Isolation Points ({displayValves.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayValves.length === 0 ? (
              <p className="text-xs text-muted-foreground">No valves available</p>
            ) : (
              displayValves.map((valve) => (
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
              ))
            )}
          </CardContent>
        </Card>

        {/* Consumer Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Consumer Points ({displayConsumerPoints.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayConsumerPoints.length === 0 ? (
              <p className="text-xs text-muted-foreground">No consumer points available</p>
            ) : (
              displayConsumerPoints.map((consumer) => (
                <div
                  key={consumer.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{consumer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {consumer.category} • {consumer.estimatedConsumption}{" "}
                      {consumer.consumptionUnit}
                    </p>
                  </div>
                  <Badge className={getStatusColor(consumer.status || "active")}>
                    {consumer.status?.toUpperCase() || "ACTIVE"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <LeafletMap
          devices={displayConsumerPoints as unknown as DeviceLocation[]}
          pipelines={displayPipelines}
          valves={displayValves}
          showDevices={showConsumerPoints}
          showPipelines={showPipelines}
          showValves={showValves}
        />

        {/* Enhanced Map Overlay Info */}
        <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="font-medium text-base mb-2">Infrastructure Status</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Pipelines: {displayPipelines.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>
                Operational Valves:{" "}
                {displayValves.filter((v) => v.status === "open").length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Consumer Points: {displayConsumerPoints.length}</span>
            </div>
          </div>
        </div>

        {/* Asset Legend */}
        <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="text-sm">
            <div className="font-medium mb-2">Asset Symbology</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span>Pipeline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span>Valve/Isolation Point</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Consumer Point</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
