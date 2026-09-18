import { Worker, Job } from "bullmq";
import {
  dispatchEmailCode,
  OtpJobPayload,
  getQueueConnection,
  OtpMessageChannel,
  dispatchWhatsAppOtp,
  dispatchSmsOtp,
} from "@repo/shared";
import {
  codeDispatchTokens,
  FUNSTAKES_REDIS_URL,
  phoneDispatchTokens,
} from "@/envVars";

/**
 * Initializes the BullMQ background worker loop for high-priority OTP generation.
 */
export const otpDispatchWorker = () => {
  const redisConnection = getQueueConnection(FUNSTAKES_REDIS_URL);

  const worker = new Worker<OtpJobPayload, any, "send_otp">(
    "otp_queue",
    async (job: Job<OtpJobPayload, any, "send_otp">) => {
      const { code, type, email, phone, firstName, userIp } = job.data;
      const otpType: OtpMessageChannel = type;
      const receiver = otpType === "EMAIL" ? email : phone;

      if (!receiver) {
        throw new Error(
          `Missing dispatch address destination for OTP verification type: ${otpType}`,
        );
      }

      switch (otpType) {
        case "EMAIL":
          await dispatchEmailCode(
            { code, recipient: { email: receiver, firstName, userIp } },
            codeDispatchTokens,
          );
          break;
        case "WHATSAPP":
          await dispatchWhatsAppOtp(
            { phoneNumber: receiver, code, userIp },
            phoneDispatchTokens,
          );
          break;
        case "SMS":
          await dispatchSmsOtp(
            { phoneNumber: receiver, code, userIp },
            phoneDispatchTokens,
          );
          break;
        default:
          throw new Error(`Unhandled dispatch channels requested: ${otpType}`);
      }
      console.log(`📧 OTP sent to channel destination: ${receiver}`);
    },
    {
      connection: redisConnection as unknown as any,
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(
      `❌ Email execution job ${job?.id} failed processing: ${err.message}`,
    );
  });

  worker.on("completed", (job) => {
    console.log(`✅ Email job ${job.id} completed processing state`);
  });

  return worker;
};
