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
  mockInfrastructurePipelines,
  mockInfrastructureValves,
  mockControlStations,
  getAssetColorByStatus,
  getPipelineColorByType,
  getValveColorByClass,
  InfrastructurePipeline,
  InfrastructureValve,
  ControlStation,
} from "@/lib/mockAssetData";
import { useDeviceLogs } from "@/hooks/useApiQueries";
import { useSurveyContext } from "@/contexts/SurveyContext";

interface HeatmapFilters {
  showDevices: boolean;
  showPipelines: boolean;
  showValves: boolean;
  showControlStations: boolean;
  timeRange: string;
  statusFilter: string;
  assetType: string;
}

/* ================= CLUSTER LOGIC ================= */

const clusterPoints = (assets: any[], zoom: number) => {
  if (!assets.length) return [];

  if (zoom >= 13) {
    return assets.map((a: any, i: number) => ({
      id: `asset-${i}`,
      lat: a.coordinates.lat,
      lng: a.coordinates.lng,
      devices: [a],
      isCluster: false,
    }));
  }

  const clusterRadiusByZoom: Record<number, number> = {
    5: 2.0,
    6: 1.5,
    7: 1.0,
    8: 0.7,
    9: 0.4,
    10: 0.25,
    11: 0.15,
    12: 0.1,
  };

  const radius = clusterRadiusByZoom[zoom] ?? 0.1;
  const used = new Set<number>();
  const clusters: any[] = [];

  assets.forEach((asset, i) => {
    if (used.has(i)) return;

    const group = [asset];
    used.add(i);

    assets.forEach((other, j) => {
      if (i === j || used.has(j)) return;

      const dist = Math.sqrt(
        Math.pow(asset.coordinates.lat - other.coordinates.lat, 2) +
        Math.pow(asset.coordinates.lng - other.coordinates.lng, 2)
      );

      if (dist <= radius) {
        group.push(other);
        used.add(j);
      }
    });

    const lat =
      group.reduce((s, a) => s + a.coordinates.lat, 0) / group.length;
    const lng =
      group.reduce((s, a) => s + a.coordinates.lng, 0) / group.length;

    clusters.push({
      id: `cluster-${i}`,
      lat,
      lng,
      devices: group,
      isCluster: group.length > 1,
    });
  });

  return clusters;
};

/* ================= MAP COMPONENT ================= */

const HeatmapLeafletMap = ({ filteredAssets }: any) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [zoomLevel, setZoomLevel] = useState(12);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([22.57, 88.36], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;

    layerRef.current.clearLayers();

    const clusters = clusterPoints(filteredAssets, zoomLevel);

    clusters.forEach((c) => {
      if (c.isCluster) {
        const marker = L.marker([c.lat, c.lng], {
          icon: L.divIcon({
            html: `<div style="
              background:#ef4444;
              color:white;
              width:42px;
              height:42px;
              border-radius:50%;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:bold;
              border:2px solid white;
            ">${c.devices.length}</div>`,
            iconSize: [42, 42],
          }),
        });

        // ✅ CLUSTER TOOLTIP
        marker.bindTooltip(
          `<b>${c.devices.length} Devices</b><br/>Zoom in to view details`,
          { direction: "top" }
        );

        layerRef.current.addLayer(marker);
      } else {
        const d = c.devices[0];

        const circle = L.circle(
          [d.coordinates.lat, d.coordinates.lng],
          {
            radius: 80,
            color: "#f97316",
            fillOpacity: 0.5,
          }
        );

        // ✅ DEVICE TOOLTIP (as before)
        circle.bindTooltip(
          `<div>
            <b>${d.name ?? "Device"}</b><br/>
            ID: ${d.id ?? "-"}<br/>
            Lat: ${d.coordinates.lat}<br/>
            Lng: ${d.coordinates.lng}
          </div>`,
          { direction: "top" }
        );

        layerRef.current.addLayer(circle);
      }
    });
  }, [filteredAssets, zoomLevel]);

  return <div ref={mapRef} className="w-full h-96 rounded-lg" />;
};

/* ================= MAIN PAGE ================= */

export const LocationHeatmapAnalytics = () => {
  const { currentSurvey } = useSurveyContext();

  const { data } = useDeviceLogs({
    limit: 100,
    surveyId: currentSurvey?.id,
  });

  const devices = Array.isArray(data?.data) ? data.data : [];

  const filteredAssets = useMemo(() => {
    return devices.filter(
      (d: any) =>
        d.coordinates &&
        d.coordinates.lat !== 0 &&
        d.coordinates.lng !== 0
    );
  }, [devices]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infrastructure Asset Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <HeatmapLeafletMap filteredAssets={filteredAssets} />
        <div className="mt-2 text-sm text-muted-foreground">
          Visible Assets: {filteredAssets.length}
        </div>
      </CardContent>
    </Card>
  );
};
