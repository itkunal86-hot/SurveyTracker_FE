import express from "express";
import { Device, ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

// Mock data - In production, this would come from a database
let devices: Device[] = [
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
];

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE, ERROR]
 *         description: Filter by device status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TRIMBLE_SPS986, MONITORING_STATION, SURVEY_EQUIPMENT]
 *         description: Filter by device type
 *     responses:
 *       200:
 *         description: Successfully retrieved devices
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
 *                     $ref: '#/components/schemas/Device'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const type = req.query.type as string;

  let filteredDevices = devices;

  if (status) {
    filteredDevices = filteredDevices.filter(
      (device) => device.status === status,
    );
  }

  if (type) {
    filteredDevices = filteredDevices.filter((device) => device.type === type);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

  const response: PaginatedResponse<Device> = {
    success: true,
    data: paginatedDevices,
    pagination: {
      page,
      limit,
      total: filteredDevices.length,
      totalPages: Math.ceil(filteredDevices.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Successfully retrieved device
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", (req, res) => {
  const device = devices.find((d) => d.id === req.params.id);

  if (!device) {
    return res.status(404).json({
      error: "Not Found",
      message: "Device not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<Device> = {
    success: true,
    data: device,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create a new device
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - status
 *               - coordinates
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TRIMBLE_SPS986, MONITORING_STATION, SURVEY_EQUIPMENT]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, MAINTENANCE, ERROR]
 *               coordinates:
 *                 $ref: '#/components/schemas/Coordinates'
 *               surveyor:
 *                 type: string
 *               batteryLevel:
 *                 type: number
 *               accuracy:
 *                 type: number
 *     responses:
 *       201:
 *         description: Device created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", (req, res) => {
  const { name, type, status, coordinates, surveyor, batteryLevel, accuracy } =
    req.body;

  if (!name || !type || !status || !coordinates) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: name, type, status, coordinates",
      statusCode: 400,
    });
  }

  const newDevice: Device = {
    id: `DEVICE_${Date.now()}`,
    name,
    type,
    status,
    coordinates,
    surveyor,
    batteryLevel,
    lastSeen: new Date().toISOString(),
    accuracy,
  };

  devices.push(newDevice);

  const response: ApiResponse<Device> = {
    success: true,
    data: newDevice,
    message: "Device created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       200:
 *         description: Device updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", (req, res) => {
  const deviceIndex = devices.findIndex((d) => d.id === req.params.id);

  if (deviceIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Device not found",
      statusCode: 404,
    });
  }

  devices[deviceIndex] = {
    ...devices[deviceIndex],
    ...req.body,
    id: req.params.id,
  };

  const response: ApiResponse<Device> = {
    success: true,
    data: devices[deviceIndex],
    message: "Device updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", (req, res) => {
  const deviceIndex = devices.findIndex((d) => d.id === req.params.id);

  if (deviceIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Device not found",
      statusCode: 404,
    });
  }

  devices.splice(deviceIndex, 1);

  const response = {
    success: true,
    message: "Device deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as deviceRoutes };
