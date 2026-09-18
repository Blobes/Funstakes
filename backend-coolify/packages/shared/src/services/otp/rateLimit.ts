import { CACHE_EXPIRY, CACHE_KEYS } from "../../constants/cacheKeys";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { createDomainError } from "../../utils/error";
import { normalizeValue } from "../../utils/hash";
import { detectIdentifierType } from "../../utils/sanitizeData";
import { CacheService } from "../redis/cache/service";

// /**
//  * Enforces dual-dimension rate limits (Phone + IP) on OTP dispatches to block SMS spam and toll fraud.
//  */
// export async function enforceOtpRateLimit(
//   phoneNumber: string,
//   userIp: string,
// ): Promise<void> {
//   const sanitizedPhone = phoneNumber.replace(/\+/g, "");
//   const phoneKey = `otp_guard:phone:${sanitizedPhone}`;
//   const ipKey = `otp_guard:ip:${userIp}`;

//   const client = CacheService.getClient();

//   // Pipeline counter increments in a single batch to reduce network round-trips
//   const incrementPipeline = client.pipeline();
//   incrementPipeline.incr(phoneKey);
//   incrementPipeline.incr(ipKey);

//   const incrementResults = await incrementPipeline.exec();

//   if (!incrementResults) {
//     return;
//   }

//   const [phoneErr, rawPhoneCount] = incrementResults[0];
//   const [ipErr, rawIpCount] = incrementResults[1];

//   const currentPhoneRequests =
//     !phoneErr && typeof rawPhoneCount === "number" ? rawPhoneCount : 0;
//   const currentIpRequests =
//     !ipErr && typeof rawIpCount === "number" ? rawIpCount : 0;

//   // Pipeline TTL assignment for newly created keys
//   const ttlPipeline = client.pipeline();
//   let needsTtlExecution = false;

//   if (currentPhoneRequests === 1) {
//     ttlPipeline.expire(phoneKey, 600);
//     needsTtlExecution = true;
//   }

//   if (currentIpRequests === 1) {
//     ttlPipeline.expire(ipKey, 600);
//     needsTtlExecution = true;
//   }

//   if (needsTtlExecution) {
//     await ttlPipeline.exec();
//   }

//   if (currentPhoneRequests > 3) {
//     const transMsg = MESSAGES_REGISTRY.AUTH.OTP_REQUEST_LIMIT_EXCEEDED(10);
//     throw createDomainError(
//       transMsg.message as string,
//       transMsg.i18nKey as string,
//       429,
//     );
//   }

//   if (currentIpRequests > 10) {
//     const transMsg = MESSAGES_REGISTRY.AUTH.SUSPICIOUS_ACTIVITY;
//     throw createDomainError(transMsg.message, transMsg.i18nKey, 429);
//   }
// }

interface RateLimitOptions {
  identifier: string;
  userIp: string;
  requestLimit?: number;
  duration?: number;
}
/**
 * Enforces dual-dimension rate limits on OTP dispatches to block spam and abuse.
 */
export async function enforceOtpRateLimit(
  options: RateLimitOptions,
): Promise<void> {
  const {
    identifier,
    userIp,
    requestLimit = 3,
    duration = CACHE_EXPIRY.MIN_10,
  } = options;

  const idType = detectIdentifierType(identifier);
  const sanitizedId = normalizeValue(identifier);
  const idKey = `otp_guard:${idType.toLowerCase()}:${sanitizedId}`;
  const ipKey = `otp_guard:ip:${userIp}`;

  const client = CacheService.getClient();

  // Pipeline counter increments in a single batch to reduce network round-trips
  const incrementPipeline = client.pipeline();
  incrementPipeline.incr(idKey);
  incrementPipeline.incr(ipKey);

  const incrementResults = await incrementPipeline.exec();

  if (!incrementResults) {
    return;
  }

  const [idErr, rawIdCount] = incrementResults[0];
  const [ipErr, rawIpCount] = incrementResults[1];

  const currentIdRequests =
    !idErr && typeof rawIdCount === "number" ? rawIdCount : 0;
  const currentIpRequests =
    !ipErr && typeof rawIpCount === "number" ? rawIpCount : 0;

  // Pipeline TTL assignment for newly created keys
  const ttlPipeline = client.pipeline();
  let needsTtlExecution = false;

  if (currentIdRequests === 1) {
    ttlPipeline.expire(idKey, duration);
    needsTtlExecution = true;
  }

  if (currentIpRequests === 1) {
    ttlPipeline.expire(ipKey, duration);
    needsTtlExecution = true;
  }

  if (needsTtlExecution) {
    await ttlPipeline.exec();
  }

  if (currentIdRequests > requestLimit) {
    const transMsg = MESSAGES_REGISTRY.AUTH.OTP_REQUEST_LIMIT_EXCEEDED(10);
    throw createDomainError(
      transMsg.message as string,
      transMsg.i18nKey as string,
      429,
    );
  }

  if (currentIpRequests > 10) {
    const transMsg = MESSAGES_REGISTRY.AUTH.SUSPICIOUS_ACTIVITY;
    throw createDomainError(transMsg.message, transMsg.i18nKey, 429);
  }
}
