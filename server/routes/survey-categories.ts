import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

interface SurveyCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data - In production, this would come from a database
let surveyCategories: SurveyCategory[] = [
  {
    id: "CAT_001",
    name: "Gas Pipeline",
    description: "Surveys for natural gas pipeline infrastructure",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "CAT_002", 
    name: "Fiber Optics",
    description: "Telecommunications fiber optic cable surveys",
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
  },
  {
    id: "CAT_003",
    name: "Waterline",
    description: "Water supply and distribution pipeline surveys",
    createdAt: "2024-01-17T10:15:00Z", 
    updatedAt: "2024-01-17T10:15:00Z",
  },
  {
    id: "CAT_004",
    name: "Electrical",
    description: "Underground electrical cable and conduit surveys",
    createdAt: "2024-01-18T11:45:00Z",
    updatedAt: "2024-01-18T11:45:00Z",
  },
];

/**
 * @swagger
 * /api/survey-categories:
 *   get:
 *     summary: Get all survey categories
 *     tags: [Survey Categories]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *     responses:
 *       200:
 *         description: Successfully retrieved survey categories
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;

  let filteredCategories = surveyCategories;

  if (search) {
    filteredCategories = filteredCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const response: PaginatedResponse<SurveyCategory> = {
    success: true,
    data: paginatedCategories,
    pagination: {
      page,
      limit,
      total: filteredCategories.length,
      totalPages: Math.ceil(filteredCategories.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-categories/{id}:
 *   get:
 *     summary: Get survey category by ID
 *     tags: [Survey Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey category ID
 *     responses:
 *       200:
 *         description: Successfully retrieved survey category
 *       404:
 *         description: Survey category not found
 */
router.get("/:id", (req, res) => {
  const category = surveyCategories.find((cat) => cat.id === req.params.id);

  if (!category) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey category not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<SurveyCategory> = {
    success: true,
    data: category,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-categories:
 *   post:
 *     summary: Create new survey category
 *     tags: [Survey Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Survey category created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required field: name",
      statusCode: 400,
    });
  }

  // Check for duplicate names
  const existingCategory = surveyCategories.find(
    (cat) => cat.name.toLowerCase() === name.toLowerCase()
  );

  if (existingCategory) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Category name must be unique",
      statusCode: 400,
    });
  }

  const newCategory: SurveyCategory = {
    id: `CAT_${Date.now()}`,
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  surveyCategories.push(newCategory);

  const response: ApiResponse<SurveyCategory> = {
    success: true,
    data: newCategory,
    message: "Survey category created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

/**
 * @swagger
 * /api/survey-categories/{id}:
 *   put:
 *     summary: Update survey category
 *     tags: [Survey Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Survey category updated successfully
 *       404:
 *         description: Survey category not found
 */
router.put("/:id", (req, res) => {
  const categoryIndex = surveyCategories.findIndex((cat) => cat.id === req.params.id);

  if (categoryIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey category not found",
      statusCode: 404,
    });
  }

  const { name, description } = req.body;

  // Check for duplicate names (excluding current category)
  if (name) {
    const existingCategory = surveyCategories.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== req.params.id
    );

    if (existingCategory) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Category name must be unique",
        statusCode: 400,
      });
    }
  }

  surveyCategories[categoryIndex] = {
    ...surveyCategories[categoryIndex],
    ...(name && { name }),
    ...(description !== undefined && { description }),
    updatedAt: new Date().toISOString(),
  };

  const response: ApiResponse<SurveyCategory> = {
    success: true,
    data: surveyCategories[categoryIndex],
    message: "Survey category updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-categories/{id}:
 *   delete:
 *     summary: Delete survey category
 *     tags: [Survey Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey category ID
 *     responses:
 *       200:
 *         description: Survey category deleted successfully
 *       404:
 *         description: Survey category not found
 */
router.delete("/:id", (req, res) => {
  const categoryIndex = surveyCategories.findIndex((cat) => cat.id === req.params.id);

  if (categoryIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey category not found",
      statusCode: 404,
    });
  }

  surveyCategories.splice(categoryIndex, 1);

  const response = {
    success: true,
    message: "Survey category deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as surveyCategoryRoutes };
