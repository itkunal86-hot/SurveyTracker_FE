import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LeafletMap } from "@/components/LeafletMap";
import { RGISMap } from "@/components/RGISMap";
import {
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  usePipelineGeoJSON,
  useValveGeoJSON,
  useConsumerGeoJSON,
  useCngStationGeoJSON,
} from "@/hooks/useApiQueries";
import {
  parseGeoJSON,
  transformPipelineFeatures,
  transformValveFeatures,
  transformConsumerFeatures,
  transformCngStationFeatures,
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
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
}

interface ValvePoint {
  id: string;
  name?: string;
  type: "control" | "emergency" | "isolation" | "station";
  status: "open" | "closed" | "maintenance" | "fault";
  segmentId: string;
  coordinates?: { lat: number; lng: number; elevation?: number };
  criticality?: string;
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
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
  coordinates?: { lat: number; lng: number };
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
}

export const MapDashboard = () => {
  // Simplified layer controls
  const [showRGIS, setShowRGIS] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showValves, setShowValves] = useState(true);
  const [showConsumerPoints, setShowConsumerPoints] = useState(true);

  // Selection state for highlighting
  const [selectedElement, setSelectedElement] = useState<{ type: "pipeline" | "valve" | "consumer"; id: string } | null>(null);

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

  const {
    data: cngStationGeoJSON,
    isLoading: loadingCngStations,
    error: cngStationsError,
    refetch: refetchCngStations,
  } = useCngStationGeoJSON();

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

  // Transform CNG Station GeoJSON data
  const transformedCngStations: ConsumerPoint[] = useMemo(() => {
    if (!cngStationGeoJSON?.data) return [];

    const geoJsonString = cngStationGeoJSON.data;
    const featureCollection = parseGeoJSON(geoJsonString);

    if (!featureCollection || !featureCollection.features) {
      return [];
    }

    const cngStations = transformCngStationFeatures(featureCollection.features);
    return cngStations.map(c => ({
      ...c,
      coordinates: { lat: c.lat, lng: c.lng },
      consumers: [],
    }));
  }, [cngStationGeoJSON?.data]);

  // Use transformed data as display data
  const displayPipelines = transformedPipelines;
  const displayValves = transformedValves;
  const displayConsumerPoints = transformedConsumerPoints;
  const displayCngStations = transformedCngStations;

  const handleRefresh = () => {
    refetchPipelines();
    refetchValves();
    refetchConsumerPoints();
    refetchCngStations();
  };

  const isLoading =
    loadingPipelines || loadingValves || loadingConsumerPoints || loadingCngStations;
  const hasError = pipelinesError || valvesError || consumerPointsError || cngStationsError;

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
            {/* Map Type Control */}
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <Label htmlFor="rgis-map" className="text-base font-semibold">
                Map Type
              </Label>
              <Switch
                id="rgis-map"
                checked={showRGIS}
                onCheckedChange={setShowRGIS}
              />
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {showRGIS ? "RGIS Map" : "Leaflet Map"}
            </div>

            {/* Satellite View Control */}
            <div className="flex items-center justify-between pb-3 mb-3">
              <Label htmlFor="satellite-view" className="text-sm font-medium">
                Satellite View
              </Label>
              <Switch
                id="satellite-view"
                checked={showSatellite}
                onCheckedChange={setShowSatellite}
              />
            </div>

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
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
                  onClick={() => setSelectedElement({ type: "pipeline", id: pipeline.id })}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedElement?.type === "pipeline" && selectedElement?.id === pipeline.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{pipeline.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ⌀{pipeline.diameter}mm • {pipeline.depth}m deep
                    </p>
                  </div>
                  <Badge className={pipeline.isActive ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                    {pipeline.isActive ? "ACTIVE" : "INACTIVE"}
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
                  onClick={() => setSelectedElement({ type: "valve", id: valve.id })}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedElement?.type === "valve" && selectedElement?.id === valve.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{valve.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {valve.type}
                    </p>
                  </div>
                  <Badge className={valve.isActive ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}>
                    {valve.isActive ? "ACTIVE" : "INACTIVE"}
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
                  onClick={() => setSelectedElement({ type: "consumer", id: consumer.id })}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedElement?.type === "consumer" && selectedElement?.id === consumer.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border hover:bg-accent"
                  }`}
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
        {showRGIS ? (
          <RGISMap
            devices={[]}
            pipelines={displayPipelines as any}
            valves={displayValves as any}
            consumers={[
              ...displayConsumerPoints.map((cp: any) => ({
                id: cp.id,
                name: cp.name,
                code: cp.consumerCode,
                mobile: cp.mobile,
                status: cp.status,
                coordinates: { lat: cp.lat, lng: cp.lng },
                consumers: [],
                isActive: cp.isActive,
                plotColor: cp.plotColor,
                plotColorInactive: cp.plotColorInactive,
                plotType: cp.plotType,
              })),
              ...displayCngStations.map((cs: any) => ({
                id: cs.id,
                name: cs.name,
                code: cs.consumerCode,
                mobile: cs.mobile,
                status: cs.status,
                coordinates: { lat: cs.lat, lng: cs.lng },
                consumers: [],
                isActive: cs.isActive,
                plotColor: cs.plotColor || "#a855f7",
                plotColorInactive: cs.plotColorInactive || "#d1d5db",
                plotType: cs.plotType,
              })),
            ] as any}
            showDevices={false}
            showPipelines={showPipelines}
            showValves={showValves}
            showConsumers={showConsumerPoints || displayCngStations.length > 0}
            showSatellite={showSatellite}
            highlightedElementId={selectedElement?.id}
            highlightedElementType={selectedElement?.type as any}
          />
        ) : (
          <LeafletMap
            devices={[]}
            pipelines={displayPipelines as any}
            valves={displayValves as any}
            consumers={[
              ...displayConsumerPoints.map((cp: any) => ({
                id: cp.id,
                name: cp.name,
                code: cp.consumerCode,
                mobile: cp.mobile,
                status: cp.status,
                coordinates: { lat: cp.lat, lng: cp.lng },
                consumers: [],
                isActive: cp.isActive,
                plotColor: cp.plotColor,
                plotColorInactive: cp.plotColorInactive,
                plotType: cp.plotType,
              })),
              ...displayCngStations.map((cs: any) => ({
                id: cs.id,
                name: cs.name,
                code: cs.consumerCode,
                mobile: cs.mobile,
                status: cs.status,
                coordinates: { lat: cs.lat, lng: cs.lng },
                consumers: [],
                isActive: cs.isActive,
                plotColor: cs.plotColor || "#a855f7",
                plotColorInactive: cs.plotColorInactive || "#d1d5db",
                plotType: cs.plotType,
              })),
            ] as any}
            showDevices={false}
            showPipelines={showPipelines}
            showValves={showValves}
            showConsumers={showConsumerPoints || displayCngStations.length > 0}
            showSatellite={showSatellite}
            highlightedElementId={selectedElement?.id}
            highlightedElementType={selectedElement?.type as any}
          />
        )}


        {/* Enhanced Map Overlay Info */}
        <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="font-medium text-base mb-2">Infrastructure Status</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Pipeline: {displayPipelines.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Valve Point: {displayValves.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Customer: {displayConsumerPoints.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
