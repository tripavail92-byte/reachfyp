import { createEmailVerificationRequestForUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/auth?error=sign-in-required", request.url), 303);
  }

  const result = createEmailVerificationRequestForUser(currentUser.id);
  const redirectUrl = new URL("/auth", request.url);

  if (!result.ok) {
    redirectUrl.searchParams.set("error", "registration-failed");
    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.searchParams.set("verificationStatus", result.alreadyVerified ? "already-verified" : "verification-sent");

  if (process.env.NODE_ENV !== "production" && result.token) {
    redirectUrl.searchParams.set("verifyEmailToken", result.token);
  }

  return NextResponse.redirect(redirectUrl, 303);
}