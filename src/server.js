/**
 * MINIMAL server — no DB / Supabase / Razorpay (Railway healthcheck first).
 * Restore full API: use src/server.full.js → `npm run start:full`
 */
import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.head("/health", (_req, res) => {
  res.status(200).end();
});

app.get("/", (_req, res) => {
  res.status(200).send("Backend is running 🚀");
});

function resolvePort() {
  const raw = process.env.PORT;
  if (raw != null && String(raw).trim() !== "") {
    const n = parseInt(String(raw), 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 5000;
}

const PORT = resolvePort();
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});
