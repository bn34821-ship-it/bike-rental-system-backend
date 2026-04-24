import { asyncHandler } from "../utils/asyncHandler.js";
import * as deliveryService from "../services/deliveryService.js";

export const apply = asyncHandler(async (req, res) => {
  const data = await deliveryService.applyForDelivery(req.user.id);
  res.status(201).json({ success: true, data });
});

export const status = asyncHandler(async (req, res) => {
  const data = await deliveryService.getDeliveryStatus(req.user.id);
  res.json({ success: true, data });
});

export const setOnline = asyncHandler(async (req, res) => {
  const data = await deliveryService.setPartnerOnline(
    req.user.id,
    Boolean(req.body.is_online)
  );
  res.json({ success: true, data });
});
