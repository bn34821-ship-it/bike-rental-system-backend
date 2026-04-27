import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./api/routes/index.js";
import adminRoutes from "./admin/routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bikeListRoutes from "./routes/bikeListRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "15mb" }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "admin", "views"));
app.use("/admin/static", express.static(path.join(__dirname, "admin", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", railway: true });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend running locally" });
});

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeListRoutes);
app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.status(404).send("Not found");
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(200).send("Server alive fallback");
});

export default app;
