import express from "express";
import { Valve, ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

// READ-ONLY ROUTES: Valve data is sourced from Trimble surveying equipment
// and pipeline installation records. Cannot be modified through the API.
// Only GET operations are supported.
// Mock data - In production, this would come from Trimble database integration
let valves: Valve[] = [
  {
    id: "VALVE_001",
    name: "Main Gate Valve A1",
    type: "GATE",
    status: "OPEN",
    coordinates: { lat: 19.076, lng: 72.8777 },
    diameter: 300,
    pressure: 10,
    installDate: "2020-01-15",
    lastMaintenance: "2023-06-15",
    pipelineId: "PIPELINE_001",
  },
  {
    id: "VALVE_002",
    name: "Control Ball Valve B2",
    type: "BALL",
    status: "CLOSED",
    coordinates: { lat: 19.08, lng: 72.881 },
    diameter: 200,
    pressure: 8,
    installDate: "2021-03-20",
    lastMaintenance: "2023-08-10",
    pipelineId: "PIPELINE_002",
  },
];

/**
 * @swagger
 * /api/valves:
 *   get:
 *     summary: Get all valves (Read-Only - Trimble Data Source)
 *     description: Retrieves valve data populated from Trimble surveying equipment and pipeline installation records. This data cannot be modified through the API as it is sourced directly from field measurements.
 *     tags: [Valves]
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
 *           enum: [OPEN, CLOSED, PARTIALLY_OPEN, FAULT]
 *         description: Filter by valve status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [GATE, BALL, BUTTERFLY, CHECK, RELIEF]
 *         description: Filter by valve type
 *     responses:
 *       200:
 *         description: Successfully retrieved valves
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
 *                     $ref: '#/components/schemas/Valve'
 *                 pagination:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const type = req.query.type as string;

  let filteredValves = valves;

  if (status) {
    filteredValves = filteredValves.filter((valve) => valve.status === status);
  }

  if (type) {
    filteredValves = filteredValves.filter((valve) => valve.type === type);
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedValves = filteredValves.slice(startIndex, endIndex);

  const response: PaginatedResponse<Valve> = {
    success: true,
    data: paginatedValves,
    pagination: {
      page,
      limit,
      total: filteredValves.length,
      totalPages: Math.ceil(filteredValves.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/valves/{id}:
 *   get:
 *     summary: Get valve by ID (Read-Only - Trimble Data Source)
 *     description: Retrieves a specific valve by ID. Data is sourced from Trimble surveying equipment and cannot be modified via API.
 *     tags: [Valves]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Valve ID
 *     responses:
 *       200:
 *         description: Successfully retrieved valve
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Valve'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Valve not found
 */
router.get("/:id", (req, res) => {
  const valve = valves.find((v) => v.id === req.params.id);

  if (!valve) {
    return res.status(404).json({
      error: "Not Found",
      message: "Valve not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<Valve> = {
    success: true,
    data: valve,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as valveRoutes };
