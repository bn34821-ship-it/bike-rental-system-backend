import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../controllers/authController.js";
import { validateRequest } from "../middleware/validate.js";

const r = Router();

r.post(
  "/send-otp",
  [body("phone").trim().notEmpty().withMessage("Phone number required")],
  validateRequest,
  authController.sendOtp
);

r.post(
  "/verify-otp",
  [
    body("phone").trim().notEmpty().withMessage("Phone number required"),
    body("otp").trim().isLength({ min: 6, max: 6 }).withMessage("Valid OTP required"),
  ],
  validateRequest,
  authController.verifyOtp
);

r.post("/logout", authController.logout);
r.get("/session", authController.session);

r.post(
  "/login",
  [
    body("phone").trim().isLength({ min: 10 }).withMessage("Valid phone required"),
    body("otp").trim().notEmpty().withMessage("OTP required"),
    body("name").optional().trim().isLength({ min: 1 }),
  ],
  validateRequest,
  authController.login
);

export default r;
