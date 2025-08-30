import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

interface SurveyHistoryLog {
  id: string;
  surveyId: string;
  surveyName?: string;
  deviceId: string;
  deviceName?: string;
  action: "ASSIGNED" | "UNASSIGNED" | "STARTED" | "COMPLETED" | "PAUSED" | "RESUMED" | "DATA_SYNC";
  timestamp: string;
  performedBy: string;
  details?: string;
  location?: {
    lat: number;
    lng: number;
  };
  dataPoints?: number;
  duration?: number; // in minutes
}

interface DeviceUsageLog {
  id: string;
  deviceId: string;
  deviceName?: string;
  surveyId: string;
  surveyName?: string;
  usageDate: string;
  hoursUsed: number;
  dataPointsCollected: number;
  batteryStart: number;
  batteryEnd: number;
  operator: string;
  location?: string;
}

interface SurveyReport {
  reportType: "INVENTORY" | "USAGE" | "DOWNTIME";
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  totalDevices: number;
  activeDevices: number;
  totalSurveys: number;
  activeSurveys: number;
  totalUsageHours: number;
  totalDataPoints: number;
  details: any[];
}

// Mock data - In production, this would come from a database
let surveyHistory: SurveyHistoryLog[] = [
  {
    id: "HIST_001",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 Unit 001",
    action: "ASSIGNED",
    timestamp: "2024-01-15T08:00:00Z",
    performedBy: "Admin User",
    details: "Device assigned to gas pipeline survey",
  },
  {
    id: "HIST_002",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 Unit 001",
    action: "STARTED",
    timestamp: "2024-01-15T09:30:00Z",
    performedBy: "Rajesh Kumar",
    details: "Survey work started in field",
    location: { lat: 19.076, lng: 72.8777 },
  },
  {
    id: "HIST_003",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 Unit 001",
    action: "DATA_SYNC",
    timestamp: "2024-01-15T12:15:00Z",
    performedBy: "System",
    details: "Synchronized survey data",
    dataPoints: 1250,
  },
];

let deviceUsageLogs: DeviceUsageLog[] = [
  {
    id: "USAGE_001",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 Unit 001",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    usageDate: "2024-01-15",
    hoursUsed: 8.5,
    dataPointsCollected: 1250,
    batteryStart: 100,
    batteryEnd: 35,
    operator: "Rajesh Kumar",
    location: "Mumbai Central",
  },
  {
    id: "USAGE_002",
    deviceId: "TRIMBLE_002",
    deviceName: "Trimble SPS986 Unit 002",
    surveyId: "SUR_002",
    surveyName: "Fiber Network Expansion",
    usageDate: "2024-01-16",
    hoursUsed: 6.0,
    dataPointsCollected: 890,
    batteryStart: 95,
    batteryEnd: 55,
    operator: "Priya Sharma",
    location: "Bandra West",
  },
];

/**
 * @swagger
 * /api/survey-history:
 *   get:
 *     summary: Get survey history logs
 *     tags: [Survey History]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: surveyId
 *         schema:
 *           type: string
 *         description: Filter by survey ID
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, UNASSIGNED, STARTED, COMPLETED, PAUSED, RESUMED, DATA_SYNC]
 *         description: Filter by action type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Successfully retrieved survey history
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const surveyId = req.query.surveyId as string;
  const deviceId = req.query.deviceId as string;
  const action = req.query.action as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let filteredHistory = surveyHistory;

  if (surveyId) {
    filteredHistory = filteredHistory.filter((log) => log.surveyId === surveyId);
  }

  if (deviceId) {
    filteredHistory = filteredHistory.filter((log) => log.deviceId === deviceId);
  }

  if (action) {
    filteredHistory = filteredHistory.filter((log) => log.action === action);
  }

  if (startDate) {
    filteredHistory = filteredHistory.filter(
      (log) => new Date(log.timestamp) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredHistory = filteredHistory.filter(
      (log) => new Date(log.timestamp) <= new Date(endDate)
    );
  }

  // Sort by timestamp descending (most recent first)
  filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  const response: PaginatedResponse<SurveyHistoryLog> = {
    success: true,
    data: paginatedHistory,
    pagination: {
      page,
      limit,
      total: filteredHistory.length,
      totalPages: Math.ceil(filteredHistory.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-history/device-usage:
 *   get:
 *     summary: Get device usage logs
 *     tags: [Survey History]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Successfully retrieved device usage logs
 */
router.get("/device-usage", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const deviceId = req.query.deviceId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let filteredLogs = deviceUsageLogs;

  if (deviceId) {
    filteredLogs = filteredLogs.filter((log) => log.deviceId === deviceId);
  }

  if (startDate) {
    filteredLogs = filteredLogs.filter(
      (log) => new Date(log.usageDate) >= new Date(startDate)
    );
  }

  if (endDate) {
    filteredLogs = filteredLogs.filter(
      (log) => new Date(log.usageDate) <= new Date(endDate)
    );
  }

  // Sort by usage date descending
  filteredLogs.sort((a, b) => new Date(b.usageDate).getTime() - new Date(a.usageDate).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const response: PaginatedResponse<DeviceUsageLog> = {
    success: true,
    data: paginatedLogs,
    pagination: {
      page,
      limit,
      total: filteredLogs.length,
      totalPages: Math.ceil(filteredLogs.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-history/reports/{reportType}:
 *   get:
 *     summary: Generate survey reports
 *     tags: [Survey History]
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [inventory, usage, downtime]
 *         description: Type of report to generate
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Filter by specific device
 *     responses:
 *       200:
 *         description: Successfully generated report
 *       400:
 *         description: Invalid report type or parameters
 */
router.get("/reports/:reportType", (req, res) => {
  const reportType = req.params.reportType.toUpperCase() as "INVENTORY" | "USAGE" | "DOWNTIME";
  const startDate = req.query.startDate as string || "2024-01-01";
  const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
  const deviceId = req.query.deviceId as string;

  if (!["INVENTORY", "USAGE", "DOWNTIME"].includes(reportType)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid report type. Must be one of: inventory, usage, downtime",
      statusCode: 400,
    });
  }

  let reportData: SurveyReport;

  switch (reportType) {
    case "INVENTORY":
      reportData = {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        totalDevices: 5,
        activeDevices: 3,
        totalSurveys: 4,
        activeSurveys: 2,
        totalUsageHours: 156.5,
        totalDataPoints: 12450,
        details: [
          { deviceId: "TRIMBLE_001", status: "ACTIVE", location: "Field", survey: "Gas Pipeline" },
          { deviceId: "TRIMBLE_002", status: "ACTIVE", location: "Field", survey: "Fiber Optics" },
          { deviceId: "TRIMBLE_003", status: "INACTIVE", location: "Godown", survey: null },
        ],
      };
      break;

    case "USAGE":
      reportData = {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        totalDevices: 5,
        activeDevices: 3,
        totalSurveys: 4,
        activeSurveys: 2,
        totalUsageHours: 156.5,
        totalDataPoints: 12450,
        details: deviceUsageLogs.filter(log => {
          if (deviceId && log.deviceId !== deviceId) return false;
          const logDate = new Date(log.usageDate);
          return logDate >= new Date(startDate) && logDate <= new Date(endDate);
        }),
      };
      break;

    case "DOWNTIME":
      reportData = {
        reportType,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate },
        totalDevices: 5,
        activeDevices: 3,
        totalSurveys: 4,
        activeSurveys: 2,
        totalUsageHours: 156.5,
        totalDataPoints: 12450,
        details: [
          { deviceId: "TRIMBLE_003", reason: "Maintenance", downtime: 48, date: "2024-01-10" },
          { deviceId: "TRIMBLE_004", reason: "Battery Issue", downtime: 12, date: "2024-01-12" },
        ],
      };
      break;
  }

  const response: ApiResponse<SurveyReport> = {
    success: true,
    data: reportData,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-history:
 *   post:
 *     summary: Create new survey history log entry
 *     tags: [Survey History]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - surveyId
 *               - deviceId
 *               - action
 *               - performedBy
 *             properties:
 *               surveyId:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [ASSIGNED, UNASSIGNED, STARTED, COMPLETED, PAUSED, RESUMED, DATA_SYNC]
 *               performedBy:
 *                 type: string
 *               details:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               dataPoints:
 *                 type: number
 *               duration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Survey history log created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const { surveyId, deviceId, action, performedBy, details, location, dataPoints, duration } = req.body;

  if (!surveyId || !deviceId || !action || !performedBy) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: surveyId, deviceId, action, performedBy",
      statusCode: 400,
    });
  }

  const newHistoryLog: SurveyHistoryLog = {
    id: `HIST_${Date.now()}`,
    surveyId,
    deviceId,
    action,
    timestamp: new Date().toISOString(),
    performedBy,
    details,
    location,
    dataPoints,
    duration,
  };

  surveyHistory.push(newHistoryLog);

  const response: ApiResponse<SurveyHistoryLog> = {
    success: true,
    data: newHistoryLog,
    message: "Survey history log created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

export { router as surveyHistoryRoutes };
