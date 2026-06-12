/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // IMPORTANT for GitHub Pages
  basePath: "/pac-dataviz-challenge",
};

export default nextConfig;