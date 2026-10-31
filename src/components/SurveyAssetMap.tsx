import { useMemo } from "react";
import { LeafletMap } from "@/components/LeafletMap";
import { RGISMap } from "@/components/RGISMap";
import { useSurveyMapCache } from "@/hooks/useSurveyMapCache";
import type { GeoJsonMapLayer, SurveyMapLayerKey } from "@/lib/surveyMapCache";

const LAYER_STYLE: Array<{
  key: SurveyMapLayerKey;
  id: string;
  kind: "line" | "point";
  color: [number, number, number];
}> = [
  { key: "pipeline", id: "Pipeline", kind: "line", color: [59, 130, 246] },
  { key: "valve", id: "Valve", kind: "point", color: [239, 68, 68] },
  { key: "consumer", id: "Consumer", kind: "point", color: [34, 197, 94] },
  { key: "catastrophe", id: "Catastrophe", kind: "point", color: [245, 158, 11] },
  { key: "cng", id: "CNG Station", kind: "point", color: [168, 85, 247] },
  { key: "drs", id: "DRS Station", kind: "point", color: [249, 115, 22] },
];

type SurveyAssetMapProps = {
  showRGIS?: boolean;
  showSatellite?: boolean;
  hiddenLayers?: SurveyMapLayerKey[];
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  disableAutoFit?: boolean;
};

export const SurveyAssetMap = ({
  showRGIS = true,
  showSatellite = false,
  hiddenLayers = [],
  onMapClick,
  selectedLocation = null,
  disableAutoFit = false,
}: SurveyAssetMapProps) => {
  const { status, layers } = useSurveyMapCache();
  const hiddenKey = hiddenLayers.join("|");
  const geoJsonLayers = useMemo(
    () => {
      const hidden = new Set(hiddenKey.split("|").filter(Boolean));
      return LAYER_STYLE.flatMap((layer) => {
        const text = layers[layer.key];
        if (!text || hidden.has(layer.key)) return [];
        return [{ id: layer.id, text, kind: layer.kind, color: layer.color }];
      });
    },
    [layers, hiddenKey],
  );

  if (status !== "ready" && geoJsonLayers.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Loading map layers…
      </div>
    );
  }

  const mapProps = {
    devices: [] as [],
    pipelines: [] as [],
    valves: [] as [],
    consumers: [] as [],
    geoJsonLayers,
    showDevices: false,
    showPipelines: false,
    showValves: false,
    showConsumers: false,
    showSatellite,
    onMapClick,
    selectedLocation,
    disableAutoFit,
  };

  return showRGIS ? <RGISMap {...mapProps} /> : <LeafletMap {...mapProps} />;
};
