import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import bikeRoutes from "./bike.routes.js";
import rentalRoutes from "./rental.routes.js";
import deliveryRoutes from "./delivery.routes.js";
import orderRoutes from "./order.routes.js";
import earningsRoutes from "./earnings.routes.js";
import skippedDaysRoutes from "./skippedDays.routes.js";
import trackingRoutes from "./trackingRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import * as rentalController from "../controllers/rentalController.js";
import { authMiddleware } from "../middleware/auth.js";
import supabase from "../utils/supabaseClient.js";
import os from "os";
import { adminApiLogin } from "../controllers/adminAuthController.js";
import { requireAdminAuth } from "../admin/middleware/adminAuth.js";
import { addInMemoryBooking, listInMemoryBookings } from "../services/bookingStore.js";
import {
  addDeliveryApplication,
  listDeliveryApplications,
  updateDeliveryApplicationStatus,
} from "../services/deliveryPartnerStore.js";
import {
  addKycDocument,
  getLatestKycByUser,
  getLatestKycByUserAndType,
  listKycDocuments,
  listKycDocumentsByUser,
  updateKycDocument,
} from "../services/kycStore.js";

const api = Router();

api.use("/auth", authRoutes);
api.use("/user", userRoutes);
api.use("/bike", bikeRoutes);
api.use("/rental", rentalRoutes);
api.use("/orders", orderRoutes);
api.use("/earnings", earningsRoutes);
api.use("/skipped-days", skippedDaysRoutes);
api.use("/", trackingRoutes);
api.use("/", bookingRoutes);
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

api.post("/admin/login", adminApiLogin);

api.use("/admin", requireAdminAuth);

api.get("/admin/health", async (req, res) => {
  try {
    const [profilesCountRes, bikesCountRes, rentalsCountRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("bikes").select("*", { count: "exact", head: true }),
      supabase.from("rentals").select("*", { count: "exact", head: true }),
    ]);

    if (profilesCountRes.error || bikesCountRes.error || rentalsCountRes.error) {
      return res.status(500).json({
        status: "error",
        message:
          profilesCountRes.error?.message ||
          bikesCountRes.error?.message ||
          rentalsCountRes.error?.message ||
          "Database stats failed",
      });
    }

    return res.json({
      status: "running",
      uptime: process.uptime(),
      memory: process.memoryUsage().rss,
      cpu: os.loadavg()[0],
      platform: process.platform,
      node_version: process.version,
      users: profilesCountRes.count || 0,
      bikes: bikesCountRes.count || 0,
      rentals: rentalsCountRes.count || 0,
    });
  } catch (error) {
    console.error("[GET /api/admin/health]", error);
    return res.status(500).json({ status: "error", message: "Server not responding ❌" });
  }
});

api.post("/delivery/apply", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      city,
      vehicle_type,
      license_number,
      aadhar_number,
      license_url,
      aadhar_url,
      photo_url,
    } = req.body || {};

    if (!full_name || !phone || !city || !vehicle_type || !license_number || !aadhar_number) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const payload = {
      full_name,
      phone,
      email: email || null,
      city,
      vehicle_type,
      license_number,
      aadhar_number,
      license_url: license_url || null,
      aadhar_url: aadhar_url || null,
      photo_url: photo_url || null,
      status: "pending",
    };

    let { data, error } = await supabase.from("delivery_partners").insert([payload]).select().single();
    if (error?.message?.toLowerCase().includes("could not find the table 'public.delivery_partners'")) {
      data = addDeliveryApplication(payload);
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.get("/admin/delivery", async (req, res) => {
  try {
    let { data, error } = await supabase
      .from("delivery_partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error?.message?.toLowerCase().includes("could not find the table 'public.delivery_partners'")) {
      data = listDeliveryApplications();
      error = null;
    }

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.patch("/admin/delivery/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = String(req.body?.status || "").toLowerCase();
    if (!["approved", "rejected"].includes(nextStatus)) {
      return res.status(400).json({ success: false, message: "status must be approved or rejected" });
    }

    let { data, error } = await supabase
      .from("delivery_partners")
      .update({ status: nextStatus })
      .eq("id", id)
      .select()
      .single();

    if (error?.message?.toLowerCase().includes("could not find the table 'public.delivery_partners'")) {
      data = updateDeliveryApplicationStatus(id, nextStatus);
      if (!data) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }
      error = null;
    }

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({
      success: true,
      data,
      message: nextStatus === "approved" ? "Approved successfully" : "Rejected successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.post("/kyc/electricity", async (req, res) => {
  try {
    const {
      user_id,
      consumer_name,
      consumer_number,
      board_name,
      address,
      file_url,
      status = "pending",
    } = req.body || {};

    if (!user_id || !consumer_name || !consumer_number || !board_name || !file_url) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const payload = {
      user_id,
      type: "electricity_bill",
      consumer_name,
      consumer_number,
      board_name,
      address: address || null,
      file_url,
      status,
    };

    let { data, error } = await supabase.from("kyc_documents").insert([payload]).select().single();
    if (error?.message?.toLowerCase().includes("could not find the table 'public.kyc_documents'")) {
      data = addKycDocument(payload);
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.post("/kyc/driving-license", async (req, res) => {
  try {
    const { user_id, full_name, license_number, expiry_date, file_url, status = "pending" } = req.body || {};
    if (!user_id || !full_name || !license_number || !expiry_date || !file_url) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const payload = {
      user_id,
      type: "driving_license",
      consumer_name: full_name,
      consumer_number: license_number,
      board_name: "RTO",
      address: expiry_date,
      file_url,
      status,
    };

    let { data, error } = await supabase.from("kyc_documents").insert([payload]).select().single();
    if (error?.message?.toLowerCase().includes("could not find the table 'public.kyc_documents'")) {
      data = addKycDocument(payload);
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.get("/kyc/electricity/status", async (req, res) => {
  try {
    const userId = String(req.query.user_id || "");
    if (!userId) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    let { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("type", "electricity_bill")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error?.message?.toLowerCase().includes("could not find the table 'public.kyc_documents'")) {
      data = getLatestKycByUser(userId);
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.get("/kyc/summary", async (req, res) => {
  try {
    const userId = String(req.query.user_id || "");
    if (!userId) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    let { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("user_id", userId)
      .in("type", ["aadhaar", "driving_license", "electricity_bill"])
      .order("created_at", { ascending: false });

    if (error?.message?.toLowerCase().includes("could not find the table 'public.kyc_documents'")) {
      data = listKycDocumentsByUser(userId);
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const rows = Array.isArray(data) ? data : [];
    const latestByType = {
      aadhaar: rows.find((x) => x.type === "aadhaar") || null,
      driving_license:
        rows.find((x) => x.type === "driving_license") || getLatestKycByUserAndType(userId, "driving_license"),
      electricity_bill:
        rows.find((x) => x.type === "electricity_bill") || getLatestKycByUserAndType(userId, "electricity_bill"),
    };
    return res.json({ success: true, data: latestByType });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.get("/admin/kyc", async (req, res) => {
  try {
    let { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("type", "electricity_bill")
      .order("created_at", { ascending: false });

    if (error?.message?.toLowerCase().includes("could not find the table 'public.kyc_documents'")) {
      data = listKycDocuments();
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.patch("/admin/kyc/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const status = String(req.body?.status || "").toLowerCase();
    const reason = req.body?.reason || null;
    if (!["approved", "rejected", "verified"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const nextStatus = status === "approved" ? "verified" : status;

    let { data, error } = await supabase
      .from("kyc_documents")
      .update({ status: nextStatus, reason })
      .eq("id", id)
      .select()
      .single();

    if (error?.message?.toLowerCase().includes("could not find the table 'public.kyc_documents'")) {
      data = updateKycDocument(id, nextStatus, reason);
      if (!data) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }
      error = null;
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

api.use("/delivery", deliveryRoutes);

api.post("/rentals", async (req, res) => {
  try {
    console.log("Incoming booking:", req.body);
    const { bike_id, user_id, duration, start_time, status } = req.body || {};

    if (!bike_id || !user_id) {
      return res.status(400).json({ message: "Missing data" });
    }

    const basePayload = {
      bike_id,
      user_id,
      duration: duration || null,
      start_time: start_time || new Date().toISOString(),
      status: status || "active",
    };

    let { data, error } = await supabase.from("rentals").insert([basePayload]).select();
    if (error?.message?.toLowerCase().includes("could not find the table 'public.rentals'")) {
      ({ data, error } = await supabase
        .from("bookings")
        .insert([
          {
            ...basePayload,
            end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            price: 0,
          },
        ])
        .select());
      if (error?.message?.toLowerCase().includes("could not find the table 'public.bookings'")) {
        ({ data, error } = await supabase
          .from("orders")
          .insert([
            {
              bike_id: bike_id,
              user_id: user_id,
              pickup_location: "App Booking",
              drop_location: "App Booking",
              status: status || "pending",
              earnings: 0,
            },
          ])
          .select());
      }
    }

    if (error) {
      const fallbackBooking = addInMemoryBooking(basePayload);
      return res.json({
        success: true,
        booking: [fallbackBooking],
        source: "in-memory-fallback",
        note: "Supabase booking tables missing; using temporary in-memory storage",
      });
    }

    return res.json({ success: true, booking: data, source: "supabase" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

api.get("/rentals", async (req, res) => {
  let { data, error } = await supabase
    .from("rentals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error?.message?.toLowerCase().includes("could not find the table 'public.rentals'")) {
    ({ data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }));
    if (error?.message?.toLowerCase().includes("could not find the table 'public.bookings'")) {
      ({ data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }));
    }
  }

  if (error) {
    return res.json(listInMemoryBookings());
  }

  return res.json(data || []);
});

export default api;
