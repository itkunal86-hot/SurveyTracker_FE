import {
  Device,
  PipelineSegment,
  Valve,
  Catastrophe,
  SurveyData,
  PaginatedResponse,
  ApiResponse,
} from "./api";

// Mock Devices Data
export const mockDevices: Device[] = [
  {
    id: "1",
    name: "Trimble Station Alpha",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 28.6139, lng: 77.2090, elevation: 216 },
    surveyor: "John Smith",
    batteryLevel: 85,
    lastSeen: "2024-01-15T10:30:00Z",
    accuracy: 0.02,
  },
  {
    id: "2",
    name: "Monitoring Station Beta",
    type: "MONITORING_STATION",
    status: "ACTIVE",
    coordinates: { lat: 28.7041, lng: 77.1025, elevation: 223 },
    surveyor: "Jane Doe",
    batteryLevel: 92,
    lastSeen: "2024-01-15T10:25:00Z",
    accuracy: 0.01,
  },
  {
    id: "3",
    name: "Survey Equipment Gamma",
    type: "SURVEY_EQUIPMENT",
    status: "MAINTENANCE",
    coordinates: { lat: 28.5355, lng: 77.3910, elevation: 201 },
    surveyor: "Mike Johnson",
    batteryLevel: 45,
    lastSeen: "2024-01-14T16:45:00Z",
    accuracy: 0.03,
  },
];

// Mock Pipelines Data
export const mockPipelines: PipelineSegment[] = [
  {
    id: "pipeline-1",
    name: "Main Distribution Line A",
    status: "OPERATIONAL",
    specifications: {
      diameter: {
        value: 500,
        unit: "MM",
        nominalSize: "DN500"
      },
      material: "STEEL",
      materialGrade: "API 5L X65",
      wallThickness: 12.7,
      coatingType: "3-Layer Polyethylene",
      length: {
        value: 1200,
        unit: "METERS"
      },
      jointType: "WELDED"
    },
    operatingPressure: {
      nominal: 6.2,
      minimum: 4.0,
      maximum: 8.5,
      unit: "BAR",
      testPressure: 9.3
    },
    installation: {
      installationYear: 2020,
      commissioningDate: "2020-03-15",
      installationMethod: "OPEN_CUT",
      depth: {
        value: 3.5,
        unit: "METERS"
      },
      soilType: "Clay",
      contractor: "Pipeline Solutions Ltd",
      inspector: "John Engineer",
      asBuiltDrawingRef: "DWG-2020-001"
    },
    consumerCategory: {
      type: "INDUSTRIAL",
      subCategory: "Manufacturing",
      estimatedConsumption: 500,
      priority: "HIGH"
    },
    coordinates: [
      { lat: 28.6139, lng: 77.2090, elevation: 216, pointType: "START", description: "Pipeline start point" },
      { lat: 28.6200, lng: 77.2150, elevation: 220, pointType: "NODE", description: "Intermediate junction" },
      { lat: 28.6250, lng: 77.2200, elevation: 218, pointType: "END", description: "Pipeline end point" },
    ],
    elevationProfile: {
      points: [
        { distance: 0, elevation: 216, coordinates: { lat: 28.6139, lng: 77.2090 } },
        { distance: 600, elevation: 220, coordinates: { lat: 28.6200, lng: 77.2150 } },
        { distance: 1200, elevation: 218, coordinates: { lat: 28.6250, lng: 77.2200 } }
      ],
      gradient: 0.17
    },
    lastInspection: "2024-01-10",
    nextInspection: "2024-07-10",
    maintenanceHistory: [
      {
        date: "2024-01-10",
        type: "INSPECTION",
        description: "Routine visual inspection - no issues found",
        cost: 2500,
        contractor: "Inspection Services Inc"
      }
    ],
    flowRate: {
      current: 125,
      maximum: 200,
      unit: "LPS"
    },
    connectedValves: ["valve-1"],
    connectedDevices: ["1"],
    standards: ["API 5L", "ASME B31.8"],
    certifications: [
      {
        type: "Material Certification",
        issuer: "Steel Manufacturer Ltd",
        issueDate: "2020-02-01",
        expiryDate: "2030-02-01",
        certificateNumber: "CERT-2020-001"
      }
    ]
  },
  {
    id: "pipeline-2",
    name: "Secondary Feed Line B",
    status: "OPERATIONAL",
    specifications: {
      diameter: {
        value: 300,
        unit: "MM",
        nominalSize: "DN300"
      },
      material: "HDPE",
      materialGrade: "PE100",
      length: {
        value: 800,
        unit: "METERS"
      },
      jointType: "FUSION"
    },
    operatingPressure: {
      nominal: 4.5,
      minimum: 3.0,
      maximum: 6.0,
      unit: "BAR"
    },
    installation: {
      installationYear: 2021,
      commissioningDate: "2021-07-22",
      installationMethod: "TRENCHLESS",
      depth: {
        value: 2.8,
        unit: "METERS"
      }
    },
    consumerCategory: {
      type: "COMMERCIAL",
      estimatedConsumption: 200,
      priority: "MEDIUM"
    },
    coordinates: [
      { lat: 28.7041, lng: 77.1025, elevation: 223, pointType: "START" },
      { lat: 28.7100, lng: 77.1080, elevation: 225, pointType: "NODE" },
      { lat: 28.7150, lng: 77.1120, elevation: 227, pointType: "END" },
    ],
    connectedValves: ["valve-2"],
    connectedDevices: ["2"]
  },
  {
    id: "pipeline-3",
    name: "Distribution Branch C",
    status: "MAINTENANCE",
    specifications: {
      diameter: {
        value: 200,
        unit: "MM",
        nominalSize: "DN200"
      },
      material: "PVC",
      length: {
        value: 400,
        unit: "METERS"
      }
    },
    operatingPressure: {
      nominal: 3.8,
      minimum: 2.5,
      maximum: 5.0,
      unit: "BAR"
    },
    installation: {
      installationYear: 2022,
      commissioningDate: "2022-11-10",
      depth: {
        value: 2.0,
        unit: "METERS"
      }
    },
    consumerCategory: {
      type: "DOMESTIC",
      estimatedConsumption: 100,
      priority: "LOW"
    },
    coordinates: [
      { lat: 28.5355, lng: 77.3910, elevation: 201, pointType: "START" },
      { lat: 28.5400, lng: 77.3950, elevation: 205, pointType: "END" },
    ],
    connectedValves: ["valve-3"],
    connectedDevices: ["3"]
  },
];

// Mock Valves Data
export const mockValves: Valve[] = [
  {
    id: "valve-1",
    name: "Main Gate Valve 001",
    type: "GATE",
    status: "OPEN",
    coordinates: { lat: 28.6139, lng: 77.2090, elevation: 216 },
    diameter: 500,
    pressure: 6.2,
    installDate: "2020-03-15",
    lastMaintenance: "2024-01-10",
    pipelineId: "pipeline-1",
  },
  {
    id: "valve-2",
    name: "Control Ball Valve 002",
    type: "BALL",
    status: "PARTIALLY_OPEN",
    coordinates: { lat: 28.7041, lng: 77.1025, elevation: 223 },
    diameter: 300,
    pressure: 4.5,
    installDate: "2021-07-22",
    lastMaintenance: "2024-01-08",
    pipelineId: "pipeline-2",
  },
  {
    id: "valve-3",
    name: "Safety Relief Valve 003",
    type: "RELIEF",
    status: "CLOSED",
    coordinates: { lat: 28.5355, lng: 77.3910, elevation: 201 },
    diameter: 200,
    pressure: 3.8,
    installDate: "2022-11-10",
    lastMaintenance: "2023-12-15",
    pipelineId: "pipeline-3",
  },
];

// Mock Catastrophes Data
export const mockCatastrophes: Catastrophe[] = [
  {
    id: "catastrophe-1",
    type: "LEAK",
    severity: "HIGH",
    status: "IN_PROGRESS",
    coordinates: { lat: 28.6139, lng: 77.2090, elevation: 216 },
    description: "Minor leak detected at joint connection",
    reportedAt: "2024-01-15T08:30:00Z",
    reportedBy: "System Alert",
    assignedTo: "Emergency Team Alpha",
    estimatedCost: 25000,
    pipelineId: "pipeline-1",
  },
  {
    id: "catastrophe-2",
    type: "CORROSION",
    severity: "MEDIUM",
    status: "INVESTIGATING",
    coordinates: { lat: 28.7041, lng: 77.1025, elevation: 223 },
    description: "Corrosion signs on pipeline surface",
    reportedAt: "2024-01-14T14:20:00Z",
    reportedBy: "Maintenance Crew",
    assignedTo: "Inspection Team Beta",
    estimatedCost: 15000,
    pipelineId: "pipeline-2",
  },
];

// Mock Surveys Data
export const mockSurveys: SurveyData[] = [
  {
    id: "survey-1",
    deviceId: "1",
    timestamp: "2024-01-15T10:30:00Z",
    coordinates: { lat: 28.6139, lng: 77.2090, elevation: 216 },
    accuracy: 0.02,
    surveyor: "John Smith",
    notes: "Routine survey check - all systems normal",
    temperature: 22.5,
    weather: "Clear",
  },
  {
    id: "survey-2",
    deviceId: "2",
    timestamp: "2024-01-15T10:25:00Z",
    coordinates: { lat: 28.7041, lng: 77.1025, elevation: 223 },
    accuracy: 0.01,
    surveyor: "Jane Doe",
    notes: "Monitoring station data collection",
    temperature: 21.8,
    weather: "Partly Cloudy",
  },
];

// Mock Configuration Data
export const mockConfig = {
  apiVersion: "1.0.0",
  lastUpdated: "2024-01-15T10:00:00Z",
  systemStatus: "MOCK_MODE",
};

export const mockCatastropheTypes = [
  { value: "LEAK", label: "Leak" },
  { value: "BURST", label: "Burst" },
  { value: "BLOCKAGE", label: "Blockage" },
  { value: "CORROSION", label: "Corrosion" },
  { value: "SUBSIDENCE", label: "Subsidence" },
  { value: "THIRD_PARTY_DAMAGE", label: "Third Party Damage" },
];

export const mockDeviceTypes = [
  { value: "TRIMBLE_SPS986", label: "Trimble SPS986" },
  { value: "MONITORING_STATION", label: "Monitoring Station" },
  { value: "SURVEY_EQUIPMENT", label: "Survey Equipment" },
];

export const mockValveTypes = [
  { value: "GATE", label: "Gate Valve" },
  { value: "BALL", label: "Ball Valve" },
  { value: "BUTTERFLY", label: "Butterfly Valve" },
  { value: "CHECK", label: "Check Valve" },
  { value: "RELIEF", label: "Relief Valve" },
];

export const mockPipelineMaterials = [
  { value: "STEEL", label: "Steel" },
  { value: "HDPE", label: "HDPE" },
  { value: "PVC", label: "PVC" },
  { value: "CONCRETE", label: "Concrete" },
];

export const mockStatusOptions = {
  device: [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "ERROR", label: "Error" },
  ],
  pipeline: [
    { value: "OPERATIONAL", label: "Operational" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "DAMAGED", label: "Damaged" },
    { value: "INACTIVE", label: "Inactive" },
  ],
  valve: [
    { value: "OPEN", label: "Open" },
    { value: "CLOSED", label: "Closed" },
    { value: "PARTIALLY_OPEN", label: "Partially Open" },
    { value: "FAULT", label: "Fault" },
  ],
  catastrophe: [
    { value: "REPORTED", label: "Reported" },
    { value: "INVESTIGATING", label: "Investigating" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ],
};

// Helper function to create paginated response
export function createMockPaginatedResponse<T>(
  data: T[],
  params: { page?: number; limit?: number } = {}
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 100;
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    success: true,
    data: paginatedData,
    message: "Data retrieved successfully (Mock Mode)",
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

// Helper function to create API response
export function createMockApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    message: "Data retrieved successfully (Mock Mode)",
    timestamp: new Date().toISOString(),
  };
}
