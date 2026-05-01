import supabase from "./src/utils/supabaseClient.js";

async function run() {
  const { data, error } = await supabase.rpc("exec_sql", { sql: "SELECT 1" });
  console.log("EXEC_SQL_RESULT:", JSON.stringify({ data, error }));
}
run();
