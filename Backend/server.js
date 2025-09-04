import express from "express";
import cors from "cors";
import fs from "fs";
import Log  from "../Logger/logger.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 8080;
const dbFile = "db.json";

function readDB() {
  if (!fs.existsSync(dbFile)) return { urls: {} };
  return JSON.parse(fs.readFileSync(dbFile));
}


function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}


function generateCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.use(cors());
app.use(express.json());


app.use(async (req, res, next) => {
  await Log("URL-SHORTENER", "INFO", "backend", `Incoming ${req.method} ${req.url}`);
  next();
});


app.post("/shorten", async (req, res) => {
  const { url, code, validity } = req.body;
  if (!url) {
    await Log("URL-SHORTENER", "ERROR", "backend", "Missing URL in request");
    return res.status(400).json({ error: "URL is required" });
  }

  const db = readDB();

  
  let shortCode = code || generateCode();
  if (db.urls[shortCode]) {
    await Log("URL-SHORTENER", "WARN", "backend", `Shortcode collision: ${shortCode}`);
    return res.status(409).json({ error: "Shortcode already exists" });
  }

  const expiry = Date.now() + ((validity || 30) * 60 * 1000);

  const record = {
    url,
    code: shortCode,
    clicks: 0,
    createdAt: Date.now(),
    expiry,
  };

  db.urls[shortCode] = record;
  writeDB(db);

  await Log("URL-SHORTENER", "INFO", "backend", `Short URL created: ${shortCode} → ${url}`);

  res.status(201).json({ shortUrl: `http://localhost:${PORT}/${shortCode}`, ...record });
});

app.get("/stats/:code", async (req, res) => {
  const db = readDB();
  const data = db.urls[req.params.code];

  if (!data) {
    await Log("URL-SHORTENER", "ERROR", "backend", `Stats request failed: ${req.params.code} not found`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  await Log("URL-SHORTENER", "INFO", "backend", `Stats retrieved for ${req.params.code}`);
  res.json(data);
});

app.get("/:code", async (req, res) => {
  const db = readDB();
  const data = db.urls[req.params.code];

  if (!data) {
    await Log("URL-SHORTENER", "ERROR", "backend", `Redirect failed: ${req.params.code} not found`);
    return res.status(404).send("Shortcode not found");
  }

  if (Date.now() > data.expiry) {
    await Log("URL-SHORTENER", "WARN", "backend", `Redirect failed: ${req.params.code} expired`);
    return res.status(410).send("Shortcode expired");
  }

  data.clicks++;
  db.urls[data.code] = data;
  writeDB(db);

  await Log("URL-SHORTENER", "INFO", "backend", `Redirected ${req.params.code} → ${data.url}`);

  res.redirect(data.url);
});

app.use(async (err, req, res, next) => {
  await Log("URL-SHORTENER", "ERROR", "backend", `Internal Server Error: ${err.message}`);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, async () => {
  await Log("URL-SHORTENER", "INFO", "backend", `Server started at http://localhost:${PORT}`);
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
