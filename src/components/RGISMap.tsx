import { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import "@arcgis/core/assets/esri/themes/light/main.css";

const DEFAULT_CENTER: [number, number] = [91.7362, 26.1445]; // longitude, latitude
const DEFAULT_ZOOM = 13;

const DEFAULT_PIPELINE_ROUTES: [number, number][][] = [
  [
    [-73.9851, 40.7589],
    [-73.9776, 40.7614],
  ],
  [
    [-73.9776, 40.7614],
    [-73.99, 40.77],
  ],
  [
    [-73.9851, 40.7589],
    [-73.9934, 40.7505],
  ],
  [
    [-73.9934, 40.7505],
    [-73.995, 40.755],
  ],
  [
    [-73.9851, 40.7589],
    [-73.98, 40.745],
  ],
  [
    [-73.98, 40.745],
    [-73.988, 40.748],
  ],
  [
    [-73.99, 40.77],
    [-73.982, 40.763],
  ],
  [
    [-73.982, 40.763],
    [-73.9776, 40.7614],
  ],
  [
    [-73.995, 40.755],
    [-73.9934, 40.7505],
  ],
  [
    [-73.988, 40.748],
    [-73.98, 40.745],
  ],
  [
    [-73.9776, 40.7614],
    [-73.9851, 40.7589],
  ],
  [
    [-73.99, 40.77],
    [-73.9851, 40.7589],
  ],
];

const DEFAULT_VALVE_POSITIONS: [number, number][] = [
  [-73.9813, 40.7601],
  [-73.9838, 40.7657],
  [-73.9892, 40.7547],
  [-73.9942, 40.7527],
  [-73.9825, 40.752],
  [-73.984, 40.7465],
  [-73.986, 40.7665],
  [-73.9798, 40.7622],
  [-73.9942, 40.7528],
  [-73.984, 40.7465],
  [-73.9813, 40.7601],
  [-73.9875, 40.7645],
];

interface DeviceLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "active" | "offline" | "maintenance" | "error";
  lastPing: string;
}

interface PipelineSegment {
  id: string;
  name?: string;
  diameter: number;
  depth: number;
  status: "normal" | "warning" | "critical" | "maintenance";
  coordinates?: Array<{ lat: number; lng: number }>;
}

interface ValvePoint {
  id: string;
  name?: string;
  type: "control" | "emergency" | "isolation" | "station";
  status: "open" | "closed" | "maintenance" | "fault";
  segmentId: string;
  coordinates?: { lat: number; lng: number };
}

interface RGISMapProps {
  devices: DeviceLocation[];
  pipelines: PipelineSegment[];
  valves: ValvePoint[];
  showDevices: boolean;
  showPipelines: boolean;
  showValves: boolean;
}

export const RGISMap = ({
  devices,
  pipelines,
  valves,
  showDevices,
  showPipelines,
  showValves,
}: RGISMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      basemap: "streets-vector",
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    viewRef.current = view;

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    const map = view.map;

    // Remove existing graphics layers
    map.layers.removeAll();

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    const allPoints: Point[] = [];

    if (showDevices) {
      devices.forEach((device) => {
        const pt = new Point({
          longitude: device.lng,
          latitude: device.lat,
        });
        allPoints.push(pt);

        const color =
          device.status === "active"
            ? [34, 197, 94]
            : device.status === "maintenance"
            ? [245, 158, 11]
            : device.status === "error"
            ? [239, 68, 68]
            : [156, 163, 175];

        const markerSymbol = {
          type: "simple-marker",
          color: color,
          outline: {
            color: [255, 255, 255],
            width: 2,
          },
        };

        const graphic = new Graphic({
          geometry: pt,
          symbol: markerSymbol as any,
          attributes: device,
          popupTemplate: {
            title: "{name}",
            content: "ID: {id}<br>Status: {status}<br>Last Ping: {lastPing}",
          },
        });

        graphicsLayer.add(graphic);
      });
    }

    if (showPipelines) {
      pipelines.forEach((pipeline, index) => {
        let coords = pipeline.coordinates?.map((c) => [c.lng, c.lat]);
        if (!coords || coords.length < 2) {
          coords = DEFAULT_PIPELINE_ROUTES[index];
        }
        if (!coords || coords.length < 2) return;

        coords.forEach((c) => {
            allPoints.push(new Point({ longitude: c[0], latitude: c[1] }));
        });

        const polyline = new Polyline({
          paths: [coords] as any,
        });

        const color =
          pipeline.status === "normal"
            ? [59, 130, 246]
            : pipeline.status === "warning"
            ? [245, 158, 11]
            : [239, 68, 68];

        const lineSymbol = {
          type: "simple-line",
          color: color,
          width: 4,
        };

        const graphic = new Graphic({
          geometry: polyline,
          symbol: lineSymbol as any,
          attributes: pipeline,
          popupTemplate: {
            title: pipeline.name ?? `Pipeline ${pipeline.id}`,
            content: "ID: {id}<br>Diameter: {diameter}mm<br>Depth: {depth}m",
          },
        });

        graphicsLayer.add(graphic);
      });
    }

    if (showValves) {
      valves.forEach((valve, index) => {
        let lon = valve.coordinates?.lng;
        let lat = valve.coordinates?.lat;

        if (lon === undefined || lat === undefined) {
          const fallback = DEFAULT_VALVE_POSITIONS[index];
          if (fallback) {
            [lon, lat] = fallback;
          }
        }

        if (lon === undefined || lat === undefined) return;

        const pt = new Point({
          longitude: lon,
          latitude: lat,
        });
        allPoints.push(pt);

        const color =
          valve.status === "open"
            ? [34, 197, 94]
            : valve.status === "closed"
            ? [239, 68, 68]
            : [245, 158, 11];

        const markerSymbol = {
          type: "simple-marker",
          style: "square",
          color: color,
          size: "12px",
          outline: {
            color: [255, 255, 255],
            width: 2,
          },
        };

        const graphic = new Graphic({
          geometry: pt,
          symbol: markerSymbol as any,
          attributes: valve,
          popupTemplate: {
            title: valve.name ?? `Valve ${valve.id}`,
            content: "Type: {type}<br>Status: {status}<br>Segment: {segmentId}",
          },
        });

        graphicsLayer.add(graphic);
      });
    }

    // Zoom to fit all graphics
    if (allPoints.length > 0) {
        view.when(() => {
            view.goTo(graphicsLayer.graphics);
        });
    }

  }, [devices, pipelines, valves, showDevices, showPipelines, showValves]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <div className="absolute top-2 left-2 z-[10] bg-background/90 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>RGIS Map View (ArcGIS)</span>
        </div>
      </div>
    </div>
  );
};
