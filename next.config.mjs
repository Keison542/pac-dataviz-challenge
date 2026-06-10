/** @type {import('next').NextConfig} */

const repo =
  process.env.GITHUB_REPOSITORY?.split("/")?.[1] || "";

const isGithub = Boolean(process.env.GITHUB_ACTIONS);

const basePath = isGithub ? `/${repo}` : "";
const assetPrefix = isGithub ? `/${repo}/` : "";

const nextConfig = {
  output: "export",

  basePath,
  assetPrefix,

  images: {
    unoptimized: true,
  },

  trailingSlash: true,

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
