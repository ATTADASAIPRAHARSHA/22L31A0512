import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const LOG_API_URL = "http://20.244.56.144/evaluation-service/logs";
const ACCESS_TOKEN = process.env.VITE_ACCESS_TOKEN;
const logFile = path.resolve("log.js");

export default async function Log(stack, level, pkg, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    stack,
    level,
    package: pkg,
    message,
  };

  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
  } catch (err) {
    console.error("Failed to write log to file:", err.message);
  }

  try {
    if (!ACCESS_TOKEN) {
      console.error("Missing access token. Cannot send logs.");
      return;
    }

    const res = await axios.post(LOG_API_URL, logEntry, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    console.log("Log sent:", res.data);
  } catch (err) {
    console.error("Failed to send log:", err.response?.data || err.message);
  }
}
