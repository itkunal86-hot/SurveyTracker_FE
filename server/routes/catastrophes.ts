import express from "express";
import { Catastrophe, ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

// Mock data - In production, this would come from a database
let catastrophes: Catastrophe[] = [
  {
    id: "CATASTROPHE_001",
    type: "LEAK",
    severity: "HIGH",
    status: "IN_PROGRESS",
    coordinates: { lat: 19.076, lng: 72.8777 },
    description: "Major water leak detected in main distribution line",
    reportedAt: "2023-12-01T10:30:00Z",
    reportedBy: "Rajesh Kumar",
    assignedTo: "Emergency Response Team A",
    estimatedCost: 50000,
    pipelineId: "PIPELINE_001",
  },
  {
    id: "CATASTROPHE_002",
    type: "BURST",
    severity: "CRITICAL",
    status: "RESOLVED",
    coordinates: { lat: 19.08, lng: 72.881 },
    description: "Pipeline burst causing service disruption",
    reportedAt: "2023-11-28T14:15:00Z",
    resolvedAt: "2023-11-30T16:45:00Z",
    reportedBy: "Priya Sharma",
    assignedTo: "Emergency Response Team B",
    estimatedCost: 75000,
    actualCost: 68500,
    pipelineId: "PIPELINE_002",
  },
];

/**
 * @swagger
 * /api/catastrophes:
 *   get:
 *     summary: Get all catastrophes
 *     tags: [Catastrophes]
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
 *           enum: [REPORTED, INVESTIGATING, IN_PROGRESS, RESOLVED, CLOSED]
 *         description: Filter by catastrophe status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [LEAK, BURST, BLOCKAGE, CORROSION, SUBSIDENCE, THIRD_PARTY_DAMAGE]
 *         description: Filter by catastrophe type
 *     responses:
 *       200:
 *         description: Successfully retrieved catastrophes
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
 *                     $ref: '#/components/schemas/Catastrophe'
 *                 pagination:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const severity = req.query.severity as string;
  const type = req.query.type as string;

  let filteredCatastrophes = catastrophes;

  if (status) {
    filteredCatastrophes = filteredCatastrophes.filter(
      (catastrophe) => catastrophe.status === status,
    );
  }

  if (severity) {
    filteredCatastrophes = filteredCatastrophes.filter(
      (catastrophe) => catastrophe.severity === severity,
    );
  }

  if (type) {
    filteredCatastrophes = filteredCatastrophes.filter(
      (catastrophe) => catastrophe.type === type,
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCatastrophes = filteredCatastrophes.slice(
    startIndex,
    endIndex,
  );

  const response: PaginatedResponse<Catastrophe> = {
    success: true,
    data: paginatedCatastrophes,
    pagination: {
      page,
      limit,
      total: filteredCatastrophes.length,
      totalPages: Math.ceil(filteredCatastrophes.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/catastrophes/{id}:
 *   get:
 *     summary: Get catastrophe by ID
 *     tags: [Catastrophes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Catastrophe ID
 *     responses:
 *       200:
 *         description: Successfully retrieved catastrophe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Catastrophe'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Catastrophe not found
 */
router.get("/:id", (req, res) => {
  const catastrophe = catastrophes.find((c) => c.id === req.params.id);

  if (!catastrophe) {
    return res.status(404).json({
      error: "Not Found",
      message: "Catastrophe not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<Catastrophe> = {
    success: true,
    data: catastrophe,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/catastrophes:
 *   post:
 *     summary: Report a new catastrophe
 *     tags: [Catastrophes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - coordinates
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [LEAK, BURST, BLOCKAGE, CORROSION, SUBSIDENCE, THIRD_PARTY_DAMAGE]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               coordinates:
 *                 $ref: '#/components/schemas/Coordinates'
 *               description:
 *                 type: string
 *               reportedBy:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               pipelineId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Catastrophe reported successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const {
    type,
    severity,
    coordinates,
    description,
    reportedBy,
    assignedTo,
    estimatedCost,
    pipelineId,
  } = req.body;

  if (!type || !coordinates) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: type, coordinates",
      statusCode: 400,
    });
  }

  const newCatastrophe: Catastrophe = {
    id: `CATASTROPHE_${Date.now()}`,
    type,
    severity: severity || "MEDIUM",
    status: "REPORTED",
    coordinates,
    description,
    reportedAt: new Date().toISOString(),
    reportedBy,
    assignedTo,
    estimatedCost,
    pipelineId,
  };

  catastrophes.push(newCatastrophe);

  const response: ApiResponse<Catastrophe> = {
    success: true,
    data: newCatastrophe,
    message: "Catastrophe reported successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

router.put("/:id", (req, res) => {
  const catastropheIndex = catastrophes.findIndex(
    (c) => c.id === req.params.id,
  );

  if (catastropheIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Catastrophe not found",
      statusCode: 404,
    });
  }

  catastrophes[catastropheIndex] = {
    ...catastrophes[catastropheIndex],
    ...req.body,
    id: req.params.id,
  };

  const response: ApiResponse<Catastrophe> = {
    success: true,
    data: catastrophes[catastropheIndex],
    message: "Catastrophe updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

router.delete("/:id", (req, res) => {
  const catastropheIndex = catastrophes.findIndex(
    (c) => c.id === req.params.id,
  );

  if (catastropheIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Catastrophe not found",
      statusCode: 404,
    });
  }

  catastrophes.splice(catastropheIndex, 1);

  const response = {
    success: true,
    message: "Catastrophe deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as catastropheRoutes };
