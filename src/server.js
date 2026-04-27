import app from "./app.js";
import { assertEnv } from "./config/env.js";
import { verifyRequiredTables } from "./config/supabase.js";
import { attachRealtime } from "./realtime/socketHub.js";
import { startScheduledJobs } from "./jobs/index.js";

assertEnv();
verifyRequiredTables().catch((err) => {
  console.error("Supabase check failed:", err);
});

console.log("Starting server...");
console.log("ENV PORT:", process.env.PORT);

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("🚀 Server started successfully");
  console.log("PORT:", PORT);
  console.log("=================================");
});

attachRealtime(server);
startScheduledJobs();
