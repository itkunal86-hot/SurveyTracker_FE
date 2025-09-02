import express from "express";
import { ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

export interface AssetProperty {
  id: string; // AP_ID
  name: string; // AP_NAME
  dataType: number; // AP_DATA_TYPE
  isRequired: boolean; // AP_IS_REQUIRED
  order?: number | null; // AP_ORDER
  options?: string | null; // AP_OPTIONS (could be JSON or CSV)
  valueUnit?: string | null; // AP_VALUE_UNIT
  assetTypeId: string; // AT_ID (FK to asset type)
  createdAt: string;
  updatedAt: string;
}

// Mock storage
let assetProperties: AssetProperty[] = [
  {
    id: "AP_001",
    name: "Diameter",
    dataType: 1,
    isRequired: true,
    order: 1,
    options: null,
    valueUnit: "mm",
    assetTypeId: "AT_001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "AP_002",
    name: "Valve Type",
    dataType: 2,
    isRequired: true,
    order: 2,
    options: JSON.stringify(["Gate", "Ball", "Butterfly"]),
    valueUnit: null,
    assetTypeId: "AT_001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * @swagger
 * /api/asset-properties:
 *   get:
 *     summary: Get asset properties, optionally filtered by assetTypeId
 *     tags: [Asset Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: assetTypeId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Successfully retrieved asset properties
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const assetTypeId = (req.query.assetTypeId as string) || undefined;
  const search = (req.query.search as string) || undefined;

  let filtered = assetProperties;
  if (assetTypeId) filtered = filtered.filter((p) => p.assetTypeId === assetTypeId);
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = filtered.slice(startIndex, endIndex);

  const response: PaginatedResponse<AssetProperty> = {
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

/** Get by id */
router.get("/:id", (req, res) => {
  const item = assetProperties.find((p) => p.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not Found", message: "Asset property not found", statusCode: 404 });
  const response: ApiResponse<AssetProperty> = { success: true, data: item, timestamp: new Date().toISOString() };
  res.json(response);
});

/** Create */
router.post("/", (req, res) => {
  const { name, dataType, isRequired = false, order = null, options = null, valueUnit = null, assetTypeId } = req.body || {};
  if (!name) return res.status(400).json({ error: "Bad Request", message: "Missing required field: name", statusCode: 400 });
  if (assetTypeId == null || assetTypeId === "") return res.status(400).json({ error: "Bad Request", message: "Missing required field: assetTypeId", statusCode: 400 });
  if (dataType == null || Number.isNaN(Number(dataType))) return res.status(400).json({ error: "Bad Request", message: "Invalid dataType", statusCode: 400 });

  const duplicate = assetProperties.find((p) => p.name.toLowerCase() === String(name).toLowerCase() && p.assetTypeId === assetTypeId);
  if (duplicate) return res.status(400).json({ error: "Bad Request", message: "Property name must be unique within asset type", statusCode: 400 });

  const newItem: AssetProperty = {
    id: `AP_${Date.now()}`,
    name: String(name),
    dataType: Number(dataType),
    isRequired: Boolean(isRequired),
    order: order !== null ? Number(order) : null,
    options: options ?? null,
    valueUnit: valueUnit ?? null,
    assetTypeId: String(assetTypeId),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assetProperties.push(newItem);
  const response: ApiResponse<AssetProperty> = { success: true, data: newItem, message: "Asset property created successfully", timestamp: new Date().toISOString() };
  res.status(201).json(response);
});

/** Update */
router.put("/:id", (req, res) => {
  const idx = assetProperties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not Found", message: "Asset property not found", statusCode: 404 });

  const { name, dataType, isRequired, order, options, valueUnit, assetTypeId } = req.body || {};

  if (name) {
    const duplicate = assetProperties.find((p) => p.name.toLowerCase() === String(name).toLowerCase() && p.assetTypeId === (assetTypeId ?? assetProperties[idx].assetTypeId) && p.id !== req.params.id);
    if (duplicate) return res.status(400).json({ error: "Bad Request", message: "Property name must be unique within asset type", statusCode: 400 });
  }

  const updated: AssetProperty = {
    ...assetProperties[idx],
    ...(name !== undefined && { name: String(name) }),
    ...(dataType !== undefined && { dataType: Number(dataType) }),
    ...(isRequired !== undefined && { isRequired: Boolean(isRequired) }),
    ...(order !== undefined && { order: order !== null ? Number(order) : null }),
    ...(options !== undefined && { options }),
    ...(valueUnit !== undefined && { valueUnit }),
    ...(assetTypeId !== undefined && { assetTypeId: String(assetTypeId) }),
    updatedAt: new Date().toISOString(),
  };
  assetProperties[idx] = updated;
  const response: ApiResponse<AssetProperty> = { success: true, data: updated, message: "Asset property updated successfully", timestamp: new Date().toISOString() };
  res.json(response);
});

/** Delete */
router.delete("/:id", (req, res) => {
  const idx = assetProperties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not Found", message: "Asset property not found", statusCode: 404 });
  assetProperties.splice(idx, 1);
  res.json({ success: true, message: "Asset property deleted successfully", timestamp: new Date().toISOString() });
});

export { router as assetPropertyRoutes, type AssetProperty };
