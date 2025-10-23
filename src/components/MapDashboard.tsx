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
  Wifi,
  WifiOff,
  Activity,
  Filter,
  RefreshCw,
  AlertCircle,
  Settings,
  Shield,
  Radio,
} from "lucide-react";
import { useDeviceLogs, usePipelines, useValves } from "@/hooks/useApiQueries";
import {
  mockInfrastructurePipelines,
  mockInfrastructureValves,
  mockControlStations,
  getAssetColorByStatus,
  getPipelineColorByType,
  getValveColorByClass,
  type InfrastructurePipeline,
  type InfrastructureValve,
  type ControlStation,
} from "@/lib/mockAssetData";
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

export const MapDashboard = () => {
  // Enhanced layer controls for comprehensive asset types
  const [showPipelines, setShowPipelines] = useState(true);
  const [showValves, setShowValves] = useState(true);
  const [showDevices, setShowDevices] = useState(true);
  const [showControlStations, setShowControlStations] = useState(true);
  const [showUnderground, setShowUnderground] = useState(true);
  const [showAboveGround, setShowAboveGround] = useState(true);
  const [showServiceLines, setShowServiceLines] = useState(true);

  // API hooks
  const {
    data: devicesResponse,
    isLoading: loadingDevices,
    error: devicesError,
    refetch: refetchDevices,
  } = useDeviceLogs({ limit: 100 });
  const {
    data: pipelinesResponse,
    isLoading: loadingPipelines,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = usePipelines({ limit: 100 });
  const {
    data: valvesResponse,
    isLoading: loadingValves,
    error: valvesError,
    refetch: refetchValves,
  } = useValves({ limit: 100 });

  // Transform infrastructure data to format compatible with existing LeafletMap
  const transformedDevices: DeviceLocation[] = useMemo(() => {
    return mockInfrastructureDevices.map((device) => ({
      id: device.id,
      name: device.name,
      lat: device.coordinates.lat,
      lng: device.coordinates.lng,
      status: device.status === "ACTIVE" ? "active" : 
              device.status === "INACTIVE" ? "offline" :
              device.status === "MAINTENANCE" ? "maintenance" : "error",
      lastPing: device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Just now",
      type: device.type,
      purpose: device.purpose,
      batteryLevel: device.batteryLevel,
    }));
  }, []);

  const transformedPipelines: PipelineSegment[] = useMemo(() => {
    return mockInfrastructurePipelines
      .filter(pipeline => {
        if (!showPipelines) return false;
        if (pipeline.type === "UNDERGROUND" && !showUnderground) return false;
        if (pipeline.type === "ABOVE_GROUND" && !showAboveGround) return false;
        if (pipeline.type === "SERVICE" && !showServiceLines) return false;
        return true;
      })
      .map((pipeline) => ({
        id: pipeline.id,
        name: pipeline.name,
        type: pipeline.type,
        diameter: pipeline.diameter,
        depth: pipeline.depth || 1.5,
        status: pipeline.status === "OPERATIONAL" ? "normal" :
                pipeline.status === "MAINTENANCE" ? "maintenance" :
                pipeline.status === "DAMAGED" ? "critical" : "warning",
        material: pipeline.material,
        coordinates: pipeline.coordinates,
      }));
  }, [showPipelines, showUnderground, showAboveGround, showServiceLines]);

  const transformedValves: ValvePoint[] = useMemo(() => {
    return mockInfrastructureValves.map((valve) => ({
      id: valve.id,
      name: valve.name,
      type: valve.valveClass === "ISOLATION_POINT" ? "isolation" :
            valve.valveClass === "VALVE_STATION" ? "station" :
            valve.type === "EMERGENCY_SHUTDOWN" ? "emergency" : "control",
      status: valve.status === "OPEN" ? "open" :
              valve.status === "CLOSED" ? "closed" :
              valve.status === "MAINTENANCE" ? "maintenance" :
              valve.status === "FAULT" ? "fault" : "closed",
      segmentId: valve.pipelineId || "Unknown",
      coordinates: valve.coordinates,
      criticality: valve.criticality,
    }));
  }, []);

  // Use transformed infrastructure data as primary display data
  const displayDevices = transformedDevices;
  const displayPipelines = transformedPipelines;
  const displayValves = transformedValves;
  const displayControlStations = mockControlStations;

  const handleRefresh = () => {
    refetchDevices();
    refetchPipelines();
    refetchValves();
  };

  const isLoading = loadingDevices || loadingPipelines || loadingValves;
  const hasError = devicesError || pipelinesError || valvesError;

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
      {/* Enhanced Layer Controls Panel */}
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
                    Using comprehensive mock infrastructure data
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
            <div className="space-y-3">
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
              
              {/* Pipeline Type Filters */}
              {showPipelines && (
                <div className="ml-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="underground" className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                      <span>Underground Pipelines</span>
                    </Label>
                    <Switch
                      id="underground"
                      checked={showUnderground}
                      onCheckedChange={setShowUnderground}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aboveground" className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Above-Ground Pipelines</span>
                    </Label>
                    <Switch
                      id="aboveground"
                      checked={showAboveGround}
                      onCheckedChange={setShowAboveGround}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="service" className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Service Pipelines</span>
                    </Label>
                    <Switch
                      id="service"
                      checked={showServiceLines}
                      onCheckedChange={setShowServiceLines}
                    />
                  </div>
                </div>
              )}
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

            {/* Device Controls */}
            <div className="flex items-center justify-between">
              <Label htmlFor="devices" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Monitoring Devices</span>
              </Label>
              <Switch
                id="devices"
                checked={showDevices}
                onCheckedChange={setShowDevices}
              />
            </div>

            {/* Control Stations */}
            <div className="flex items-center justify-between">
              <Label htmlFor="control-stations" className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span>Control Stations</span>
              </Label>
              <Switch
                id="control-stations"
                checked={showControlStations}
                onCheckedChange={setShowControlStations}
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

        {/* Monitoring Devices Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Monitoring Devices ({displayDevices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {device.status === "active" ? (
                    <Wifi className="w-4 h-4 text-success" />
                  ) : device.status === "maintenance" ? (
                    <Settings className="w-4 h-4 text-warning" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.type}</p>
                    {device.batteryLevel && (
                      <p className="text-xs text-muted-foreground">
                        Battery: {device.batteryLevel}%
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(device.status)}>
                    {device.status.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {device.lastPing}
                  </p>
                </div>
              </div>
            ))}
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
            {displayPipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{pipeline.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pipeline.type} • ⌀{pipeline.diameter}mm • {pipeline.depth}m deep
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pipeline.material}
                  </p>
                </div>
                <Badge className={getStatusColor(pipeline.status)}>
                  {pipeline.status.toUpperCase()}
                </Badge>
              </div>
            ))}
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
            {displayValves.map((valve) => (
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
            ))}
          </CardContent>
        </Card>

        {/* Control Stations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Control Stations ({displayControlStations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayControlStations.map((station) => (
              <div
                key={station.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{station.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.type} • {station.controlledPipelines.length} pipelines
                  </p>
                </div>
                <Badge className={getStatusColor(station.status)}>
                  {station.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <LeafletMap
          devices={displayDevices}
          pipelines={displayPipelines}
          valves={displayValves}
          showDevices={showDevices}
          showPipelines={showPipelines}
          showValves={showValves}
        />

        {/* Enhanced Map Overlay Info */}
        <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="font-medium text-base mb-2">Infrastructure Status</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span>
                Active Devices: {displayDevices.filter((d) => d.status === "active").length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span>
                Maintenance: {displayDevices.filter((d) => d.status === "maintenance").length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>
                Underground Lines: {displayPipelines.filter((p) => p.type === "UNDERGROUND").length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>
                Above-Ground Lines: {displayPipelines.filter((p) => p.type === "ABOVE_GROUND").length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>
                Critical Valves: {displayValves.filter((v) => v.criticality === "CRITICAL").length}
              </span>
            </div>
          </div>
        </div>

        {/* Asset Legend */}
        <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="text-sm">
            <div className="font-medium mb-2">Asset Symbology</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-700"></div>
                <span>Underground Pipeline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-purple-500"></div>
                <span>Above-Ground Pipeline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-green-600 border-dashed border-2 border-green-600"></div>
                <span>Service Pipeline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
                <span>Valve/Isolation Point</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Monitoring Device</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
