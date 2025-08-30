/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - type
 *         - status
 *         - coordinates
 *       properties:
 *         id:
 *           type: string
 *           description: Unique device identifier
 *         name:
 *           type: string
 *           description: Device name
 *         type:
 *           type: string
 *           enum: [TRIMBLE_SPS986, MONITORING_STATION, SURVEY_EQUIPMENT]
 *           description: Device type
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE, ERROR]
 *           description: Device operational status
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *         surveyor:
 *           type: string
 *           description: Assigned surveyor name
 *         batteryLevel:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Battery level percentage
 *         lastSeen:
 *           type: string
 *           format: date-time
 *           description: Last communication timestamp
 *         accuracy:
 *           type: number
 *           description: GPS accuracy in meters
 */
export interface Device {
  id: string;
  name: string;
  type: "TRIMBLE_SPS986" | "MONITORING_STATION" | "SURVEY_EQUIPMENT";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "ERROR";
  coordinates: Coordinates;
  surveyor?: string;
  batteryLevel?: number;
  lastSeen?: string;
  accuracy?: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Coordinates:
 *       type: object
 *       required:
 *         - lat
 *         - lng
 *       properties:
 *         lat:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: Latitude coordinate
 *         lng:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: Longitude coordinate
 *         elevation:
 *           type: number
 *           description: Elevation in meters
 */
export interface Coordinates {
  lat: number;
  lng: number;
  elevation?: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     PipelineSegment:
 *       type: object
 *       description: "Read-only pipeline segment data sourced from Trimble surveying equipment. Cannot be modified via API."
 *       required:
 *         - id
 *         - name
 *         - diameter
 *         - material
 *         - coordinates
 *       properties:
 *         id:
 *           type: string
 *           description: Unique segment identifier
 *         name:
 *           type: string
 *           description: Pipeline segment name
 *         diameter:
 *           type: number
 *           description: Pipe diameter in mm
 *         material:
 *           type: string
 *           enum: [STEEL, HDPE, PVC, CONCRETE]
 *           description: Pipeline material
 *         depth:
 *           type: number
 *           description: Burial depth in meters
 *         pressure:
 *           type: number
 *           description: Operating pressure in bar
 *         installDate:
 *           type: string
 *           format: date
 *           description: Installation date
 *         coordinates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Coordinates'
 *           description: Pipeline route coordinates
 *         status:
 *           type: string
 *           enum: [OPERATIONAL, MAINTENANCE, DAMAGED, INACTIVE]
 *           description: Pipeline status
 */
export interface PipelineSegment {
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Valve:
 *       type: object
 *       description: "Read-only valve data sourced from Trimble surveying equipment and pipeline installation records. Cannot be modified via API."
 *       required:
 *         - id
 *         - name
 *         - type
 *         - status
 *         - coordinates
 *       properties:
 *         id:
 *           type: string
 *           description: Unique valve identifier
 *         name:
 *           type: string
 *           description: Valve name
 *         type:
 *           type: string
 *           enum: [GATE, BALL, BUTTERFLY, CHECK, RELIEF]
 *           description: Valve type
 *         status:
 *           type: string
 *           enum: [OPEN, CLOSED, PARTIALLY_OPEN, FAULT]
 *           description: Valve status
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *         diameter:
 *           type: number
 *           description: Valve diameter in mm
 *         pressure:
 *           type: number
 *           description: Operating pressure in bar
 *         installDate:
 *           type: string
 *           format: date
 *           description: Installation date
 *         lastMaintenance:
 *           type: string
 *           format: date
 *           description: Last maintenance date
 *         pipelineId:
 *           type: string
 *           description: Associated pipeline segment ID
 */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     Catastrophe:
 *       type: object
 *       required:
 *         - id
 *         - type
 *         - coordinates
 *         - reportedAt
 *       properties:
 *         id:
 *           type: string
 *           description: Unique catastrophe identifier
 *         type:
 *           type: string
 *           enum: [LEAK, BURST, BLOCKAGE, CORROSION, SUBSIDENCE, THIRD_PARTY_DAMAGE]
 *           description: Catastrophe type
 *         severity:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Severity level
 *         status:
 *           type: string
 *           enum: [REPORTED, INVESTIGATING, IN_PROGRESS, RESOLVED, CLOSED]
 *           description: Resolution status
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *         description:
 *           type: string
 *           description: Detailed description of the incident
 *         reportedAt:
 *           type: string
 *           format: date-time
 *           description: When the catastrophe was reported
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: When the catastrophe was resolved
 *         reportedBy:
 *           type: string
 *           description: Who reported the incident
 *         assignedTo:
 *           type: string
 *           description: Assigned response team/person
 *         estimatedCost:
 *           type: number
 *           description: Estimated repair cost
 *         actualCost:
 *           type: number
 *           description: Actual repair cost
 *         pipelineId:
 *           type: string
 *           description: Affected pipeline segment ID
 */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     ValveOperation:
 *       type: object
 *       required:
 *         - id
 *         - valveId
 *         - operation
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: Unique operation identifier
 *         valveId:
 *           type: string
 *           description: Target valve identifier
 *         operation:
 *           type: string
 *           enum: [OPEN, CLOSE, MAINTAIN, INSPECT, REPAIR]
 *           description: Operation performed
 *         status:
 *           type: string
 *           enum: [COMPLETED, FAILED, IN_PROGRESS, SCHEDULED]
 *           description: Operation status
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Operation timestamp
 *         operator:
 *           type: string
 *           description: Person who performed the operation
 *         reason:
 *           type: string
 *           description: Reason for the operation
 *         notes:
 *           type: string
 *           description: Additional notes
 *         duration:
 *           type: number
 *           description: Operation duration in minutes
 */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     SurveyData:
 *       type: object
 *       required:
 *         - id
 *         - deviceId
 *         - timestamp
 *         - coordinates
 *       properties:
 *         id:
 *           type: string
 *           description: Unique survey record identifier
 *         deviceId:
 *           type: string
 *           description: Survey device identifier
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Survey timestamp
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *         accuracy:
 *           type: number
 *           description: Measurement accuracy in meters
 *         surveyor:
 *           type: string
 *           description: Surveyor name
 *         notes:
 *           type: string
 *           description: Survey notes
 *         temperature:
 *           type: number
 *           description: Ambient temperature in Celsius
 *         weather:
 *           type: string
 *           description: Weather conditions
 */
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
