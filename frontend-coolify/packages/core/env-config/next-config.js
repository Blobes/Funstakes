import fs from "fs";
import path from "path";

/** @type {import('next').NextConfig} */

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve("../../package.json"), "utf8"),
);

/**
 * Generates the foundational configuration block shared across the application architecture.
 */
export function withBaseConfig(appConfig = {}, backendApi, appName) {
  const isProduction = process.env.NODE_ENV === "production";

  const appVersion = isProduction ? packageJson.version : `dev-${Date.now()}`;

  const isShell = appName === "shell";
  const assetPrefix = isShell ? undefined : `/${appName}-assets`;

  // Standard list of directories to ignore across watchers
  const ignoredWatchPatterns = [
    "**/.git/**",
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",
    "../../apps/*/.next/**",
    "../../../backend-coolify/**",
  ];

  return {
    ...appConfig,
    output: isProduction ? "standalone" : undefined,
    assetPrefix: appConfig.assetPrefix || assetPrefix,
    env: { ...appConfig.env, NEXT_PUBLIC_APP_VERSION: appVersion },

    // Configures native asset loader rules for Next.js 16 Turbopack
    turbopack: {
      rules: {
        "*.lottie": {
          loaders: ["file-loader"],
          as: "*.lottie",
        },
      },
    },

    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "images.unsplash.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "media.funstakes.net",
          pathname: "/**",
        },
      ],
    },

    webpack(config) {
      // Retains support if building with --webpack flag
      config.module.rules.push({
        test: /\.lottie$/,
        type: "asset/resource",
      });
      if (typeof appConfig.webpack === "function") {
        return appConfig.webpack(config);
      }
      return config;
    },

    async headers() {
      const userHeaders =
        typeof appConfig.headers === "function"
          ? await appConfig.headers()
          : [];

      const baseHeaders = [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Cross-Origin-Opener-Policy",
              value: "same-origin-allow-popups",
            },
            {
              key: "Cross-Origin-Embedder-Policy",
              value: "unsafe-none",
            },
          ],
        },
        {
          source: "/_next/:path*",
          headers: [
            { key: "Access-Control-Allow-Origin", value: "*" },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET,OPTIONS,PATCH,POST",
            },
            { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          ],
        },
      ];
      return [...baseHeaders, ...userHeaders];
    },

    async rewrites() {
      const baseRewrites = appConfig.rewrites
        ? await appConfig.rewrites()
        : { beforeFiles: [], afterFiles: [], fallback: [] };

      const beforeFiles = Array.isArray(baseRewrites)
        ? []
        : baseRewrites.beforeFiles || [];

      return {
        ...baseRewrites,
        beforeFiles: [
          ...beforeFiles,
          ...(assetPrefix
            ? [
                {
                  source: `${assetPrefix}/_next/:path*`,
                  destination: "/_next/:path*",
                },
              ]
            : []),
          {
            source: "/api/:path*",
            destination: `${backendApi}/:path*`,
          },
        ],
      };
    },
  };
}

/**
 * Maps asset routes to their corresponding multi-zone application targets.
 */
export function mapAppAssets(apps) {
  return Object.entries(apps)
    .filter(([_, url]) => !!url)
    .map(([name, url]) => ({
      source: `/${name}-assets/_next/:path*`,
      destination: `${url}/${name}-assets/_next/:path*`,
    }));
}
