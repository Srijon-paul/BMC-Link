import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import { normalizeAllowedOrigins } from "./utils/security.js";
import passport from "./config/passport.js";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import { setCsrfCookie, csrfProtection } from "./middlewares/csrf.middleware.js";

const app = express();

app.set("trust proxy", 1);

// Security
app.use(helmet());

// CORS
const configuredOrigins = normalizeAllowedOrigins(
  process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:4800",
);

if (configuredOrigins.includes("*")) {
  throw new Error(
    "CORS_ORIGIN cannot contain '*' when credentials are enabled. Use explicit origins.",
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-csrf-token", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
  }),
);

// Logger
app.use(morgan("dev"));

// Body Parsers
app.use(
  "/api/v1/payments/razorpay/webhook",
  express.raw({ type: "application/json" }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(
  "/storage/public",
  express.static(
    path.resolve(process.cwd(), process.env.STORAGE_PUBLIC_PATH || "storage/public"),
  ),
);
app.use(cookieParser());
app.use(setCsrfCookie);
app.use(csrfProtection);

app.use(passport.initialize());

const swaggerEnabled =
  process.env.NODE_ENV !== "production"
    ? process.env.SWAGGER_ENABLED !== "false"
    : process.env.SWAGGER_ENABLED === "true";

if (swaggerEnabled) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "BMC-Link API Docs",
    }),
  );

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

// API Routes
const enablePayments = process.env.ENABLE_PAYMENTS === "true";

if (enablePayments) {
  app.use("/api/v1/payments", paymentRoutes);
}
app.use("/api/v1", router);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
