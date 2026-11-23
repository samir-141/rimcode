import type { NextConfig } from "next";
import projects from "./db/projects.json";
import settings from "./db/settings.json";
import { safeExternalUrl } from "./src/lib/urls";

const isDev = process.env.NODE_ENV === "development";
const useAnalytics = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim());
const useRive = Boolean(process.env.NEXT_PUBLIC_RIMY_RIVE_SRC?.trim());
const riveUrl = safeExternalUrl(process.env.NEXT_PUBLIC_RIMY_RIVE_SRC);
const frameOrigins = [...new Set(projects.projects
  .filter(({ demo }) => demo.enabled && safeExternalUrl(demo.url))
  .map(({ demo }) => new URL(demo.url).origin))];

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'" +
    (isDev ? " 'unsafe-eval'" : "") +
    (useRive ? " 'wasm-unsafe-eval'" : "") +
    (useAnalytics ? " https://www.googletagmanager.com" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:" + (useAnalytics ? " https://*.google-analytics.com https://www.googletagmanager.com" : ""),
  "font-src 'self'",
  "media-src 'self' blob:",
  "connect-src 'self' " + new URL(settings.currency.ratesEndpoint).origin +
    (useRive ? " https://unpkg.com https://cdn.jsdelivr.net" + (riveUrl ? " " + new URL(riveUrl).origin : "") : "") +
    (useAnalytics ? " https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com" : "") +
    (isDev ? " ws: wss:" : ""),
  "frame-src " + (frameOrigins.join(" ") || "'none'"),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
        ...(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") && !isDev ? [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ] : []),
      ],
    }];
  },
  allowedDevOrigins: ["192.168.1.115", "192.168.56.1", "localhost", "127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    rules: {
      // Tailwind solo debe procesar CSS global. Si el loader también
      // toca los `.module.css`, Turbopack los trata como CSS plano y
      // sus exports quedan vacíos (styles.shell === undefined).
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
