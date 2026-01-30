import express, { Request, Response } from "express";
import { Device, ApiResponse } from "../models/types";

const router = express.Router();

// Mock devices data (shared from devices.ts)
const getMockDevices = (): Device[] => [
  {
    id: "TRIMBLE_001",
    name: "Trimble SPS986 Unit 001",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 19.076, lng: 72.8777 },
    surveyor: "Rajesh Kumar",
    batteryLevel: 89,
    lastSeen: new Date().toISOString(),
    accuracy: 0.02,
  },
  {
    id: "TRIMBLE_002",
    name: "Trimble SPS986 Unit 002",
    type: "TRIMBLE_SPS986",
    status: "ACTIVE",
    coordinates: { lat: 19.0896, lng: 72.8656 },
    surveyor: "Priya Sharma",
    batteryLevel: 76,
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    accuracy: 0.03,
  },
  {
    id: "MONITOR_001",
    name: "Central Monitoring Station",
    type: "MONITORING_STATION",
    status: "ACTIVE",
    coordinates: { lat: 19.0825, lng: 72.8746 },
    batteryLevel: 95,
    lastSeen: new Date().toISOString(),
    accuracy: 0.01,
  },
  {
    id: "SURVEY_UNIT_001",
    name: "Survey Unit 001",
    type: "SURVEY_EQUIPMENT",
    status: "INACTIVE",
    coordinates: { lat: 19.0750, lng: 72.8850 },
    surveyor: "Amit Patel",
    batteryLevel: 15,
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    accuracy: 0.15,
  },
  {
    id: "SURVEY_UNIT_002",
    name: "Survey Unit 002",
    type: "SURVEY_EQUIPMENT",
    status: "ACTIVE",
    coordinates: { lat: 19.0880, lng: 72.8600 },
    surveyor: "Neha Singh",
    batteryLevel: 82,
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    accuracy: 0.04,
  },
];

interface DeviceStatisticsResponse {
  totalDeviceCount: number;
  totalActiveDeviceCount: number;
  totalInactiveDeviceCount: number;
  normalUsage: number;
  underUsage: number;
  normalAccuracy: number;
  belowAverageAccuracy: number;
  normalAccuracyPercentage: number;
  minimumTTFA: number;
  averageTTFA: number;
  maximumTTFA: number;
}

/**
 * @swagger
 * /api/devices/statistics:
 *   get:
 *     summary: Get device statistics and analytics
 *     tags: [Devices]
 *     parameters:
 *       - in: query
 *         name: zone
 *         schema:
 *           type: string
 *         description: Filter by zone (optional)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (optional)
 *     responses:
 *       200:
 *         description: Successfully retrieved device statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDeviceCount:
 *                       type: number
 *                     totalActiveDeviceCount:
 *                       type: number
 *                     totalInactiveDeviceCount:
 *                       type: number
 *                     normalUsage:
 *                       type: number
 *                     underUsage:
 *                       type: number
 *                     normalAccuracy:
 *                       type: number
 *                     belowAverageAccuracy:
 *                       type: number
 *                     normalAccuracyPercentage:
 *                       type: number
 *                     minimumTTFA:
 *                       type: number
 *                     averageTTFA:
 *                       type: number
 *                     maximumTTFA:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const devices = getMockDevices();

    // Calculate statistics
    const totalDeviceCount = devices.length;
    const totalActiveDeviceCount = devices.filter(
      (d) => d.status === "ACTIVE"
    ).length;
    const totalInactiveDeviceCount = devices.filter(
      (d) => d.status === "INACTIVE"
    ).length;

    // Usage classification (based on battery level and recent activity)
    const normalUsage = devices.filter((d) => {
      if (d.status !== "ACTIVE") return false;
      if (!d.batteryLevel || d.batteryLevel < 20) return false;
      const lastSeen = d.lastSeen ? new Date(d.lastSeen).getTime() : 0;
      const now = Date.now();
      const hoursAgo = (now - lastSeen) / (1000 * 60 * 60);
      return hoursAgo < 24; // Active in last 24 hours
    }).length;

    const underUsage = totalActiveDeviceCount - normalUsage;

    // Accuracy classification (accuracy in meters)
    // Normal accuracy: <= 0.05 meters (5cm)
    // Below average: > 0.05 meters
    const normalAccuracy = devices.filter((d) => {
      const acc = d.accuracy ?? Infinity;
      return acc <= 0.05;
    }).length;

    const belowAverageAccuracy = devices.filter((d) => {
      const acc = d.accuracy ?? Infinity;
      return acc > 0.05;
    }).length;

    const normalAccuracyPercentage =
      totalDeviceCount > 0 ? (normalAccuracy / totalDeviceCount) * 100 : 0;

    // TTFA (Time to Achieve Accuracy) simulation
    // In a real scenario, this would come from device logs or upstream API
    const accuracies = devices
      .filter((d) => d.accuracy !== undefined)
      .map((d) => d.accuracy || 0);

    let minimumTTFA = 0;
    let averageTTFA = 0;
    let maximumTTFA = 0;

    if (accuracies.length > 0) {
      // Simulate TTFA in minutes based on accuracy
      // Better accuracy = shorter TTFA
      const ttfas = accuracies.map((acc) => {
        if (acc <= 0.05) return Math.random() * 2 + 1; // 1-3 minutes for good accuracy
        if (acc <= 0.1) return Math.random() * 4 + 3; // 3-7 minutes for fair accuracy
        return Math.random() * 5 + 8; // 8-13 minutes for poor accuracy
      });

      minimumTTFA = Math.min(...ttfas);
      averageTTFA = ttfas.reduce((a, b) => a + b, 0) / ttfas.length;
      maximumTTFA = Math.max(...ttfas);
    }

    const response: ApiResponse<DeviceStatisticsResponse> = {
      success: true,
      data: {
        totalDeviceCount,
        totalActiveDeviceCount,
        totalInactiveDeviceCount,
        normalUsage,
        underUsage,
        normalAccuracy,
        belowAverageAccuracy,
        normalAccuracyPercentage: Math.round(normalAccuracyPercentage * 100) / 100,
        minimumTTFA: Math.round(minimumTTFA * 100) / 100,
        averageTTFA: Math.round(averageTTFA * 100) / 100,
        maximumTTFA: Math.round(maximumTTFA * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: {} as any,
      message: error?.message || "Failed to fetch device statistics",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
