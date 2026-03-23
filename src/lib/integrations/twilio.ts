/**
 * Twilio integration — SMS outbound + two-way messaging.
 *
 * Handles:
 * - Sending SMS (booking reminders, invoice nudges, marketing)
 * - Receiving inbound SMS via webhook
 * - Phone number provisioning
 */

let _client: TwilioClient | null = null;

interface TwilioClient {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export function getTwilioClient(): TwilioClient {
  if (_client) return _client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env.local");
  }

  _client = { accountSid, authToken, fromNumber };
  return _client;
}

/** Send an SMS message */
export async function sendSMS(params: {
  to: string;
  body: string;
}): Promise<{ sid: string; status: string }> {
  const client = getTwilioClient();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${client.accountSid}/Messages.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${client.accountSid}:${client.authToken}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      To: params.to,
      From: client.fromNumber,
      Body: params.body,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twilio SMS failed: ${error.message}`);
  }

  const data = await response.json();
  return { sid: data.sid, status: data.status };
}

/** Send a booking reminder SMS */
export async function sendBookingReminder(params: {
  to: string;
  clientName: string;
  serviceName: string;
  dateTime: string;
  businessName: string;
}) {
  return sendSMS({
    to: params.to,
    body: `Hi ${params.clientName}, this is a reminder for your ${params.serviceName} appointment on ${params.dateTime}. — ${params.businessName}`,
  });
}

/** Send an invoice payment reminder SMS */
export async function sendPaymentReminder(params: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  paymentLink?: string;
}) {
  const linkText = params.paymentLink ? ` Pay here: ${params.paymentLink}` : "";
  return sendSMS({
    to: params.to,
    body: `Hi ${params.clientName}, invoice ${params.invoiceNumber} for ${params.amount} is due.${linkText}`,
  });
}

/** Verify an inbound Twilio webhook signature */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const client = getTwilioClient();
  // Build the validation string: URL + sorted params
  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params[key];
  }

  // HMAC-SHA1 signature verification
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha1", client.authToken);
  hmac.update(dataString);
  const computed = hmac.digest("base64");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}
