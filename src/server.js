import app from "./app.js";
import { assertEnv } from "./config/env.js";
import { verifyRequiredTables } from "./config/supabase.js";
import { attachRealtime } from "./realtime/socketHub.js";
import { startScheduledJobs } from "./jobs/index.js";

assertEnv();
verifyRequiredTables().catch((err) => {
  console.error("[supabase] required table check failed", err);
});

const PORT = process.env.PORT;

if (!PORT) {
  console.error("PORT is not defined");
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});

attachRealtime(server);
startScheduledJobs();
