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
app.disable("x-powered-by");
app.set("trust proxy", true);

// Railway / load balancers: register probes FIRST (before CORS, JSON body, static).
const healthJson = (_req, res) => {
  res.status(200).json({ status: "OK" });
};
const rootPlain = (_req, res) => {
  res.type("text/plain").send("Backend running");
};

app.get("/health", healthJson);
app.head("/health", (_req, res) => res.status(200).end());
app.get("/healthz", healthJson);
app.head("/healthz", (_req, res) => res.status(200).end());
app.get("/", rootPlain);
app.head("/", (_req, res) => res.status(200).end());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "15mb" }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "admin", "views"));
app.use("/admin/static", express.static(path.join(__dirname, "admin", "public")));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", railway: true, api_prefix: true });
});

app.head("/api/health", (req, res) => {
  res.status(200).end();
});

app.use("/api/users", userRoutes);
app.use("/api/bikes", bikeListRoutes);
app.use("/api", apiRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

export default app;
