import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

interface LeafletMapProps {
  devices: DeviceLocation[];
  pipelines: PipelineSegment[];
  valves: ValvePoint[];
  showDevices: boolean;
  showPipelines: boolean;
  showValves: boolean;
}

export const LeafletMap = ({
  devices,
  pipelines,
  valves,
  showDevices,
  showPipelines,
  showValves,
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null);
  const [pipelinesLayer, setPipelinesLayer] = useState<L.LayerGroup | null>(
    null,
  );
  const [valvesLayer, setValvesLayer] = useState<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([40.7589, -73.9851], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create layer groups
    const deviceLayer = L.layerGroup().addTo(map);
    const pipelineLayer = L.layerGroup().addTo(map);
    const valveLayer = L.layerGroup().addTo(map);

    setMarkersLayer(deviceLayer);
    setPipelinesLayer(pipelineLayer);
    setValvesLayer(valveLayer);

    return () => {
      map.remove();
    };
  }, []);

  // Update device markers
  useEffect(() => {
    if (!markersLayer) return;

    markersLayer.clearLayers();

    if (showDevices) {
      devices.forEach((device) => {
        const color = device.status === "active" ? "green" : "red";
        const marker = L.circleMarker([device.lat, device.lng], {
          radius: 8,
          fillColor: color,
          color: "white",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 4px;">
            <strong>${device.name}</strong><br/>
            <span style="color: #666;">ID: ${device.id}</span><br/>
            <span style="color: ${color};">Status: ${device.status}</span><br/>
            <span style="color: #666;">Last ping: ${device.lastPing}</span>
          </div>
        `);

        markersLayer.addLayer(marker);
      });
    }
  }, [devices, showDevices, markersLayer]);

  // Update pipeline segments
  useEffect(() => {
    if (!pipelinesLayer) return;

    pipelinesLayer.clearLayers();

    if (showPipelines) {
      // Create demo pipeline routes for expanded network
      const pipelineRoutes: L.LatLngExpression[][] = [
        [
          [40.7589, -73.9851],
          [40.7614, -73.9776],
        ], // PS-001: Central to East
        [
          [40.7614, -73.9776],
          [40.77, -73.99],
        ], // PS-002: East to North
        [
          [40.7589, -73.9851],
          [40.7505, -73.9934],
        ], // PS-003: Central to West
        [
          [40.7505, -73.9934],
          [40.755, -73.995],
        ], // PS-004: West to Emergency
        [
          [40.7589, -73.9851],
          [40.745, -73.98],
        ], // PS-005: Central to South
        [
          [40.745, -73.98],
          [40.748, -73.988],
        ], // PS-006: South to Flow Control
        [
          [40.77, -73.99],
          [40.763, -73.982],
        ], // PS-007: North to Pressure
        [
          [40.763, -73.982],
          [40.7614, -73.9776],
        ], // PS-008: Pressure to East
        [
          [40.755, -73.995],
          [40.7505, -73.9934],
        ], // PS-009: Emergency to West
        [
          [40.748, -73.988],
          [40.745, -73.98],
        ], // PS-010: Flow Control to South
        [
          [40.7614, -73.9776],
          [40.7589, -73.9851],
        ], // PS-011: East to Central (return)
        [
          [40.77, -73.99],
          [40.7589, -73.9851],
        ], // PS-012: North to Central (return)
      ];

      pipelines.forEach((pipeline, index) => {
        if (pipelineRoutes[index]) {
          const color =
            pipeline.status === "normal"
              ? "#3b82f6"
              : pipeline.status === "warning"
                ? "#f59e0b"
                : "#ef4444";

          const polyline = L.polyline(pipelineRoutes[index], {
            color: color,
            weight: 4,
            opacity: 0.8,
          });

          polyline.bindPopup(`
            <div style="font-family: system-ui; padding: 4px;">
              <strong>Pipeline ${pipeline.id}</strong><br/>
              <span style="color: #666;">Diameter: ${pipeline.diameter}mm</span><br/>
              <span style="color: #666;">Depth: ${pipeline.depth}m</span><br/>
              <span style="color: ${color};">Status: ${pipeline.status}</span>
            </div>
          `);

          pipelinesLayer.addLayer(polyline);
        }
      });
    }
  }, [pipelines, showPipelines, pipelinesLayer]);

  // Update valve points
  useEffect(() => {
    if (!valvesLayer) return;

    valvesLayer.clearLayers();

    if (showValves) {
      // Place valves at strategic points along the pipeline network
      const valvePositions: L.LatLngExpression[] = [
        [40.7601, -73.9813], // VLV-001: Central-East midpoint
        [40.7657, -73.9838], // VLV-002: East-North midpoint
        [40.7547, -73.9892], // VLV-003: Central-West midpoint
        [40.7527, -73.9942], // VLV-004: West-Emergency midpoint
        [40.752, -73.9825], // VLV-005: Central-South midpoint
        [40.7465, -73.984], // VLV-006: South-Flow Control midpoint
        [40.7665, -73.986], // VLV-007: North-Pressure midpoint
        [40.7622, -73.9798], // VLV-008: Pressure-East midpoint
        [40.7528, -73.9942], // VLV-009: Emergency-West midpoint
        [40.7465, -73.984], // VLV-010: Flow Control-South midpoint
        [40.7601, -73.9813], // VLV-011: East-Central return midpoint
        [40.7645, -73.9875], // VLV-012: North-Central return midpoint
      ];

      valves.forEach((valve, index) => {
        if (valvePositions[index]) {
          const color =
            valve.status === "open"
              ? "#22c55e"
              : valve.status === "closed"
                ? "#ef4444"
                : "#f59e0b";

          const marker = L.marker(valvePositions[index], {
            icon: L.divIcon({
              className: "custom-valve-icon",
              html: `<div style="
                width: 16px; 
                height: 16px; 
                background-color: ${color}; 
                border: 2px solid white; 
                border-radius: 2px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [16, 16],
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

          valvesLayer.addLayer(marker);
        }
      });
    }
  }, [valves, showValves, valvesLayer]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg leaflet-container"
      />
      {(showPipelines || showValves) && (
        <div className="absolute top-2 left-2 z-[10002] bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            <span>
              Pipeline & Valve data sourced from Trimble equipment (read-only)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
