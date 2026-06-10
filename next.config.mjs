const isGithubActions = process.env.GITHUB_ACTIONS === "true";

let basePath = "";
let assetPrefix = "";

if (isGithubActions && process.env.GITHUB_REPOSITORY) {
  const repo = process.env.GITHUB_REPOSITORY.split("/")[1];
  basePath = `/${repo}`;
  assetPrefix = `/${repo}/`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",

  basePath,
  assetPrefix,

  images: {
    unoptimized: true,
  },

  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
