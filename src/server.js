import app from "./app.js";
import { assertEnv } from "./config/env.js";
import { verifyRequiredTables } from "./config/supabase.js";
import { attachRealtime } from "./realtime/socketHub.js";
import { startScheduledJobs } from "./jobs/index.js";

assertEnv();
verifyRequiredTables().catch((err) => {
  console.error("[supabase] required table check failed", err);
});

console.log("Starting server...");
console.log("PORT:", process.env.PORT);

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

attachRealtime(server);
startScheduledJobs();
