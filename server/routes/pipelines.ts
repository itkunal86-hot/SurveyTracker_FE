import express from "express";
import {
  PipelineSegment,
  ApiResponse,
  PaginatedResponse,
} from "../models/types";

const router = express.Router();

// READ-ONLY ROUTES: Pipeline data is sourced from Trimble surveying equipment
// and cannot be modified through the API. Only GET operations are supported.
// Mock data - In production, this would come from Trimble database integration
let pipelines: PipelineSegment[] = [
  {
    id: "PIPELINE_001",
    name: "Main Distribution Line A",
    diameter: 300,
    material: "STEEL",
    depth: 1.5,
    pressure: 10,
    installDate: "2020-01-15",
    status: "OPERATIONAL",
    coordinates: [
      { lat: 19.076, lng: 72.8777 },
      { lat: 19.078, lng: 72.879 },
      { lat: 19.08, lng: 72.881 },
    ],
  },
  {
    id: "PIPELINE_002",
    name: "Secondary Branch B",
    diameter: 200,
    material: "HDPE",
    depth: 1.2,
    pressure: 8,
    installDate: "2021-03-20",
    status: "OPERATIONAL",
    coordinates: [
      { lat: 19.08, lng: 72.881 },
      { lat: 19.082, lng: 72.883 },
      { lat: 19.084, lng: 72.885 },
    ],
  },
  {
    id: "PIPELINE_003",
    name: "Service Line C",
    diameter: 150,
    material: "PVC",
    depth: 1.0,
    pressure: 6,
    installDate: "2022-06-10",
    status: "MAINTENANCE",
    coordinates: [
      { lat: 19.084, lng: 72.885 },
      { lat: 19.086, lng: 72.887 },
      { lat: 19.088, lng: 72.889 },
    ],
  },
];

/**
 * @swagger
 * /api/pipelines:
 *   get:
 *     summary: Get all pipeline segments (Read-Only - Trimble Data Source)
 *     description: Retrieves pipeline segment data populated from Trimble surveying equipment. This data cannot be modified through the API as it is sourced directly from field measurements.
 *     tags: [Pipelines]
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
 *           enum: [OPERATIONAL, MAINTENANCE, DAMAGED, INACTIVE]
 *         description: Filter by pipeline status
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           enum: [STEEL, HDPE, PVC, CONCRETE]
 *         description: Filter by pipeline material
 *     responses:
 *       200:
 *         description: Successfully retrieved pipeline segments
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
 *                     $ref: '#/components/schemas/PipelineSegment'
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
  const material = req.query.material as string;

  let filteredPipelines = pipelines;

  if (status) {
    filteredPipelines = filteredPipelines.filter(
      (pipeline) => pipeline.status === status,
    );
  }

  if (material) {
    filteredPipelines = filteredPipelines.filter(
      (pipeline) => pipeline.material === material,
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPipelines = filteredPipelines.slice(startIndex, endIndex);

  const response: PaginatedResponse<PipelineSegment> = {
    success: true,
    data: paginatedPipelines,
    pagination: {
      page,
      limit,
      total: filteredPipelines.length,
      totalPages: Math.ceil(filteredPipelines.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/pipelines/{id}:
 *   get:
 *     summary: Get pipeline segment by ID (Read-Only - Trimble Data Source)
 *     description: Retrieves a specific pipeline segment by ID. Data is sourced from Trimble surveying equipment and cannot be modified via API.
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pipeline segment ID
 *     responses:
 *       200:
 *         description: Successfully retrieved pipeline segment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PipelineSegment'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Pipeline segment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", (req, res) => {
  const pipeline = pipelines.find((p) => p.id === req.params.id);

  if (!pipeline) {
    return res.status(404).json({
      error: "Not Found",
      message: "Pipeline segment not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<PipelineSegment> = {
    success: true,
    data: pipeline,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as pipelineRoutes };
