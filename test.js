import supabase from "./src/utils/supabaseClient.js";

async function run() {
  const { data, error } = await supabase.from("payment_configs").select("*").limit(1);
  console.log("TEST_DB_RESULT:", JSON.stringify({ data, error }));
}
run();
