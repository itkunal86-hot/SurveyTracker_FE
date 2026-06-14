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
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}> {
  return features
    .filter((feature) =>
      ["MultiLineString", "LineString"].includes(feature.geometry.type),
    )
    .map((feature, index) => {
      const props = feature.properties;
      const coordinates = getLineCoordinates(feature);

      // Extract Plot sub-object properties (new structure)
      const plotData = props.Plot || {};

      return {
        id: props.SE_ID?.toString() || `pipeline-${index}`,
        name: props.SE_VALUE || "Pipeline",
        type: props.SE_VALUE || "UNKNOWN",
        diameter: parseInt(props["pipe diameter"] || "0", 10),
        depth: parseInt(props.depth || props["depth meter"] || "0", 10),
        status: "normal" as const,
        material: props.material || "UNKNOWN",
        coordinates: coordinates.length > 0 ? coordinates : [],
        isActive: props.IsActive !== undefined ? props.IsActive : true,
        plotType: plotData.PLOT_TYPE as "line" | "round" | "square" | undefined,
        plotColor: plotData.PLOT_COLOR || "#3b82f6",
        plotColorInactive: plotData.PLOT_COLOR_INACTIVE || "#9ca3af",
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
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}> {
  return features
    .filter((feature) => feature.geometry.type === "Point")
    .map((feature, index) => {
      const props = feature.properties;
      const coords = getPointCoordinates(feature);

      // Extract Plot sub-object properties (new structure)
      const plotData = props.Plot || {};

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
        isActive: props.IsActive !== undefined ? props.IsActive : true,
        plotType: plotData.PLOT_TYPE as "line" | "round" | "square" | undefined,
        plotColor: plotData.PLOT_COLOR || "#ef4444",
        plotColorInactive: plotData.PLOT_COLOR_INACTIVE || "#9ca3af",
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
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}> {
  return features
    .filter((feature) => feature.geometry && feature.geometry.type === "Point")
    .map((feature, index) => {
      const props = feature.properties;
      const coords = getPointCoordinates(feature);

      // Extract Plot sub-object properties (new structure)
      const plotData = props.Plot || {};

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
        isActive: props.IsActive !== undefined ? props.IsActive : true,
        plotType: plotData.PLOT_TYPE as "line" | "round" | "square" | undefined,
        plotColor: plotData.PLOT_COLOR || "#10b981",
        plotColorInactive: plotData.PLOT_COLOR_INACTIVE || "#9ca3af",
      };
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);
}

/**
 * Transform GeoJSON features to catastrophe points
 */
export function transformCatastropheFeatures(
  features: GeoJSONFeature[],
): Array<{
  id: string;
  type: string;
  description: string;
  lat: number;
  lng: number;
  severity: "low" | "medium" | "high" | "critical";
  reportedDate: string;
  point: number;
  location?: string;
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}> {
  return features
    .filter((feature) => feature.geometry && feature.geometry.type === "Point")
    .map((feature, index) => {
      const props = feature.properties;
      const coords = getPointCoordinates(feature);

      // Extract Plot sub-object properties (new structure)
      const plotData = props.Plot || {};

      if (!coords) {
        return null;
      }

      // Determine severity based on type or properties
      let severity: "low" | "medium" | "high" | "critical" = "medium";
      const catastropheType = props.Type || props.SE_VALUE || "UNKNOWN";
      if (catastropheType === "BLOCKAGE") {
        severity = "high";
      } else if (catastropheType === "BREAK" || catastropheType === "BURST") {
        severity = "critical";
      } else if (catastropheType === "LEAK") {
        severity = "medium";
      }

      // Extract isActive with multiple fallback property names
      // Default to true if not specified in the data
      let isActive = true;
      if (props.IsActive !== undefined && props.IsActive !== null) {
        isActive = Boolean(props.IsActive);
      } else if (props.isActive !== undefined && props.isActive !== null) {
        isActive = Boolean(props.isActive);
      } else if (props.active !== undefined && props.active !== null) {
        isActive = Boolean(props.active);
      } else if (props.Active !== undefined && props.Active !== null) {
        isActive = Boolean(props.Active);
      }

      // Determine plot color based on severity
      // Use color mapping similar to RGISMap's getCatastropheColor
      let plotColor = "#f97316"; // default orange
      switch (severity) {
        case "critical":
          plotColor = "#991b1b"; // red-900
          break;
        case "high":
          plotColor = "#ef4444"; // red-500
          break;
        case "medium":
          plotColor = "#f59e0b"; // amber-500
          break;
        case "low":
          plotColor = "#22c55e"; // green-500
          break;
      }

      // Override with API-provided color from Plot sub-object if available
      const finalPlotColor = plotData.PLOT_COLOR || plotColor;
      const finalPlotColorInactive = plotData.PLOT_COLOR_INACTIVE || "#9ca3af";

      return {
        id: props.SE_ID?.toString() || `catastrophe-${index}`,
        type: catastropheType,
        description: props.Description || props.SE_VALUE || "No description provided",
        lat: coords.lat,
        lng: coords.lng,
        severity,
        reportedDate: props.SE_ENTRY_DATE || new Date().toISOString(),
        point: props.POINT || index,
        location: props.Location || "",
        isActive,
        plotType: plotData.PLOT_TYPE as "line" | "round" | "square" | undefined,
        plotColor: finalPlotColor,
        plotColorInactive: finalPlotColorInactive,
      };
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);
}

// Transform CNG Station features - reads LAT/LNG from properties instead of geometry
export function transformCngStationFeatures(
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
  isActive?: boolean;
  plotType?: "line" | "round" | "square";
  plotColor?: string;
  plotColorInactive?: string;
}> {
  return features.map((feature, index) => {
    const props = feature.properties;

    // Read LAT/LNG directly from properties for CNG stations (geometry is null)
    const lat = Number(props.LAT);
    const lng = Number(props.LNG);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    // Extract Plot sub-object properties
    const plotData = props.Plot || {};

    return {
      id: props.SE_ID?.toString() || `cng-${index}`,
      name: props["Station Name"] || `CNG Station ${props.POINT || index}`,
      lat: lat,
      lng: lng,
      type: "CNG_STATION",
      category: props.Category || "CNG",
      status: "active" as const,
      consumerCode: props.SE_ID?.toString(),
      mobile: props.Mobile,
      estimatedConsumption: 0,
      consumptionUnit: "m³/day",
      isActive: props.IsActive !== undefined ? props.IsActive : true,
      plotType: plotData.PLOT_TYPE as "line" | "round" | "square" | undefined,
      plotColor: plotData.PLOT_COLOR || "purple",
      plotColorInactive: plotData.PLOT_COLOR_INACTIVE || "grey",
    };
  })
  .filter((item): item is Exclude<typeof item, null> => item !== null);
}
