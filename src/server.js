/**
 * Production entry: Express app (app.js), Supabase checks, Socket.IO, cron jobs.
 */
import "./config/env.js";

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

async function main() {
  const { assertEnv } = await import("./config/env.js");
  const { default: app } = await import("./app.js");
  const { verifyRequiredTables } = await import("./config/supabase.js");
  const { attachRealtime } = await import("./realtime/socketHub.js");
  const { startScheduledJobs } = await import("./jobs/index.js");

  assertEnv();

  const PORT = process.env.PORT;

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  setTimeout(() => {
    verifyRequiredTables().catch(console.error);
  }, 3000);

  try {
    attachRealtime(server);
  } catch (e) {
    console.error(e);
  }

  try {
    startScheduledJobs();
  } catch (e) {
    console.error(e);
  }

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
