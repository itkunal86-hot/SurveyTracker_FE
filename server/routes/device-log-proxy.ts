import express from "express";
import https from "https";

export const deviceLogProxyRoutes = express.Router();

// GET /api/proxy/device-log -> forwards to https://localhost:7215/api/DeviceLog
deviceLogProxyRoutes.get("/", async (req, res) => {
  try {
    const upstreamRoot =
      process.env.UPSTREAM_API_URL ||
      process.env.API_BASE_URL ||
      "https://altgeo.hirenq.com";
    const base = `${upstreamRoot.replace(/\/$/, "")}/DeviceLog`;
    const search = new URLSearchParams(req.query as Record<string, string>).toString();
    const url = `${base}${search ? `?${search}` : ""}`;

    const agent = new https.Agent({ rejectUnauthorized: false });

    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      // @ts-expect-error - Node fetch supports agent
      agent,
    } as any);

    const text = await upstream.text();
    const status = upstream.status;
    const contentType = upstream.headers.get("content-type") || "application/json";

    res.status(status);
    res.setHeader("content-type", contentType);

    // Try to forward JSON, otherwise send raw
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
      message: err?.message || "Failed to proxy DeviceLog",
      timestamp: new Date().toISOString(),
    });
  }
});
