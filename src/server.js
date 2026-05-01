import app from "./app.js";
import { assertEnv } from "./config/env.js";
import { verifyRequiredTables } from "./config/supabase.js";
import { attachRealtime } from "./realtime/socketHub.js";
import { startScheduledJobs } from "./jobs/index.js";

try {
  console.log("🚀 Server starting...");
  console.log("ENV CHECK:", {
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
  verifyRequiredTables().catch((err) => {
    console.error("Supabase check failed:", err);
  });

  const PORT = Number(process.env.PORT) || 5000;

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  attachRealtime(server);
  startScheduledJobs();
} catch (err) {
  console.error("Startup error:", err);
  process.exit(1);
}
