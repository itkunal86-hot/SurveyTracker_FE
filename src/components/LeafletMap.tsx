import { useEffect, useMemo, useRef, useState } from "react";
import L, { type LatLngBounds, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [22.5744, 88.3629];
const DEFAULT_ZOOM = 13;

const DEFAULT_PIPELINE_ROUTES: [number, number][][] = [
  [
    [40.7589, -73.9851],
    [40.7614, -73.9776],
  ],
  [
    [40.7614, -73.9776],
    [40.77, -73.99],
  ],
  [
    [40.7589, -73.9851],
    [40.7505, -73.9934],
  ],
  [
    [40.7505, -73.9934],
    [40.755, -73.995],
  ],
  [
    [40.7589, -73.9851],
    [40.745, -73.98],
  ],
  [
    [40.745, -73.98],
    [40.748, -73.988],
  ],
  [
    [40.77, -73.99],
    [40.763, -73.982],
  ],
  [
    [40.763, -73.982],
    [40.7614, -73.9776],
  ],
  [
    [40.755, -73.995],
    [40.7505, -73.9934],
  ],
  [
    [40.748, -73.988],
    [40.745, -73.98],
  ],
  [
    [40.7614, -73.9776],
    [40.7589, -73.9851],
  ],
  [
    [40.77, -73.99],
    [40.7589, -73.9851],
  ],
];

const DEFAULT_VALVE_POSITIONS: [number, number][] = [
  [40.7601, -73.9813],
  [40.7657, -73.9838],
  [40.7547, -73.9892],
  [40.7527, -73.9942],
  [40.752, -73.9825],
  [40.7465, -73.984],
  [40.7665, -73.986],
  [40.7622, -73.9798],
  [40.7528, -73.9942],
  [40.7465, -73.984],
  [40.7601, -73.9813],
  [40.7645, -73.9875],
];

const isFiniteCoordinate = (lat: number | undefined, lng: number | undefined) =>
  Number.isFinite(lat) && Number.isFinite(lng);

const sanitizeCoordinate = (
  coordinate?: { lat: number; lng: number },
): [number, number] | null => {
  if (!coordinate) return null;
  const { lat, lng } = coordinate;
  return isFiniteCoordinate(lat, lng) ? [lat, lng] : null;
};

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

interface CatastrophePoint {
  id: string;
  name?: string;
  severity?: string;
  status?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
}

interface LeafletMapProps {
  devices: DeviceLocation[];
  pipelines: PipelineSegment[];
  valves: ValvePoint[];
  showDevices: boolean;
  showPipelines: boolean;
  showValves: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  disableAutoFit?: boolean;
  catastrophes?: CatastrophePoint[];
  showCatastrophes?: boolean;
}

const getPipelineColor = (status: PipelineSegment["status"]) => {
  switch (status) {
    case "normal":
      return "#3b82f6";
    case "warning":
      return "#f59e0b";
    case "maintenance":
      return "#6366f1";
    case "critical":
    default:
      return "#ef4444";
  }
};

export const LeafletMap = ({
  devices,
  pipelines,
  valves,
  showDevices,
  showPipelines,
  showValves,
  onMapClick,
  selectedLocation,
  disableAutoFit,
  catastrophes = [],
  showCatastrophes = false,
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null);
  const [pipelinesLayer, setPipelinesLayer] = useState<L.LayerGroup | null>(null);
  const [valvesLayer, setValvesLayer] = useState<L.LayerGroup | null>(null);
  const [catastrophesLayer, setCatastrophesLayer] = useState<L.LayerGroup | null>(null);
  const [selectionLayer, setSelectionLayer] = useState<L.LayerGroup | null>(null);
  const lastBoundsRef = useRef<LatLngBounds | null>(null);
  const lastCenterRef = useRef<{ lat: number; lng: number; zoom: number } | null>(
    null,
  );
  const userInteractedRef = useRef(false);
  const onMapClickRef = useRef<typeof onMapClick | undefined>(onMapClick);

  const devicePositions = useMemo<[number, number][]>(() => {
    return devices
      .map((device) => sanitizeCoordinate({ lat: device.lat, lng: device.lng }))
      .filter((coord): coord is [number, number] => coord !== null);
  }, [devices]);

  const pipelineRoutes = useMemo<[number, number][][]>(() => {
    return pipelines.map((pipeline, index) => {
      const derived = (pipeline.coordinates ?? [])
        .map((point) => sanitizeCoordinate(point))
        .filter((coord): coord is [number, number] => coord !== null);

      if (derived.length >= 2) {
        return derived;
      }

      const fallback = DEFAULT_PIPELINE_ROUTES[index];
      return fallback ? [...fallback] : [];
    });
  }, [pipelines]);

  const valvePositions = useMemo<( [number, number] | null )[]>(() => {
    return valves.map((valve, index) => {
      const derived = sanitizeCoordinate(valve.coordinates);
      if (derived) return derived;
      const fallback = DEFAULT_VALVE_POSITIONS[index];
      return fallback ? [...fallback] : null;
    });
  }, [valves]);

  const catastrophePositions = useMemo<[number, number][]>(() => {
    return (catastrophes || [])
      .map((c) => sanitizeCoordinate(c.coordinates))
      .filter((coord): coord is [number, number] => coord !== null);
  }, [catastrophes]);

  const getCatastropheColor = (severity?: string) => {
    const s = String(severity || "").toLowerCase();
    if (s.includes("critical")) return "#991b1b";
    if (s.includes("high") || s.includes("major")) return "#ef4444";
    if (s.includes("medium") || s.includes("moderate")) return "#f59e0b";
    if (s.includes("low") || s.includes("minor")) return "#22c55e";
    return "#a855f7";
  };

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    mapInstanceRef.current = map;

    const deviceLayer = L.layerGroup().addTo(map);
    const pipelineLayer = L.layerGroup().addTo(map);
    const valveLayer = L.layerGroup().addTo(map);
    const catastropheLayer = L.layerGroup().addTo(map);
    const selectionLayerGroup = L.layerGroup().addTo(map);

    setMarkersLayer(deviceLayer);
    setPipelinesLayer(pipelineLayer);
    setValvesLayer(valveLayer);
    setCatastrophesLayer(catastropheLayer);
    setSelectionLayer(selectionLayerGroup);

    map.on("click", (e: L.LeafletMouseEvent) => {
      userInteractedRef.current = true;
      const handler = onMapClickRef.current;
      if (handler) handler(e.latlng.lat, e.latlng.lng);
    });
    map.on("movestart", () => {
      userInteractedRef.current = true;
    });
    map.on("zoomstart", () => {
      userInteractedRef.current = true;
    });
    map.on("dragstart", () => {
      userInteractedRef.current = true;
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersLayer) return;

    markersLayer.clearLayers();

    if (showDevices) {
      devices.forEach((device) => {
        if (!isFiniteCoordinate(device.lat, device.lng)) return;
        const color =
          device.status === "active"
            ? "#22c55e"
            : device.status === "maintenance"
              ? "#f59e0b"
              : device.status === "error"
                ? "#ef4444"
                : "#9ca3af";

        const marker = L.circleMarker([device.lat, device.lng], {
          radius: 8,
          fillColor: color,
          color: "white",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.bindPopup(
          `
          <div style="font-family: system-ui; padding: 4px; min-width: 180px;">
            <strong>${device.name}</strong><br/>
            <span style="color: #666;">ID: ${device.id}</span><br/>
            <span style="color: ${color};">Status: ${device.status}</span><br/>
            <span style="color: #666;">Last ping: ${device.lastPing}</span>
          </div>
        `,
        );

        markersLayer.addLayer(marker);
      });
    }
  }, [devices, showDevices, markersLayer]);

  useEffect(() => {
    if (!catastrophesLayer) return;
    catastrophesLayer.clearLayers();

    if (showCatastrophes) {
      (catastrophes || []).forEach((c) => {
        const coord = sanitizeCoordinate(c.coordinates);
        if (!coord) return;
        const color = getCatastropheColor(c.severity);
        const marker = L.circleMarker(coord, {
          radius: 6,
          fillColor: color,
          color: "white",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });
        marker.bindPopup(`
          <div style="font-family: system-ui; padding: 4px; min-width: 180px;">
            <strong>${c.name ?? `Catastrophe ${c.id}`}</strong><br/>
            <span style="color: ${color};">Severity: ${c.severity ?? "Unknown"}</span><br/>
            <span style="color: #666;">Status: ${c.status ?? "REPORTED"}</span>
          </div>
        `);
        catastrophesLayer.addLayer(marker);
      });
    }
  }, [catastrophes, showCatastrophes, catastrophesLayer]);

  useEffect(() => {
    if (!pipelinesLayer) return;

    pipelinesLayer.clearLayers();

    if (showPipelines) {
      pipelines.forEach((pipeline, index) => {
        const route = pipelineRoutes[index];
        if (!route || route.length < 2) return;

        const color = getPipelineColor(pipeline.status);

        const polyline = L.polyline(route, {
          color,
          weight: 4,
          opacity: 0.85,
        });

        polyline.bindPopup(
          `
          <div style="font-family: system-ui; padding: 4px; min-width: 200px;">
            <strong>${pipeline.name ?? `Pipeline ${pipeline.id}`}</strong><br/>
            <span style="color: #666;">ID: ${pipeline.id}</span><br/>
            <span style="color: #666;">Diameter: ${pipeline.diameter}mm</span><br/>
            <span style="color: #666;">Depth: ${pipeline.depth}m</span><br/>
            <span style="color: ${color};">Status: ${pipeline.status}</span>
          </div>
        `,
        );

        pipelinesLayer.addLayer(polyline);
      });
    }
  }, [pipelines, pipelineRoutes, showPipelines, pipelinesLayer]);

  useEffect(() => {
    if (!valvesLayer) return;

    valvesLayer.clearLayers();

    if (showValves) {
      valves.forEach((valve, index) => {
        const position = valvePositions[index];
        if (!position) return;

        const color =
          valve.status === "open"
            ? "#22c55e"
            : valve.status === "closed"
              ? "#ef4444"
              : valve.status === "maintenance"
                ? "#f59e0b"
                : "#a855f7";

        const marker = L.marker(position, {
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

        marker.bindPopup(
          `
          <div style="font-family: system-ui; padding: 4px; min-width: 180px;">
            <strong>${valve.name ?? `Valve ${valve.id}`}</strong><br/>
            <span style="color: #666;">Type: ${valve.type}</span><br/>
            <span style="color: ${color};">Status: ${valve.status}</span><br/>
            <span style="color: #666;">Pipeline: ${valve.segmentId}</span>
          </div>
        `,
        );

        valvesLayer.addLayer(marker);
      });
    }
  }, [valves, valvePositions, showValves, valvesLayer]);

  useEffect(() => {
    if (!selectionLayer) return;
    selectionLayer.clearLayers();
    if (
      selectedLocation &&
      Number.isFinite(selectedLocation.lat) &&
      Number.isFinite(selectedLocation.lng)
    ) {
      const marker = L.circleMarker([selectedLocation.lat, selectedLocation.lng], {
        radius: 6,
        fillColor: "#0ea5e9",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });
      selectionLayer.addLayer(marker);
    }
  }, [selectedLocation, selectionLayer]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (disableAutoFit || selectedLocation || userInteractedRef.current) {
      return;
    }

    const points: [number, number][] = [];

    if (showDevices) {
      devicePositions.forEach((coord) => points.push(coord));
    }

    if (showPipelines) {
      pipelineRoutes.forEach((route) => {
        route.forEach((coord) => points.push(coord));
      });
    }

    if (showValves) {
      valvePositions.forEach((coord) => {
        if (coord) {
          points.push(coord);
        }
      });
    }

    if (showCatastrophes) {
      catastrophePositions.forEach((coord) => points.push(coord));
    }

    if (points.length === 0) {
      return;
    }

    const latLngs = points.map(([lat, lng]) => L.latLng(lat, lng));
    const bounds = L.latLngBounds(latLngs);

    if (!bounds.isValid()) return;

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();
    const samePoint = northEast.equals(southWest);

    if (samePoint) {
      const zoom = 15;
      const lastCenter = lastCenterRef.current;
      if (
        !lastCenter ||
        Math.abs(lastCenter.lat - northEast.lat) > 1e-6 ||
        Math.abs(lastCenter.lng - northEast.lng) > 1e-6 ||
        lastCenter.zoom !== zoom
      ) {
        map.setView(northEast, zoom);
        lastCenterRef.current = { lat: northEast.lat, lng: northEast.lng, zoom };
      }
      lastBoundsRef.current = null;
      return;
    }

    if (lastBoundsRef.current && lastBoundsRef.current.equals(bounds)) {
      return;
    }

    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
    lastBoundsRef.current = bounds;
    lastCenterRef.current = null;
  }, [devicePositions, pipelineRoutes, valvePositions, catastrophePositions, showDevices, showPipelines, showValves, showCatastrophes, disableAutoFit, selectedLocation]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-lg leaflet-container" />
      {(showPipelines || showValves || showCatastrophes) && (
        <div className="absolute top-2 left-2 z-[10002] bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            <span>
              Pipeline, Valve & Catastrophe markers (read-only)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
