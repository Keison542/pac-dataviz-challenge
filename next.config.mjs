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

  // Comment these out for local development
  // basePath: `/${repo}`,
  // assetPrefix: `/${repo}/`,
};

export default nextConfig;