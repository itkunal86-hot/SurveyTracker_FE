import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

interface SurveyAttribute {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  dataType: "TEXT" | "NUMBER" | "DATE" | "DROPDOWN";
  dropdownOptions?: string[];
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Mock data - In production, this would come from a database
let surveyAttributes: SurveyAttribute[] = [
  {
    id: "ATTR_001",
    categoryId: "CAT_001",
    categoryName: "Gas Pipeline",
    name: "Pipe Diameter",
    dataType: "NUMBER",
    isRequired: true,
    order: 1,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ATTR_002",
    categoryId: "CAT_001", 
    categoryName: "Gas Pipeline",
    name: "Material Type",
    dataType: "DROPDOWN",
    dropdownOptions: ["Steel", "HDPE", "PVC", "Concrete"],
    isRequired: true,
    order: 2,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ATTR_003",
    categoryId: "CAT_001",
    categoryName: "Gas Pipeline", 
    name: "Installation Date",
    dataType: "DATE",
    isRequired: false,
    order: 3,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "ATTR_004",
    categoryId: "CAT_002",
    categoryName: "Fiber Optics",
    name: "Core Count",
    dataType: "NUMBER",
    isRequired: true,
    order: 1,
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
  },
  {
    id: "ATTR_005",
    categoryId: "CAT_002",
    categoryName: "Fiber Optics",
    name: "Cable Type",
    dataType: "DROPDOWN",
    dropdownOptions: ["Single Mode", "Multi Mode", "Armored", "Aerial"],
    isRequired: true,
    order: 2,
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T09:30:00Z",
  },
];

/**
 * @swagger
 * /api/survey-attributes:
 *   get:
 *     summary: Get all survey attributes
 *     tags: [Survey Attributes]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name
 *     responses:
 *       200:
 *         description: Successfully retrieved survey attributes
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const categoryId = req.query.categoryId as string;
  const search = req.query.search as string;

  let filteredAttributes = surveyAttributes;

  if (categoryId) {
    filteredAttributes = filteredAttributes.filter(
      (attr) => attr.categoryId === categoryId
    );
  }

  if (search) {
    filteredAttributes = filteredAttributes.filter(
      (attr) => attr.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort by category and order
  filteredAttributes.sort((a, b) => {
    if (a.categoryId !== b.categoryId) {
      return a.categoryId.localeCompare(b.categoryId);
    }
    return a.order - b.order;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedAttributes = filteredAttributes.slice(startIndex, endIndex);

  const response: PaginatedResponse<SurveyAttribute> = {
    success: true,
    data: paginatedAttributes,
    pagination: {
      page,
      limit,
      total: filteredAttributes.length,
      totalPages: Math.ceil(filteredAttributes.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-attributes/by-category/{categoryId}:
 *   get:
 *     summary: Get all attributes for a specific category
 *     tags: [Survey Attributes]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey category ID
 *     responses:
 *       200:
 *         description: Successfully retrieved survey attributes for category
 */
router.get("/by-category/:categoryId", (req, res) => {
  const categoryId = req.params.categoryId;
  
  const attributes = surveyAttributes
    .filter((attr) => attr.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);

  const response: ApiResponse<SurveyAttribute[]> = {
    success: true,
    data: attributes,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-attributes/{id}:
 *   get:
 *     summary: Get survey attribute by ID
 *     tags: [Survey Attributes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey attribute ID
 *     responses:
 *       200:
 *         description: Successfully retrieved survey attribute
 *       404:
 *         description: Survey attribute not found
 */
router.get("/:id", (req, res) => {
  const attribute = surveyAttributes.find((attr) => attr.id === req.params.id);

  if (!attribute) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey attribute not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<SurveyAttribute> = {
    success: true,
    data: attribute,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-attributes:
 *   post:
 *     summary: Create new survey attribute
 *     tags: [Survey Attributes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - name
 *               - dataType
 *               - isRequired
 *               - order
 *             properties:
 *               categoryId:
 *                 type: string
 *               name:
 *                 type: string
 *               dataType:
 *                 type: string
 *                 enum: [TEXT, NUMBER, DATE, DROPDOWN]
 *               dropdownOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *               isRequired:
 *                 type: boolean
 *               order:
 *                 type: number
 *     responses:
 *       201:
 *         description: Survey attribute created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const { categoryId, name, dataType, dropdownOptions, isRequired, order } = req.body;

  if (!categoryId || !name || !dataType || isRequired === undefined || !order) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required fields: categoryId, name, dataType, isRequired, order",
      statusCode: 400,
    });
  }

  // Validate dropdown options for DROPDOWN type
  if (dataType === "DROPDOWN" && (!dropdownOptions || dropdownOptions.length === 0)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Dropdown options are required for DROPDOWN data type",
      statusCode: 400,
    });
  }

  const newAttribute: SurveyAttribute = {
    id: `ATTR_${Date.now()}`,
    categoryId,
    name,
    dataType,
    dropdownOptions: dataType === "DROPDOWN" ? dropdownOptions : undefined,
    isRequired,
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  surveyAttributes.push(newAttribute);

  const response: ApiResponse<SurveyAttribute> = {
    success: true,
    data: newAttribute,
    message: "Survey attribute created successfully",
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

/**
 * @swagger
 * /api/survey-attributes/{id}:
 *   put:
 *     summary: Update survey attribute
 *     tags: [Survey Attributes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey attribute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               name:
 *                 type: string
 *               dataType:
 *                 type: string
 *                 enum: [TEXT, NUMBER, DATE, DROPDOWN]
 *               dropdownOptions:
 *                 type: array
 *                 items:
 *                   type: string
 *               isRequired:
 *                 type: boolean
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Survey attribute updated successfully
 *       404:
 *         description: Survey attribute not found
 */
router.put("/:id", (req, res) => {
  const attributeIndex = surveyAttributes.findIndex((attr) => attr.id === req.params.id);

  if (attributeIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey attribute not found",
      statusCode: 404,
    });
  }

  const { categoryId, name, dataType, dropdownOptions, isRequired, order } = req.body;

  // Validate dropdown options for DROPDOWN type
  if (dataType === "DROPDOWN" && (!dropdownOptions || dropdownOptions.length === 0)) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Dropdown options are required for DROPDOWN data type",
      statusCode: 400,
    });
  }

  surveyAttributes[attributeIndex] = {
    ...surveyAttributes[attributeIndex],
    ...(categoryId && { categoryId }),
    ...(name && { name }),
    ...(dataType && { dataType }),
    ...(dataType === "DROPDOWN" && dropdownOptions && { dropdownOptions }),
    ...(isRequired !== undefined && { isRequired }),
    ...(order && { order }),
    updatedAt: new Date().toISOString(),
  };

  const response: ApiResponse<SurveyAttribute> = {
    success: true,
    data: surveyAttributes[attributeIndex],
    message: "Survey attribute updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/survey-attributes/{id}:
 *   delete:
 *     summary: Delete survey attribute
 *     tags: [Survey Attributes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey attribute ID
 *     responses:
 *       200:
 *         description: Survey attribute deleted successfully
 *       404:
 *         description: Survey attribute not found
 */
router.delete("/:id", (req, res) => {
  const attributeIndex = surveyAttributes.findIndex((attr) => attr.id === req.params.id);

  if (attributeIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey attribute not found",
      statusCode: 404,
    });
  }

  surveyAttributes.splice(attributeIndex, 1);

  const response = {
    success: true,
    message: "Survey attribute deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as surveyAttributeRoutes };
