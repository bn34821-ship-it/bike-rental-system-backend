import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY,
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  demoOtp: process.env.DEMO_OTP || "123456",
};

export function assertEnv() {
  if (!env.supabaseUrl) {
    throw new Error("SUPABASE_URL is required");
  }
  if (!env.supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_KEY is required");
  }
}
