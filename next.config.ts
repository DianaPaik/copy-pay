const isGithubPages = process.env.GITHUB_PAGES === "true";
const repo = process.env.GITHUB_REPO_NAME || "copypay";

const nextConfig = {
  ...(isGithubPages ? { output: "export" as const } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isGithubPages ? `/${repo}` : "",
  assetPrefix: isGithubPages ? `/${repo}/` : "",
};

export default nextConfig;
