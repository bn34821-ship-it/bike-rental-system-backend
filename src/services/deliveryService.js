import supabase from "../config/supabase.js";
import { DeliveryRequestStatus } from "../constants/dbEnums.js";
import { AppError } from "../utils/AppError.js";

const APPROVAL_DELAY_MS = 3500;

function scheduleApproval(userId) {
  setTimeout(async () => {
    try {
      await supabase
        .from("delivery_requests")
        .update({ status: DeliveryRequestStatus.approved })
        .eq("userId", userId)
        .eq("status", DeliveryRequestStatus.pending);
      await supabase
        .from("users")
        .update({ is_delivery_partner: true, is_online: true })
        .eq("id", userId);
      console.log(`[delivery] Auto-approved partner user_id=${userId}`);
    } catch (e) {
      console.error("[delivery] approval job failed", e);
    }
  }, APPROVAL_DELAY_MS);
}

export async function applyForDelivery(userId) {
  const { data: existing, error: fetchError } = await supabase
    .from("delivery_requests")
    .select("*")
    .eq("userId", userId)
    .maybeSingle();
  if (fetchError) {
    console.error("[deliveryService.applyForDelivery] fetch failed", fetchError);
    throw new AppError("Unable to submit application", 500);
  }
  if (existing?.status === DeliveryRequestStatus.approved) {
    throw new AppError("Already an approved delivery partner", 409);
  }
  if (existing?.status === DeliveryRequestStatus.pending) {
    return { status: "pending", message: "Application already pending" };
  }

  const { error: createError } = await supabase
    .from("delivery_requests")
    .insert([{ userId, status: DeliveryRequestStatus.pending }]);
  if (createError) {
    console.error("[deliveryService.applyForDelivery] create failed", createError);
    throw new AppError("Unable to submit application", 500);
  }

  scheduleApproval(userId);
  return { status: "pending", message: "Application received; approval simulated shortly" };
}

export async function setPartnerOnline(userId, isOnline) {
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (fetchError) {
    console.error("[deliveryService.setPartnerOnline] fetch failed", fetchError);
    throw new AppError("Unable to update online status", 500);
  }
  if (!user?.is_delivery_partner) {
    throw new AppError("Only approved partners can set online status", 403);
  }
  const { error: updateError } = await supabase
    .from("users")
    .update({ is_online: isOnline })
    .eq("id", userId);
  if (updateError) {
    console.error("[deliveryService.setPartnerOnline] update failed", updateError);
    throw new AppError("Unable to update online status", 500);
  }
  return { is_online: isOnline };
}

export async function getDeliveryStatus(userId) {
  const [{ data: user, error: userError }, { data: request, error: reqError }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("delivery_requests")
        .select("*")
        .eq("userId", userId)
        .maybeSingle(),
    ]);
  if (userError || reqError) {
    console.error("[deliveryService.getDeliveryStatus] failed", userError || reqError);
    throw new AppError("Unable to fetch delivery status", 500);
  }
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return {
    is_delivery_partner: user.is_delivery_partner,
    is_online: user.is_online,
    request,
  };
}
