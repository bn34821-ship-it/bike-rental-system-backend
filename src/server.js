import http from "http";
import app from "./app.js";
import { assertEnv, env } from "./config/env.js";
import { verifyRequiredTables } from "./config/supabase.js";
import { attachRealtime } from "./realtime/socketHub.js";
import { startScheduledJobs } from "./jobs/index.js";

assertEnv();
verifyRequiredTables().catch((err) => {
  console.error("[supabase] required table check failed", err);
});

const server = http.createServer(app);
attachRealtime(server);
startScheduledJobs();

server.listen(env.port, "0.0.0.0", () => {
  console.log(`Server running on port ${env.port}`);
});
