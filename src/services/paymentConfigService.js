import supabase from "../utils/supabaseClient.js";

/**
 * Fetches the currently active Razorpay configuration from Supabase.
 */
export async function getActiveRazorpayConfig() {
  try {
    const { data, error } = await supabase
      .from("payment_configs")
      .select("id, key_id, key_secret, mode, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data?.key_id || !data?.key_secret) {
      throw new Error("No active Razorpay configuration found");
    }
    return data;
  } catch (error) {
    console.error("[paymentConfigService] getActiveRazorpayConfig failed:", error.message);
    throw error;
  }
}

/**
 * Admin: List all configs (secrets masked)
 */
export async function listPaymentConfigs() {
  try {
    const { data, error } = await supabase
      .from("payment_configs")
      .select("id, key_id, mode, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("[paymentConfigService] listPaymentConfigs failed:", error.message);
    return [];
  }
}

/**
 * Admin: Add or update a payment config
 */
export async function savePaymentConfig(payload) {
  const { key_id, key_secret, mode = "test" } = payload;
  const { data, error } = await supabase
    .from("payment_configs")
    .insert([{ key_id, key_secret, mode, is_active: false }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin: Activate a specific config
 */
export async function activatePaymentConfig(configId) {
  await supabase.from("payment_configs").update({ is_active: false }).eq("is_active", true);
  const { data, error } = await supabase
    .from("payment_configs")
    .update({ is_active: true })
    .eq("id", configId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
