import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

interface SurveyItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: "ACTIVE" | "CLOSED";
  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Mock data - In production, this would come from a database
let surveys: SurveyItem[] = [
  {
    id: "SUR_001",
    name: "Mumbai Gas Main Line Survey",
    categoryId: "CAT_001",
    categoryName: "Gas Pipeline",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    status: "ACTIVE",
    createdBy: "Admin User",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "SUR_002",
    name: "Fiber Network Expansion",
    categoryId: "CAT_002",
    categoryName: "Fiber Optics",
    startDate: "2024-02-01",
    endDate: "2024-04-01",
    status: "ACTIVE",
    createdBy: "Admin User",
    createdAt: "2024-01-25T09:30:00Z",
    updatedAt: "2024-01-25T09:30:00Z",
  },
  {
    id: "SUR_003",
    name: "Water Distribution Assessment",
    categoryId: "CAT_003",
    categoryName: "Waterline",
    startDate: "2023-11-01",
    endDate: "2023-12-31",
    status: "CLOSED",
    createdBy: "Admin User",
    createdAt: "2023-10-25T10:15:00Z",
    updatedAt: "2024-01-05T10:15:00Z",
  },
];

/**
 * @swagger
 * /api/survey-management:
 *   get:
 *     summary: Get all surveys (management)
 *     tags: [Survey Management]
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
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, CLOSED]
 *         description: Filter by survey status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or categoryName
 *     responses:
 *       200:
 *         description: Successfully retrieved surveys
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const categoryId = req.query.categoryId as string;
  const status = req.query.status as string;
  const search = req.query.search as string;

  let filtered = surveys;

  if (categoryId) {
    filtered = filtered.filter((s) => s.categoryId === categoryId);
  }

  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) => s.name.toLowerCase().includes(q) || s.categoryName?.toLowerCase().includes(q),
    );
  }

  // Sort by updatedAt desc
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageItems = filtered.slice(startIndex, endIndex);

  const response: PaginatedResponse<SurveyItem> = {
    success: true,
    data: pageItems,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-management/{id}:
 *   get:
 *     summary: Get survey by ID (management)
 *     tags: [Survey Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Successfully retrieved survey
 *       404:
 *         description: Survey not found
 */
router.get("/:id", (req, res) => {
  const survey = surveys.find((s) => s.id === req.params.id);

  if (!survey) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<SurveyItem> = {
    success: true,
    data: survey,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-management:
 *   post:
 *     summary: Create new survey (management)
 *     tags: [Survey Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - startDate
 *               - endDate
 *               - status
 *               - createdBy
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CLOSED]
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Survey created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const { name, categoryId, startDate, endDate, status, createdBy, categoryName } = req.body;

  if (!name || !categoryId || !startDate || !endDate || !status || !createdBy) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: name, categoryId, startDate, endDate, status, createdBy",
      statusCode: 400,
    });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "End date must be after start date",
      statusCode: 400,
    });
  }

  const newSurvey: SurveyItem = {
    id: `SUR_${Date.now()}`,
    name,
    categoryId,
    categoryName,
    startDate,
    endDate,
    status,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  surveys.push(newSurvey);

  const response: ApiResponse<SurveyItem> = {
    success: true,
    data: newSurvey,
    message: "Survey created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

/**
 * @swagger
 * /api/survey-management/{id}:
 *   put:
 *     summary: Update survey (management)
 *     tags: [Survey Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               categoryName:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CLOSED]
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *       404:
 *         description: Survey not found
 */
router.put("/:id", (req, res) => {
  const index = surveys.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey not found",
      statusCode: 404,
    });
  }

  const { startDate, endDate } = req.body;
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "End date must be after start date",
      statusCode: 400,
    });
  }

  surveys[index] = {
    ...surveys[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  const response: ApiResponse<SurveyItem> = {
    success: true,
    data: surveys[index],
    message: "Survey updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-management/{id}:
 *   delete:
 *     summary: Delete survey (management)
 *     tags: [Survey Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey ID
 *     responses:
 *       200:
 *         description: Survey deleted successfully
 *       404:
 *         description: Survey not found
 */
router.delete("/:id", (req, res) => {
  const index = surveys.findIndex((s) => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey not found",
      statusCode: 404,
    });
  }

  surveys.splice(index, 1);

  res.json({
    success: true,
    message: "Survey deleted successfully",
    timestamp: new Date().toISOString(),
  });
});

export { router as surveyManagementRoutes };
