/** @type {import('next').NextConfig} */

const isProdExport = process.env.NEXT_PUBLIC_EXPORT === "true";

const nextConfig = {
  // Only enable static export for production builds
  ...(isProdExport && {
    output: "export",
  }),

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

  // GitHub Pages base path (only needed in export mode)
  basePath: isProdExport ? "/pac-dataviz-challenge" : "",
};

export default nextConfig;