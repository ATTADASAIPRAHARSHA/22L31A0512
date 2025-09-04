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

  const canSubmit = form.url.trim() !== "" && (form.validity === "" || /^\d+$/.test(form.validity));


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
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif", padding: "1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>URL Shortener</h1>
      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          type="url"
          required
          value={form.url}
          onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
          placeholder="https://example.com/very/long/link"
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="text"
          value={form.validity}
          onChange={(e) => setForm((s) => ({ ...s, validity: e.target.value }))}
          placeholder="Validity in minutes (optional)"
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
          placeholder="Custom shortcode (optional)"
          style={{ padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          disabled={!canSubmit || creating}
          style={{
            padding: "0.6rem",
            backgroundColor: canSubmit ? "#007bff" : "#999",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {creating ? "Creating..." : "Create"}
        </button>

      </form>

      {createErr && <p style={{ color: "red", marginTop: "0.5rem" }}>{createErr}</p>}
      {createdInfo && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
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

      <div style={{ marginTop: "2rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={codeQuery}
          onChange={(e) => setCodeQuery(e.target.value)}
          placeholder="Enter shortcode to fetch stats"
          style={{ flex: 1, padding: "0.5rem", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button
          onClick={fetchStats}
          disabled={loadingStats}
          style={{
            padding: "0.6rem",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loadingStats ? "wait" : "pointer",
          }}
        >
          {loadingStats ? "Loading..." : "Get Stats"}
        </button>
      </div>

      {statsErr && <p style={{ color: "red", marginTop: "0.5rem" }}>{statsErr}</p>}
      {stats && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 4 }}>
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
