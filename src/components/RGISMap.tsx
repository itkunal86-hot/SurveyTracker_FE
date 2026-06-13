import { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import "@arcgis/core/assets/esri/themes/light/main.css";
import { colorNameToRgb, getSeverityColorRgb, resolveColorRgb } from "@/lib/colorUtils";

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
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}

interface ValvePoint {
  id: string;
  name?: string;
  type: "control" | "emergency" | "isolation" | "station";
  status: "open" | "closed" | "maintenance" | "fault";
  segmentId: string;
  coordinates?: { lat: number; lng: number };
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}
type Consumer = {
  name: string
  code: string
  mobile: string
}
interface ConsumerPoint {
  id: string;
  name?: string;
  code?: string;
  mobile?: string;
  status?: string;
  coordinates: { lat: number; lng: number };
  consumers: Consumer[];
  isActive?: boolean;
  plotColor?: string;
  plotColorInactive?: string;
  plotType?: "line" | "round" | "square";
}

interface CatastrophePoint {
  id: string;
  name?: string;
  severity?: string;
  status?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}

interface RGISMapProps {
  devices: DeviceLocation[];
  pipelines: PipelineSegment[];
  valves: ValvePoint[];
  consumers?: ConsumerPoint[];
  catastrophes?: CatastrophePoint[];
  showDevices: boolean;
  showPipelines: boolean;
  showValves: boolean;
  showConsumers: boolean;
  showCatastrophes?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  disableAutoFit?: boolean;
  showSatellite?: boolean;
  highlightedElementId?: string;
  highlightedElementType?: "pipeline" | "valve" | "consumer";
}

export const RGISMap = ({
  devices,
  pipelines,
  valves,
  consumers = [],
  catastrophes = [],
  showDevices,
  showPipelines,
  showValves,
  showConsumers = false,
  showCatastrophes = false,
  onMapClick,
  selectedLocation,
  disableAutoFit = false,
  showSatellite = false,
  highlightedElementId,
  highlightedElementType,
}: RGISMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      basemap: showSatellite ? "satellite" : "streets-vector",
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    viewRef.current = view;

    // Add click handler
    if (onMapClick) {
      view.on("click", (event: any) => {
        const pt = view.toMap({ x: event.x, y: event.y });
        if (pt) {
          onMapClick(pt.latitude, pt.longitude);
        }
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [onMapClick]);

  // Handle satellite view toggle without remounting the map
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.map.basemap = showSatellite ? "satellite" : "streets-vector";
  }, [showSatellite]);

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

        // Use plotColor/plotColorInactive if provided, otherwise fallback to status-based colors
        const color = resolveColorRgb({
          isActive: pipeline.isActive,
          plotColor: pipeline.plotColor,
          plotColorInactive: pipeline.plotColorInactive,
          severity: pipeline.status,
          default: pipeline.status === "normal"
            ? "#3b82f6" // blue
            : pipeline.status === "warning"
            ? "#f59e0b" // amber
            : "#ef4444", // red
        });

        const lineSymbol = {
          type: "simple-line",
          color: color,
          width: 4,
        };

        const graphic = new Graphic({
          geometry: polyline,
          symbol: lineSymbol as any,
          attributes: {
            ...pipeline,
            displayStatus: pipeline.status.toUpperCase(),
            displayActive: pipeline.isActive ? "YES" : "NO",
          },
          popupTemplate: {
            title: pipeline.name ?? `Pipeline ${pipeline.id}`,
            content: `
              <div style="font-family: system-ui; font-size: 12px; line-height: 1.8;">
                <div><strong>ID:</strong> {id}</div>
                <div><strong>Diameter:</strong> {diameter}mm</div>
                <div><strong>Depth:</strong> {depth}m</div>
                <div><strong>Status:</strong> {displayStatus}</div>
                <div><strong>Material:</strong> {material}</div>
                <div><strong>Type:</strong> {type}</div>
                <div><strong>Active:</strong> {displayActive}</div>
              </div>
            `,
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

        // Use plotColor/plotColorInactive if provided, otherwise fallback to status-based colors
        const color = resolveColorRgb({
          isActive: valve.isActive,
          plotColor: valve.plotColor,
          plotColorInactive: valve.plotColorInactive,
          severity: valve.status === "open" ? "low" : valve.status === "closed" ? "high" : "medium",
          default: valve.status === "open"
            ? "#22c55e" // green for open
            : valve.status === "closed"
            ? "#ef4444" // red for closed
            : "#f59e0b", // amber for maintenance
        });

        // Map PLOT_TYPE to RGIS marker style: "line" | "round" | "square"
        const markerStyle = valve.plotType === "round" ? "circle"
                          : valve.plotType === "line" ? "cross"
                          : "square"; // default to square

        const markerSymbol = {
          type: "simple-marker",
          style: markerStyle,
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
          attributes: {
            ...valve,
            displayStatus: valve.status.toUpperCase(),
            displayActive: valve.isActive ? "YES" : "NO",
          },
          popupTemplate: {
            title: valve.name ?? `Valve ${valve.id}`,
            content: `
              <div style="font-family: system-ui; font-size: 12px; line-height: 1.8;">
                <div><strong>ID:</strong> {id}</div>
                <div><strong>Type:</strong> {type}</div>
                <div><strong>Status:</strong> {displayStatus}</div>
                <div><strong>Criticality:</strong> {criticality}</div>
                <div><strong>Segment ID:</strong> {segmentId}</div>
                <div><strong>Active:</strong> {displayActive}</div>
              </div>
            `,
          },
        });

        graphicsLayer.add(graphic);
      });
    }

    // if (showConsumers) {
    //   consumers.forEach((consumer) => {
    //     if (consumer.coordinates.lat === undefined || consumer.coordinates.lng === undefined) return;

    //     const pt = new Point({
    //       longitude: consumer.coordinates.lng,
    //       latitude: consumer.coordinates.lat,
    //     });
    //     allPoints.push(pt);

    //     const markerSymbol = {
    //       type: "simple-marker",
    //       color: [251, 146, 60], // orange-400
    //       outline: {
    //         color: [255, 255, 255],
    //         width: 2,
    //       },
    //     };

    //     const graphic = new Graphic({
    //       geometry: pt,
    //       symbol: markerSymbol as any,
    //       attributes: consumer,
    //       popupTemplate: {
    //         title: consumer.name ?? `Consumer ${consumer.id}`,
    //         content: "Code: {code}<br>Mobile: {mobile}<br>Status: {status}",
    //       },
    //     });

    //     graphicsLayer.add(graphic);
    //   });
    // }

    if (showConsumers) {
  consumers.forEach((consumerPoint) => {
    if (
      consumerPoint.coordinates.lat === undefined ||
      consumerPoint.coordinates.lng === undefined
    ) return;

    const pt = new Point({
      longitude: consumerPoint.coordinates.lng,
      latitude: consumerPoint.coordinates.lat,
    });

    allPoints.push(pt);

    const color = resolveColorRgb({
      isActive: consumerPoint.isActive,
      plotColor: consumerPoint.plotColor,
      plotColorInactive: consumerPoint.plotColorInactive,
      default: "#22c55e", // green for customer
    });

    const markerSymbol = {
      type: "simple-marker",
      color: color,
      outline: {
        color: [255, 255, 255],
        width: 2,
      },
    };

    // Build popup HTML for all consumers
    const consumersHtml = (consumerPoint.consumers || [])
      .map((c: any) => `
        <div style="margin-bottom:6px;">
          <strong>${c.name || "Consumer"}</strong><br/>
          <span style="color:#666;">Code: ${c.code || "N/A"}</span><br/>
          <span style="color:#666;">Mobile: ${c.mobile || "N/A"}</span>
        </div>
      `)
      .join("<hr/>");

    const popupHtml = `
      <div style="font-family: system-ui; min-width:200px;">
        <div style="max-height:220px; overflow:auto;">
          ${consumersHtml}
        </div>
        <br/>
        <span style="color:#666;">Status: ${consumerPoint.status || "N/A"}</span>
        <br/>
        <span style="color:#666;">Active: ${consumerPoint.isActive ? 'Yes' : 'No'}</span>
      </div>
    `;

    const graphic = new Graphic({
      geometry: pt,
      symbol: markerSymbol as any,
      attributes: {
        ...consumerPoint,
        displayActive: consumerPoint.isActive ? "YES" : "NO",
        consumerCount: consumerPoint.consumers?.length || 0,
      },
      popupTemplate: {
        title: consumerPoint.name || "Consumer Point",
        content: `
          <div style="font-family: system-ui; font-size: 12px; line-height: 1.8;">
            <div><strong>ID:</strong> {id}</div>
            <div><strong>Code:</strong> {code}</div>
            <div><strong>Mobile:</strong> {mobile}</div>
            <div><strong>Status:</strong> {status}</div>
            <div><strong>Active:</strong> {displayActive}</div>
            ${consumerPoint.consumers && consumerPoint.consumers.length > 0 ? `
              <hr style="margin: 6px 0; border: none; border-top: 1px solid #eee;"/>
              <div><strong>Associated Consumers ({consumerCount}):</strong></div>
              ${popupHtml}
            ` : ""}
          </div>
        `,
      },
    });

    graphicsLayer.add(graphic);
  });
}

    if (showCatastrophes) {
      (catastrophes || []).forEach((catastrophe) => {
        if (!catastrophe.coordinates?.lat || !catastrophe.coordinates?.lng) return;

        const pt = new Point({
          longitude: catastrophe.coordinates.lng,
          latitude: catastrophe.coordinates.lat,
        });
        allPoints.push(pt);

        // Use plotColor/plotColorInactive if provided, otherwise fallback to severity-based colors
        const color = resolveColorRgb({
          isActive: catastrophe.isActive,
          plotColor: catastrophe.plotColor,
          plotColorInactive: catastrophe.plotColorInactive,
          severity: catastrophe.severity,
        });

        // Map PLOT_TYPE to RGIS marker style: "line" | "round" | "square"
        const markerStyle = catastrophe.plotType === "round" ? "circle"
                          : catastrophe.plotType === "line" ? "cross"
                          : "circle"; // default to circle for catastrophes

        const markerSymbol = {
          type: "simple-marker",
          style: markerStyle,
          color: color,
          size: "10px",
          outline: {
            color: [255, 255, 255],
            width: 1.5,
          },
        };

        const graphic = new Graphic({
          geometry: pt,
          symbol: markerSymbol as any,
          attributes: catastrophe,
          popupTemplate: {
            title: catastrophe.name ?? `Catastrophe ${catastrophe.id}`,
            content: `Severity: {severity}<br>Status: {status}<br>Description: {description}<br>Active: {isActive ? 'Yes' : 'No'}`,
          },
        });

        graphicsLayer.add(graphic);
      });
    }

    // Add selected location marker if present
    if (selectedLocation && Number.isFinite(selectedLocation.lat) && Number.isFinite(selectedLocation.lng)) {
      const pt = new Point({
        longitude: selectedLocation.lng,
        latitude: selectedLocation.lat,
      });

      const markerSymbol = {
        type: "simple-marker",
        color: [14, 165, 233], // cyan-500 (#0ea5e9)
        size: "10px",
        outline: {
          color: [255, 255, 255],
          width: 2,
        },
      };

      const graphic = new Graphic({
        geometry: pt,
        symbol: markerSymbol as any,
        attributes: { name: "Selected Location" },
        popupTemplate: {
          title: "Selected Location",
          content: `Latitude: ${selectedLocation.lat.toFixed(4)}<br>Longitude: ${selectedLocation.lng.toFixed(4)}`,
        },
      });

      graphicsLayer.add(graphic);
      allPoints.push(pt);
    }

    // Zoom to fit all graphics
    if (allPoints.length > 0 && !disableAutoFit && !selectedLocation) {
        view.when(() => {
            view.goTo(graphicsLayer.graphics);
        });
    }

  }, [devices, pipelines, valves, consumers, catastrophes, showDevices, showPipelines, showValves, showConsumers, showCatastrophes, selectedLocation, disableAutoFit]);

  // Handle highlighting of selected elements
  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    const map = view.map;

    // Remove existing highlight layer if present
    const existingHighlight = map.layers.find((layer: any) => layer.title === "highlight-layer");
    if (existingHighlight) {
      map.remove(existingHighlight);
    }

    if (!highlightedElementId || !highlightedElementType) return;

    const highlightLayer = new GraphicsLayer({ title: "highlight-layer" });
    map.add(highlightLayer);

    if (highlightedElementType === "pipeline") {
      const pipeline = pipelines.find((p) => p.id === highlightedElementId);
      if (!pipeline) return;

      const index = pipelines.indexOf(pipeline);
      let coords = pipeline.coordinates?.map((c) => [c.lng, c.lat]);
      if (!coords || coords.length < 2) {
        coords = DEFAULT_PIPELINE_ROUTES[index];
      }
      if (!coords || coords.length < 2) return;

      const polyline = new Polyline({ paths: [coords] as any });
      const lineSymbol = {
        type: "simple-line",
        color: [251, 191, 36], // amber-400 for highlight
        width: 8,
      };

      const graphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol as any,
      });

      highlightLayer.add(graphic);
    } else if (highlightedElementType === "valve") {
      const valve = valves.find((v) => v.id === highlightedElementId);
      if (!valve) return;

      const index = valves.indexOf(valve);
      let lon = valve.coordinates?.lng;
      let lat = valve.coordinates?.lat;

      if (lon === undefined || lat === undefined) {
        const fallback = DEFAULT_VALVE_POSITIONS[index];
        if (fallback) {
          [lon, lat] = fallback;
        }
      }

      if (lon === undefined || lat === undefined) return;

      const pt = new Point({ longitude: lon, latitude: lat });
      const markerSymbol = {
        type: "simple-marker",
        color: [251, 191, 36], // amber-400 for highlight
        size: "24px",
        outline: {
          color: [255, 255, 255],
          width: 3,
        },
      };

      const graphic = new Graphic({
        geometry: pt,
        symbol: markerSymbol as any,
      });

      highlightLayer.add(graphic);
    } else if (highlightedElementType === "consumer") {
      const consumer = consumers.find((c) => c.id === highlightedElementId);
      if (!consumer) return;

      if (consumer.coordinates.lat === undefined || consumer.coordinates.lng === undefined) return;

      const pt = new Point({
        longitude: consumer.coordinates.lng,
        latitude: consumer.coordinates.lat,
      });

      const markerSymbol = {
        type: "simple-marker",
        color: [251, 191, 36], // amber-400 for highlight
        size: "24px",
        outline: {
          color: [255, 255, 255],
          width: 3,
        },
      };

      const graphic = new Graphic({
        geometry: pt,
        symbol: markerSymbol as any,
      });

      highlightLayer.add(graphic);
    }
  }, [highlightedElementId, highlightedElementType, pipelines, valves, consumers]);

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
