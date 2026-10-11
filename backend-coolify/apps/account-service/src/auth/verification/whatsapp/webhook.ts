import { Request, Response } from "express";
import { phoneDispatchTokens } from "../../../envVars";

const VERIFY_TOKEN = phoneDispatchTokens.WHATSAPP_WEBHOOK_TOKEN;

/**
 * Handles Meta's webhook verification challenge
 */
export const handleWhatsappChallenge = async (
  req: Request,
  res: Response,
): Promise<unknown> => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("--- WEBHOOK VERIFIED SUCCESSFULLY ---");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

/**
 * Receives actual WhatsApp message updates (Delivered, Read, Failed)
 */
export const handleWhatsappMsgUpdates = async (
  req: Request,
  res: Response,
): Promise<unknown> => {
  const body = req.body;

  console.log("Incoming Webhook Event:", JSON.stringify(body, null, 2));

  if (body.object === "whatsapp_business_account") {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.statuses
    ) {
      const statusUpdate = body.entry[0].changes[0].value.statuses[0];
      const recipientPhone = statusUpdate.recipient_id;
      const messageStatus = statusUpdate.status; // "delivered", "read", "sent", or "failed"

      console.log(
        `[OTP Status Update] Phone: ${recipientPhone} is now ${messageStatus.toUpperCase()}`,
      );
    }

    // Always return a 200 OK immediately so Meta knows you received the payload
    return res.status(200).send("EVENT_RECEIVED");
  } else {
    return res.sendStatus(404);
  }
};
