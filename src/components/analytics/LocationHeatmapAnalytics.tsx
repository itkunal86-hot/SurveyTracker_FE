import { useState, useMemo, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Layers,
  Activity,
  TrendingUp,
  BarChart3,
  Gauge,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  mockInfrastructureDevices,
  mockInfrastructurePipelines,
  mockInfrastructureValves,
  mockControlStations,
  getAssetColorByStatus,
  getPipelineColorByType,
  getValveColorByClass,
  InfrastructureDevice,
  InfrastructurePipeline,
  InfrastructureValve,
  ControlStation,
} from "@/lib/mockAssetData";

interface HeatmapFilters {
  showDevices: boolean;
  showPipelines: boolean;
  showValves: boolean;
  showControlStations: boolean;
  timeRange: string;
  statusFilter: string;
  assetType: string;
}

// Generate usage data based on infrastructure assets
const generateUsageData = () => {
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0') + ':00';
    const baseUsage = Math.sin((i - 6) * Math.PI / 12) * 50 + 100;
    const peakHours = i >= 8 && i <= 18;
    const usage = Math.max(0, baseUsage + (peakHours ? Math.random() * 30 : Math.random() * 15));
    
    return {
      hour,
      usage: Math.round(usage),
      pressure: Math.round(35 + Math.random() * 15),
      flowRate: Math.round(usage * 0.8 + Math.random() * 20),
      temperature: Math.round(20 + Math.random() * 10),
    };
  });

  const pipelineUsage = mockInfrastructurePipelines.map(pipeline => ({
    id: pipeline.id,
    name: pipeline.name,
    usage: pipeline.flowRate || Math.round(Math.random() * 1000 + 500),
    efficiency: Math.round(85 + Math.random() * 15),
    pressure: pipeline.pressure || Math.round(Math.random() * 50 + 25),
    diameter: pipeline.diameter,
    status: pipeline.status,
    type: pipeline.type,
  }));

  const deviceUtilization = mockInfrastructureDevices.map(device => ({
    id: device.id,
    name: device.name,
    utilization: device.batteryLevel || Math.round(Math.random() * 100),
    activeTime: Math.round(Math.random() * 24),
    dataPoints: Math.round(Math.random() * 1000 + 100),
    status: device.status,
    type: device.type,
  }));

  const pressureDistribution = mockControlStations.map(station => ({
    id: station.id,
    name: station.name,
    pressure: station.operatingPressure || Math.round(Math.random() * 50 + 20),
    flow: Math.round(Math.random() * 500 + 200),
    efficiency: Math.round(80 + Math.random() * 20),
    status: station.status,
  }));

  return {
    hourlyData,
    pipelineUsage,
    deviceUtilization,
    pressureDistribution,
  };
};

// Generate density heatmap data
const generateHeatmapDensity = (assets: any[], latBounds: [number, number], lngBounds: [number, number]) => {
  const gridSize = 10;
  const density = [];
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = latBounds[0] + (latBounds[1] - latBounds[0]) * (i / gridSize);
      const lng = lngBounds[0] + (lngBounds[1] - lngBounds[0]) * (j / gridSize);
      
      // Count assets within a radius
      const radius = 0.01; // ~1km
      const count = assets.filter(asset => {
        const distance = Math.sqrt(
          Math.pow(asset.coordinates.lat - lat, 2) + 
          Math.pow(asset.coordinates.lng - lng, 2)
        );
        return distance <= radius;
      }).length;
      
      if (count > 0) {
        density.push({
          lat,
          lng,
          density: count,
          intensity: Math.min(count / 5, 1), // Normalize to 0-1
        });
      }
    }
  }
  
  return density;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface HeatmapLeafletMapProps {
  filteredAssets: any[];
  heatmapDensity: any[];
  filters: HeatmapFilters;
}

const HeatmapLeafletMap = ({ filteredAssets, heatmapDensity, filters }: HeatmapLeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    assets: L.LayerGroup;
    heatmap: L.LayerGroup;
    pipelines: L.LayerGroup;
  } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([19.0760, 72.8777], 13); // Mumbai coordinates

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create layer groups
    const layers = {
      assets: L.layerGroup().addTo(map),
      heatmap: L.layerGroup().addTo(map),
      pipelines: L.layerGroup().addTo(map),
    };

    layersRef.current = layers;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map data
  useEffect(() => {
    if (!layersRef.current) return;

    //const { assets: assetLayer, heatmap: heatmapLayer, pipelines: pipelineLayer } = layersRef.current;
    const { heatmap: heatmapLayer } = layersRef.current;

    // Clear existing layers
    //assetLayer.clearLayers();
    heatmapLayer.clearLayers();
    //pipelineLayer.clearLayers();

    // Add heatmap density circles
    heatmapDensity.forEach((point) => {
      const radius = 20 + point.density * 30; // Scale radius based on density
      const color = point.intensity > 0.7 ? '#ef4444' :
                   point.intensity > 0.4 ? '#f97316' : '#eab308';

      const circle = L.circle([point.lat, point.lng], {
        radius: radius,
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 1,
      });

      circle.bindTooltip(`Density: ${point.density} assets`, {
        permanent: false,
        direction: 'top'
      });

      heatmapLayer.addLayer(circle);
    });

    // Add pipeline segments if enabled
    if (filters.showPipelines) {
      mockInfrastructurePipelines.forEach((pipeline) => {
        if (pipeline.coordinates && pipeline.coordinates.length > 1) {
          const latlngs: L.LatLngExpression[] = pipeline.coordinates.map(coord => [coord.lat, coord.lng]);

          const polyline = L.polyline(latlngs, {
            color: getPipelineColorByType(pipeline.type),
            weight: Math.max(2, pipeline.diameter / 100),
            opacity: pipeline.status === 'OPERATIONAL' ? 0.8 : 0.4,
          });

          polyline.bindPopup(`
            <div style="font-family: system-ui; padding: 4px;">
              <strong>${pipeline.name}</strong><br/>
              <span style="color: #666;">Type: ${pipeline.type}</span><br/>
              <span style="color: #666;">Diameter: ${pipeline.diameter}mm</span><br/>
              <span style="color: #666;">Status: ${pipeline.status}</span>
            </div>
          `);

          //pipelineLayer.addLayer(polyline);
        }
      });
    }

    // Add asset markers
    filteredAssets.forEach((asset) => {
      const marker = L.circleMarker([asset.coordinates.lat, asset.coordinates.lng], {
        radius: 8,
        fillColor: getAssetColorByStatus(asset.status, asset.assetType),
        color: "white",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });

      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong>${asset.name}</strong><br/>
          <span style="color: #666;">Type: ${asset.assetType}</span><br/>
          <span style="color: #666;">Status: ${asset.status}</span><br/>
          ${asset.pressure ? `<span style="color: #666;">Pressure: ${asset.pressure} Bar</span><br/>` : ''}
          ${asset.batteryLevel ? `<span style="color: #666;">Battery: ${asset.batteryLevel}%</span><br/>` : ''}
        </div>
      `);

      //assetLayer.addLayer(marker);
    });

  }, [filteredAssets, heatmapDensity, filters]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />
      <div className="absolute bottom-4 left-4 z-[10002] bg-white/90 backdrop-blur-sm rounded p-3 text-sm">
        <div className="font-medium">Visible Assets: {filteredAssets.length}</div>
        <div className="text-muted-foreground">Mumbai Gas Network</div>
      </div>
    </div>
  );
};

export const LocationHeatmapAnalytics = () => {
  const [filters, setFilters] = useState<HeatmapFilters>({
    showDevices: true,
    showPipelines: true,
    showValves: true,
    showControlStations: true,
    timeRange: "24h",
    statusFilter: "all",
    assetType: "device",
  });

  const usageData = useMemo(() => generateUsageData(), []);
  
  const filteredAssets = useMemo(() => {
    let assets: any[] = [];
    
    if (filters.showDevices) {
      assets.push(...mockInfrastructureDevices.map(d => ({ ...d, assetType: 'device' })));
    }
    // if (filters.showValves) {
    //   assets.push(...mockInfrastructureValves.map(v => ({ ...v, assetType: 'valve' })));
    // }
    // if (filters.showControlStations) {
    //   assets.push(...mockControlStations.map(c => ({ ...c, assetType: 'controlStation' })));
    // }
    
    // Apply status filter
    // if (filters.statusFilter !== "all") {
    //   assets = assets.filter(asset => asset.status === filters.statusFilter);
    // }
    
    // // Apply asset type filter
    // if (filters.assetType !== "all") {
    //   assets = assets.filter(asset => asset.assetType === filters.assetType);
    // }
    
    return assets;
  }, [filters]);

  const heatmapDensity = useMemo(() => {
    const latBounds: [number, number] = [40.7589, 40.7000];
    const lngBounds: [number, number] = [-73.9851, -74.0100];
    return generateHeatmapDensity(filteredAssets, latBounds, lngBounds);
  }, [filteredAssets]);

  const summaryStats = useMemo(() => {
    const totalDevices = mockInfrastructureDevices.length;
    const activeDevices = mockInfrastructureDevices.filter(d => d.status === 'ACTIVE').length;
    const totalValves = mockInfrastructureValves.length;
    const operationalPipelines = mockInfrastructurePipelines.filter(p => p.status === 'OPERATIONAL').length;
    const totalPipelines = mockInfrastructurePipelines.length;
    
    return {
      totalAssets: totalDevices + totalValves + totalPipelines + mockControlStations.length,
      activeDevices: `${activeDevices}/${totalDevices}`,
      operationalPipelines: `${operationalPipelines}/${totalPipelines}`,
      totalUsage: usageData.hourlyData.reduce((sum, d) => sum + d.usage, 0),
      avgPressure: Math.round(usageData.hourlyData.reduce((sum, d) => sum + d.pressure, 0) / usageData.hourlyData.length),
      peakFlow: Math.max(...usageData.hourlyData.map(d => d.flowRate)),
    };
  }, [usageData]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Heatmap & Usage Analytics</h1>
          <p className="text-muted-foreground">
            Real-time visualization of asset distribution and usage patterns
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={filters.timeRange} onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{summaryStats.totalAssets}</p>
              </div>
              <MapPin className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.activeDevices}</p>
              </div>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipelines</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.operationalPipelines}</p>
              </div>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">{summaryStats.totalUsage}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Pressure</p>
                <p className="text-2xl font-bold text-orange-600">{summaryStats.avgPressure} Bar</p>
              </div>
              <Gauge className="h-4 w-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peak Flow</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.peakFlow} L/s</p>
              </div>
              <BarChart3 className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="heatmap" className="space-y-6">
        <TabsList>
          <TabsTrigger value="heatmap">Location Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Map Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Asset Type Filters */}
                <div className="space-y-4 hidden">
                  <h4 className="font-medium">Asset Layers</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Devices</span>
                    </div>
                    <Switch 
                      checked={filters.showDevices} 
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showDevices: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Pipelines</span>
                    </div>
                    <Switch 
                      checked={filters.showPipelines} 
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showPipelines: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Valves</span>
                    </div>
                    <Switch 
                      checked={filters.showValves} 
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showValves: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Control Stations</span>
                    </div>
                    <Switch 
                      checked={filters.showControlStations} 
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showControlStations: checked }))}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <h4 className="font-medium">Status Filter</h4>
                  <Select value={filters.statusFilter} onValueChange={(value) => setFilters(prev => ({ ...prev, statusFilter: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Density Legend */}
                <div className="space-y-3">
                  <h4 className="font-medium">Asset Density</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High</span>
                      <div className="h-3 w-6 bg-red-500 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium</span>
                      <div className="h-3 w-6 bg-orange-500 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low</span>
                      <div className="h-3 w-6 bg-yellow-500 rounded"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Map */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Infrastructure Asset Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapLeafletMap
                  filteredAssets={filteredAssets}
                  heatmapDensity={heatmapDensity}
                  filters={filters}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
};
