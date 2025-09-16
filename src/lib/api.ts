import {
  mockDevices,
  mockPipelines,
  mockValves,
  mockCatastrophes,
  mockSurveys,
  mockConfig,
  mockCatastropheTypes,
  mockDeviceTypes,
  mockValveTypes,
  mockPipelineMaterials,
  mockStatusOptions,
  createMockPaginatedResponse,
  createMockApiResponse,
} from "./mockData";

const RAW_API_URL = (import.meta.env.VITE_API_URL ?? "").toString().trim();
const CLEANED_API_URL = RAW_API_URL.replace(/^['"]|['"]$/g, "");
const API_BASE_URL = CLEANED_API_URL || "/api";
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface GeolocationPoint extends Coordinates {
  pointType: "START" | "END" | "NODE" | "JUNCTION" | "VALVE" | "DEVICE";
  description?: string;
  accuracy?: number; // GPS accuracy in meters
}

export interface ConsumerCategory {
  type: "INDUSTRIAL" | "DOMESTIC" | "COMMERCIAL" | "MUNICIPAL" | "AGRICULTURAL";
  subCategory?: string;
  estimatedConsumption?: number; // in cubic meters per day
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

export interface OperatingPressure {
  nominal: number; // Typical operating pressure
  minimum: number; // Minimum safe operating pressure
  maximum: number; // Maximum allowable operating pressure
  unit: "BAR" | "PSI" | "KPA";
  testPressure?: number; // Pressure used for testing
}

export interface PipeSpecifications {
  diameter: {
    value: number;
    unit: "MM" | "INCHES";
    nominalSize?: string; // e.g., "DN500", "6-inch"
  };
  material: "STEEL" | "HDPE" | "PVC" | "CONCRETE" | "CAST_IRON" | "COPPER" | "POLYETHYLENE" | "OTHER";
  materialGrade?: string; // e.g., "API 5L X65", "PE100"
  wallThickness?: number;
  coatingType?: string;
  length?: {
    value: number;
    unit: "METERS" | "FEET";
  };
  jointType?: "WELDED" | "FLANGED" | "THREADED" | "COMPRESSION" | "FUSION";
}

export interface InstallationDetails {
  installationYear: number;
  commissioningDate?: string;
  installationMethod?: "OPEN_CUT" | "TRENCHLESS" | "DIRECTIONAL_DRILLING" | "MICRO_TUNNELING";
  depth?: {
    value: number;
    unit: "METERS" | "FEET";
  };
  soilType?: string;
  contractor?: string;
  inspector?: string;
  asBuiltDrawingRef?: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "ERROR";
  coordinates: Coordinates;
  modelName?: string;
  surveyor?: string;
  batteryLevel?: number;
  lastSeen?: string;
  accuracy?: number;
  serialNumber?: string;
}

export interface DeviceCreateUpdate {
  name: string;
  type: string;
  status: Device["status"];
  modelName?: string;
}

export interface PipelineSegment {
  id: string;
  name: string;
  status: "OPERATIONAL" | "MAINTENANCE" | "DAMAGED" | "INACTIVE";
  
  // Comprehensive spatial feature attributes
  specifications: PipeSpecifications;
  operatingPressure: OperatingPressure;
  installation: InstallationDetails;
  consumerCategory?: ConsumerCategory;
  
  // Geolocation with detailed points
  coordinates: GeolocationPoint[]; // Start, end, and intermediate points
  elevationProfile?: {
    points: Array<{
      distance: number; // Distance from start in meters
      elevation: number; // Elevation at this point
      coordinates: Coordinates;
    }>;
    gradient?: number; // Overall gradient percentage
  };
  
  // Maintenance and inspection data
  lastInspection?: string;
  nextInspection?: string;
  maintenanceHistory?: Array<{
    date: string;
    type: "INSPECTION" | "REPAIR" | "REPLACEMENT" | "CLEANING";
    description: string;
    cost?: number;
    contractor?: string;
  }>;
  
  // Performance metrics
  flowRate?: {
    current: number;
    maximum: number;
    unit: "LPS" | "GPM" | "M3H";
  };
  
  // Associated assets
  connectedValves?: string[]; // Array of valve IDs
  connectedDevices?: string[]; // Array of device IDs
  
  // Documentation
  drawings?: Array<{
    type: "AS_BUILT" | "DESIGN" | "INSPECTION" | "REPAIR";
    title: string;
    url: string;
    uploadDate: string;
  }>;
  
  // Compliance and certifications
  standards?: string[]; // e.g., ["API 5L", "ASME B31.8", "ISO 9001"]
  certifications?: Array<{
    type: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    certificateNumber: string;
  }>;
}

export interface Valve {
  id: string;
  name: string;
  type: "GATE" | "BALL" | "BUTTERFLY" | "CHECK" | "RELIEF";
  status: "OPEN" | "CLOSED" | "PARTIALLY_OPEN" | "FAULT";
  coordinates: Coordinates;
  diameter?: number;
  pressure?: number;
  installDate?: string;
  lastMaintenance?: string;
  pipelineId?: string;
}

export interface Catastrophe {
  id: string;
  type:
    | "LEAK"
    | "BURST"
    | "BLOCKAGE"
    | "CORROSION"
    | "SUBSIDENCE"
    | "THIRD_PARTY_DAMAGE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "INVESTIGATING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  coordinates: Coordinates;
  description?: string;
  reportedAt: string;
  resolvedAt?: string;
  reportedBy?: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  pipelineId?: string;
}

export interface AssetType {
  id: string;
  name: string;
  isSurveyElement: boolean;
  surveyCategoryId: string | null;
  menuName?: string | null;
  menuOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetProperty {
  id: string;
  name: string;
  dataType: number;
  isRequired: boolean;
  order?: number | null;
  options?: string | null;
  valueUnit?: string | null;
  assetTypeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValveOperation {
  id: string;
  valveId: string;
  operation: "OPEN" | "CLOSE" | "MAINTAIN" | "INSPECT" | "REPAIR";
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "SCHEDULED";
  timestamp: string;
  operator?: string;
  reason?: string;
  notes?: string;
  duration?: number;
}

export interface SurveyData {
  id: string;
  deviceId: string;
  timestamp: string;
  coordinates: Coordinates;
  accuracy?: number;
  surveyor?: string;
  notes?: string;
  temperature?: number;
  weather?: string;
}

export interface UserRegistrationRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: "MANAGER" | "SURVEY_MANAGER";
  company: string;
}

export interface UserRegistrationResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "MANAGER" | "SURVEY_MANAGER";
  company: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface UserListResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: UserData[];
}

export interface UserUpdateRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "MANAGER" | "SURVEY_MANAGER";
  company?: string;
  isActive?: boolean;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: UserData | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: string;
}

export interface ChangePasswordRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: string;
}

import type { SurveyCategory as SurveyCategoryType, DeviceAssignment, Survey as AdminSurvey } from "@/types/admin";

const DEMO_USERS: UserData[] = [
  {
    id: "1",
    email: "john.smith@company.com",
    firstName: "John",
    lastName: "Smith",
    role: "ADMIN",
    company: "Infrastep",
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    lastLogin: "2024-08-29T09:30:00Z"
  },
  {
    id: "2",
    email: "sarah.johnson@company.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "MANAGER",
    company: "Infrastep",
    isActive: true,
    createdAt: "2024-02-20T14:30:00Z",
    lastLogin: "2024-08-28T16:45:00Z"
  },
  {
    id: "3",
    email: "mike.wilson@company.com",
    firstName: "Mike",
    lastName: "Wilson",
    role: "SURVEY_MANAGER",
    company: "Infrastep",
    isActive: true,
    createdAt: "2024-03-10T09:15:00Z",
    lastLogin: "2024-08-29T08:15:00Z"
  },
  {
    id: "4",
    email: "emily.davis@company.com",
    firstName: "Emily",
    lastName: "Davis",
    role: "SURVEY_MANAGER",
    company: "Infrastep",
    isActive: false,
    createdAt: "2024-01-25T11:20:00Z",
    lastLogin: "2024-08-25T13:30:00Z"
  }
];

class ApiClient {
  private baseURL: string;
  private useMockData: boolean = false;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL?.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  }


  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    // If we're already in mock mode, don't try the real API
    if (this.useMockData) {
      throw new Error("Using mock data");
    }

    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      // Add timeout to requests using AbortController (configurable)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const configWithTimeout = {
        ...config,
        signal: controller.signal
      };

      const response = await fetch(url, configWithTimeout);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Mock stores for assets when API is unavailable
  private mockAssetTypes: AssetType[] = [
    { id: "AT_001", name: "Valve", isSurveyElement: true, surveyCategoryId: "CAT_001", menuName: "Valve", menuOrder: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "AT_002", name: "Manhole", isSurveyElement: true, surveyCategoryId: "CAT_003", menuName: "Manhole", menuOrder: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  private mockAssetProperties: AssetProperty[] = [
    { id: "AP_001", name: "Diameter", dataType: 1, isRequired: true, order: 1, options: null, valueUnit: "mm", assetTypeId: "AT_001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "AP_002", name: "Valve Type", dataType: 2, isRequired: true, order: 2, options: JSON.stringify(["Gate","Ball","Butterfly"]), valueUnit: null, assetTypeId: "AT_001", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  private filterMockData<T>(data: T[], params?: any): T[] {
    let filtered = [...data];
    
    if (params?.status) {
      filtered = filtered.filter((item: any) => item.status === params.status);
    }
    
    if (params?.type) {
      filtered = filtered.filter((item: any) => item.type === params.type);
    }
    
    if (params?.material) {
      filtered = filtered.filter((item: any) => item.material === params.material);
    }
    
    if (params?.severity) {
      filtered = filtered.filter((item: any) => item.severity === params.severity);
    }
    
    if (params?.deviceId) {
      filtered = filtered.filter((item: any) => item.deviceId === params.deviceId);
    }
    
    if (params?.surveyor) {
      filtered = filtered.filter((item: any) => item.surveyor === params.surveyor);
    }
    
    return filtered;
  }

  // Asset Types endpoints
  async getAssetTypes(params?: { page?: number; limit?: number; surveyCategoryId?: string; search?: string; }): Promise<PaginatedResponse<AssetType>> {
    try {
      const sp = new URLSearchParams();
      if (params?.page) sp.append("page", String(params.page));
      if (params?.limit) sp.append("limit", String(params.limit));
      if (params?.surveyCategoryId) sp.append("surveyCategoryId", params.surveyCategoryId);
      if (params?.search) sp.append("search", params.search);
      const q = sp.toString();

      // Prefer external API naming and normalize its shape
      const raw: any = await this.request<any>(`/AssetTypes${q ? `?${q}` : ""}`);

      const timestamp = raw?.timestamp || new Date().toISOString();

      const rawItems = Array.isArray(raw?.data?.data)
        ? raw.data.data
        : Array.isArray(raw?.data?.items)
          ? raw.data.items
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];

      const mapped: AssetType[] = rawItems.map((it: any) => {
        const fallbackId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
          ? crypto.randomUUID()
          : `${Date.now()}`;
        const createdAt = it.createdAt ?? it.CreatedAt ?? it.created_at ?? raw?.timestamp ?? new Date().toISOString();
        const updatedAt = it.updatedAt ?? it.UpdatedAt ?? it.updated_at ?? "";
        const id = String(it.id ?? it.ID ?? it.atId ?? it.AT_ID ?? fallbackId);
        const name = it.name ?? it.Name ?? it.atName ?? it.AT_NAME ?? "";
        const isSurveyElement = Boolean(it.isSurveyElement ?? it.IsSurveyElement ?? it.atIsSurveyElement ?? it.AT_IS_SURVEY_ELEMENT ?? false);
        const surveyCategoryId = it.surveyCategoryId ?? it.SurveyCategoryId ?? it.scId ?? it.SC_ID ?? null;
        const menuName = it.menuName ?? it.MenuName ?? it.atMenuName ?? it.AT_MENU_NAME ?? null;
        const menuOrder = it.menuOrder ?? it.MenuOrder ?? it.atMenuOrder ?? it.AT_MENU_ORDER ?? null;

        return {
          id: String(id),
          name: String(name),
          isSurveyElement,
          surveyCategoryId: surveyCategoryId != null ? String(surveyCategoryId) : null,
          menuName: menuName != null ? String(menuName) : null,
          menuOrder: menuOrder != null ? Number(menuOrder) : null,
          createdAt,
          updatedAt,
        } as AssetType;
      });

      const pagination = raw?.data?.pagination || {
        page: params?.page ?? 1,
        limit: params?.limit ?? mapped.length,
        total: mapped.length,
        totalPages: 1,
      };

      return {
        success: (raw?.status_code ?? 200) >= 200 && (raw?.status_code ?? 200) < 300,
        data: mapped,
        message: raw?.message,
        timestamp,
        pagination,
      };
    } catch (primaryError) {
      try {
        // Fallback to internal route naming
        const sp = new URLSearchParams();
        if (params?.page) sp.append("page", String(params.page));
        if (params?.limit) sp.append("limit", String(params.limit));
        if (params?.surveyCategoryId) sp.append("surveyCategoryId", params.surveyCategoryId);
        if (params?.search) sp.append("search", params.search);
        const q = sp.toString();
        return await this.request<PaginatedResponse<AssetType>>(`/asset-types${q ? `?${q}` : ""}`);
      } catch (secondaryError) {
        return {
          success: true,
          data: [],
          message: "",
          timestamp: new Date().toISOString(),
          pagination: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 0,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }
  }

  async createAssetType(payload: Omit<AssetType, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<AssetType>> {
    try {
      return await this.request<ApiResponse<AssetType>>(`/AssetTypes`, { method: "POST", body: JSON.stringify(payload) });
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<AssetType>>(`/asset-types`, { method: "POST", body: JSON.stringify(payload) });
      } catch (secondaryError) {
        throw secondaryError;
      }
    }
  }

  async updateAssetType(id: string, payload: Partial<AssetType>): Promise<ApiResponse<AssetType>> {
    try {
      return await this.request<ApiResponse<AssetType>>(`/AssetTypes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<AssetType>>(`/asset-types/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } catch (secondaryError) {
        throw secondaryError;
      }
    }
  }

  async deleteAssetType(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<ApiResponse<void>>(`/AssetTypes/${id}`, { method: "DELETE" });
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<void>>(`/asset-types/${id}`, { method: "DELETE" });
      } catch (secondaryError) {
        throw secondaryError;
      }
    }
  }

  // Asset Properties endpoints
  async getAssetProperties(params?: { page?: number; limit?: number; assetTypeId?: string; search?: string; }): Promise<PaginatedResponse<AssetProperty>> {
    try {
      const sp = new URLSearchParams();
      if (params?.page) sp.append("page", String(params.page));
      if (params?.limit) sp.append("limit", String(params.limit));
      if (params?.assetTypeId) {
        sp.append("assetTypeId", params.assetTypeId);
        sp.append("atId", params.assetTypeId); // try both for compatibility
      }
      if (params?.search) sp.append("search", params.search);

      // Prefer external API naming and normalize its shape
      const raw: any = await this.request<any>(`/AssetProperties${sp.toString() ? `?${sp.toString()}` : ""}`);

      const timestamp = raw?.timestamp || new Date().toISOString();

      const rawItems = Array.isArray(raw?.data?.data)
        ? raw.data.data
        : Array.isArray(raw?.data?.items)
          ? raw.data.items
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];

      const mapped: AssetProperty[] = rawItems.map((it: any) => {
        const fallbackId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
          ? crypto.randomUUID()
          : `${Date.now()}`;

        const id = String(it.id ?? it.ID ?? it.apId ?? it.AP_ID ?? fallbackId);
        const name = it.name ?? it.Name ?? it.apName ?? it.AP_NAME ?? "";
        const dataType = Number(it.dataType ?? it.DataType ?? it.apDataType ?? it.AP_DATA_TYPE ?? 0);
        const isRequired = Boolean(it.isRequired ?? it.IsRequired ?? it.apIsRequired ?? it.AP_IS_REQUIRED ?? false);
        const order = it.order ?? it.Order ?? it.apOrder ?? it.AP_ORDER ?? null;
        const options = it.options ?? it.Options ?? it.apOptions ?? it.AP_OPTIONS ?? null;
        const valueUnit = it.valueUnit ?? it.ValueUnit ?? it.apValueUnit ?? it.AP_VALUE_UNIT ?? null;
        const assetTypeId = String(it.assetTypeId ?? it.AssetTypeId ?? it.atId ?? it.AT_ID ?? "");
        const createdAt = it.createdAt ?? it.CreatedAt ?? it.created_at ?? timestamp;
        const updatedAt = it.updatedAt ?? it.UpdatedAt ?? it.updated_at ?? "";

        return {
          id,
          name: String(name),
          dataType,
          isRequired,
          order: order != null ? Number(order) : null,
          options: options != null && options !== "" ? String(options) : null,
          valueUnit: valueUnit != null && valueUnit !== "" ? String(valueUnit) : null,
          assetTypeId,
          createdAt,
          updatedAt,
        } as AssetProperty;
      });

      const pagination = raw?.data?.pagination || {
        page: params?.page ?? 1,
        limit: params?.limit ?? mapped.length,
        total: mapped.length,
        totalPages: 1,
      };

      return {
        success: (raw?.status_code ?? 200) >= 200 && (raw?.status_code ?? 200) < 300,
        data: mapped,
        message: raw?.message,
        timestamp,
        pagination,
      };
    } catch (primaryError) {
      try {
        // Fallback to internal route naming
        const sp = new URLSearchParams();
        if (params?.page) sp.append("page", String(params.page));
        if (params?.limit) sp.append("limit", String(params.limit));
        if (params?.assetTypeId) sp.append("assetTypeId", params.assetTypeId);
        if (params?.search) sp.append("search", params.search);
        return await this.request<PaginatedResponse<AssetProperty>>(`/AssetProperties?${sp.toString()}`);
      } catch (error) {
        let data = [...this.mockAssetProperties];
        if (params?.assetTypeId) data = data.filter(p => p.assetTypeId === params.assetTypeId);
        if (params?.search) {
          const t = params.search.toLowerCase();
          data = data.filter(p => p.name.toLowerCase().includes(t));
        }
        return createMockPaginatedResponse(data, params);
      }
    }
  }

  async createAssetProperty(payload: Omit<AssetProperty, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<AssetProperty>> {
    try {
      return await this.request<ApiResponse<AssetProperty>>(`/AssetProperties`, { method: "POST", body: JSON.stringify(payload) });
    } catch (error) {
      const item: AssetProperty = { ...payload, id: `AP_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as AssetProperty;
      this.mockAssetProperties.push(item);
      return createMockApiResponse(item);
    }
  }

  async updateAssetProperty(id: string, payload: Partial<AssetProperty>): Promise<ApiResponse<AssetProperty>> {
    try {
      return await this.request<ApiResponse<AssetProperty>>(`/AssetProperties/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch (error) {
      const idx = this.mockAssetProperties.findIndex(p => p.id === id);
      if (idx === -1) throw error;
      this.mockAssetProperties[idx] = { ...this.mockAssetProperties[idx], ...payload, updatedAt: new Date().toISOString() };
      return createMockApiResponse(this.mockAssetProperties[idx]);
    }
  }

  async deleteAssetProperty(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<ApiResponse<void>>(`/AssetProperties/${id}`, { method: "DELETE" });
    } catch (error) {
      this.mockAssetProperties = this.mockAssetProperties.filter(p => p.id !== id);
      return createMockApiResponse(undefined as unknown as void);
    }
  }

  // Device endpoints
  async getDevices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedResponse<Device>> {
    // If already in mock mode, return mock data immediately
    if (this.useMockData) {
      console.log("📊 Using mock data for devices");
      const filteredData = this.filterMockData(mockDevices, params);
      return createMockPaginatedResponse(filteredData, params);
    }

    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.type) searchParams.append("type", params.type);

      const query = searchParams.toString();
      // Prefer uppercase /Device per backend convention, fallback to lowercase /devices
      const raw: any = await (async () => {
        try {
          return await this.request<any>(`/Device${query ? `?${query}` : ""}`);
        } catch (primaryError) {
          return await this.request<any>(`/devices${query ? `?${query}` : ""}`);
        }
      })();

      const timestamp = raw?.timestamp || new Date().toISOString();

      const rawItems = Array.isArray(raw?.data?.items)
        ? raw.data.items
        : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];

      const mapped: Device[] = rawItems.map((it: any) => {
        const id = String(it.id ?? it.ID ?? it.deviceId ?? it.DeviceId ?? it.device_id ?? `${Date.now()}`);
        const name = String(it.name ?? it.Name ?? it.deviceName ?? it.DeviceName ?? id);

        // Normalize status into allowed set
        const rawStatus = String(it.status ?? it.Status ?? it.deviceStatus ?? it.DeviceStatus ?? "").toUpperCase();
        const allowedStatuses = new Set(["ACTIVE", "INACTIVE", "MAINTENANCE", "ERROR"]);
        const status = (allowedStatuses.has(rawStatus) ? rawStatus : "ACTIVE") as Device["status"];

        // Use backend-provided type directly (uppercased) to support dynamic lists
        const type = String(it.type ?? it.Type ?? it.deviceType ?? it.DeviceType ?? "SURVEY_EQUIPMENT").toUpperCase();

        const lat = Number(it.lat ?? it.latitude ?? it.Latitude);
        const lng = Number(it.lng ?? it.longitude ?? it.Longitude);
        const coordinates = (!Number.isNaN(lat) && !Number.isNaN(lng))
          ? { lat, lng }
          : (it.coordinates && typeof it.coordinates.lat === "number" && typeof it.coordinates.lng === "number")
            ? { lat: it.coordinates.lat, lng: it.coordinates.lng }
            : { lat: 0, lng: 0 };

        const batteryLevel = typeof it.batteryLevel === "number" ? it.batteryLevel : undefined;
        const lastSeen = typeof it.lastSeen === "string" ? it.lastSeen : undefined;
        const accuracy = typeof it.accuracy === "number" ? it.accuracy : undefined;
        const modelName = it.modelName ?? it.ModelName ?? it.deviceModel ?? it.DeviceModel ?? undefined;

        return {
          id,
          name,
          type,
          status,
          coordinates,
          modelName: modelName != null ? String(modelName) : undefined,
          surveyor: it.surveyor ?? it.Surveyor ?? undefined,
          batteryLevel,
          lastSeen,
          accuracy,
        } as Device;
      });

      const pagination = raw?.data?.pagination || {
        page: params?.page ?? 1,
        limit: params?.limit ?? mapped.length,
        total: mapped.length,
        totalPages: 1,
      };

      return {
        success: (raw?.status_code ?? 200) >= 200 && (raw?.status_code ?? 200) < 300,
        data: mapped,
        message: raw?.message ?? raw?.status_message,
        timestamp,
        pagination,
      };
    } catch (error) {
      console.log("📊 Unexpected error while fetching devices, using mock");
      const filteredData = this.filterMockData(mockDevices, params);
      return createMockPaginatedResponse(filteredData, params);
    }
  }

  async getDevice(id: string): Promise<ApiResponse<Device>> {
    try {
      try {
        return await this.request<ApiResponse<Device>>(`/Device/${id}`);
      } catch (primaryError) {
        try {
          return await this.request<ApiResponse<Device>>(`/devices/${id}`);
        } catch (secondaryError) {
          const device = mockDevices.find(d => d.id === id);
          if (!device) {
            throw secondaryError;
          }
          return createMockApiResponse(device);
        }
      }
    } catch (error) {
      const device = mockDevices.find(d => d.id === id);
      if (!device) {
        throw error;
      }
      return createMockApiResponse(device);
    }
  }

  async createDevice(
    device: DeviceCreateUpdate,
  ): Promise<ApiResponse<Device>> {
    // Build body with only allowed fields
    const body: any = {
      name: device.name,
      type: device.type,
      status: device.status,
      ...(device.modelName !== undefined ? { modelName: device.modelName } : {}),
    };

    try {
      return await this.request<ApiResponse<Device>>("/Device", {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch (primaryError) {
      return await this.request<ApiResponse<Device>>("/devices", {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
  }

  async updateDevice(
    id: string,
    device: Partial<DeviceCreateUpdate>,
  ): Promise<ApiResponse<Device>> {
    // Build body with only allowed fields
    const body: any = {
      ...(device.name !== undefined ? { name: device.name } : {}),
      ...(device.type !== undefined ? { type: device.type } : {}),
      ...(device.status !== undefined ? { status: device.status } : {}),
      ...(device.modelName !== undefined ? { modelName: device.modelName } : {}),
    };

    try {
      return await this.request<ApiResponse<Device>>(`/Device/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (primaryError) {
      return await this.request<ApiResponse<Device>>(`/devices/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    }
  }

  async deleteDevice(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/devices/${id}`, {
      method: "DELETE",
    });
  }

  // Pipeline endpoints
  async getPipelines(params?: {
    page?: number;
    limit?: number;
    status?: string;
    material?: string;
  }): Promise<PaginatedResponse<PipelineSegment>> {
    // If already in mock mode, return mock data immediately
    if (this.useMockData) {
      console.log("📊 Using mock data for pipelines");
      const filteredData = this.filterMockData(mockPipelines, params);
      return createMockPaginatedResponse(filteredData, params);
    }

    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.material) searchParams.append("material", params.material);

      const query = searchParams.toString();
      return await this.request<PaginatedResponse<PipelineSegment>>(
        `/pipelines${query ? `?${query}` : ""}`,
      );
    } catch (error) {
      // Fallback to mock data
      console.log("📊 API failed, falling back to mock data for pipelines");
      const filteredData = this.filterMockData(mockPipelines, params);
      return createMockPaginatedResponse(filteredData, params);
    }
  }

  async getPipeline(id: string): Promise<ApiResponse<PipelineSegment>> {
    try {
      return await this.request<ApiResponse<PipelineSegment>>(`/pipelines/${id}`);
    } catch (error) {
      // Fallback to mock data
      const pipeline = mockPipelines.find(p => p.id === id);
      if (!pipeline) {
        throw new Error(`Pipeline with id ${id} not found`);
      }
      return createMockApiResponse(pipeline);
    }
  }

  async createPipeline(
    pipeline: Omit<PipelineSegment, "id">,
  ): Promise<ApiResponse<PipelineSegment>> {
    return this.request<ApiResponse<PipelineSegment>>("/pipelines", {
      method: "POST",
      body: JSON.stringify(pipeline),
    });
  }

  async updatePipeline(
    id: string,
    pipeline: Partial<PipelineSegment>,
  ): Promise<ApiResponse<PipelineSegment>> {
    return this.request<ApiResponse<PipelineSegment>>(`/pipelines/${id}`, {
      method: "PUT",
      body: JSON.stringify(pipeline),
    });
  }

  async deletePipeline(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/pipelines/${id}`, {
      method: "DELETE",
    });
  }

  // Valve endpoints
  async getValves(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedResponse<Valve>> {
    // If already in mock mode, return mock data immediately
    if (this.useMockData) {
      console.log("📊 Using mock data for valves");
      const filteredData = this.filterMockData(mockValves, params);
      return createMockPaginatedResponse(filteredData, params);
    }

    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.type) searchParams.append("type", params.type);

      const query = searchParams.toString();
      return await this.request<PaginatedResponse<Valve>>(
        `/valves${query ? `?${query}` : ""}`,
      );
    } catch (error) {
      // Fallback to mock data
      console.log("📊 API failed, falling back to mock data for valves");
      const filteredData = this.filterMockData(mockValves, params);
      return createMockPaginatedResponse(filteredData, params);
    }
  }

  async getValve(id: string): Promise<ApiResponse<Valve>> {
    try {
      return await this.request<ApiResponse<Valve>>(`/valves/${id}`);
    } catch (error) {
      // Fallback to mock data
      const valve = mockValves.find(v => v.id === id);
      if (!valve) {
        throw new Error(`Valve with id ${id} not found`);
      }
      return createMockApiResponse(valve);
    }
  }

  async createValve(valve: Omit<Valve, "id">): Promise<ApiResponse<Valve>> {
    return this.request<ApiResponse<Valve>>("/valves", {
      method: "POST",
      body: JSON.stringify(valve),
    });
  }

  async updateValve(
    id: string,
    valve: Partial<Valve>,
  ): Promise<ApiResponse<Valve>> {
    return this.request<ApiResponse<Valve>>(`/valves/${id}`, {
      method: "PUT",
      body: JSON.stringify(valve),
    });
  }

  async deleteValve(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/valves/${id}`, {
      method: "DELETE",
    });
  }

  // Survey Categories endpoints
  async getSurveyCategories(params?: { page?: number; limit?: number; search?: string; }): Promise<PaginatedResponse<SurveyCategoryType>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append("page", String(params.page));
    if (params?.limit) sp.append("limit", String(params.limit));
    if (params?.search) sp.append("search", params.search);
    const q = sp.toString();

    const tryPaths = [
      `/SurveyCategories${q ? `?${q}` : ""}`,
      `/surveyCategories${q ? `?${q}` : ""}`,
      `/survey-categories${q ? `?${q}` : ""}`,
    ];

    for (const path of tryPaths) {
      try {
        const raw: any = await this.request<any>(path);
        const timestamp = raw?.timestamp || new Date().toISOString();
        const items = Array.isArray(raw?.data?.items)
          ? raw.data.items
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw) ? raw : [];

        const mapped: SurveyCategoryType[] = items.map((it: any) => {
          const fallbackId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : `${Date.now()}`;
          const createdAt = it.createdAt ?? it.CreatedAt ?? it.created_at ?? raw?.timestamp ?? new Date().toISOString();
          const updatedAt = it.updatedAt ?? it.UpdatedAt ?? it.updated_at ?? "";
          return {
            id: String(it.id ?? it.ID ?? it.categoryId ?? it.CategoryId ?? fallbackId),
            name: it.name ?? it.Name ?? "",
            description: it.description ?? it.Description ?? "",
            createdAt,
            updatedAt,
          };
        });

        const pagination = raw?.data?.pagination || raw?.pagination || {
          page: params?.page ?? 1,
          limit: params?.limit ?? mapped.length,
          total: mapped.length,
          totalPages: 1,
        };

        return {
          success: true,
          data: mapped,
          message: raw?.message,
          timestamp,
          pagination,
        };
      } catch (_) {
        // try next
      }
    }

    return createMockPaginatedResponse<SurveyCategoryType>([], params);
  }

  async createSurveyCategory(payload: { name: string; description?: string; }): Promise<ApiResponse<SurveyCategoryType>> {
    try {
      return await this.request<ApiResponse<SurveyCategoryType>>(`/SurveyCategories`, { method: "POST", body: JSON.stringify(payload) });
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<SurveyCategoryType>>(`/survey-categories`, { method: "POST", body: JSON.stringify(payload) });
      } catch {
        const item: SurveyCategoryType = { id: `CAT_${Date.now()}`, name: payload.name, description: payload.description || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as SurveyCategoryType;
        return createMockApiResponse(item);
      }
    }
  }

  async updateSurveyCategory(id: string, payload: Partial<SurveyCategoryType>): Promise<ApiResponse<SurveyCategoryType>> {
    try {
      return await this.request<ApiResponse<SurveyCategoryType>>(`/SurveyCategories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<SurveyCategoryType>>(`/survey-categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } catch {
        const item: SurveyCategoryType = { id, name: payload.name || "", description: payload.description || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as SurveyCategoryType;
        return createMockApiResponse(item);
      }
    }
  }

  async deleteSurveyCategory(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<ApiResponse<void>>(`/SurveyCategories/${id}`, { method: "DELETE" });
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<void>>(`/survey-categories/${id}`, { method: "DELETE" });
      } catch {
        return createMockApiResponse(undefined as unknown as void);
      }
    }
  }

  // Catastrophe endpoints
  async getCatastrophes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    type?: string;
  }): Promise<PaginatedResponse<Catastrophe>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.severity) searchParams.append("severity", params.severity);
      if (params?.type) searchParams.append("type", params.type);

      const query = searchParams.toString();
      return await this.request<PaginatedResponse<Catastrophe>>(
        `/catastrophes${query ? `?${query}` : ""}`,
      );
    } catch (error) {
      // Fallback to mock data
      const filteredData = this.filterMockData(mockCatastrophes, params);
      return createMockPaginatedResponse(filteredData, params);
    }
  }

  async getCatastrophe(id: string): Promise<ApiResponse<Catastrophe>> {
    try {
      return await this.request<ApiResponse<Catastrophe>>(`/catastrophes/${id}`);
    } catch (error) {
      // Fallback to mock data
      const catastrophe = mockCatastrophes.find(c => c.id === id);
      if (!catastrophe) {
        throw new Error(`Catastrophe with id ${id} not found`);
      }
      return createMockApiResponse(catastrophe);
    }
  }

  async createCatastrophe(
    catastrophe: Omit<Catastrophe, "id" | "reportedAt">,
  ): Promise<ApiResponse<Catastrophe>> {
    return this.request<ApiResponse<Catastrophe>>("/catastrophes", {
      method: "POST",
      body: JSON.stringify(catastrophe),
    });
  }

  async updateCatastrophe(
    id: string,
    catastrophe: Partial<Catastrophe>,
  ): Promise<ApiResponse<Catastrophe>> {
    return this.request<ApiResponse<Catastrophe>>(`/catastrophes/${id}`, {
      method: "PUT",
      body: JSON.stringify(catastrophe),
    });
  }

  async deleteCatastrophe(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/catastrophes/${id}`, {
      method: "DELETE",
    });
  }

  // Survey endpoints
  async getSurveys(params?: {
    page?: number;
    limit?: number;
    deviceId?: string;
    surveyor?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<SurveyData>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.deviceId) searchParams.append("deviceId", params.deviceId);
      if (params?.surveyor) searchParams.append("surveyor", params.surveyor);
      if (params?.startDate) searchParams.append("startDate", params.startDate);
      if (params?.endDate) searchParams.append("endDate", params.endDate);

      const query = searchParams.toString();
      return await this.request<PaginatedResponse<SurveyData>>(
        `/surveys${query ? `?${query}` : ""}`,
      );
    } catch (error) {
      // Fallback to mock data
      const filteredData = this.filterMockData(mockSurveys, params);
      return createMockPaginatedResponse(filteredData, params);
    }
  }

  async getSurvey(id: string): Promise<ApiResponse<SurveyData>> {
    try {
      return await this.request<ApiResponse<SurveyData>>(`/surveys/${id}`);
    } catch (error) {
      // Fallback to mock data
      const survey = mockSurveys.find(s => s.id === id);
      if (!survey) {
        throw new Error(`Survey with id ${id} not found`);
      }
      return createMockApiResponse(survey);
    }
  }

  // Device Assignments endpoints
  private mapDeviceAssignment(raw: any): DeviceAssignment {
    const id = String(raw.id ?? raw.ID ?? raw.assignmentId ?? raw.AssignmentId ?? `ASN_${Date.now()}`);
    const deviceId = String(raw.deviceId ?? raw.DeviceId ?? raw.devId ?? raw.DEVICE_ID ?? "");
    const surveyId = String(raw.surveyId ?? raw.SurveyId ?? raw.srvId ?? raw.SURVEY_ID ?? "");
    const deviceName = raw.deviceName ?? raw.DeviceName ?? null;
    const surveyName = raw.surveyName ?? raw.SurveyName ?? null;

    const from = raw.fromDate ?? raw.FromDate ?? raw.assignedDate ?? raw.AssignedDate ?? raw.startDate ?? raw.StartDate;
    const to = raw.toDate ?? raw.ToDate ?? raw.unassignedDate ?? raw.UnassignedDate ?? raw.endDate ?? raw.EndDate;

    const status = raw.status ?? raw.Status ?? null;
    const isActive = typeof raw.isActive === "boolean" ? raw.isActive : (status ? String(status).toUpperCase() === "ACTIVE" : (to ? new Date(to) > new Date() : true));

    const createdAt = raw.createdAt ?? raw.CreatedAt ?? raw.created_at ?? new Date().toISOString();

    return {
      id,
      deviceId,
      deviceName: deviceName ?? "",
      surveyId,
      surveyName: surveyName ?? undefined,
      fromDate: from ? String(from) : new Date().toISOString(),
      toDate: to ? String(to) : new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      isActive,
      createdAt: String(createdAt),
    } as DeviceAssignment;
  }

  async getDeviceAssignments(params?: { page?: number; limit?: number; deviceId?: string; surveyId?: string; status?: string; }): Promise<PaginatedResponse<DeviceAssignment>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append("page", String(params.page));
    if (params?.limit) sp.append("limit", String(params.limit));
    if (params?.deviceId) sp.append("deviceId", params.deviceId);
    if (params?.surveyId) sp.append("surveyId", params.surveyId);
    if (params?.status) sp.append("status", params.status);
    const q = sp.toString();

    try {
      const raw: any = await this.request<any>(`/DeviceAssignments${q ? `?${q}` : ""}`);
      const items = Array.isArray(raw?.data?.items) ? raw.data.items : Array.isArray(raw?.data?.data) ? raw.data.data : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      const mapped = items.map((it: any) => this.mapDeviceAssignment(it));
      const pagination = raw?.data?.pagination || raw?.pagination || {
        page: params?.page ?? 1,
        limit: params?.limit ?? mapped.length,
        total: mapped.length,
        totalPages: 1,
      };
      return {
        success: true,
        data: mapped,
        message: raw?.message,
        timestamp: raw?.timestamp || new Date().toISOString(),
        pagination,
      };
    } catch (primaryError) {
      try {
        return await this.request<PaginatedResponse<DeviceAssignment>>(`/device-assignments${q ? `?${q}` : ""}`);
      } catch (secondaryError) {
        // Fallback to empty when API unavailable
        return createMockPaginatedResponse<DeviceAssignment>([], params);
      }
    }
  }

  async getDeviceAssignment(id: string): Promise<ApiResponse<DeviceAssignment>> {
    try {
      const raw = await this.request<any>(`/DeviceAssignments/${id}`);
      const item = this.mapDeviceAssignment(raw?.data ?? raw);
      return { success: true, data: item, message: raw?.message, timestamp: raw?.timestamp || new Date().toISOString() };
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<DeviceAssignment>>(`/device-assignments/${id}`);
      } catch (secondaryError) {
        throw secondaryError;
      }
    }
  }

  async createDeviceAssignment(payload: { deviceId: string; surveyId: string; fromDate: string; toDate: string; assignedBy?: string; notes?: string; }): Promise<ApiResponse<DeviceAssignment>> {
    // Normalize IDs to numbers when possible (some backends require ints)
    const deviceIdNum = Number(payload.deviceId);
    const surveyIdNum = Number(payload.surveyId);
    const assignedByNum = Number.isFinite(Number(payload.assignedBy))
      ? Number(payload.assignedBy)
      : 1; // default admin user id

    // Provide multiple field aliases for broad backend compatibility
    const body: any = {
      // canonical
      deviceId: Number.isFinite(deviceIdNum) ? deviceIdNum : payload.deviceId,
      surveyId: Number.isFinite(surveyIdNum) ? surveyIdNum : payload.surveyId,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
      // aliases commonly expected by .NET backends
      from: payload.fromDate,
      to: payload.toDate,
      assignedDate: payload.fromDate,
      unassignedDate: payload.toDate,
      UnAssignedDate: payload.toDate,
      assignedBy: assignedByNum,
      notes: payload.notes,
    };

    try {
      const raw = await this.request<any>(`/DeviceAssignments`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const item = this.mapDeviceAssignment(raw?.data ?? raw);
      return {
        success: true,
        data: item,
        message: raw?.message,
        timestamp: raw?.timestamp || new Date().toISOString(),
      };
    } catch (primaryError: any) {
      const msg = String(primaryError?.message || "");
      // Only try lowercase fallback on true 404; otherwise bubble the original error (e.g., 400 validation)
      if (/404/.test(msg)) {
        return await this.request<ApiResponse<DeviceAssignment>>(`/device-assignments`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      throw primaryError;
    }
  }

  async updateDeviceAssignment(id: string, payload: { deviceId?: string | number; surveyId?: string | number; fromDate?: string; toDate?: string; assignedBy?: string | number; unassignedDate?: string; status?: string; notes?: string; }): Promise<ApiResponse<DeviceAssignment>> {
    const deviceIdNum = Number(payload.deviceId);
    const surveyIdNum = Number(payload.surveyId);
    const assignedByNum = Number.isFinite(Number(payload.assignedBy))
      ? Number(payload.assignedBy)
      : undefined;
    const body: any = {
      ...(payload.deviceId !== undefined ? { deviceId: Number.isFinite(deviceIdNum) ? deviceIdNum : payload.deviceId } : {}),
      ...(payload.surveyId !== undefined ? { surveyId: Number.isFinite(surveyIdNum) ? surveyIdNum : payload.surveyId } : {}),
      ...(payload.fromDate ? { fromDate: payload.fromDate, from: payload.fromDate, assignedDate: payload.fromDate } : {}),
      ...(payload.toDate ? { toDate: payload.toDate, to: payload.toDate, unassignedDate: payload.toDate, UnAssignedDate: payload.toDate } : {}),
      ...(payload.unassignedDate ? { unassignedDate: payload.unassignedDate, UnAssignedDate: payload.unassignedDate } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(assignedByNum !== undefined ? { assignedBy: assignedByNum } : {}),
    };
    try {
      const raw = await this.request<any>(`/DeviceAssignments/${id}`, { method: "PUT", body: JSON.stringify(body) });
      const item = this.mapDeviceAssignment(raw?.data ?? raw);
      return { success: true, data: item, message: raw?.message, timestamp: raw?.timestamp || new Date().toISOString() };
    } catch (primaryError: any) {
      const msg = String(primaryError?.message || "");
      if (/404/.test(msg)) {
        return await this.request<ApiResponse<DeviceAssignment>>(`/device-assignments/${id}`, { method: "PUT", body: JSON.stringify(body) });
      }
      throw primaryError;
    }
  }

  async deleteDeviceAssignment(id: string): Promise<ApiResponse<void>> {
    try {
      return await this.request<ApiResponse<void>>(`/DeviceAssignments/${id}`, { method: "DELETE" });
    } catch (primaryError) {
      return await this.request<ApiResponse<void>>(`/device-assignments/${id}`, { method: "DELETE" });
    }
  }

  async getAssignmentsBySurvey(surveyId: string): Promise<ApiResponse<DeviceAssignment[]>> {
    try {
      const raw = await this.request<any>(`/DeviceAssignments/by-survey/${encodeURIComponent(surveyId)}`);
      const items = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      return {
        success: true,
        data: items.map((it: any) => this.mapDeviceAssignment(it)),
        message: raw?.message,
        timestamp: raw?.timestamp || new Date().toISOString(),
      };
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<DeviceAssignment[]>>(`/device-assignments/by-survey/${encodeURIComponent(surveyId)}`);
      } catch (secondaryError) {
        return createMockApiResponse<DeviceAssignment[]>([]);
      }
    }
  }

  async getAssignmentConflicts(params: { deviceId: string; startDate: string; endDate: string; }): Promise<ApiResponse<any[]>> {
    const sp = new URLSearchParams({ deviceId: params.deviceId, startDate: params.startDate, endDate: params.endDate });
    try {
      return await this.request<ApiResponse<any>>(`/DeviceAssignments/conflicts?${sp.toString()}`);
    } catch (primaryError) {
      try {
        return await this.request<ApiResponse<any>>(`/device-assignments/conflicts?${sp.toString()}`);
      } catch (secondaryError) {
        return createMockApiResponse<any[]>([]);
      }
    }
  }

  // Survey Master endpoints (admin surveys)
  private mapSurveyMaster(raw: any): AdminSurvey {
    // Support multiple backend field conventions
    const id = String(
      raw.id ?? raw.ID ?? raw.surveyId ?? raw.SurveyId ?? raw.smId ?? raw.SM_ID ?? `SUR_${Date.now()}`
    );
    const name = String(
      raw.name ?? raw.surveyName ?? raw.SurveyName ?? raw.smName ?? raw.SM_NAME ?? ""
    );
    const categoryId = String(
      raw.categoryId ?? raw.CategoryId ?? raw.category_id ?? raw.scId ?? raw.SC_ID ?? ""
    );
    const categoryName = raw.categoryName ?? raw.CategoryName ?? raw.scName ?? raw.ScName ?? undefined;

    const start =
      raw.startDate ?? raw.StartDate ?? raw.fromDate ?? raw.FromDate ?? raw.smStartDate ?? raw.SM_START_DATE;
    const end =
      raw.endDate ?? raw.EndDate ?? raw.toDate ?? raw.ToDate ?? raw.smEndDate ?? raw.SM_END_DATE;

    const statusRaw = (raw.status ?? raw.Status ?? raw.smStatus ?? raw.SM_STATUS ?? "ACTIVE").toString();
    const status = statusRaw.toUpperCase() === "CLOSED" ? "CLOSED" : "ACTIVE";

    const createdBy = String(raw.createdBy ?? raw.CreatedBy ??  raw.createdByName ?? "");
    const createdAt = String(raw.createdAt ?? raw.CreatedAt ?? raw.timestamp ?? new Date().toISOString());
    const updatedAt = String(raw.updatedAt ?? raw.UpdatedAt ?? createdAt);

    const toDateOnly = (val: any): string | undefined => {
      if (!val) return undefined;
      const s = String(val);
      const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
      if (s.includes("T")) return s.split("T")[0];
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
      return s.slice(0, 10);
    };

    return {
      id,
      name,
      categoryId,
      categoryName,
      startDate: toDateOnly(start) || createdAt.substring(0, 10),
      endDate: toDateOnly(end) || createdAt.substring(0, 10),
      status,
      createdBy,
      createdAt,
      updatedAt,
    } as AdminSurvey;
  }

  async getSurveyMasters(params?: { page?: number; limit?: number; status?: string; }): Promise<PaginatedResponse<AdminSurvey>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append("page", String(params.page));
    if (params?.limit) sp.append("limit", String(params.limit));
    if (params?.status) sp.append("status", params.status);
    const q = sp.toString();

    const tryPaths = [
      `/api/SurveyMaster${q ? `?${q}` : ""}`,
      `/SurveyMaster${q ? `?${q}` : ""}`,
      `/survey-masters${q ? `?${q}` : ""}`,
      `/surveys-admin${q ? `?${q}` : ""}`,
    ];

    for (const path of tryPaths) {
      try {
        const raw: any = await this.request<any>(path);
        const timestamp = raw?.timestamp || new Date().toISOString();

        const rawItems = Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data?.items)
            ? raw.data.items
            : Array.isArray(raw?.data)
              ? raw.data
              : Array.isArray(raw)
                ? raw
                : [];

        const mapped: AdminSurvey[] = rawItems.map((it: any) => this.mapSurveyMaster(it));

        const pagination = raw?.data?.pagination || raw?.pagination || {
          page: params?.page ?? 1,
          limit: params?.limit ?? mapped.length,
          total: mapped.length,
          totalPages: 1,
        };

        return {
          success: true,
          data: mapped,
          message: raw?.message,
          timestamp,
          pagination,
        };
      } catch (_) {
        // try next path
      }
    }

    const now = new Date();
    let mock: AdminSurvey[] = [
      {
        id: "SUR_001",
        name: "Mumbai Gas Main Line Survey",
        categoryId: "CAT_001",
        categoryName: "Gas Pipeline",
        startDate: "2024-01-15",
        endDate: "2024-03-15",
        status: "ACTIVE",
        createdBy: "System",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: "SUR_002",
        name: "Fiber Network Expansion",
        categoryId: "CAT_002",
        categoryName: "Fiber Optics",
        startDate: "2024-02-01",
        endDate: "2024-04-01",
        status: "ACTIVE",
        createdBy: "System",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: "SUR_004",
        name: "Metro Pipeline Extension",
        categoryId: "CAT_001",
        categoryName: "Gas Pipeline",
        startDate: "2024-01-20",
        endDate: "2024-04-20",
        status: "ACTIVE",
        createdBy: "System",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: "SUR_005",
        name: "Underground Electrical Survey",
        categoryId: "CAT_003",
        categoryName: "Electrical",
        startDate: "2024-02-15",
        endDate: "2024-05-15",
        status: "ACTIVE",
        createdBy: "System",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    if (params?.status) {
      mock = mock.filter((s) => s.status === params.status);
    }

    return createMockPaginatedResponse<AdminSurvey>(mock, params);
  }

  async getSurveyMaster(id: string): Promise<ApiResponse<AdminSurvey>> {
    const tryPaths = [
      `/api/SurveyMaster/${id}`,
      `/SurveyMaster/${id}`,
      `/survey-masters/${id}`,
      `/surveys-admin/${id}`,
    ];

    for (const path of tryPaths) {
      try {
        const raw = await this.request<any>(path);
        const item = this.mapSurveyMaster(raw?.data ?? raw);
        return { success: true, data: item, timestamp: new Date().toISOString(), message: raw?.message };
      } catch (_) {
        // try next
      }
    }

    const now = new Date().toISOString();
    const item: AdminSurvey = {
      id,
      name: `Survey ${id}`,
      categoryId: "CAT_001",
      categoryName: "Gas Pipeline",
      startDate: now.slice(0, 10),
      endDate: now.slice(0, 10),
      status: "ACTIVE",
      createdBy: "System",
      createdAt: now,
      updatedAt: now,
    } as AdminSurvey;
    return createMockApiResponse(item);
  }

  async createSurveyMaster(payload: Partial<AdminSurvey>): Promise<ApiResponse<AdminSurvey>> {
    const body: any = {
      SmName: payload.name,
      ScId: payload.categoryId,
      SmStartDate: payload.startDate,
      SmEndDate: payload.endDate,
      SmStatus: payload.status,
    };
    const tryPaths = [`/api/SurveyMaster`, `/SurveyMaster`, `/survey-masters`, `/surveys-admin`];

    for (const path of tryPaths) {
      try {
        const raw = await this.request<any>(path, { method: "POST", body: JSON.stringify(body) });
        const item = this.mapSurveyMaster(raw?.data ?? raw);
        return { success: true, data: item, timestamp: new Date().toISOString(), message: raw?.message };
      } catch (_) {
        // try next
      }
    }

    const now = new Date().toISOString();
    const item: AdminSurvey = {
      id: `SUR_${Date.now()}`,
      name: String(payload.name || "New Survey"),
      categoryId: String(payload.categoryId || ""),
      categoryName: undefined,
      startDate: String(payload.startDate || now.slice(0, 10)),
      endDate: String(payload.endDate || now.slice(0, 10)),
      status: (payload.status as any) || "ACTIVE",
      createdBy: "System",
      createdAt: now,
      updatedAt: now,
    } as AdminSurvey;
    return createMockApiResponse(item);
  }

  async updateSurveyMaster(id: string, payload: Partial<AdminSurvey>): Promise<ApiResponse<AdminSurvey>> {
    const body: any = {
      ...(payload.name !== undefined ? { SmName: payload.name } : {}),
      ...(payload.categoryId !== undefined ? { ScId: payload.categoryId } : {}),
      ...(payload.startDate !== undefined ? { SmStartDate: payload.startDate } : {}),
      ...(payload.endDate !== undefined ? { SmEndDate: payload.endDate } : {}),
      ...(payload.status !== undefined ? { SmStatus: payload.status } : {}),
    };

    const tryPaths = [`/api/SurveyMaster/${id}`, `/SurveyMaster/${id}`, `/survey-masters/${id}`, `/surveys-admin/${id}`];
    for (const path of tryPaths) {
      try {
        const raw = await this.request<any>(path, { method: "PUT", body: JSON.stringify(body) });
        const item = this.mapSurveyMaster(raw?.data ?? raw);
        return { success: true, data: item, timestamp: new Date().toISOString(), message: raw?.message };
      } catch (_) {
        // try next
      }
    }

    const now = new Date().toISOString();
    const item: AdminSurvey = {
      id,
      name: String(payload.name || `Survey ${id}`),
      categoryId: String(payload.categoryId || ""),
      categoryName: undefined,
      startDate: String(payload.startDate || now.slice(0, 10)),
      endDate: String(payload.endDate || now.slice(0, 10)),
      status: (payload.status as any) || "ACTIVE",
      createdBy: "System",
      createdAt: now,
      updatedAt: now,
    } as AdminSurvey;
    return createMockApiResponse(item);
  }

  async deleteSurveyMaster(id: string): Promise<ApiResponse<void>> {
    const tryPaths = [`/SurveyMaster/${id}`, `/survey-masters/${id}`, `/surveys-admin/${id}`];
    for (const path of tryPaths) {
      try {
        return await this.request<ApiResponse<void>>(path, { method: "DELETE" });
      } catch (_) {
        // try next
      }
    }
    return createMockApiResponse(undefined as unknown as void);
  }

  // Valve Operations endpoints
  async getValveOperations(params?: {
    page?: number;
    limit?: number;
    valveId?: string;
    operation?: string;
    status?: string;
  }): Promise<PaginatedResponse<ValveOperation>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.valveId) queryParams.append("valveId", params.valveId);
    if (params?.operation) queryParams.append("operation", params.operation);
    if (params?.status) queryParams.append("status", params.status);

    try {
      return await this.request<PaginatedResponse<ValveOperation>>(
        `/valve-operations?${queryParams.toString()}`,
      );
    } catch (error) {
      // Fallback to mock data
      const mockOperations: ValveOperation[] = [
        {
          id: "OP-001",
          valveId: "VALVE_001",
          operation: "CLOSE",
          status: "COMPLETED", 
          timestamp: new Date(2024, 0, 15, 14, 30, 0).toISOString(),
          operator: "John Smith",
          reason: "Emergency closure due to gas leak",
          notes: "Emergency closure due to gas leak at Main Street",
        },
        {
          id: "OP-002",
          valveId: "VALVE_002", 
          operation: "CLOSE",
          status: "COMPLETED",
          timestamp: new Date(2024, 0, 10, 9, 15, 0).toISOString(),
          operator: "Sarah Johnson",
          reason: "Maintenance",
          notes: "Isolation for pressure drop investigation",
        },
      ];
      
      let filteredOperations = mockOperations;
      if (params?.valveId) {
        filteredOperations = filteredOperations.filter(op => op.valveId === params.valveId);
      }
      if (params?.operation) {
        filteredOperations = filteredOperations.filter(op => op.operation === params.operation);
      }
      if (params?.status) {
        filteredOperations = filteredOperations.filter(op => op.status === params.status);
      }

      return createMockPaginatedResponse(filteredOperations, params);
    }
  }

  async getValveOperation(id: string): Promise<ApiResponse<ValveOperation>> {
    try {
      return await this.request<ApiResponse<ValveOperation>>(`/valve-operations/${id}`);
    } catch (error) {
      const mockOperation: ValveOperation = {
        id: id,
        valveId: "VALVE_001",
        operation: "CLOSE",
        status: "COMPLETED",
        timestamp: new Date().toISOString(),
        operator: "John Smith",
        reason: "Emergency closure",
        notes: "Emergency operation",
      };
      return createMockApiResponse(mockOperation);
    }
  }

  async createValveOperation(
    operation: Omit<ValveOperation, "id" | "timestamp" | "status">,
  ): Promise<ApiResponse<ValveOperation>> {
    return this.request<ApiResponse<ValveOperation>>("/valve-operations", {
      method: "POST",
      body: JSON.stringify(operation),
    });
  }

  async updateValveOperation(
    id: string,
    operation: Partial<ValveOperation>,
  ): Promise<ApiResponse<ValveOperation>> {
    return this.request<ApiResponse<ValveOperation>>(`/valve-operations/${id}`, {
      method: "PUT", 
      body: JSON.stringify(operation),
    });
  }

  async deleteValveOperation(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/valve-operations/${id}`, {
      method: "DELETE",
    });
  }

  // User endpoints
  async loginUser(credentials: UserLoginRequest): Promise<UserLoginResponse> {
    try {
      return await this.request<UserLoginResponse>("/User/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      console.error("User login failed:", error);

      const user = DEMO_USERS.find(
        u => u.email.toLowerCase() === credentials.email.toLowerCase() && u.isActive
      );
      if (user) {
        return {
          status_code: 200,
          status_message: "success",
          message: "Login successful (demo)",
          data: user,
        };
      }
      return {
        status_code: 401,
        status_message: "error",
        message: "Invalid email or password",
        data: null,
      };
    }
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      return await this.request<ForgotPasswordResponse>("/User/forgot-password", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error("Forgot password request failed:", error);

      // Mock response for fallback
      return {
        status_code: 200,
        status_message: "success",
        message: "Password reset instructions sent to your email (mock)",
        data: `mock_reset_${Date.now()}`,
      };
    }
  }

  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      return await this.request<ResetPasswordResponse>("/User/reset-password", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error("Password reset failed:", error);

      // Mock response for fallback
      return {
        status_code: 400,
        status_message: "error",
        message: "Password reset failed (API unavailable)",
        data: null,
      };
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      return await this.request<ChangePasswordResponse>("/User/change-password", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error("Password change failed:", error);

      // Mock response for fallback
      return {
        status_code: 400,
        status_message: "error",
        message: "Password change failed (API unavailable)",
        data: null,
      };
    }
  }

  async registerUser(userData: UserRegistrationRequest): Promise<UserRegistrationResponse> {
    try {
      return await this.request<UserRegistrationResponse>("/User/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error("User registration failed, using mock response:", error);

      // Mock successful registration for fallback
      return {
        status_code: 200,
        status_message: "success",
        message: "User registered successfully (mock)",
        data: `mock_user_${Date.now()}`,
      };
    }
  }

  async getUsers(params?: {
    role?: string;
    isActive?: boolean;
    company?: string;
  }): Promise<UserListResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.role) searchParams.append("role", params.role);
      if (params?.isActive !== undefined) searchParams.append("isActive", params.isActive.toString());
      if (params?.company) searchParams.append("company", params.company);

      const query = searchParams.toString();
      return await this.request<UserListResponse>(
        `/User${query ? `?${query}` : ""}`,
      );
    } catch (error) {
      console.warn("Failed to fetch users from API, using mock data");

      // Mock users data for fallback
      const mockUsers: UserData[] = DEMO_USERS;

      let filteredUsers = mockUsers;
      if (params?.role) {
        filteredUsers = filteredUsers.filter(user => user.role === params.role);
      }
      if (params?.isActive !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isActive === params.isActive);
      }
      if (params?.company) {
        filteredUsers = filteredUsers.filter(user =>
          user.company.toLowerCase().includes(params.company!.toLowerCase())
        );
      }

      return {
        status_code: 200,
        status_message: "success",
        message: "Users retrieved successfully (mock)",
        data: filteredUsers,
      };
    }
  }

  async getUser(id: string): Promise<UserRegistrationResponse> {
    try {
      return await this.request<UserRegistrationResponse>(`/User/${id}`);
    } catch (error) {
      // Fallback to mock data
      return {
        status_code: 404,
        status_message: "error",
        message: "User not found (mock)",
        data: "",
      };
    }
  }

  async updateUser(id: string, userData: UserUpdateRequest): Promise<UserRegistrationResponse> {
    try {
      return await this.request<UserRegistrationResponse>(`/User/${id}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error("User update failed, using mock response:", error);

      return {
        status_code: 200,
        status_message: "success",
        message: "User updated successfully (mock)",
        data: id,
      };
    }
  }

  async deleteUser(id: string): Promise<UserRegistrationResponse> {
    try {
      return await this.request<UserRegistrationResponse>(`/User/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("User deletion failed, using mock response:", error);

      return {
        status_code: 200,
        status_message: "success",
        message: "User deleted successfully (mock)",
        data: id,
      };
    }
  }

  // Configuration endpoints
  async getConfig(): Promise<ApiResponse<any>> {
    try {
      return await this.request<ApiResponse<any>>("/config");
    } catch (error) {
      // Fallback to mock data
      return createMockApiResponse(mockConfig);
    }
  }

  async getCatastropheTypes(): Promise<ApiResponse<any[]>> {
    try {
      return await this.request<ApiResponse<any[]>>("/config/catastrophe-types");
    } catch (error) {
      // Fallback to mock data
      return createMockApiResponse(mockCatastropheTypes);
    }
  }

  async getDeviceTypes(): Promise<ApiResponse<any[]>> {
    try {
      return await this.request<ApiResponse<any[]>>("/config/master_data/deviceTypes");
    } catch (error) {
      // Fallback to mock data
      return createMockApiResponse(mockDeviceTypes);
    }
  }

  async getValveTypes(): Promise<ApiResponse<any[]>> {
    try {
      return await this.request<ApiResponse<any[]>>("/config/valve-types");
    } catch (error) {
      // Fallback to mock data
      return createMockApiResponse(mockValveTypes);
    }
  }

  async getPipelineMaterials(): Promise<ApiResponse<any[]>> {
    try {
      return await this.request<ApiResponse<any[]>>("/config/pipeline-materials");
    } catch (error) {
      // Fallback to mock data
      return createMockApiResponse(mockPipelineMaterials);
    }
  }

  async getStatusOptions(
    type: "device" | "pipeline" | "valve" | "catastrophe",
  ): Promise<ApiResponse<any[]>> {
    try {
      // if (type === "device") {
      //   return await this.request<ApiResponse<any[]>>("/config/master_data/device");
      // }
      return await this.request<ApiResponse<any[]>>(`/config/master_data/${type}`);
    } catch (error) {
      // Fallback to mock data
      const statusOptions = mockStatusOptions[type];
      if (!statusOptions) {
        throw new Error(`Status options for type ${type} not found`);
      }
      return createMockApiResponse(statusOptions);
    }
  }
  // Device Log endpoint - used for Device Status Grid
  async getDeviceLogs(params?: { page?: number; limit?: number; status?: string; surveyId?: string; }): Promise<PaginatedResponse<Device>> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append("page", String(params.page));
    if (params?.limit) sp.append("limit", String(params.limit));
    if (params?.status) sp.append("status", params.status);
    // Pass surveyId if available (from params or persisted selection)
    const storedSurveyId = (() => {
      try {
        return (typeof localStorage !== "undefined" && localStorage.getItem("activeSurveyId")) || undefined;
      } catch {
        return undefined;
      }
    })();
    const effectiveSurveyId = params?.surveyId || storedSurveyId;
    if (effectiveSurveyId) sp.append("surveyId", String(effectiveSurveyId));

    const q = sp.toString();

    const fetchAndMap = async (raw: any) => {
      const timestamp = raw?.timestamp || new Date().toISOString();

      const rawItems = Array.isArray(raw?.data?.items)
        ? raw.data.items
        : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw)
              ? raw
              : [];

      const normalizeStatus = (val: any): Device["status"] => {
        const s = String(val || "").toUpperCase();
        if (s === "ONLINE" || s === "CONNECTED") return "ACTIVE";
        if (s === "OFFLINE" || s === "DISCONNECTED") return "INACTIVE";
        if (s === "MAINTENANCE" || s === "SERVICE") return "MAINTENANCE";
        if (s === "ERROR" || s === "FAULT") return "ERROR";
        const allowed = new Set(["ACTIVE","INACTIVE","MAINTENANCE","ERROR"]);
        return (allowed.has(s) ? (s as Device["status"]) : "ACTIVE");
      };

      const mapped: Device[] = rawItems.map((it: any) => {
        const fallbackId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
          ? crypto.randomUUID()
          : `${Date.now()}`;

        const id = String(
          it.id ?? it.ID ?? it.deviceId ?? it.DeviceId ?? it.device_id ?? it.instrumentId ?? it.InstrumentId ?? fallbackId
        );
        const name = String(
          it.name ?? it.Name ?? it.deviceName ?? it.DeviceName ?? it.instrument ?? it.Instrument ?? id
        );
        const type = String(
          it.type ?? it.Type ?? it.deviceType ?? it.DeviceType ?? it.model ?? it.Model ?? it.modelName ?? it.ModelName ?? "DEVICE"
        ).toUpperCase();
        const status = normalizeStatus(
          it.status ?? it.Status ?? it.state ?? it.State ?? it.connectionStatus ?? it.ConnectionStatus
        );

        const lat = Number(it.lat ?? it.latitude ?? it.Latitude ?? it.latDeg ?? it.LatDeg);
        const lng = Number(it.lng ?? it.longitude ?? it.Longitude ?? it.lonDeg ?? it.LonDeg);
        const coordinates = (!Number.isNaN(lat) && !Number.isNaN(lng))
          ? { lat, lng }
          : (it.coordinates && typeof it.coordinates.lat === "number" && typeof it.coordinates.lng === "number")
            ? { lat: it.coordinates.lat, lng: it.coordinates.lng }
            : { lat: 0, lng: 0 };

        const batteryRaw = it.battery ?? it.Battery ?? it.batteryLevel ?? it.BatteryLevel;
        const batteryLevel = typeof batteryRaw === "number" ? batteryRaw : (typeof batteryRaw === "string" ? Number(batteryRaw.replace(/%/g, "")) : undefined);

        const lastSeen = String(
          it.lastSeen ?? it.LastSeen ?? it.lastPing ?? it.LastPing ?? it.timestamp ?? it.Timestamp ?? it.logTime ?? it.LogTime ?? ""
        ) || undefined;

        const accuracyVal = it.accuracy ?? it.Accuracy;
        const accuracy = typeof accuracyVal === "number" ? accuracyVal : undefined;

        const modelName = it.modelName ?? it.ModelName ?? undefined;
        const serialRaw = it.serialNumber ?? it.SerialNumber ?? it.serial_no ?? it.SERIAL_NO ?? it.deviceSerial ?? it.DeviceSerial ?? it.serial ?? it.Serial ?? null;
        const serialNumber = serialRaw != null ? String(serialRaw) : undefined;

        return {
          id,
          name,
          type,
          status,
          coordinates,
          modelName: modelName != null ? String(modelName) : undefined,
          surveyor: it.surveyor ?? it.Surveyor ?? it.user ?? it.User ?? undefined,
          batteryLevel,
          lastSeen,
          accuracy,
          serialNumber,
        } as Device;
      });

      const pagination = raw?.data?.pagination || raw?.pagination || {
        page: params?.page ?? 1,
        limit: params?.limit ?? mapped.length,
        total: mapped.length,
        totalPages: 1,
      };

      return {
        success: true,
        data: mapped,
        message: raw?.message,
        timestamp,
        pagination,
      };
    };

    // Try direct endpoint first; if unavailable, fallback to proxy route in our dev server
    try {
      const raw: any = await this.request<any>(`/DeviceLog${q ? `?${q}` : ""}`);
      return await fetchAndMap(raw);
    } catch (primaryError) {
      try {
        const localBase = (typeof window !== "undefined" && window.location?.origin)
          ? `${window.location.origin}/api`
          : "/api";
        const resp = await fetch(`${localBase}/proxy/device-log${q ? `?${q}` : ""}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const text = await resp.text();
        let rawProxy: any;
        try { rawProxy = JSON.parse(text); } catch { rawProxy = text; }
        return await fetchAndMap(rawProxy);
      } catch (error) {
        return createMockPaginatedResponse<Device>([], params);
      }
    }
  }

}

// Compatibility helpers for backward compatibility with existing components
export interface LegacyPipelineSegment {
  id: string;
  name: string;
  diameter: number;
  material: "STEEL" | "HDPE" | "PVC" | "CONCRETE";
  depth?: number;
  pressure?: number;
  installDate?: string;
  coordinates: Coordinates[];
  status: "OPERATIONAL" | "MAINTENANCE" | "DAMAGED" | "INACTIVE";
}

// Helper function to convert new PipelineSegment to legacy format for backward compatibility
export function toLegacyPipelineSegment(pipeline: PipelineSegment): LegacyPipelineSegment {
  return {
    id: pipeline.id,
    name: pipeline.name,
    diameter: pipeline.specifications.diameter.value,
    material: pipeline.specifications.material as "STEEL" | "HDPE" | "PVC" | "CONCRETE",
    depth: pipeline.installation.depth?.value,
    pressure: pipeline.operatingPressure.nominal,
    installDate: pipeline.installation.commissioningDate,
    coordinates: pipeline.coordinates.map(coord => ({
      lat: coord.lat,
      lng: coord.lng,
      elevation: coord.elevation
    })),
    status: pipeline.status
  };
}

// Helper function to convert legacy format to new PipelineSegment
export function fromLegacyPipelineSegment(legacy: Partial<LegacyPipelineSegment>): Partial<PipelineSegment> {
  const coordinates: GeolocationPoint[] = legacy.coordinates?.map((coord, index) => ({
    ...coord,
    pointType: index === 0 ? "START" : 
               index === (legacy.coordinates?.length || 1) - 1 ? "END" : "NODE"
  })) || [];

  return {
    id: legacy.id,
    name: legacy.name || "",
    status: legacy.status || "OPERATIONAL",
    specifications: {
      diameter: {
        value: legacy.diameter || 0,
        unit: "MM"
      },
      material: legacy.material || "STEEL",
      length: {
        value: 0,
        unit: "METERS"
      }
    },
    operatingPressure: {
      nominal: legacy.pressure || 0,
      minimum: legacy.pressure ? legacy.pressure * 0.7 : 0,
      maximum: legacy.pressure ? legacy.pressure * 1.3 : 0,
      unit: "BAR"
    },
    installation: {
      installationYear: legacy.installDate ? new Date(legacy.installDate).getFullYear() : new Date().getFullYear(),
      commissioningDate: legacy.installDate,
      depth: legacy.depth ? {
        value: legacy.depth,
        unit: "METERS"
      } : undefined
    },
    coordinates
  };
}

export const apiClient = new ApiClient();
export default apiClient;
