import express from "express";
import { SurveyData, ApiResponse, PaginatedResponse } from "../models/types";

const router = express.Router();

// Mock data - In production, this would come from a database
let surveys: SurveyData[] = [
  {
    id: "SURVEY_001",
    deviceId: "TRIMBLE_001",
    timestamp: "2023-12-01T08:30:00Z",
    coordinates: { lat: 19.076, lng: 72.8777, elevation: 15.5 },
    accuracy: 0.02,
    surveyor: "Rajesh Kumar",
    notes: "Daily pipeline inspection - Section A",
    temperature: 28,
    weather: "Clear skies",
  },
  {
    id: "SURVEY_002",
    deviceId: "TRIMBLE_002",
    timestamp: "2023-12-01T09:15:00Z",
    coordinates: { lat: 19.08, lng: 72.881, elevation: 12.3 },
    accuracy: 0.03,
    surveyor: "Priya Sharma",
    notes: "Valve inspection and maintenance check",
    temperature: 29,
    weather: "Partly cloudy",
  },
];

/**
 * @swagger
 * /api/surveys:
 *   get:
 *     summary: Get all survey data
 *     tags: [Surveys]
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
 *         name: surveyor
 *         schema:
 *           type: string
 *         description: Filter by surveyor name
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter surveys from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter surveys until this date
 *     responses:
 *       200:
 *         description: Successfully retrieved survey data
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
 *                     $ref: '#/components/schemas/SurveyData'
 *                 pagination:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const deviceId = req.query.deviceId as string;
  const surveyor = req.query.surveyor as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let filteredSurveys = surveys;

  if (deviceId) {
    filteredSurveys = filteredSurveys.filter(
      (survey) => survey.deviceId === deviceId,
    );
  }

  if (surveyor) {
    filteredSurveys = filteredSurveys.filter((survey) =>
      survey.surveyor?.toLowerCase().includes(surveyor.toLowerCase()),
    );
  }

  if (startDate) {
    filteredSurveys = filteredSurveys.filter(
      (survey) => new Date(survey.timestamp) >= new Date(startDate),
    );
  }

  if (endDate) {
    filteredSurveys = filteredSurveys.filter(
      (survey) => new Date(survey.timestamp) <= new Date(endDate),
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSurveys = filteredSurveys.slice(startIndex, endIndex);

  const response: PaginatedResponse<SurveyData> = {
    success: true,
    data: paginatedSurveys,
    pagination: {
      page,
      limit,
      total: filteredSurveys.length,
      totalPages: Math.ceil(filteredSurveys.length / limit),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * @swagger
 * /api/surveys/{id}:
 *   get:
 *     summary: Get survey data by ID
 *     tags: [Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Survey data ID
 *     responses:
 *       200:
 *         description: Successfully retrieved survey data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SurveyData'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: Survey data not found
 */
router.get("/:id", (req, res) => {
  const survey = surveys.find((s) => s.id === req.params.id);

  if (!survey) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey data not found",
      statusCode: 404,
    });
  }

  const response: ApiResponse<SurveyData> = {
    success: true,
    data: survey,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});


router.put("/:id", (req, res) => {
  const surveyIndex = surveys.findIndex((s) => s.id === req.params.id);

  if (surveyIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey data not found",
      statusCode: 404,
    });
  }

  surveys[surveyIndex] = {
    ...surveys[surveyIndex],
    ...req.body,
    id: req.params.id,
  };

  const response: ApiResponse<SurveyData> = {
    success: true,
    data: surveys[surveyIndex],
    message: "Survey data updated successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

router.delete("/:id", (req, res) => {
  const surveyIndex = surveys.findIndex((s) => s.id === req.params.id);

  if (surveyIndex === -1) {
    return res.status(404).json({
      error: "Not Found",
      message: "Survey data not found",
      statusCode: 404,
    });
  }

  surveys.splice(surveyIndex, 1);

  const response = {
    success: true,
    message: "Survey data deleted successfully",
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export { router as surveyRoutes };
