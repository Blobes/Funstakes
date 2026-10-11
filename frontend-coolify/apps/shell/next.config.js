import { withBaseConfig, mapAppAssets } from "@repo/core/next-config";

const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";

    const platformUrl = isDev
      ? "http://localhost:3001"
      : "http://platform-app:3001";
    const authUrl = isDev ? "http://localhost:3002" : "http://auth-app:3002";
    const postUrl = isDev ? "http://localhost:3003" : "http://post-app:3003";

    return {
      beforeFiles: [
        // Automatically map assets for all apps
        ...mapAppAssets({
          platform: platformUrl,
          auth: authUrl,
          post: postUrl,
        }),
      ],
      afterFiles: [
        // Platform pages routes
        { source: "/privacy", destination: `${platformUrl}/privacy` },
        { source: "/terms", destination: `${platformUrl}/terms` },
        // Auth pages routes
        { source: "/login", destination: `${authUrl}/login` },
        { source: "/signup", destination: `${authUrl}/signup` },
        {
          source: "/verify-identity",
          destination: `${authUrl}/verify-identity`,
        },
        { source: "/reset-password", destination: `${authUrl}/reset-password` },
        { source: "/onboarding", destination: `${authUrl}/signup/onboarding` },
        // Gist pages routes
        { source: "/gist", destination: `${postUrl}/gist/detail` },
        { source: "/gists", destination: `${postUrl}/gist/feed` },
        { source: "/gist/:path*", destination: `${postUrl}/gist/:path*` },
        // Stake pages routes
        { source: "/stake", destination: `${postUrl}/stake/detail` },
        { source: "/stake/:path*", destination: `${postUrl}/stake/:path*` },
      ],
    };
  },
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net", "shell");
