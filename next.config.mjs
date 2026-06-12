/** @type {import('next').NextConfig} */

const repo = "pac-dataviz-challenge";

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

  // REQUIRED for GitHub Pages
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
};

export default nextConfig;
