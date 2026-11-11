import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.115", "localhost", "127.0.0.1"],
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
