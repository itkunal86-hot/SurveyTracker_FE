import express from "express";
import { ValveOperation, ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

// Mock data - In production, this would come from a database
let valveOperations: ValveOperation[] = [
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
  {
    id: "OP-003",
    valveId: "VALVE_001", 
    operation: "OPEN",
    status: "COMPLETED",
    timestamp: new Date(2024, 0, 16, 10, 0, 0).toISOString(),
    operator: "Mike Davis",
    reason: "Reopened after repair",
    notes: "Reopened after leak repair completion",
  },
];

/**
 * @swagger
 * /api/valve-operations:
 *   get:
 *     summary: Get all valve operations
 *     tags: [Valve Operations]
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
 *         name: valveId
 *         schema:
 *           type: string
 *         description: Filter by valve ID
 *       - in: query
 *         name: operation
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSE, MAINTAIN, INSPECT, REPAIR]
 *         description: Filter by operation type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, FAILED, IN_PROGRESS, SCHEDULED]
 *         description: Filter by operation status
 *     responses:
 *       200:
 *         description: Successfully retrieved valve operations
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
 *                     $ref: '#/components/schemas/ValveOperation'
 *                 pagination:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const valveId = req.query.valveId as string;
  const operation = req.query.operation as string;
  const status = req.query.status as string;

  let filteredOperations = valveOperations;

  if (valveId) {
    filteredOperations = filteredOperations.filter(
      (op) => op.valveId === valveId,
    );
  }

  if (operation) {
    filteredOperations = filteredOperations.filter(
      (op) => op.operation === operation,
    );
  }

  if (status) {
    filteredOperations = filteredOperations.filter(
      (op) => op.status === status,
    );
  }

  // Sort by timestamp descending (most recent first)
  filteredOperations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedOperations = filteredOperations.slice(startIndex, endIndex);

  const response: PaginatedResponse<ValveOperation> = {
    success: true,
    data: paginatedOperations,
    pagination: {
      page,
      limit,
      total: filteredOperations.length,
      totalPages: Math.ceil(filteredOperations.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/valve-operations/{id}:
 *   get:
 *     summary: Get valve operation by ID
 *     tags: [Valve Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Valve operation ID
 *     responses:
 *       200:
 *         description: Successfully retrieved valve operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ValveOperation'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Valve operation not found
 */
router.get("/:id", (req, res) => {
  const operation = valveOperations.find((op) => op.id === req.params.id);

  if (!operation) {
    return res.status(404).json({
      error: "Not Found",
      message: "Valve operation not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<ValveOperation> = {
    success: true,
    data: operation,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/valve-operations:
 *   post:
 *     summary: Create new valve operation
 *     tags: [Valve Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valveId
 *               - operation
 *               - operator
 *             properties:
 *               valveId:
 *                 type: string
 *               operation:
 *                 type: string
 *                 enum: [OPEN, CLOSE, MAINTAIN, INSPECT, REPAIR]
 *               operator:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               duration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Valve operation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ValveOperation'
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const { valveId, operation, operator, reason, notes, duration } = req.body;

  if (!valveId || !operation || !operator) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: valveId, operation, operator",
      statusCode: 400,
    });
  }

  const newOperation: ValveOperation = {
    id: `OP-${Date.now()}`,
    valveId,
    operation,
    status: "COMPLETED",
    timestamp: new Date().toISOString(),
    operator,
    reason,
    notes,
    duration,
  };

  valveOperations.push(newOperation);

  const response: ApiResponse<ValveOperation> = {
    success: true,
    data: newOperation,
    message: "Valve operation created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

/**
 * @swagger
 * /api/valve-operations/{id}:
 *   put:
 *     summary: Update valve operation
 *     tags: [Valve Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Valve operation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValveOperation'
 *     responses:
 *       200:
 *         description: Valve operation updated successfully
 *       404:
 *         description: Valve operation not found
 */
router.put("/:id", (req, res) => {
  const operationIndex = valveOperations.findIndex((op) => op.id === req.params.id);

  if (operationIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Valve operation not found",
      statusCode: 404,
    });
  }

  valveOperations[operationIndex] = {
    ...valveOperations[operationIndex],
    ...req.body,
    id: req.params.id,
  };

  const response: ApiResponse<ValveOperation> = {
    success: true,
    data: valveOperations[operationIndex],
    message: "Valve operation updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/valve-operations/{id}:
 *   delete:
 *     summary: Delete valve operation
 *     tags: [Valve Operations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Valve operation ID
 *     responses:
 *       200:
 *         description: Valve operation deleted successfully
 *       404:
 *         description: Valve operation not found
 */
router.delete("/:id", (req, res) => {
  const operationIndex = valveOperations.findIndex((op) => op.id === req.params.id);

  if (operationIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Valve operation not found",
      statusCode: 404,
    });
  }

  valveOperations.splice(operationIndex, 1);

  const response = {
    success: true,
    message: "Valve operation deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as valveOperationRoutes };