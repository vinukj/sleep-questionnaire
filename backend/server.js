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
// Disable COOP/COEP so Google OAuth popup works
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
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