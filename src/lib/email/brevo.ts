import "server-only";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export type BrevoEmail = {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  replyTo?: { email: string; name?: string };
};

// Sends a transactional email through Brevo (BREVO_API_KEY, server-only) from the verified
// sender (CONTACT_SENDER_EMAIL, noreply@mrdesign.com.co by default). Never throws: it logs under
// `label` and returns whether Brevo accepted the email, so callers decide what a failure means.
export async function sendBrevoEmail(label: string, email: BrevoEmail): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(`${label} skipped: BREVO_API_KEY is not set`);
    return false;
  }

  let response: Response;
  try {
    response = await fetch(BREVO_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        sender: { email: process.env.CONTACT_SENDER_EMAIL ?? "noreply@mrdesign.com.co", name: "MR Design" },
        ...email,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error(`${label} failed: Brevo could not be reached`, error);
    return false;
  }

  if (!response.ok) console.error(`${label} failed: Brevo answered ${response.status}`);
  return response.ok;
}
