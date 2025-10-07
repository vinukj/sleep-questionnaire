import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import authRoute from "./routes/authRoute.js";
import quizRoute from "./routes/quizRoute.js";
import userRoutes from "./routes/userRoute.js";
import exportRoute from "./routes/exportRoute.js";
import questionnaireRoute from "./routes/questionnaireRoute.js";
import { initializeTables } from "./models/questionnaireModel.js";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

// Parse JSON bodies (limit to prevent abuse)
app.use(express.json({ limit: '1mb' }));

// Parse cookies
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "sleep-development-build.vercel.app",
  "https://sleep-development-build.vercel.app",
  "https://st-john-web-app.vercel.app",

];

// CORS setup to allow frontend to send cookies
app.use(cors({
    origin: allowedOrigins, // 
    credentials: true, // important: allows sending cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
    
// Security headers via Helmet
app.use(helmet({
  crossOriginEmbedderPolicy: false, // keep Google OAuth working
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));

// Basic rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per window
});
app.use(generalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 auth actions per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
});



// Routes
app.use("/about", userRoutes);
// apply stricter rate limit on auth endpoints
app.use("/auth", authLimiter, authRoute);
// app.use("/quizzes", quizRoute);
app.use("/api", exportRoute);
app.use("/questionnaire", questionnaireRoute);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation using Swagger",
    },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

if (process.env.NODE_ENV !== 'production') {
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Example route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Initialize database tables
initializeTables()
  .then(() => {
    // Start server after database is initialized
    const PORT = 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(error => {
    console.error('Failed to initialize database tables:', error);
    process.exit(1);
  });
export default app;