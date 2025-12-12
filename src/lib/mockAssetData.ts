// Mock data for comprehensive gas infrastructure asset identification and mapping
// Covers all key asset types with geo-referencing and detailed attributes

export interface AssetCoordinates {
  lat: number;
  lng: number;
  elevation?: number;
}

// Enhanced Device interface for comprehensive tracking
export interface InfrastructureDevice {
  id: string;
  name: string;
  type: "TRIMBLE_SPS986" | "MONITORING_STATION" | "SURVEY_EQUIPMENT" | "CONTROL_STATION" | "PRESSURE_SENSOR";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "ERROR";
  coordinates: AssetCoordinates;
  surveyor?: string;
  batteryLevel?: number;
  lastSeen?: string;
  accuracy?: number;
  installDate?: string;
  purpose?: string;
}

// Enhanced Pipeline interface for underground/above-ground classification
export interface InfrastructurePipeline {
  id: string;
  name: string;
  type: "UNDERGROUND" | "ABOVE_GROUND" | "SERVICE" | "TRANSMISSION" | "DISTRIBUTION";
  diameter: number;
  material: "STEEL" | "HDPE" | "PVC" | "CONCRETE" | "CAST_IRON";
  depth?: number;
  pressure?: number;
  installDate?: string;
  coordinates: AssetCoordinates[];
  status: "OPERATIONAL" | "MAINTENANCE" | "DAMAGED" | "INACTIVE" | "UNDER_CONSTRUCTION";
  maxOperatingPressure?: number;
  flowRate?: number;
  coating?: string;
  cathodicProtection?: boolean;
}

// Enhanced Valve interface for comprehensive valve station management
export interface InfrastructureValve {
  id: string;
  name: string;
  type: "GATE" | "BALL" | "BUTTERFLY" | "CHECK" | "RELIEF" | "CONTROL" | "ISOLATION" | "EMERGENCY_SHUTDOWN";
  valveClass: "ISOLATION_POINT" | "VALVE_STATION" | "CONTROL_STATION" | "SERVICE_CONNECTION";
  status: "OPEN" | "CLOSED" | "PARTIALLY_OPEN" | "FAULT" | "MAINTENANCE";
  coordinates: AssetCoordinates;
  diameter?: number;
  pressure?: number;
  installDate?: string;
  lastMaintenance?: string;
  pipelineId?: string;
  automationLevel?: "MANUAL" | "MOTORIZED" | "REMOTELY_CONTROLLED";
  criticality?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Control Station interface for monitoring and regulatory facilities
export interface ControlStation {
  id: string;
  name: string;
  type: "PRESSURE_REGULATION" | "FLOW_CONTROL" | "MONITORING" | "EMERGENCY_RESPONSE";
  coordinates: AssetCoordinates;
  status: "OPERATIONAL" | "MAINTENANCE" | "OFFLINE" | "EMERGENCY";
  controlledPipelines: string[];
  monitoredValves: string[];
  operatingPressure?: number;
  emergencyContactLevel?: number;
  installDate?: string;
  lastInspection?: string;
}

// Asset symbology configuration for map visualization
export interface AssetSymbology {
  pipeline: {
    underground: { color: string; weight: number; opacity: number; pattern?: string };
    aboveGround: { color: string; weight: number; opacity: number; pattern?: string };
    service: { color: string; weight: number; opacity: number; pattern?: string };
    transmission: { color: string; weight: number; opacity: number; pattern?: string };
    distribution: { color: string; weight: number; opacity: number; pattern?: string };
  };
  valve: {
    isolation: { color: string; size: number; shape: string };
    control: { color: string; size: number; shape: string };
    emergency: { color: string; size: number; shape: string };
    station: { color: string; size: number; shape: string };
  };
  device: {
    active: { color: string; size: number };
    inactive: { color: string; size: number };
    maintenance: { color: string; size: number };
    error: { color: string; size: number };
  };
  controlStation: {
    operational: { color: string; size: number; icon: string };
    maintenance: { color: string; size: number; icon: string };
    offline: { color: string; size: number; icon: string };
    emergency: { color: string; size: number; icon: string };
  };
}

// Color coding based on pipe diameter, depth, and status
export const getAssetSymbology = (): AssetSymbology => ({
  pipeline: {
    underground: { color: "#1e40af", weight: 4, opacity: 0.8, pattern: "solid" },
    aboveGround: { color: "#7c3aed", weight: 5, opacity: 0.9, pattern: "solid" },
    service: { color: "#059669", weight: 3, opacity: 0.7, pattern: "dashed" },
    transmission: { color: "#dc2626", weight: 6, opacity: 1.0, pattern: "solid" },
    distribution: { color: "#ea580c", weight: 4, opacity: 0.8, pattern: "solid" },
  },
  valve: {
    isolation: { color: "#ef4444", size: 12, shape: "square" },
    control: { color: "#3b82f6", size: 10, shape: "circle" },
    emergency: { color: "#f59e0b", size: 14, shape: "triangle" },
    station: { color: "#8b5cf6", size: 16, shape: "hexagon" },
  },
  device: {
    active: { color: "#22c55e", size: 8 },
    inactive: { color: "#ef4444", size: 8 },
    maintenance: { color: "#f59e0b", size: 8 },
    error: { color: "#dc2626", size: 8 },
  },
  controlStation: {
    operational: { color: "#10b981", size: 20, icon: "control-panel" },
    maintenance: { color: "#f59e0b", size: 20, icon: "maintenance" },
    offline: { color: "#ef4444", size: 20, icon: "offline" },
    emergency: { color: "#dc2626", size: 20, icon: "emergency" },
  },
});

// Mock data for Mumbai gas infrastructure network
export const mockInfrastructureDevicesold: InfrastructureDevice[] = [
  {
    id: "TRIMBLE_001",
    name: "Central Survey Station",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 19.076, lng: 72.8777, elevation: 11 },
    surveyor: "Survey Team A",
    batteryLevel: 85,
    lastSeen: new Date().toISOString(),
    accuracy: 0.01,
    installDate: "2024-01-15",
    purpose: "Primary geodetic control point",
  },
  {
    id: "MON_ST_001",
    name: "Pressure Monitoring Station Alpha",
    type: "MONITORING_STATION",
    status: "ACTIVE",
    coordinates: { lat: 19.0728, lng: 72.8826, elevation: 8 },
    batteryLevel: 92,
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    accuracy: 0.1,
    installDate: "2023-11-20",
    purpose: "Real-time pressure monitoring",
  },
  {
    id: "CTL_ST_001",
    name: "Central Control Station",
    type: "CONTROL_STATION",
    status: "ACTIVE",
    coordinates: { lat: 19.0756, lng: 72.8865, elevation: 12 },
    batteryLevel: 78,
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    accuracy: 0.05,
    installDate: "2023-08-10",
    purpose: "Network control and monitoring",
  },
  {
    id: "PRES_SEN_001",
    name: "High Pressure Sensor",
    type: "PRESSURE_SENSOR",
    status: "MAINTENANCE",
    coordinates: { lat: 19.0695, lng: 72.8758, elevation: 9 },
    batteryLevel: 45,
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    accuracy: 0.02,
    installDate: "2023-12-05",
    purpose: "Critical pressure monitoring",
  },
];

export const mockInfrastructureDevices: InfrastructureDevice[] = [
  {
    id: "TRIMBLE_001",
    name: "Central Survey Station",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 19.076, lng: 72.8777, elevation: 11 },
    surveyor: "Survey Team A",
    batteryLevel: 85,
    lastSeen: new Date().toISOString(),
    accuracy: 0.01,
    installDate: "2024-01-15",
    purpose: "Primary geodetic control point",
  },
  {
    id: "MON_ST_001",
    name: "Pressure Monitoring Station Alpha",
    type: "MONITORING_STATION",
    status: "ACTIVE",
    coordinates: { lat: 19.0728, lng: 72.8826, elevation: 8 },
    batteryLevel: 92,
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    accuracy: 0.1,
    installDate: "2023-11-20",
    purpose: "Real-time pressure monitoring",
  },
  
];
export const mockInfrastructurePipelines: InfrastructurePipeline[] = [
  {
    id: "UG_MAIN_001",
    name: "Main Transmission Line A",
    type: "UNDERGROUND",
    diameter: 600,
    material: "STEEL",
    depth: 2.5,
    pressure: 45,
    installDate: "2022-03-15",
    coordinates: [
      { lat: 19.076, lng: 72.8777, elevation: -2.5 },
      { lat: 19.0780, lng: 72.8820, elevation: -2.3 },
      { lat: 19.0820, lng: 72.8850, elevation: -2.8 },
    ],
    status: "OPERATIONAL",
    maxOperatingPressure: 70,
    flowRate: 15000,
    coating: "Fusion Bonded Epoxy",
    cathodicProtection: true,
  },
  {
    id: "AG_DIST_001",
    name: "Above Ground Distribution B",
    type: "ABOVE_GROUND",
    diameter: 300,
    material: "STEEL",
    depth: 0,
    pressure: 25,
    installDate: "2023-01-20",
    coordinates: [
      { lat: 19.0695, lng: 72.8758, elevation: 3.0 },
      { lat: 19.0720, lng: 72.8790, elevation: 3.2 },
      { lat: 19.0745, lng: 72.8815, elevation: 3.5 },
    ],
    status: "OPERATIONAL",
    maxOperatingPressure: 40,
    flowRate: 8000,
    coating: "Polyethylene",
    cathodicProtection: false,
  },
  {
    id: "SRV_LINE_001",
    name: "Service Line Complex A",
    type: "SERVICE",
    diameter: 150,
    material: "HDPE",
    depth: 1.2,
    pressure: 12,
    installDate: "2023-06-10",
    coordinates: [
      { lat: 19.0745, lng: 72.8815, elevation: -1.2 },
      { lat: 19.0765, lng: 72.8835, elevation: -1.0 },
      { lat: 19.0785, lng: 72.8855, elevation: -1.3 },
    ],
    status: "OPERATIONAL",
    maxOperatingPressure: 20,
    flowRate: 2500,
    coating: "N/A",
    cathodicProtection: false,
  },
  {
    id: "UG_MAIN_002",
    name: "Secondary Transmission C",
    type: "UNDERGROUND",
    diameter: 450,
    material: "STEEL",
    depth: 3.0,
    pressure: 35,
    installDate: "2022-09-05",
    coordinates: [
      { lat: 19.0820, lng: 72.8850, elevation: -3.0 },
      { lat: 19.0840, lng: 72.8880, elevation: -2.8 },
      { lat: 19.0860, lng: 72.8910, elevation: -3.2 },
    ],
    status: "MAINTENANCE",
    maxOperatingPressure: 60,
    flowRate: 12000,
    coating: "Three Layer Polyethylene",
    cathodicProtection: true,
  },
];

export const mockInfrastructureValves: InfrastructureValve[] = [
  {
    id: "ISO_VLV_001",
    name: "Main Isolation Valve Alpha",
    type: "GATE",
    valveClass: "ISOLATION_POINT",
    status: "OPEN",
    coordinates: { lat: 19.0780, lng: 72.8820, elevation: -2.3 },
    diameter: 600,
    pressure: 45,
    installDate: "2022-03-15",
    lastMaintenance: "2024-01-10",
    pipelineId: "UG_MAIN_001",
    automationLevel: "REMOTELY_CONTROLLED",
    criticality: "CRITICAL",
  },
  {
    id: "CTL_VLV_001",
    name: "Flow Control Valve Beta",
    type: "BUTTERFLY",
    valveClass: "CONTROL_STATION",
    status: "PARTIALLY_OPEN",
    coordinates: { lat: 19.0720, lng: 72.8790, elevation: 3.2 },
    diameter: 300,
    pressure: 25,
    installDate: "2023-01-20",
    lastMaintenance: "2024-02-15",
    pipelineId: "AG_DIST_001",
    automationLevel: "MOTORIZED",
    criticality: "HIGH",
  },
  {
    id: "EMG_VLV_001",
    name: "Emergency Shutdown Alpha",
    type: "EMERGENCY_SHUTDOWN",
    valveClass: "VALVE_STATION",
    status: "CLOSED",
    coordinates: { lat: 19.0820, lng: 72.8850, elevation: -2.8 },
    diameter: 600,
    pressure: 0,
    installDate: "2022-03-15",
    lastMaintenance: "2024-01-05",
    pipelineId: "UG_MAIN_001",
    automationLevel: "REMOTELY_CONTROLLED",
    criticality: "CRITICAL",
  },
  {
    id: "SRV_VLV_001",
    name: "Service Connection Point A",
    type: "BALL",
    valveClass: "SERVICE_CONNECTION",
    status: "OPEN",
    coordinates: { lat: 19.0765, lng: 72.8835, elevation: -1.0 },
    diameter: 150,
    pressure: 12,
    installDate: "2023-06-10",
    lastMaintenance: "2023-12-20",
    pipelineId: "SRV_LINE_001",
    automationLevel: "MANUAL",
    criticality: "MEDIUM",
  },
  {
    id: "REL_VLV_001",
    name: "Pressure Relief Valve",
    type: "RELIEF",
    valveClass: "CONTROL_STATION",
    status: "MAINTENANCE",
    coordinates: { lat: 19.0840, lng: 72.8880, elevation: -2.8 },
    diameter: 450,
    pressure: 35,
    installDate: "2022-09-05",
    lastMaintenance: "2024-03-01",
    pipelineId: "UG_MAIN_002",
    automationLevel: "MANUAL",
    criticality: "HIGH",
  },
];

export const mockControlStations: ControlStation[] = [
  {
    id: "CTL_STN_001",
    name: "Central Control Facility",
    type: "PRESSURE_REGULATION",
    coordinates: { lat: 19.0756, lng: 72.8865, elevation: 12 },
    status: "OPERATIONAL",
    controlledPipelines: ["UG_MAIN_001", "AG_DIST_001"],
    monitoredValves: ["ISO_VLV_001", "CTL_VLV_001", "EMG_VLV_001"],
    operatingPressure: 45,
    emergencyContactLevel: 1,
    installDate: "2023-08-10",
    lastInspection: "2024-02-28",
  },
  {
    id: "CTL_STN_002",
    name: "Flow Control Station Beta",
    type: "FLOW_CONTROL",
    coordinates: { lat: 19.0728, lng: 72.8826, elevation: 8 },
    status: "OPERATIONAL",
    controlledPipelines: ["SRV_LINE_001"],
    monitoredValves: ["SRV_VLV_001"],
    operatingPressure: 12,
    emergencyContactLevel: 2,
    installDate: "2023-11-20",
    lastInspection: "2024-03-10",
  },
  {
    id: "CTL_STN_003",
    name: "Emergency Response Station",
    type: "EMERGENCY_RESPONSE",
    coordinates: { lat: 19.0695, lng: 72.8758, elevation: 9 },
    status: "MAINTENANCE",
    controlledPipelines: ["UG_MAIN_002"],
    monitoredValves: ["REL_VLV_001"],
    operatingPressure: 35,
    emergencyContactLevel: 1,
    installDate: "2023-12-05",
    lastInspection: "2024-03-15",
  },
];

// Helper functions for asset classification and color coding
export const getAssetColorByStatus = (status: string, assetType: string): string => {
  const symbology = getAssetSymbology();
  
  switch (assetType) {
    case "device":
      switch (status) {
        case "ACTIVE": return symbology.device.active.color;
        case "INACTIVE": return symbology.device.inactive.color;
        case "MAINTENANCE": return symbology.device.maintenance.color;
        case "ERROR": return symbology.device.error.color;
        default: return symbology.device.inactive.color;
      }
    case "controlStation":
      switch (status) {
        case "OPERATIONAL": return symbology.controlStation.operational.color;
        case "MAINTENANCE": return symbology.controlStation.maintenance.color;
        case "OFFLINE": return symbology.controlStation.offline.color;
        case "EMERGENCY": return symbology.controlStation.emergency.color;
        default: return symbology.controlStation.offline.color;
      }
    default:
      return "#6b7280"; // Default gray
  }
};

export const getPipelineColorByType = (type: string): string => {
  const symbology = getAssetSymbology();
  
  switch (type) {
    case "UNDERGROUND": return symbology.pipeline.underground.color;
    case "ABOVE_GROUND": return symbology.pipeline.aboveGround.color;
    case "SERVICE": return symbology.pipeline.service.color;
    case "TRANSMISSION": return symbology.pipeline.transmission.color;
    case "DISTRIBUTION": return symbology.pipeline.distribution.color;
    default: return symbology.pipeline.underground.color;
  }
};

export const getValveColorByClass = (valveClass: string): string => {
  const symbology = getAssetSymbology();
  
  switch (valveClass) {
    case "ISOLATION_POINT": return symbology.valve.isolation.color;
    case "CONTROL_STATION": return symbology.valve.control.color;
    case "VALVE_STATION": return symbology.valve.station.color;
    case "SERVICE_CONNECTION": return symbology.valve.control.color;
    default: return symbology.valve.control.color;
  }
};

// Diameter-based styling for pipelines
export const getPipelineWeightByDiameter = (diameter: number): number => {
  if (diameter >= 500) return 6; // Large transmission
  if (diameter >= 300) return 5; // Medium distribution
  if (diameter >= 200) return 4; // Small distribution
  if (diameter >= 100) return 3; // Service lines
  return 2; // Small service connections
};

// Depth-based opacity for underground assets
export const getPipelineOpacityByDepth = (depth: number): number => {
  if (depth >= 3.0) return 0.9; // Deep underground
  if (depth >= 2.0) return 0.8; // Medium depth
  if (depth >= 1.0) return 0.7; // Shallow
  return 1.0; // Above ground
};