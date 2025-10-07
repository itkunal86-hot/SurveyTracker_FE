import express from "express";
import https from "https";

export const deviceAlertsProxyRoutes = express.Router();

// GET /api/proxy/device-alerts -> forwards to <UPSTREAM_API_URL>/api/Device/alerts
deviceAlertsProxyRoutes.get("/", async (req, res) => {
  try {
    const upstreamRoot =
      process.env.UPSTREAM_API_URL ||
      process.env.API_BASE_URL ||
      "https://localhost:7215";

    const base = `${upstreamRoot.replace(/\/$/, "")}/api/Device/alerts`;
    const search = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${base}${search ? `?${search}` : ""}`;

    const agent = new https.Agent({ rejectUnauthorized: false });

    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      // @ts-expect-error agent is supported in node fetch
      agent,
    } as any);

    const text = await upstream.text();
    const status = upstream.status;
    const contentType = upstream.headers.get("content-type") || "application/json";

    res.status(status);
    res.setHeader("content-type", contentType);

    try {
      const json = JSON.parse(text);
      res.json(json);
    } catch {
      res.send(text);
    }
  } catch (err: any) {
    res.status(502).json({
      status_code: 502,
      status_message: "Bad Gateway",
      message: err?.message || "Failed to proxy Device Alerts",
      timestamp: new Date().toISOString(),
    });
  }
});
