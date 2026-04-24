import { createEmailVerificationRequestForUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { sendEmailVerificationEmail } from "../../../../lib/mailer/auth-mailer";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/auth?error=sign-in-required", request.url), 303);
  }

  const result = await createEmailVerificationRequestForUser(currentUser.id);
  const redirectUrl = new URL("/auth", request.url);

  if (!result.ok) {
    redirectUrl.searchParams.set("error", "registration-failed");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (result.alreadyVerified) {
    redirectUrl.searchParams.set("verificationStatus", "already-verified");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!result.token) {
    redirectUrl.searchParams.set("error", "verification-send-failed");
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    const delivery = await sendEmailVerificationEmail(currentUser.name, currentUser.email, result.token);
    redirectUrl.searchParams.set("verificationStatus", "verification-sent");

    if (delivery.previewToken) {
      redirectUrl.searchParams.set("verifyEmailToken", delivery.previewToken);
    }
  } catch (error) {
    console.error("Failed to resend verification email", error);
    redirectUrl.searchParams.set("error", "verification-send-failed");
  }

  return NextResponse.redirect(redirectUrl, 303);
}