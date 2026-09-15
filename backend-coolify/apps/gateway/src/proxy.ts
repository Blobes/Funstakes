import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";
import {
  ACCOUNT_URL,
  JWT_SECRET,
  PLATFORM_URL,
  POST_URL,
  WORKER_URL,
} from "./envVars";
import { forwardIdHeaders } from "./middleware";

const router: Router = Router();

// Apply gateway authentication middleware globally across proxy routes.
router.use(forwardIdHeaders(JWT_SECRET));

/**
 * Factory that initializes http-proxy-middleware instances statically.
 * This guarantees event listeners are registered exactly once during app initialization.
 */
const createStaticProxy = (
  prefixes: string[],
  targetEnvVar: string,
  shouldStrip: boolean = false,
) => {
  if (!targetEnvVar) {
    console.error(
      `❌ [Proxy Initialization Error] ${targetEnvVar} is undefined!`,
    );
    // Fallback handler for missing environmental configurations
    return (req: Request, res: Response, next: NextFunction) => {
      const matchedPrefix = prefixes.find((p) => req.path.startsWith(p));
      if (!matchedPrefix) return next();
      res.status(502).json({ error: `Config missing: ${targetEnvVar}` });
    };
  }

  const proxyOptions: Options = {
    target: targetEnvVar,
    changeOrigin: true,
    secure: true,
    xfwd: true,
    pathRewrite: shouldStrip
      ? (path, req) => {
          const matchedPrefix = prefixes.find((p) => path.startsWith(p));
          return matchedPrefix ? path.replace(matchedPrefix, "") : path;
        }
      : undefined,
    on: {
      error: (err, req, res) => {
        console.error(`[Proxy Error] ${targetEnvVar}:`, err.message);
        (res as Response).status(502).json({ error: "Service unavailable" });
      },
    },
  };

  const middlewareInstance = createProxyMiddleware(proxyOptions);

  return (req: Request, res: Response, next: NextFunction) => {
    const matchedPrefix = prefixes.find((p) => req.path.startsWith(p));
    if (!matchedPrefix) return next();

    // Forward execution context to the pre-allocated static proxy middleware
    return middlewareInstance(req, res, next);
  };
};

// ====== Static Microservice Mappings ======

// ACCOUNT SERVICE
router.use(createStaticProxy(["/account"], ACCOUNT_URL, true));
router.use(createStaticProxy(["/auth", "/user"], ACCOUNT_URL));

// POST SERVICE
router.use(createStaticProxy(["/post"], POST_URL, true));
router.use(createStaticProxy(["/feed", "/gist"], POST_URL));

// PLATFORM SERVICE
router.use(createStaticProxy(["/platform"], PLATFORM_URL, true));
router.use(
  createStaticProxy(
    [
      "/upload",
      "/topic",
      "/notification",
      "/search",
      "/audit",
      "/moderation",
      "/webhook",
    ],
    PLATFORM_URL,
  ),
);

// WORKER SERVICE
router.use(createStaticProxy(["/worker"], WORKER_URL, true));

export default router;
