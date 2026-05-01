import app from "./app.js";
import { assertEnv } from "./config/env.js";
import { verifyRequiredTables } from "./config/supabase.js";
import { attachRealtime } from "./realtime/socketHub.js";
import { startScheduledJobs } from "./jobs/index.js";

function resolveListenPort() {
  const raw = process.env.PORT;
  if (raw != null && String(raw).trim() !== "") {
    const n = parseInt(String(raw), 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 5000;
}

try {
  console.log("🚀 Server starting...");
  console.log("ENV CHECK:", {
    PORT: process.env.PORT ?? "(unset)",
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_KEY: !!(
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
  });

  assertEnv();

  const PORT = resolveListenPort();
  const HOST = "0.0.0.0";

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT} (host ${HOST})`);
  });

  setImmediate(() => {
    verifyRequiredTables().catch((err) => {
      console.error("Supabase check failed:", err);
    });
  });

  try {
    attachRealtime(server);
  } catch (e) {
    console.error("attachRealtime error:", e);
  }

  try {
    startScheduledJobs();
  } catch (e) {
    console.error("startScheduledJobs error:", e);
  }

  const shutdown = () => {
    console.log("Shutting down HTTP server...");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} catch (err) {
  console.error("Startup error:", err);
  process.exit(1);
}
