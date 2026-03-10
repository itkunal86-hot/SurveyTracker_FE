import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LeafletMap } from "@/components/LeafletMap";
import {
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  usePipelineGeoJSON,
  useValveGeoJSON,
  useConsumerGeoJSON,
} from "@/hooks/useApiQueries";
import {
  parseGeoJSON,
  transformPipelineFeatures,
  transformValveFeatures,
  transformConsumerFeatures,
} from "@/lib/geoJsonParser";
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
  consumerCode?: string;
  mobile?: string;
}

export const MapDashboard = () => {
  // Simplified layer controls
  const [showPipelines, setShowPipelines] = useState(true);
  const [showValves, setShowValves] = useState(true);
  const [showConsumerPoints, setShowConsumerPoints] = useState(true);

  // Get current survey context
  const { currentSurvey } = useSurveyContext();

  // API hooks - fetch GeoJSON from survey-geojson endpoint
  const {
    data: pipelinesGeoJSON,
    isLoading: loadingPipelines,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = usePipelineGeoJSON();

  const {
    data: valvesGeoJSON,
    isLoading: loadingValves,
    error: valvesError,
    refetch: refetchValves,
  } = useValveGeoJSON();

  const {
    data: consumerGeoJSON,
    isLoading: loadingConsumerPoints,
    error: consumerPointsError,
    refetch: refetchConsumerPoints,
  } = useConsumerGeoJSON();

  // Transform pipeline GeoJSON data
  const transformedPipelines: PipelineSegment[] = useMemo(() => {
    if (!showPipelines || !pipelinesGeoJSON?.data) return [];

    const geoJsonString = pipelinesGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);

    if (!featureCollection || !featureCollection.features) {
      return [];
    }

    return transformPipelineFeatures(featureCollection.features);
  }, [pipelinesGeoJSON?.data, showPipelines]);

  // Transform valve GeoJSON data
  const transformedValves: ValvePoint[] = useMemo(() => {
    if (!showValves || !valvesGeoJSON?.data) return [];

    const geoJsonString = valvesGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);

    if (!featureCollection || !featureCollection.features) {
      return [];
    }

    return transformValveFeatures(featureCollection.features);
  }, [valvesGeoJSON?.data, showValves]);

  // Transform consumer GeoJSON data
  const transformedConsumerPoints: ConsumerPoint[] = useMemo(() => {
    if (!showConsumerPoints || !consumerGeoJSON?.data) return [];

    const geoJsonString = consumerGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);

    if (!featureCollection || !featureCollection.features) {
      return [];
    }

    return transformConsumerFeatures(featureCollection.features);
  }, [consumerGeoJSON?.data, showConsumerPoints]);

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
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
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
                    {pipeline.material && (
                      <p className="text-xs text-muted-foreground">
                        {pipeline.material}
                      </p>
                    )}
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
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
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
            <CardTitle className="text-lg">
              Consumer Points ({displayConsumerPoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
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
                      {consumer.category}
                    </p>
                    {consumer.consumerCode && (
                      <p className="text-xs text-muted-foreground">
                        Code: {consumer.consumerCode}
                      </p>
                    )}
                    {consumer.mobile && (
                      <p className="text-xs text-muted-foreground">
                        {consumer.mobile}
                      </p>
                    )}
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
              <span>Valves: {displayValves.length}</span>
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
