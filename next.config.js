/** @type {import('next').NextConfig} */

// .Parse Supabase hostname from env for Next.js image remotePatterns
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

const nextConfig = {
  turbopack: {},

  experimental: {},

  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5001/h*',
    },
  ],

  images: {
    remotePatterns: [
      // ✅ Supabase public storage
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

      // ✅ Placeholder images
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },

      // ✅ Bing domains
      { protocol: "https", hostname: "th.bing.com", pathname: "/**" },
      { protocol: "https", hostname: "www.bing.com", pathname: "/**" },
      { protocol: "https", hostname: "tse1.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse2.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse3.mm.bing.net", pathname: "/**" },
      { protocol: "https", hostname: "tse4.mm.bing.net", pathname: "/**" },

      // ✅ Timothylangston
      { protocol: "https", hostname: "www.timothylangston.com", pathname: "/**" },

      // ✅ Amazon images (CURRENT ERROR FIX)
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
