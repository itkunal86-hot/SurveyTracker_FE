// Utility functions for parsing GeoJSON data from survey entries API

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point" | "MultiLineString" | "LineString" | "Polygon";
    coordinates: any;
  };
  properties: Record<string, any>;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

/**
 * Parse GeoJSON string response from API
 * The API returns data as a JSON string that needs to be parsed
 */
export function parseGeoJSON(dataString: string): GeoJSONFeatureCollection | null {
  try {
    if (typeof dataString !== "string") {
      return null;
    }
    return JSON.parse(dataString) as GeoJSONFeatureCollection;
  } catch (error) {
    console.error("Failed to parse GeoJSON:", error);
    return null;
  }
}

/**
 * Extract point coordinates from GeoJSON feature
 * GeoJSON uses [longitude, latitude] order
 */
export function getPointCoordinates(
  feature: GeoJSONFeature,
): { lat: number; lng: number } | null {
  if (feature.geometry.type === "Point") {
    const [lng, lat] = feature.geometry.coordinates;
    return { lat, lng };
  }
  return null;
}

/**
 * Extract line coordinates from GeoJSON feature
 * GeoJSON uses [longitude, latitude] order
 */
export function getLineCoordinates(
  feature: GeoJSONFeature,
): Array<{ lat: number; lng: number; elevation?: number }> {
  const coords: Array<{ lat: number; lng: number; elevation?: number }> = [];

  if (feature.geometry.type === "MultiLineString") {
    const lineStrings = feature.geometry.coordinates as number[][][];
    lineStrings.forEach((line) => {
      line.forEach(([lng, lat, elevation]) => {
        coords.push({
          lat,
          lng,
          elevation: elevation ?? undefined,
        });
      });
    });
  } else if (feature.geometry.type === "LineString") {
    const line = feature.geometry.coordinates as number[][];
    line.forEach(([lng, lat, elevation]) => {
      coords.push({
        lat,
        lng,
        elevation: elevation ?? undefined,
      });
    });
  }

  return coords;
}

/**
 * Transform GeoJSON features to pipeline segments
 */
export function transformPipelineFeatures(
  features: GeoJSONFeature[],
): Array<{
  id: string;
  name: string;
  type: string;
  diameter: number;
  depth: number;
  status: "normal" | "warning" | "critical" | "maintenance";
  material?: string;
  coordinates: Array<{ lat: number; lng: number; elevation?: number }>;
}> {
  return features
    .filter((feature) =>
      ["MultiLineString", "LineString"].includes(feature.geometry.type),
    )
    .map((feature, index) => {
      const props = feature.properties;
      const coordinates = getLineCoordinates(feature);

      return {
        id: props.SE_ID?.toString() || `pipeline-${index}`,
        name: props.SE_VALUE || "Pipeline",
        type: props.SE_VALUE || "UNKNOWN",
        diameter: parseInt(props["pipe diameter"] || "0", 10),
        depth: parseInt(props.depth || props["depth meter"] || "0", 10),
        status: "normal" as const,
        material: props.material || "UNKNOWN",
        coordinates: coordinates.length > 0 ? coordinates : [],
      };
    });
}

/**
 * Transform GeoJSON features to valve points
 */
export function transformValveFeatures(
  features: GeoJSONFeature[],
): Array<{
  id: string;
  name: string;
  type: "isolation" | "station" | "control" | "emergency";
  status: "open" | "closed" | "maintenance" | "fault";
  segmentId: string;
  coordinates?: { lat: number; lng: number; elevation?: number };
  criticality: string;
}> {
  return features
    .filter((feature) => feature.geometry.type === "Point")
    .map((feature, index) => {
      const props = feature.properties;
      const coords = getPointCoordinates(feature);

      // Determine valve type based on properties
      let valveType: "isolation" | "station" | "control" | "emergency" = "station";
      if (props.isolation && props.isolation.trim()) {
        valveType = "isolation";
      } else if (props["control station"] && props["control station"].trim()) {
        valveType = "control";
      }

      return {
        id: props.SE_ID?.toString() || `valve-${index}`,
        name: props.SE_VALUE || props["bulb station"] || "Valve",
        type: valveType,
        status: "closed" as const,
        segmentId: "Unknown",
        coordinates: coords || undefined,
        criticality: "MEDIUM",
      };
    });
}

/**
 * Transform GeoJSON features to consumer points
 */
export function transformConsumerFeatures(
  features: GeoJSONFeature[],
): Array<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  status: "active" | "inactive";
  consumerCode?: string;
  mobile?: string;
  estimatedConsumption?: number;
  consumptionUnit?: string;
}> {
  return features
    .filter((feature) => feature.geometry.type === "Point")
    .map((feature, index) => {
      const props = feature.properties;
      const coords = getPointCoordinates(feature);

      if (!coords) {
        return null;
      }

      return {
        id: props.SE_ID?.toString() || `consumer-${index}`,
        name: props.Consumer_Name || `Consumer ${props.POINT || index}`,
        lat: coords.lat,
        lng: coords.lng,
        type: "CONSUMER",
        category: props.Category || "DOMESTIC",
        status: "active" as const,
        consumerCode: props.Consumer_Code,
        mobile: props.Mobile,
        estimatedConsumption: 0,
        consumptionUnit: "m³/day",
      };
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);
}
