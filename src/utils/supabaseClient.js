import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!url || !serviceKey) {
  console.error(
    "[supabaseClient] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — backend must use the service_role key from Dashboard → Settings → API (NOT the anon/public key).",
  );
}

if (url && serviceKey) {
  const maskedKey = `${String(serviceKey).slice(0, 6)}...${String(serviceKey).slice(-4)}`;
  console.log("[supabaseClient] Connected config:", { url, keyPreview: maskedKey });
}

const supabase = createClient(url, serviceKey);

export default supabase;
