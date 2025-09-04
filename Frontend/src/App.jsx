import React, { useState, useMemo } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8080";

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
}

export default function App() {
  const [form, setForm] = useState({ url: "", validity: "", code: "" });
  const [creating, setCreating] = useState(false);
  const [createRes, setCreateRes] = useState(null);
  const [createErr, setCreateErr] = useState(null);

  const [codeQuery, setCodeQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsErr, setStatsErr] = useState(null);

  const canSubmit =
    isValidUrl(form.url) && (form.validity === "" || /^\d+$/.test(form.validity));

  // Create short URL
  async function handleCreate(e) {
    e.preventDefault();
    setCreateErr(null);
    setCreateRes(null);

    if (!isValidUrl(form.url)) {
      setCreateErr("Please enter a valid URL including http/https.");
      return;
    }

    const body = {
      url: form.url.trim(),
      ...(form.validity ? { validity: Number(form.validity) } : {}),
      ...(form.code ? { code: form.code.trim() } : {}),
    };

    setCreating(true);
    try {
      const res = await axios.post(`${API_BASE}/shorten`, body);
      setCreateRes(res.data);
      if (res.data?.code) setCodeQuery(res.data.code);
    } catch (err) {
      setCreateErr(err.response?.data?.error || "Failed to create short URL");
    } finally {
      setCreating(false);
    }
  }

  // Fetch stats
  async function fetchStats() {
    setStatsErr(null);
    setStats(null);

    const sc = codeQuery.trim();
    if (!sc) {
      setStatsErr("Enter a shortcode to fetch stats.");
      return;
    }

    setLoadingStats(true);
    try {
      const res = await axios.get(`${API_BASE}/stats/${encodeURIComponent(sc)}`);
      setStats(res.data);
    } catch (err) {
      setStatsErr(err.response?.data?.error || "Failed to fetch stats");
    } finally {
      setLoadingStats(false);
    }
  }

  // Info for created URL
  const createdInfo = useMemo(() => {
    if (!createRes) return null;
    return {
      shortUrl: createRes.shortUrl,
      originalUrl: createRes.url,
      code: createRes.code,
      createdAt: new Date(createRes.createdAt).toLocaleString(),
      expiresAt: new Date(createRes.expiry).toLocaleString(),
    };
  }, [createRes]);

  return (
    <div>
      <h1>URL Shortener</h1>

      {/* Create Short URL */}
      <form onSubmit={handleCreate}>
        <input
          type="url"
          required
          value={form.url}
          onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
          placeholder="https://example.com/very/long/link"
        />
        <input
          type="text"
          value={form.validity}
          onChange={(e) => setForm((s) => ({ ...s, validity: e.target.value }))}
          placeholder="Validity in minutes (optional)"
        />
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
          placeholder="Custom shortcode (optional)"
        />
        <button type="submit" disabled={!canSubmit || creating}>
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {createErr && <p style={{ color: "red" }}>{createErr}</p>}
      {createdInfo && (
        <div>
          <p>
            Short URL:{" "}
            <a href={createdInfo.shortUrl} target="_blank" rel="noreferrer">
              {createdInfo.shortUrl}
            </a>
          </p>
          <p>Original URL: {createdInfo.originalUrl}</p>
          <p>Code: {createdInfo.code}</p>
          <p>Created At: {createdInfo.createdAt}</p>
          <p>Expires At: {createdInfo.expiresAt}</p>
        </div>
      )}

      {/* Stats Section */}
      <div>
        <input
          type="text"
          value={codeQuery}
          onChange={(e) => setCodeQuery(e.target.value)}
          placeholder="Enter shortcode to fetch stats"
        />
        <button onClick={fetchStats} disabled={loadingStats}>
          {loadingStats ? "Loading..." : "Get Stats"}
        </button>
      </div>

      {statsErr && <p style={{ color: "red" }}>{statsErr}</p>}
      {stats && (
        <div>
          <h3>Statistics for {codeQuery}</h3>
          <p>Original URL: {stats.url}</p>
          <p>Created At: {new Date(stats.createdAt).toLocaleString()}</p>
          <p>Expires At: {new Date(stats.expiry).toLocaleString()}</p>
          <p>Total Clicks: {stats.clicks}</p>
        </div>
      )}
    </div>
  );
}
