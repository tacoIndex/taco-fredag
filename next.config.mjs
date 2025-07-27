/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  // Next.js 15 best practices
  experimental: {
    // Enable partial prerendering for better performance
    // ppr: true, // Only available in canary
    // Optimize package imports
    optimizePackageImports: ["@tanstack/react-query", "@trpc/react-query"],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // TypeScript - we'll handle errors with biome
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Generate standalone output for better deployment
  output: "standalone",
};

export default config;
