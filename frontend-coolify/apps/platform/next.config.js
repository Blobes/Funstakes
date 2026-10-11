import { withBaseConfig } from "@repo/core/next-config";

const nextConfig = {
  // assetPrefix: "/platform-assets",
};

export default withBaseConfig(
  nextConfig,
  "https://api.funstakes.net",
  "platform",
);
