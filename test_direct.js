import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  console.log("Testing with:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Service Role Key" : "No Service Role Key");
  
  const { data, error } = await supabase
    .from("payment_configs")
    .insert([
      {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        mode: "Test",
        provider: "razorpay",
        is_active: true,
        created_at: new Date()
      }
    ])
    .select();

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

run();
