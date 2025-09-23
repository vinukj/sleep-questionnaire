import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import authRoute from "./routes/authRoute.js";
import quizRoute from "./routes/quizRoute.js";
import userRoutes from "./routes/userRoute.js";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "sleep-development-build.vercel.app",
  "https://sleep-development-build.vercel.app"

];

// CORS setup to allow frontend to send cookies
app.use(cors({
    origin: allowedOrigins, // 
    credentials: true, // important: allows sending cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
    
// Security headers for Google OAuth
app.use((req, res, next) => {
    // Allow popups for Google OAuth
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // NOTE: Setting a strict Cross-Origin-Embedder-Policy (COEP) such as
  // 'require-corp' will enable cross-origin isolation but also blocks
  // many cross-origin operations (including some window.postMessage flows
  // used by OAuth popups). For typical OAuth popup flows with external
  // providers (e.g. accounts.google.com) it's safer to keep COEP permissive.
  // Set to 'unsafe-none' (the default) so the OAuth popup can postMessage
  // back to the opener. If you need cross-origin isolation features
  // (e.g. SharedArrayBuffer), revisit this and implement a full COEP/COOP
  // plan and ensure all resources opt-in via CORP.
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// Routes
app.use("/about", userRoutes);
app.use("/auth", authRoute);
app.use("/quizzes", quizRoute);

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

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Example route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export default app;