import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { deviceRoutes } from "./routes/devices";
import { pipelineRoutes } from "./routes/pipelines";
import { valveRoutes } from "./routes/valves";
import { valveOperationRoutes } from "./routes/valve-operations";
import { catastropheRoutes } from "./routes/catastrophes";
import { surveyRoutes } from "./routes/surveys";
import { configRoutes } from "./routes/config";
import { userRoutes } from "./routes/users";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting to work correctly behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-domain.com"]
        : ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  trustProxy: true, // Enable trust proxy for rate limiting
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pipeline Management API",
      version: "1.0.0",
      description:
        "A comprehensive API for managing pipeline infrastructure, devices, and operations. Note: Pipeline and valve data is read-only as it's sourced from Trimble surveying equipment.",
      contact: {
        name: "Infrastep Team",
        email: "api@infrastep.com",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.your-domain.com"
            : `http://localhost:${PORT}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            message: {
              type: "string",
              description: "Detailed error description",
            },
            statusCode: {
              type: "number",
              description: "HTTP status code",
            },
          },
        },
      },
    },
  },
  apis: [__dirname + "/routes/*.ts", __dirname + "/models/*.ts"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Pipeline Management API Documentation",
  }),
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/devices", deviceRoutes);
app.use("/api/pipelines", pipelineRoutes);
app.use("/api/valves", valveRoutes);
app.use("/api/valve-operations", valveOperationRoutes);
app.use("/api/catastrophes", catastropheRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/config", configRoutes);
app.use("/api/User", userRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
      error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
      message:
        process.env.NODE_ENV === "production" && statusCode >= 500
          ? "Something went wrong"
          : message,
      statusCode,
    });
  },
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📚 API Documentation available at http://localhost:${PORT}/api-docs`,
  );
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});

export default app;
