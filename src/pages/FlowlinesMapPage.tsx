import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

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

const DEFAULT_CENTER: [number, number] = [26.1445, 91.7362];
const DEFAULT_ZOOM = 13;

interface FlowlineFeature {
  type: "Feature";
  geometry: {
    type: "MultiLineString" | "LineString";
    coordinates: number[][][] | number[][];
  };
  properties: {
    id: number;
    depth: number;
    pipe_diameter: string;
    shape_length?: number;
    [key: string]: unknown;
  };
}

interface GeoJsonResponse {
  type: "FeatureCollection";
  features: FlowlineFeature[];
}

export default function FlowlinesMapPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | "survey">("admin");
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { toast } = useToast();
  const flowlinesLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        const roleFromServer = (user?.role as string) || "SURVEY MANAGER";
        let appRole: "admin" | "manager" | "survey" = "survey";
        if (roleFromServer === "ADMIN") appRole = "admin";
        else if (roleFromServer === "MANAGER") appRole = "manager";
        else appRole = "survey";
        setUserRole(appRole);
      }
    } catch {}
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("currentUser");
    } catch {}
    window.location.href = "/";
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const flowlinesLayer = L.layerGroup().addTo(map);
    flowlinesLayerRef.current = flowlinesLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch and display flowlines data
  useEffect(() => {
    const fetchFlowlines = async () => {
      try {
        setIsLoading(true);
        const data: GeoJsonResponse = await apiClient.getFlowlines();
        
        if (!flowlinesLayerRef.current) return;

        flowlinesLayerRef.current.clearLayers();

        // Track bounds for auto-fit
        let bounds: L.LatLngBounds | null = null;

        data.features.forEach((feature) => {
          const { geometry, properties } = feature;
          
          if (
            geometry.type === "MultiLineString" ||
            (geometry.type === "LineString" && Array.isArray(geometry.coordinates[0]?.[0]))
          ) {
            const coordinates = geometry.type === "MultiLineString"
              ? (geometry.coordinates as number[][][])
              : [(geometry.coordinates as number[][])];

            coordinates.forEach((lineCoords) => {
              // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
              const latLngs = lineCoords.map((coord) => [coord[1], coord[0]] as [number, number]);

              if (latLngs.length >= 2) {
                const diameter = properties.pipe_diameter || "Unknown";
                const polyline = L.polyline(latLngs, {
                  color: "#3b82f6",
                  weight: 4,
                  opacity: 0.85,
                });

                polyline.bindPopup(`
                  <div style="font-family: system-ui; padding: 8px; min-width: 200px;">
                    <strong>Flowline ${properties.id}</strong><br/>
                    <span style="color: #666;">Pipe Diameter: ${diameter}mm</span><br/>
                    <span style="color: #666;">Depth: ${properties.depth}m</span><br/>
                    ${properties.shape_length ? `<span style="color: #666;">Length: ${(properties.shape_length as number).toFixed(2)}m</span><br/>` : ""}
                  </div>
                `);

                flowlinesLayerRef.current?.addLayer(polyline);

                // Track bounds
                latLngs.forEach((coord) => {
                  if (!bounds) {
                    bounds = L.latLngBounds(coord, coord);
                  } else {
                    bounds.extend(coord);
                  }
                });
              }
            });
          }
        });

        // Auto-fit map to bounds
        if (bounds && mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
        }

        toast({
          title: "Success",
          description: `Loaded ${data.features.length} flowlines`,
        });
      } catch (error) {
        console.error("Failed to fetch flowlines:", error);
        toast({
          title: "Error",
          description: "Failed to load flowlines. Please check the API endpoint.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlowlines();
  }, [toast]);

  const activeTab = "flowlines";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={() => {}}
        userRole={userRole}
        onLogout={handleLogout}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <div className="w-full h-screen flex flex-col">
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading flowlines...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full rounded-lg leaflet-container" />
          </div>
        </div>
      </main>
    </div>
  );
}
