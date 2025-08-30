import express from "express";
import { ApiResponse } from "../models/types";

const router = express.Router();

// Configuration data - In production, this would come from a database
const configData = {
  catastropheTypes: [
    { value: "LEAK", label: "Water Leak", color: "#3B82F6" },
    { value: "BURST", label: "Pipeline Burst", color: "#EF4444" },
    { value: "BLOCKAGE", label: "Blockage", color: "#F59E0B" },
    { value: "CORROSION", label: "Corrosion", color: "#8B5CF6" },
    { value: "SUBSIDENCE", label: "Ground Subsidence", color: "#10B981" },
    {
      value: "THIRD_PARTY_DAMAGE",
      label: "Third Party Damage",
      color: "#F97316",
    },
  ],
  severityLevels: [
    { value: "LOW", label: "Low", color: "#10B981" },
    { value: "MEDIUM", label: "Medium", color: "#F59E0B" },
    { value: "HIGH", label: "High", color: "#F97316" },
    { value: "CRITICAL", label: "Critical", color: "#EF4444" },
  ],
  deviceTypes: [
    { value: "TRIMBLE_SPS986", label: "Trimble SPS986" },
    { value: "MONITORING_STATION", label: "Monitoring Station" },
    { value: "SURVEY_EQUIPMENT", label: "Survey Equipment" },
  ],
  pipelineMaterials: [
    { value: "STEEL", label: "Steel" },
    { value: "HDPE", label: "HDPE" },
    { value: "PVC", label: "PVC" },
    { value: "CONCRETE", label: "Concrete" },
  ],
  valveTypes: [
    { value: "GATE", label: "Gate Valve" },
    { value: "BALL", label: "Ball Valve" },
    { value: "BUTTERFLY", label: "Butterfly Valve" },
    { value: "CHECK", label: "Check Valve" },
    { value: "RELIEF", label: "Relief Valve" },
  ],
  statusOptions: {
    device: [
      { value: "ACTIVE", label: "Active", color: "#10B981" },
      { value: "INACTIVE", label: "Inactive", color: "#6B7280" },
      { value: "MAINTENANCE", label: "Maintenance", color: "#F59E0B" },
      { value: "ERROR", label: "Error", color: "#EF4444" },
    ],
    pipeline: [
      { value: "OPERATIONAL", label: "Operational", color: "#10B981" },
      { value: "MAINTENANCE", label: "Maintenance", color: "#F59E0B" },
      { value: "DAMAGED", label: "Damaged", color: "#EF4444" },
      { value: "INACTIVE", label: "Inactive", color: "#6B7280" },
    ],
    valve: [
      { value: "OPEN", label: "Open", color: "#10B981" },
      { value: "CLOSED", label: "Closed", color: "#EF4444" },
      { value: "PARTIALLY_OPEN", label: "Partially Open", color: "#F59E0B" },
      { value: "FAULT", label: "Fault", color: "#8B5CF6" },
    ],
    catastrophe: [
      { value: "REPORTED", label: "Reported", color: "#F59E0B" },
      { value: "INVESTIGATING", label: "Investigating", color: "#3B82F6" },
      { value: "IN_PROGRESS", label: "In Progress", color: "#8B5CF6" },
      { value: "RESOLVED", label: "Resolved", color: "#10B981" },
      { value: "CLOSED", label: "Closed", color: "#6B7280" },
    ],
  },
  operationTypes: [
    { value: "OPEN", label: "Open Valve" },
    { value: "CLOSE", label: "Close Valve" },
    { value: "MAINTAIN", label: "Maintenance" },
    { value: "INSPECT", label: "Inspection" },
    { value: "REPAIR", label: "Repair" },
  ],
};

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Get all configuration data
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Successfully retrieved configuration data
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
 *                     catastropheTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           color:
 *                             type: string
 *                     severityLevels:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           color:
 *                             type: string
 *                     deviceTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/", (req, res) => {
  const response: ApiResponse<typeof configData> = {
    success: true,
    data: configData,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/config/catastrophe-types:
 *   get:
 *     summary: Get catastrophe types configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Successfully retrieved catastrophe types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                       label:
 *                         type: string
 *                       color:
 *                         type: string
 *                 timestamp:
 *                   type: string
 */
router.get("/catastrophe-types", (req, res) => {
  const response: ApiResponse<typeof configData.catastropheTypes> = {
    success: true,
    data: configData.catastropheTypes,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/config/device-types:
 *   get:
 *     summary: Get device types configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Successfully retrieved device types
 */
router.get("/device-types", (req, res) => {
  const response: ApiResponse<typeof configData.deviceTypes> = {
    success: true,
    data: configData.deviceTypes,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/config/valve-types:
 *   get:
 *     summary: Get valve types configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Successfully retrieved valve types
 */
router.get("/valve-types", (req, res) => {
  const response: ApiResponse<typeof configData.valveTypes> = {
    success: true,
    data: configData.valveTypes,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/config/pipeline-materials:
 *   get:
 *     summary: Get pipeline materials configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Successfully retrieved pipeline materials
 */
router.get("/pipeline-materials", (req, res) => {
  const response: ApiResponse<typeof configData.pipelineMaterials> = {
    success: true,
    data: configData.pipelineMaterials,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/config/status-options/{type}:
 *   get:
 *     summary: Get status options for a specific entity type
 *     tags: [Configuration]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [device, pipeline, valve, catastrophe]
 *         description: Entity type
 *     responses:
 *       200:
 *         description: Successfully retrieved status options
 *       400:
 *         description: Invalid entity type
 */
router.get("/status-options/:type", (req, res) => {
  const type = req.params.type as keyof typeof configData.statusOptions;

  if (!configData.statusOptions[type]) {
    return res.status(400).json({
      error: "Bad Request",
      message:
        "Invalid entity type. Valid types: device, pipeline, valve, catastrophe",
      statusCode: 400,
    });
  }

  const response: ApiResponse<(typeof configData.statusOptions)[typeof type]> =
    {
      success: true,
      data: configData.statusOptions[type],
      timestamp: new Date().toISOString(),
    };

  res.json(response);
});

export { router as configRoutes };
