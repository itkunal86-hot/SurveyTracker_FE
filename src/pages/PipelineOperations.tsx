import { useState, useMemo, useRef, useEffect } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { Link } from "react-router-dom";
import { useTable } from "@/hooks/use-table";
import {
  RefreshCw,
  MapPin,
  AlertTriangle,
  Settings,
  Activity,
  Gauge,
  Layers,
  ArrowLeft
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  usePipelines,
  useValves,
  useCatastrophes,
  useValveOperations,
  useDevices
} from "@/hooks/useApiQueries";
import { toast } from "sonner";

// Enhanced Leaflet Map Component with highlighting
interface EnhancedMapProps {
  devices: any[];
  pipelines: any[];
  valves: any[];
  catastrophes: any[];
  valveOperations: any[];
  highlightedItemId?: string;
  highlightedItemType?: 'pipeline' | 'valve' | 'catastrophe' | 'operation';
}

const EnhancedMap = ({ 
  devices, 
  pipelines, 
  valves, 
  catastrophes, 
  valveOperations,
  highlightedItemId,
  highlightedItemType 
}: EnhancedMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    devices: L.LayerGroup;
    pipelines: L.LayerGroup;
    valves: L.LayerGroup;
    catastrophes: L.LayerGroup;
  } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([40.7589, -73.9851], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create layer groups
    const layers = {
      devices: L.layerGroup().addTo(map),
      pipelines: L.layerGroup().addTo(map),
      valves: L.layerGroup().addTo(map),
      catastrophes: L.layerGroup().addTo(map)
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

    const { devices: deviceLayer, pipelines: pipelineLayer, valves: valveLayer, catastrophes: catastropheLayer } = layersRef.current;

    // Clear existing layers
    deviceLayer.clearLayers();
    pipelineLayer.clearLayers();
    valveLayer.clearLayers();
    catastropheLayer.clearLayers();

    // Add devices
    devices.forEach((device) => {
      const isHighlighted = highlightedItemType === 'pipeline' && highlightedItemId === device.id;
      const color = device.status === "active" ? "green" : "red";
      const radius = isHighlighted ? 12 : 8;
      
      const marker = L.circleMarker([device.lat, device.lng], {
        radius,
        fillColor: color,
        color: isHighlighted ? "#fff" : "white",
        weight: isHighlighted ? 4 : 2,
        opacity: 1,
        fillOpacity: isHighlighted ? 1 : 0.8,
        className: isHighlighted ? 'highlighted-marker' : ''
      });

      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong>${device.name}</strong><br/>
          <span style="color: #666;">ID: ${device.id}</span><br/>
          <span style="color: ${color};">Status: ${device.status}</span><br/>
          <span style="color: #666;">Last ping: ${device.lastPing}</span>
        </div>
      `);

      deviceLayer.addLayer(marker);
    });

    // Add pipelines
    const pipelineRoutes: L.LatLngExpression[][] = [
      [[40.7589, -73.9851], [40.7614, -73.9776]],
      [[40.7614, -73.9776], [40.77, -73.99]],
      [[40.7589, -73.9851], [40.7505, -73.9934]],
      [[40.7505, -73.9934], [40.755, -73.995]],
      [[40.7589, -73.9851], [40.745, -73.98]],
      [[40.745, -73.98], [40.748, -73.988]],
    ];

    pipelines.forEach((pipeline, index) => {
      if (pipelineRoutes[index]) {
        const isHighlighted = highlightedItemType === 'pipeline' && highlightedItemId === pipeline.id;
        const color = pipeline.status === "normal" ? "#3b82f6" : 
                     pipeline.status === "warning" ? "#f59e0b" : "#ef4444";

        const polyline = L.polyline(pipelineRoutes[index], {
          color: color,
          weight: isHighlighted ? 8 : 4,
          opacity: isHighlighted ? 1 : 0.8,
          className: isHighlighted ? 'highlighted-pipeline' : ''
        });

        polyline.bindPopup(`
          <div style="font-family: system-ui; padding: 4px;">
            <strong>Pipeline ${pipeline.id}</strong><br/>
            <span style="color: #666;">Diameter: ${pipeline.diameter}mm</span><br/>
            <span style="color: #666;">Depth: ${pipeline.depth}m</span><br/>
            <span style="color: ${color};">Status: ${pipeline.status}</span>
          </div>
        `);

        pipelineLayer.addLayer(polyline);
      }
    });

    // Add valves
    const valvePositions: L.LatLngExpression[] = [
      [40.7601, -73.9813], [40.7657, -73.9838], [40.7547, -73.9892],
      [40.7527, -73.9942], [40.752, -73.9825], [40.7465, -73.984]
    ];

    valves.forEach((valve, index) => {
      if (valvePositions[index]) {
        const isHighlighted = highlightedItemType === 'valve' && highlightedItemId === valve.id;
        const color = valve.status === "open" ? "#22c55e" : 
                     valve.status === "closed" ? "#ef4444" : "#f59e0b";

        const marker = L.marker(valvePositions[index], {
          icon: L.divIcon({
            className: `custom-valve-icon ${isHighlighted ? 'highlighted' : ''}`,
            html: `<div style="
              width: ${isHighlighted ? 24 : 16}px; 
              height: ${isHighlighted ? 24 : 16}px; 
              background-color: ${color}; 
              border: ${isHighlighted ? 4 : 2}px solid white; 
              border-radius: 2px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              ${isHighlighted ? 'animation: pulse 2s infinite;' : ''}
            "></div>`,
            iconSize: [isHighlighted ? 24 : 16, isHighlighted ? 24 : 16],
          }),
        });

        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 4px;">
            <strong>Valve ${valve.id}</strong><br/>
            <span style="color: #666;">Type: ${valve.type}</span><br/>
            <span style="color: ${color};">Status: ${valve.status}</span><br/>
            <span style="color: #666;">Pipeline: ${valve.segmentId}</span>
          </div>
        `);

        valveLayer.addLayer(marker);
      }
    });

    // Add catastrophes
    catastrophes.forEach((catastrophe, index) => {
      const isHighlighted = highlightedItemType === 'catastrophe' && highlightedItemId === catastrophe.id;
      const pos: L.LatLngExpression = [
        catastrophe.location?.lat || (40.7589 + (index * 0.01)), 
        catastrophe.location?.lng || (-73.9851 + (index * 0.01))
      ];

      const marker = L.marker(pos, {
        icon: L.divIcon({
          className: `catastrophe-icon ${isHighlighted ? 'highlighted' : ''}`,
          html: `<div style="
            width: ${isHighlighted ? 32 : 24}px; 
            height: ${isHighlighted ? 32 : 24}px; 
            background-color: #ef4444; 
            border: ${isHighlighted ? 4 : 2}px solid white; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${isHighlighted ? 16 : 12}px;
            ${isHighlighted ? 'animation: pulse 2s infinite;' : ''}
          ">!</div>`,
          iconSize: [isHighlighted ? 32 : 24, isHighlighted ? 32 : 24],
        }),
      });

      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong>Catastrophe ${catastrophe.id}</strong><br/>
          <span style="color: #666;">Type: ${catastrophe.type}</span><br/>
          <span style="color: #666;">Description: ${catastrophe.description}</span><br/>
          <span style="color: #666;">Reported: ${new Date(catastrophe.reportedDate).toLocaleDateString()}</span>
        </div>
      `);

      catastropheLayer.addLayer(marker);
    });

  }, [devices, pipelines, valves, catastrophes, highlightedItemId, highlightedItemType]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[600px] rounded-lg" />
      <div className="absolute top-2 left-2 z-[10002] bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
          <span>Pipeline & Valve data sourced from Trimble equipment (read-only)</span>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

type PipelineOperationsProps = {
  titleOverride?: string;
  defaultTab?: "pipelines" | "valves" | "catastrophes" | "operations";
};

export const PipelineOperations = ({ titleOverride, defaultTab = "pipelines" }: PipelineOperationsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [highlightedItemId, setHighlightedItemId] = useState<string | undefined>();
  const [highlightedItemType, setHighlightedItemType] = useState<'pipeline' | 'valve' | 'catastrophe' | 'operation' | undefined>();

  // API hooks
  const { data: pipelinesResponse, isLoading: loadingPipelines, refetch: refetchPipelines } = usePipelines({ limit: 100 });
  const { data: valvesResponse, isLoading: loadingValves, refetch: refetchValves } = useValves({ limit: 100 });
  const { data: catastrophesResponse, isLoading: loadingCatastrophes, refetch: refetchCatastrophes } = useCatastrophes({ limit: 100 });
  const { data: valveOperationsResponse, isLoading: loadingOperations, refetch: refetchOperations } = useValveOperations({ limit: 100 });
  const { data: devicesResponse, isLoading: loadingDevices } = useDevices({ limit: 50 });

  // Transform data for components
  const mapDevices = useMemo(() => {
    if (!Array.isArray(devicesResponse?.data)) return [];
    return devicesResponse.data.map((device) => ({
      id: device.id,
      name: device.name,
      lat: device.coordinates.lat,
      lng: device.coordinates.lng,
      status: device.status === "ACTIVE" ? "active" : "offline",
      lastPing: device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Unknown",
    }));
  }, [devicesResponse]);

  const mapPipelines = useMemo(() => {
    if (!Array.isArray(pipelinesResponse?.data)) return [];
    return pipelinesResponse.data.map((pipeline) => ({
      id: pipeline.id,
      diameter: pipeline.specifications?.diameter?.value || 200,
      depth: pipeline.installation?.depth?.value || 1.5,
      status: pipeline.status === "OPERATIONAL" ? "normal" :
              pipeline.status === "MAINTENANCE" ? "warning" : "critical",
    }));
  }, [pipelinesResponse]);

  const mapValves = useMemo(() => {
    if (!Array.isArray(valvesResponse?.data)) return [];
    return valvesResponse.data.map((valve) => ({
      id: valve.id,
      type: valve.type === "GATE" ? "control" : valve.type === "RELIEF" ? "emergency" : "isolation",
      status: valve.status === "OPEN" ? "open" : valve.status === "CLOSED" ? "closed" : "maintenance",
      segmentId: valve.pipelineId || "Unknown",
    }));
  }, [valvesResponse]);

  const catastrophes = useMemo(() => {
    if (!Array.isArray(catastrophesResponse?.data)) return [];
    return catastrophesResponse.data.map((cat) => ({
      id: cat.id,
      segmentId: cat.pipelineId || "Unknown",
      type: cat.type.toLowerCase().replace("_", "-"),
      description: cat.description || "No description provided",
      location: {
        lat: cat.coordinates.lat,
        lng: cat.coordinates.lng,
      },
      reportedDate: new Date(cat.reportedAt),
    }));
  }, [catastrophesResponse]);

  const valveOperations = useMemo(() => {
    if (!Array.isArray(valveOperationsResponse?.data)) return [];
    return valveOperationsResponse.data.map((op) => ({
      id: op.id,
      valveId: op.valveId,
      catastropheId: op.catastropheId || "N/A",
      actionType: op.operation === "OPEN" ? "open" : "close",
      actionTimestamp: new Date(op.timestamp),
      performedBy: op.performedBy || "System",
      remarks: op.notes || "",
    }));
  }, [valveOperationsResponse]);

  // Table configurations
  const pipelineTable = useTable(Array.isArray(pipelinesResponse?.data) ? pipelinesResponse.data : [], 10, "id");
  const valveTable = useTable(Array.isArray(valvesResponse?.data) ? valvesResponse.data : [], 10, "id");
  const catastropheTable = useTable(catastrophes, 10, "id");
  const operationTable = useTable(valveOperations, 10, "id");

  const handleRefreshAll = () => {
    refetchPipelines();
    refetchValves();
    refetchCatastrophes();
    refetchOperations();
    toast.success("All data refreshed");
  };

  const handleRowHover = (itemId: string, itemType: 'pipeline' | 'valve' | 'catastrophe' | 'operation') => {
    setHighlightedItemId(itemId);
    setHighlightedItemType(itemType);
  };

  const handleRowLeave = () => {
    setHighlightedItemId(undefined);
    setHighlightedItemType(undefined);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      OPERATIONAL: { label: "Operational", variant: "default" as const },
      MAINTENANCE: { label: "Maintenance", variant: "secondary" as const },
      DAMAGED: { label: "Damaged", variant: "destructive" as const },
      INACTIVE: { label: "Inactive", variant: "outline" as const },
      OPEN: { label: "Open", variant: "default" as const },
      CLOSED: { label: "Closed", variant: "destructive" as const },
      PARTIALLY_OPEN: { label: "Partially Open", variant: "secondary" as const },
      FAULT: { label: "Fault", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const isLoading = loadingPipelines || loadingValves || loadingCatastrophes || loadingOperations || loadingDevices;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{titleOverride ?? "Pipeline Operations Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Button onClick={handleRefreshAll} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Loading..." : "Refresh All"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Segments</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelinesResponse?.data?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valve Points</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valvesResponse?.data?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Catastrophes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{catastrophes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valve Operations</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valveOperations.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Integrated Pipeline Operations Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedMap
              devices={mapDevices}
              pipelines={mapPipelines}
              valves={mapValves}
              catastrophes={catastrophes}
              valveOperations={valveOperations}
              highlightedItemId={highlightedItemId}
              highlightedItemType={highlightedItemType}
            />
          </CardContent>
        </Card>

        {/* Tabbed Data */}
        <Card>
          <CardHeader>
            <CardTitle>Operations Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
                <TabsTrigger value="valves">Valves</TabsTrigger>
                <TabsTrigger value="catastrophes">Catastrophes</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
              </TabsList>

              <TabsContent value="pipelines" className="mt-4">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          sortKey="name"
                          currentSortKey={pipelineTable.tableConfig.sortConfig.key as string}
                          sortDirection={pipelineTable.tableConfig.sortConfig.direction}
                          onSort={pipelineTable.tableConfig.handleSort}
                        >
                          Name
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="status"
                          currentSortKey={pipelineTable.tableConfig.sortConfig.key as string}
                          sortDirection={pipelineTable.tableConfig.sortConfig.direction}
                          onSort={pipelineTable.tableConfig.handleSort}
                        >
                          Status
                        </SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pipelineTable.sortedAndPaginatedData.map((pipeline) => (
                        <TableRow 
                          key={pipeline.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onMouseEnter={() => handleRowHover(pipeline.id, 'pipeline')}
                          onMouseLeave={handleRowLeave}
                        >
                          <TableCell className="font-medium">{pipeline.name}</TableCell>
                          <TableCell>{getStatusBadge(pipeline.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination
                    config={pipelineTable.tableConfig.paginationConfig}
                    onPageChange={pipelineTable.tableConfig.setCurrentPage}
                    onPageSizeChange={pipelineTable.tableConfig.setPageSize}
                    onFirstPage={pipelineTable.tableConfig.goToFirstPage}
                    onLastPage={pipelineTable.tableConfig.goToLastPage}
                    onNextPage={pipelineTable.tableConfig.goToNextPage}
                    onPreviousPage={pipelineTable.tableConfig.goToPreviousPage}
                    canGoNext={pipelineTable.tableConfig.canGoNext}
                    canGoPrevious={pipelineTable.tableConfig.canGoPrevious}
                    pageSizeOptions={[5, 10, 20]}
                  />
                </div>
              </TabsContent>

              <TabsContent value="valves" className="mt-4">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          sortKey="id"
                          currentSortKey={valveTable.tableConfig.sortConfig.key as string}
                          sortDirection={valveTable.tableConfig.sortConfig.direction}
                          onSort={valveTable.tableConfig.handleSort}
                        >
                          ID
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="status"
                          currentSortKey={valveTable.tableConfig.sortConfig.key as string}
                          sortDirection={valveTable.tableConfig.sortConfig.direction}
                          onSort={valveTable.tableConfig.handleSort}
                        >
                          Status
                        </SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valveTable.sortedAndPaginatedData.map((valve) => (
                        <TableRow 
                          key={valve.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onMouseEnter={() => handleRowHover(valve.id, 'valve')}
                          onMouseLeave={handleRowLeave}
                        >
                          <TableCell className="font-medium">{valve.id}</TableCell>
                          <TableCell>{getStatusBadge(valve.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination
                    config={valveTable.tableConfig.paginationConfig}
                    onPageChange={valveTable.tableConfig.setCurrentPage}
                    onPageSizeChange={valveTable.tableConfig.setPageSize}
                    onFirstPage={valveTable.tableConfig.goToFirstPage}
                    onLastPage={valveTable.tableConfig.goToLastPage}
                    onNextPage={valveTable.tableConfig.goToNextPage}
                    onPreviousPage={valveTable.tableConfig.goToPreviousPage}
                    canGoNext={valveTable.tableConfig.canGoNext}
                    canGoPrevious={valveTable.tableConfig.canGoPrevious}
                    pageSizeOptions={[5, 10, 20]}
                  />
                </div>
              </TabsContent>

              <TabsContent value="catastrophes" className="mt-4">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          sortKey="id"
                          currentSortKey={catastropheTable.tableConfig.sortConfig.key as string}
                          sortDirection={catastropheTable.tableConfig.sortConfig.direction}
                          onSort={catastropheTable.tableConfig.handleSort}
                        >
                          ID
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="type"
                          currentSortKey={catastropheTable.tableConfig.sortConfig.key as string}
                          sortDirection={catastropheTable.tableConfig.sortConfig.direction}
                          onSort={catastropheTable.tableConfig.handleSort}
                        >
                          Type
                        </SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catastropheTable.sortedAndPaginatedData.map((catastrophe) => (
                        <TableRow 
                          key={catastrophe.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onMouseEnter={() => handleRowHover(catastrophe.id, 'catastrophe')}
                          onMouseLeave={handleRowLeave}
                        >
                          <TableCell className="font-medium">{catastrophe.id}</TableCell>
                          <TableCell className="capitalize">{catastrophe.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination
                    config={catastropheTable.tableConfig.paginationConfig}
                    onPageChange={catastropheTable.tableConfig.setCurrentPage}
                    onPageSizeChange={catastropheTable.tableConfig.setPageSize}
                    onFirstPage={catastropheTable.tableConfig.goToFirstPage}
                    onLastPage={catastropheTable.tableConfig.goToLastPage}
                    onNextPage={catastropheTable.tableConfig.goToNextPage}
                    onPreviousPage={catastropheTable.tableConfig.goToPreviousPage}
                    canGoNext={catastropheTable.tableConfig.canGoNext}
                    canGoPrevious={catastropheTable.tableConfig.canGoPrevious}
                    pageSizeOptions={[5, 10, 20]}
                  />
                </div>
              </TabsContent>

              <TabsContent value="operations" className="mt-4">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          sortKey="id"
                          currentSortKey={operationTable.tableConfig.sortConfig.key as string}
                          sortDirection={operationTable.tableConfig.sortConfig.direction}
                          onSort={operationTable.tableConfig.handleSort}
                        >
                          ID
                        </SortableTableHead>
                        <SortableTableHead
                          sortKey="actionType"
                          currentSortKey={operationTable.tableConfig.sortConfig.key as string}
                          sortDirection={operationTable.tableConfig.sortConfig.direction}
                          onSort={operationTable.tableConfig.handleSort}
                        >
                          Action
                        </SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operationTable.sortedAndPaginatedData.map((operation) => (
                        <TableRow 
                          key={operation.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onMouseEnter={() => handleRowHover(operation.valveId, 'valve')}
                          onMouseLeave={handleRowLeave}
                        >
                          <TableCell className="font-medium">{operation.id}</TableCell>
                          <TableCell>
                            <Badge variant={operation.actionType === "open" ? "default" : "destructive"} className="capitalize">
                              {operation.actionType}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination
                    config={operationTable.tableConfig.paginationConfig}
                    onPageChange={operationTable.tableConfig.setCurrentPage}
                    onPageSizeChange={operationTable.tableConfig.setPageSize}
                    onFirstPage={operationTable.tableConfig.goToFirstPage}
                    onLastPage={operationTable.tableConfig.goToLastPage}
                    onNextPage={operationTable.tableConfig.goToNextPage}
                    onPreviousPage={operationTable.tableConfig.goToPreviousPage}
                    canGoNext={operationTable.tableConfig.canGoNext}
                    canGoPrevious={operationTable.tableConfig.canGoPrevious}
                    pageSizeOptions={[5, 10, 20]}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PipelineOperations;
