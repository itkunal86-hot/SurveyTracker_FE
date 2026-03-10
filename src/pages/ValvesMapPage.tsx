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

interface ValveFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: number;
    bulb: string;
    control: string;
    service: string;
    isolation: string;
    [key: string]: unknown;
  };
}

interface GeoJsonResponse {
  type: "FeatureCollection";
  features: ValveFeature[];
}

export default function ValvesMapPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "manager" | "survey">("admin");
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { toast } = useToast();
  const valvesLayerRef = useRef<L.LayerGroup | null>(null);

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

    const valvesLayer = L.layerGroup().addTo(map);
    valvesLayerRef.current = valvesLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch and display valves data
  useEffect(() => {
    const fetchValves = async () => {
      try {
        setIsLoading(true);
        const data: GeoJsonResponse = await apiClient.getValves();

        if (!valvesLayerRef.current) return;

        valvesLayerRef.current.clearLayers();

        // Track bounds for auto-fit
        let bounds: L.LatLngBounds | null = null;

        data.features.forEach((feature) => {
          const { geometry, properties } = feature;

          if (geometry.type === "Point") {
            const [lng, lat] = geometry.coordinates;

            const marker = L.circleMarker([lat, lng], {
              radius: 8,
              fillColor: "#ef4444",
              color: "white",
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8,
            });

            marker.bindPopup(`
              <div style="font-family: system-ui; padding: 8px; min-width: 220px;">
                <strong>Valve ${properties.id}</strong><br/>
                <span style="color: #666;">Bulb: ${properties.bulb || "N/A"}</span><br/>
                ${properties.control ? `<span style="color: #666;">Control: ${properties.control}</span><br/>` : ""}
                ${properties.service ? `<span style="color: #666;">Service: ${properties.service}</span><br/>` : ""}
                ${properties.isolation ? `<span style="color: #666;">Isolation: ${properties.isolation}</span><br/>` : ""}
              </div>
            `);

            valvesLayerRef.current?.addLayer(marker);

            // Track bounds
            if (!bounds) {
              bounds = L.latLngBounds([lat, lng], [lat, lng]);
            } else {
              bounds.extend([lat, lng]);
            }
          }
        });

        // Auto-fit map to bounds
        if (bounds && mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
        }

        toast({
          title: "Success",
          description: `Loaded ${data.features.length} valves`,
        });
      } catch (error) {
        console.error("Failed to fetch valves:", error);
        toast({
          title: "Error",
          description: "Failed to load valves. Please check the API endpoint.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchValves();
  }, [toast]);

  const activeTab = "valves";

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
                  <p className="text-muted-foreground">Loading valves...</p>
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
