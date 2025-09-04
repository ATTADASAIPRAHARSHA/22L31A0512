import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const LOG_API_URL = "http://20.244.56.144/evaluation-service/logs";

const ACCESS_TOKEN = process.env.VITE_ACCESS_TOKEN ;
console.log(ACCESS_TOKEN)

export default async function Log(stack, level, pkg, message) {
  try {
    const res = await axios.post(
      LOG_API_URL,
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    console.log("Log sent:", res.data);
  } catch (err) {
    console.error("Failed to send log:", err.response?.data || err.message);
  }
}
