import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import bikeRoutes from "./bike.routes.js";
import rentalRoutes from "./rental.routes.js";
import deliveryRoutes from "./delivery.routes.js";
import orderRoutes from "./order.routes.js";
import earningsRoutes from "./earnings.routes.js";
import skippedDaysRoutes from "./skippedDays.routes.js";
import * as rentalController from "../controllers/rentalController.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../utils/supabaseClient.js";

const api = Router();

api.use("/auth", authRoutes);
api.use("/user", userRoutes);
api.use("/bike", bikeRoutes);
api.use("/rental", rentalRoutes);
api.use("/delivery", deliveryRoutes);
api.use("/orders", orderRoutes);
api.use("/earnings", earningsRoutes);
api.use("/skipped-days", skippedDaysRoutes);
api.get("/bookings", authMiddleware, rentalController.bookings);
api.get("/test-db", async (req, res) => {
  try {
    const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" });
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.json({ success: true, message: "Supabase profiles reachable" });
  } catch (err) {
    console.error("[GET /test-db]", err);
    return res.status(500).json({ success: false, message: err?.message || "Database test failed" });
  }
});

export default api;
