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
  "https://sleep-deploy-8zdtsxqy5-zaids-projects-ed10428c.vercel.app",
  "https://sleep-deploy-ex5ty6m16-zaids-projects-ed10428c.vercel.app"
];

// CORS setup to allow frontend to send cookies
app.use(cors({
    origin: allowedOrigins, // replace with your frontend URL
    credentials: true, // important: allows sending cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
    
// Security headers for Google OAuth
app.use((req, res, next) => {
    // Allow popups for Google OAuth
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    // Allow embedding in iframes for Google OAuth
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
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