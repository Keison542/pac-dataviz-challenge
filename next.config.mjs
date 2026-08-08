/** @type {import('next').NextConfig} */

const isInfinityFree = process.env.DEPLOY_TARGET === "infinityfree";

const basePath = isInfinityFree
  ? "/pac-dataviz"
  : "/pac-dataviz-challenge";

const nextConfig = {
  output: "export",

  trailingSlash: true,

  basePath,

  assetPrefix: `${basePath}/`,

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
