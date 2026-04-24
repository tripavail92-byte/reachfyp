import serverEnv, { hasPostmarkEmailConfig } from "../env/server";

type AuthEmailDeliveryResult = {
  delivered: boolean;
  previewToken: string | null;
};

type PostmarkEmailInput = {
  to: string;
  subject: string;
  tag: string;
  textBody: string;
  htmlBody: string;
};

function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, serverEnv.appUrl).toString();
}

async function sendPostmarkEmail(input: PostmarkEmailInput) {
  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": serverEnv.postmarkServerToken,
    },
    body: JSON.stringify({
      From: serverEnv.postmarkFromEmail,
      To: input.to,
      Subject: input.subject,
      TextBody: input.textBody,
      HtmlBody: input.htmlBody,
      MessageStream: serverEnv.postmarkMessageStream,
      Tag: input.tag,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Postmark request failed with ${response.status}: ${await response.text()}`);
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<AuthEmailDeliveryResult> {
  const resetUrl = buildAbsoluteUrl(`/auth/reset-password?token=${encodeURIComponent(token)}`);

  if (!hasPostmarkEmailConfig()) {
    return { delivered: false, previewToken: token };
  }

  await sendPostmarkEmail({
    to: email,
    subject: "Reset your Reachfyp password",
    tag: "password-reset",
    textBody: `Use this link to reset your Reachfyp password: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`,
    htmlBody: `<p>Use this link to reset your Reachfyp password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
  });

  return { delivered: true, previewToken: null };
}

export async function sendEmailVerificationEmail(name: string, email: string, token: string): Promise<AuthEmailDeliveryResult> {
  const verifyUrl = buildAbsoluteUrl(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  const safeName = name.trim() || "there";

  if (!hasPostmarkEmailConfig()) {
    return { delivered: false, previewToken: token };
  }

  await sendPostmarkEmail({
    to: email,
    subject: "Verify your Reachfyp email",
    tag: "email-verification",
    textBody: `Hi ${safeName},\n\nVerify your Reachfyp email with this link: ${verifyUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.`,
    htmlBody: `<p>Hi ${safeName},</p><p>Verify your Reachfyp email with this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>`,
  });

  return { delivered: true, previewToken: null };
}