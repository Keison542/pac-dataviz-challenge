/** @type {import('next').NextConfig} */

const repo = "pac-dataviz-challenge";

const nextConfig = {
  output: "export",

  trailingSlash: true,

  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
