/**
 * Comprehensive color name to hex and RGB conversion utilities
 * Handles both CSS color names and hex codes
 */

// Standard CSS color name mappings
const COLOR_NAME_MAP: Record<string, string> = {
  // Reds
  red: "#ef4444",
  darkred: "#dc2626",
  crimson: "#dc143c",
  
  // Greys
  grey: "#9ca3af",
  gray: "#9ca3af",
  lightgrey: "#d1d5db",
  lightgray: "#d1d5db",
  darkgrey: "#6b7280",
  darkgray: "#6b7280",
  
  // Blues
  blue: "#3b82f6",
  darkblue: "#1e40af",
  lightblue: "#93c5fd",
  navy: "#000080",
  
  // Greens
  green: "#22c55e",
  darkgreen: "#15803d",
  lightgreen: "#86efac",
  lime: "#32cd32",
  
  // Yellows/Ambers
  yellow: "#eab308",
  gold: "#fbbf24",
  amber: "#f59e0b",
  orange: "#f97316",
  
  // Purples/Violets
  purple: "#a855f7",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  
  // Other colors
  black: "#000000",
  white: "#ffffff",
  brown: "#92400e",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

/**
 * Converts a color name (e.g., "red", "blue") or hex code to a hex code
 * @param color Color name or hex code
 * @returns Hex color code (e.g., "#ef4444") or default grey
 */
export const colorNameToHex = (color?: string): string => {
  if (!color || typeof color !== "string") {
    return "#9ca3af"; // Default grey
  }

  const normalized = color.trim().toLowerCase();

  // If already a hex code, validate and return
  if (normalized.startsWith("#")) {
    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
      return normalized;
    }
    // Invalid hex, return default
    return "#9ca3af";
  }

  // Check if it's a color name
  if (normalized in COLOR_NAME_MAP) {
    return COLOR_NAME_MAP[normalized];
  }

  // Unknown color, return default grey
  return "#9ca3af";
};

/**
 * Converts a hex color code to RGB array
 * @param hex Hex color code (e.g., "#ef4444" or "ef4444")
 * @returns RGB array [r, g, b] or default grey
 */
export const hexToRgb = (hex?: string): [number, number, number] => {
  if (!hex || typeof hex !== "string") {
    return [156, 163, 175]; // Default grey
  }

  const cleanHex = hex.trim().toLowerCase();

  // Handle both "#" prefixed and non-prefixed hex codes
  const hexPattern =
    cleanHex.startsWith("#") ? cleanHex.slice(1) : cleanHex;

  // Validate hex pattern
  if (!/^[a-f0-9]{6}$/i.test(hexPattern)) {
    return [156, 163, 175]; // Default grey
  }

  try {
    const r = parseInt(hexPattern.slice(0, 2), 16);
    const g = parseInt(hexPattern.slice(2, 4), 16);
    const b = parseInt(hexPattern.slice(4, 6), 16);

    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return [r, g, b];
    }
  } catch (e) {
    // Parsing error, return default
  }

  return [156, 163, 175]; // Default grey
};

/**
 * Converts a color name or hex code directly to RGB array
 * @param color Color name (e.g., "red") or hex code (e.g., "#ef4444")
 * @returns RGB array [r, g, b] or default grey
 */
export const colorNameToRgb = (color?: string): [number, number, number] => {
  const hex = colorNameToHex(color);
  return hexToRgb(hex);
};

/**
 * Get severity-based default color
 * @param severity Severity level (e.g., "critical", "high", "medium", "low")
 * @returns Hex color code
 */
export const getSeverityColor = (severity?: string): string => {
  const s = String(severity || "").toLowerCase();
  if (s.includes("critical") || s.includes("burst")) return "#991b1b"; // red-900
  if (
    s.includes("high") ||
    s.includes("major") ||
    s.includes("severe")
  )
    return "#ef4444"; // red-500
  if (
    s.includes("medium") ||
    s.includes("moderate") ||
    s.includes("standard")
  )
    return "#f59e0b"; // amber-500
  if (s.includes("low") || s.includes("minor")) return "#22c55e"; // green-500
  return "#a855f7"; // purple-500 for unknown
};

/**
 * Get severity-based color as RGB array
 * @param severity Severity level
 * @returns RGB array [r, g, b]
 */
export const getSeverityColorRgb = (severity?: string): [number, number, number] => {
  return hexToRgb(getSeverityColor(severity));
};

/**
 * Resolve color with active/inactive state support
 * Priority: plotColor > severity > default
 * @param params Color resolution parameters
 * @returns Hex color code
 */
export const resolveColor = (params: {
  isActive?: boolean | string | number;
  plotColor?: string;
  plotColorInactive?: string;
  severity?: string;
  default?: string;
}): string => {
  const isInactive =
    params.isActive === false ||
    params.isActive === "false" ||
    params.isActive === 0;

  if (isInactive) {
    if (params.plotColorInactive) {
      return colorNameToHex(params.plotColorInactive);
    }
    return params.default || "#9ca3af"; // grey for inactive
  }

  if (params.plotColor) {
    return colorNameToHex(params.plotColor);
  }

  if (params.severity) {
    return getSeverityColor(params.severity);
  }

  return params.default || "#3b82f6"; // blue default for active
};

/**
 * Resolve color to RGB array with active/inactive state support
 * @param params Color resolution parameters
 * @returns RGB array [r, g, b]
 */
export const resolveColorRgb = (params: {
  isActive?: boolean | string | number;
  plotColor?: string;
  plotColorInactive?: string;
  severity?: string;
  default?: string;
}): [number, number, number] => {
  return hexToRgb(resolveColor(params));
};
