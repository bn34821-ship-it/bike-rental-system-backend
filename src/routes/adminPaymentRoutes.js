import express from "express";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

const router = express.Router();

// GET payment configs
router.get("/list", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payment_configs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SUPABASE ERROR (list):", error);
      throw error;
    }
    
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to load payment settings" });
  }
});

// POST add new config
router.post("/configs", async (req, res) => {
  try {
    const { key_id, key_secret, mode } = req.body || {};

    console.log("REQ BODY:", req.body);

    if (!key_id || !key_secret) {
      return res.status(400).json({
        success: false,
        message: "Missing fields"
      });
    }

    const { error: deactivateError } = await supabase
      .from("payment_configs")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      console.error("SUPABASE DEACTIVATE ERROR:", deactivateError);
      return res.status(500).json({
        success: false,
        message: deactivateError.message
      });
    }

    const { data, error } = await supabase
      .from("payment_configs")
      .insert([
        {
          key_id,
          key_secret,
          mode: mode || "test",
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    return res.json({
      success: true,
      message: "Payment configuration saved successfully",
      data
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// PATCH activate config
router.patch("/configs/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const { error: deactivateError } = await supabase
      .from("payment_configs")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) throw deactivateError;

    const { data, error } = await supabase
      .from("payment_configs")
      .update({ is_active: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE config
router.delete("/configs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("payment_configs").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true, message: "Configuration deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Test Connection
router.post("/test-connection", async (req, res) => {
  try {
    const { key_id, key_secret } = req.body;
    const rzp = new Razorpay({ key_id, key_secret });
    
    // Create a dummy order of 1 INR
    const order = await rzp.orders.create({
      amount: 100,
      currency: "INR",
      receipt: "test_connection_receipt"
    });

    res.json({ success: true, message: "Connected successfully", order_id: order.id });
  } catch (err) {
    res.status(400).json({ success: false, message: "Connection failed: " + err.message });
  }
});

export default router;
