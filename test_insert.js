import http from "http";
import "dotenv/config";

const data = JSON.stringify({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
  mode: "Test"
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/admin/payment/configs",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => { body += chunk; });
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${body}`);
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.write(data);
req.end();
