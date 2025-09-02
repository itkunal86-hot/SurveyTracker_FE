import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

export interface AssetType {
  id: string; // maps to AT_ID
  name: string; // AT_NAME
  isSurveyElement: boolean; // AT_IS_SURVEY_ELEMENT
  surveyCategoryId: string | null; // SC_ID (FK to survey category)
  menuName?: string | null; // AT_MENU_NAME
  menuOrder?: number | null; // AT_MENU_ORDER
  createdAt: string;
  updatedAt: string;
}

// In-memory mock store
let assetTypes: AssetType[] = [
  {
    id: "AT_001",
    name: "Valve",
    isSurveyElement: true,
    surveyCategoryId: "CAT_001",
    menuName: "Valve",
    menuOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "AT_002",
    name: "Manhole",
    isSurveyElement: true,
    surveyCategoryId: "CAT_003",
    menuName: "Manhole",
    menuOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * @swagger
 * /api/asset-types:
 *   get:
 *     summary: Get asset types (optionally filtered by survey category)
 *     tags: [Asset Types]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: surveyCategoryId
 *         schema:
 *           type: string
 *         description: Filter by survey category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by name or menu name
 *     responses:
 *       200:
 *         description: Successfully retrieved asset types
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const surveyCategoryId = (req.query.surveyCategoryId as string) || undefined;
  const search = (req.query.search as string) || undefined;

  let filtered = assetTypes;
  if (surveyCategoryId) {
    filtered = filtered.filter((a) => a.surveyCategoryId === surveyCategoryId);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (a) => a.name.toLowerCase().includes(term) || (a.menuName || "").toLowerCase().includes(term)
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = filtered.slice(startIndex, endIndex);

  const response: PaginatedResponse<AssetType> = {
    success: true,
    data: paginated,
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
 * /api/asset-types/{id}:
 *   get:
 *     summary: Get asset type by id
 *     tags: [Asset Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Found
 *       404:
 *         description: Not found
 */
router.get("/:id", (req, res) => {
  const item = assetTypes.find((a) => a.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Not Found", message: "Asset type not found", statusCode: 404 });
  }
  const response: ApiResponse<AssetType> = {
    success: true,
    data: item,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

/**
 * @swagger
 * /api/asset-types:
 *   post:
 *     summary: Create asset type
 *     tags: [Asset Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               isSurveyElement: { type: boolean }
 *               surveyCategoryId: { type: string, nullable: true }
 *               menuName: { type: string, nullable: true }
 *               menuOrder: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Invalid input
 */
router.post("/", (req, res) => {
  const { name, isSurveyElement = false, surveyCategoryId = null, menuName = null, menuOrder = null } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: "Bad Request", message: "Missing required field: name", statusCode: 400 });
  }

  // Unique within category by name
  const duplicate = assetTypes.find(
    (a) => a.name.toLowerCase() === String(name).toLowerCase() && a.surveyCategoryId === surveyCategoryId
  );
  if (duplicate) {
    return res.status(400).json({ error: "Bad Request", message: "Asset type name must be unique within category", statusCode: 400 });
  }

  const newItem: AssetType = {
    id: `AT_${Date.now()}`,
    name: String(name),
    isSurveyElement: Boolean(isSurveyElement),
    surveyCategoryId: surveyCategoryId,
    menuName: menuName,
    menuOrder: menuOrder !== null ? Number(menuOrder) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assetTypes.push(newItem);

  const response: ApiResponse<AssetType> = {
    success: true,
    data: newItem,
    message: "Asset type created successfully",
    timestamp: new Date().toISOString(),
  };
  res.status(201).json(response);
});

/**
 * @swagger
 * /api/asset-types/{id}:
 *   put:
 *     summary: Update asset type
 *     tags: [Asset Types]
 */
router.put("/:id", (req, res) => {
  const idx = assetTypes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Not Found", message: "Asset type not found", statusCode: 404 });
  }

  const { name, isSurveyElement, surveyCategoryId, menuName, menuOrder } = req.body || {};

  if (name) {
    const duplicate = assetTypes.find(
      (a) => a.name.toLowerCase() === String(name).toLowerCase() && a.surveyCategoryId === (surveyCategoryId ?? assetTypes[idx].surveyCategoryId) && a.id !== req.params.id
    );
    if (duplicate) {
      return res.status(400).json({ error: "Bad Request", message: "Asset type name must be unique within category", statusCode: 400 });
    }
  }

  const updated: AssetType = {
    ...assetTypes[idx],
    ...(name !== undefined && { name: String(name) }),
    ...(isSurveyElement !== undefined && { isSurveyElement: Boolean(isSurveyElement) }),
    ...(surveyCategoryId !== undefined && { surveyCategoryId }),
    ...(menuName !== undefined && { menuName }),
    ...(menuOrder !== undefined && { menuOrder: menuOrder !== null ? Number(menuOrder) : null }),
    updatedAt: new Date().toISOString(),
  };

  assetTypes[idx] = updated;

  const response: ApiResponse<AssetType> = {
    success: true,
    data: updated,
    message: "Asset type updated successfully",
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

/**
 * @swagger
 * /api/asset-types/{id}:
 *   delete:
 *     summary: Delete asset type
 *     tags: [Asset Types]
 */
router.delete("/:id", (req, res) => {
  const idx = assetTypes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Not Found", message: "Asset type not found", statusCode: 404 });
  }
  assetTypes.splice(idx, 1);
  res.json({ success: true, message: "Asset type deleted successfully", timestamp: new Date().toISOString() });
});

export { router as assetTypeRoutes, type AssetType };
