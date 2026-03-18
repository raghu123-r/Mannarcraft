/** @type {import('next').NextConfig} */

// Parse Supabase hostname from env for Next.js image remotePatterns
const { URL } = require("url");

const rawSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

let supabaseHostname = "";

try {
  if (rawSupabaseUrl) {
    supabaseHostname = new URL(rawSupabaseUrl).hostname;
  }
} catch (err) {
  console.warn(
    "Could not parse SUPABASE URL for next.config remotePatterns:",
    rawSupabaseUrl
  );
}

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  turbopack: {},

  experimental: {},

  // ✅ FIXED: rewrites now use env variable instead of localhost
  // On Vercel: set NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
  // On localhost: set NEXT_PUBLIC_API_URL = http://localhost:5001
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
        pathname: "/storage/v1/object/public/**",
      },

      {
        protocol: "https",
        hostname: "via.placeholder.com",
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

      {
        protocol: "https",
        hostname: "www.timothylangston.com",
        pathname: "/**",
      },

      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/**",
      },
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
