/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",

  // Required for GitHub Pages static hosting
  trailingSlash: true,

  // Required because GitHub Pages is NOT a full server
  images: {
    unoptimized: true,
  },

  // Clean and safe for static export
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;