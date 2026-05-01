import supabase from "./src/utils/supabaseClient.js";
import "dotenv/config";

async function run() {
  try {
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
  } catch (err) {
    console.error("CATCH ERROR:", err);
  }
}

run();
