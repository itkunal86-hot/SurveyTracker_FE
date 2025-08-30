import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

interface DeviceAssignment {
  id: string;
  deviceId: string;
  deviceName?: string;
  surveyId: string;
  surveyName?: string;
  assignedDate: string;
  unassignedDate?: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  assignedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssignmentConflict {
  deviceId: string;
  deviceName: string;
  conflictingSurveyId: string;
  conflictingSurveyName: string;
  assignedDate: string;
  unassignedDate?: string;
}

// Mock data - In production, this would come from a database
let deviceAssignments: DeviceAssignment[] = [
  {
    id: "ASN_001",
    deviceId: "TRIMBLE_001",
    deviceName: "Trimble SPS986 Unit 001",
    surveyId: "SUR_001",
    surveyName: "Mumbai Gas Main Line Survey",
    assignedDate: "2024-01-15T08:00:00Z",
    status: "ACTIVE",
    assignedBy: "Admin User",
    notes: "Primary device for gas pipeline survey",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ASN_002",
    deviceId: "TRIMBLE_002",
    deviceName: "Trimble SPS986 Unit 002",
    surveyId: "SUR_002",
    surveyName: "Fiber Network Expansion",
    assignedDate: "2024-01-16T09:00:00Z",
    status: "ACTIVE",
    assignedBy: "Admin User",
    notes: "Fiber optics survey device",
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-16T09:00:00Z",
  },
  {
    id: "ASN_003",
    deviceId: "TRIMBLE_003",
    deviceName: "Trimble SPS986 Unit 003",
    surveyId: "SUR_003",
    surveyName: "Water Distribution Assessment",
    assignedDate: "2023-11-01T10:00:00Z",
    unassignedDate: "2023-12-31T18:00:00Z",
    status: "COMPLETED",
    assignedBy: "Admin User",
    notes: "Completed water survey project",
    createdAt: "2023-11-01T10:00:00Z",
    updatedAt: "2023-12-31T18:00:00Z",
  },
];

/**
 * @swagger
 * /api/device-assignments:
 *   get:
 *     summary: Get all device assignments
 *     tags: [Device Assignments]
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
 *         name: surveyId
 *         schema:
 *           type: string
 *         description: Filter by survey ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED]
 *         description: Filter by assignment status
 *     responses:
 *       200:
 *         description: Successfully retrieved device assignments
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const deviceId = req.query.deviceId as string;
  const surveyId = req.query.surveyId as string;
  const status = req.query.status as string;

  let filteredAssignments = deviceAssignments;

  if (deviceId) {
    filteredAssignments = filteredAssignments.filter(
      (assignment) => assignment.deviceId === deviceId
    );
  }

  if (surveyId) {
    filteredAssignments = filteredAssignments.filter(
      (assignment) => assignment.surveyId === surveyId
    );
  }

  if (status) {
    filteredAssignments = filteredAssignments.filter(
      (assignment) => assignment.status === status
    );
  }

  // Sort by assigned date descending (most recent first)
  filteredAssignments.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

  const response: PaginatedResponse<DeviceAssignment> = {
    success: true,
    data: paginatedAssignments,
    pagination: {
      page,
      limit,
      total: filteredAssignments.length,
      totalPages: Math.ceil(filteredAssignments.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/device-assignments/by-survey/{surveyId}:
 *   get:
 *     summary: Get all device assignments for a specific survey
 *     tags: [Device Assignments]
 *     parameters:
 *       - in: path
 *         name: surveyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Successfully retrieved device assignments for survey
 */
router.get("/by-survey/:surveyId", (req, res) => {
  const surveyId = req.params.surveyId;
  
  const assignments = deviceAssignments
    .filter((assignment) => assignment.surveyId === surveyId)
    .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());

  const response: ApiResponse<DeviceAssignment[]> = {
    success: true,
    data: assignments,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/device-assignments/conflicts:
 *   get:
 *     summary: Check for device assignment conflicts
 *     tags: [Device Assignments]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         schema:
 *           type: string
 *         description: Device ID to check conflicts for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for conflict check
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for conflict check
 *     responses:
 *       200:
 *         description: Successfully checked for conflicts
 */
router.get("/conflicts", (req, res) => {
  const deviceId = req.query.deviceId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let conflicts: AssignmentConflict[] = [];

  if (deviceId && startDate && endDate) {
    const conflictingAssignments = deviceAssignments.filter((assignment) => {
      if (assignment.deviceId !== deviceId || assignment.status !== "ACTIVE") {
        return false;
      }

      const assignedDate = new Date(assignment.assignedDate);
      const requestStartDate = new Date(startDate);
      const requestEndDate = new Date(endDate);
      const unassignedDate = assignment.unassignedDate ? new Date(assignment.unassignedDate) : null;

      // Check if there's overlap
      if (unassignedDate) {
        return assignedDate <= requestEndDate && unassignedDate >= requestStartDate;
      } else {
        return assignedDate <= requestEndDate;
      }
    });

    conflicts = conflictingAssignments.map((assignment) => ({
      deviceId: assignment.deviceId,
      deviceName: assignment.deviceName || "",
      conflictingSurveyId: assignment.surveyId,
      conflictingSurveyName: assignment.surveyName || "",
      assignedDate: assignment.assignedDate,
      unassignedDate: assignment.unassignedDate,
    }));
  }

  const response: ApiResponse<AssignmentConflict[]> = {
    success: true,
    data: conflicts,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/device-assignments/{id}:
 *   get:
 *     summary: Get device assignment by ID
 *     tags: [Device Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device assignment ID
 *     responses:
 *       200:
 *         description: Successfully retrieved device assignment
 *       404:
 *         description: Device assignment not found
 */
router.get("/:id", (req, res) => {
  const assignment = deviceAssignments.find((asn) => asn.id === req.params.id);

  if (!assignment) {
    return res.status(404).json({
      error: "Not Found",
      message: "Device assignment not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<DeviceAssignment> = {
    success: true,
    data: assignment,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/device-assignments:
 *   post:
 *     summary: Create new device assignment
 *     tags: [Device Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - surveyId
 *               - assignedDate
 *               - assignedBy
 *             properties:
 *               deviceId:
 *                 type: string
 *               surveyId:
 *                 type: string
 *               assignedDate:
 *                 type: string
 *                 format: date-time
 *               assignedBy:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device assignment created successfully
 *       400:
 *         description: Invalid input or conflict detected
 */
router.post("/", (req, res) => {
  const { deviceId, surveyId, assignedDate, assignedBy, notes } = req.body;

  if (!deviceId || !surveyId || !assignedDate || !assignedBy) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: deviceId, surveyId, assignedDate, assignedBy",
      statusCode: 400,
    });
  }

  // Check for existing active assignment for this device
  const existingAssignment = deviceAssignments.find(
    (assignment) => assignment.deviceId === deviceId && assignment.status === "ACTIVE"
  );

  if (existingAssignment) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Device is already assigned to an active survey",
      statusCode: 400,
    });
  }

  const newAssignment: DeviceAssignment = {
    id: `ASN_${Date.now()}`,
    deviceId,
    surveyId,
    assignedDate,
    status: "ACTIVE",
    assignedBy,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  deviceAssignments.push(newAssignment);

  const response: ApiResponse<DeviceAssignment> = {
    success: true,
    data: newAssignment,
    message: "Device assignment created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

/**
 * @swagger
 * /api/device-assignments/{id}:
 *   put:
 *     summary: Update device assignment
 *     tags: [Device Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unassignedDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, CANCELLED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device assignment updated successfully
 *       404:
 *         description: Device assignment not found
 */
router.put("/:id", (req, res) => {
  const assignmentIndex = deviceAssignments.findIndex((asn) => asn.id === req.params.id);

  if (assignmentIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Device assignment not found",
      statusCode: 404,
    });
  }

  const { unassignedDate, status, notes } = req.body;

  deviceAssignments[assignmentIndex] = {
    ...deviceAssignments[assignmentIndex],
    ...(unassignedDate && { unassignedDate }),
    ...(status && { status }),
    ...(notes !== undefined && { notes }),
    updatedAt: new Date().toISOString(),
  };

  const response: ApiResponse<DeviceAssignment> = {
    success: true,
    data: deviceAssignments[assignmentIndex],
    message: "Device assignment updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/device-assignments/{id}:
 *   delete:
 *     summary: Delete device assignment
 *     tags: [Device Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device assignment ID
 *     responses:
 *       200:
 *         description: Device assignment deleted successfully
 *       404:
 *         description: Device assignment not found
 */
router.delete("/:id", (req, res) => {
  const assignmentIndex = deviceAssignments.findIndex((asn) => asn.id === req.params.id);

  if (assignmentIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Device assignment not found",
      statusCode: 404,
    });
  }

  deviceAssignments.splice(assignmentIndex, 1);

  const response = {
    success: true,
    message: "Device assignment deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as deviceAssignmentRoutes };
