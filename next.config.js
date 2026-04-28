/** @type {import('next').NextConfig} */

const { URL } = require("url");
const rawSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

let supabaseHostname = "";
try {
  if (rawSupabaseUrl) supabaseHostname = new URL(rawSupabaseUrl).hostname;
} catch (err) {
  console.warn(
    "Could not parse SUPABASE URL for next.config remotePatterns:",
    rawSupabaseUrl
  );
  supabaseHostname = "";
}

// Parse backend URL hostname dynamically
const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || "";
let backendHostname = "";
try {
  if (rawBackendUrl) backendHostname = new URL(rawBackendUrl).hostname;
} catch (err) {
  console.warn("Could not parse NEXT_PUBLIC_API_URL for remotePatterns:", rawBackendUrl);
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  turbopack: {},

  experimental: {},

  ...(process.env.NEXT_PUBLIC_API_URL
    ? {
        rewrites: async () => [
          {
            source: "/api/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
          },
        ],
      }
    : {}),

  images: {
    unoptimized: true,
    remotePatterns: [
      // ── Supabase (dynamic from env) ──────────────────────────────
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname,
              port: "",
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),

      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },

      // ── Your backend API server (dynamic from env) ───────────────
      // Covers: mk-backend-a6c7.onrender.com or any other host in NEXT_PUBLIC_API_URL
      ...(backendHostname
        ? [
            {
              protocol: "https",
              hostname: backendHostname,
              port: "",
              pathname: "/**",
            },
          ]
        : []),

      // ── Fallback: allow all Render.com subdomains ─────────────────
      {
        protocol: "https",
        hostname: "*.onrender.com",
        port: "",
        pathname: "/**",
      },

      // ── Local development backend ─────────────────────────────────
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },

      // ── Placeholder / Bing ────────────────────────────────────────
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      { protocol: "https", hostname: "th.bing.com", pathname: "/**" },
      { protocol: "https", hostname: "www.bing.com", pathname: "/**" },
      { protocol: "https", hostname: "tse1.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse2.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse3.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse4.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse5.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse6.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse7.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse8.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "www.timothylangston.com", pathname: "/**" },
      { protocol: "https", hostname: "m.media-amazon.com", pathname: "/**" },
    ],

    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; img-src * data: blob;",
  },

  webpack: (config) => {
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push((warn) =>
      /Critical dependency: the request of a dependency is an expression/.test(
        warn.message || ""
      )
    );
    return config;
  },
};

module.exports = nextConfig;