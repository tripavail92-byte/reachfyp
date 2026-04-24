import { createEmailVerificationRequestForUser, registerAuthUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie } from "../../../lib/auth/session";
import { sendEmailVerificationEmail } from "../../../lib/mailer/auth-mailer";

const allowedModes = new Set([
  "sign-in",
  "register",
  "brand-sign-in",
  "creator-sign-in",
  "admin-sign-in",
  "register-brand",
  "register-creator",
  "brand-checkout-sign-in",
  "brand-checkout-register",
]);

function getSafeRedirectPath(rawRedirectPath: string) {
  if (!rawRedirectPath.startsWith("/") || rawRedirectPath.startsWith("//")) {
    return null;
  }

  return rawRedirectPath;
}

function getSignupRedirectUrl(request: NextRequest, mode: string | null, params: Record<string, string>, reservedCreatorUsername?: string | null) {
  const pathname = mode === "register-creator" ? "/creator" : mode === "register-brand" ? "/brand" : "/auth";
  const redirectUrl = new URL(pathname, request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  if (mode === "register-creator" && reservedCreatorUsername) {
    redirectUrl.searchParams.set("username", reservedCreatorUsername);
    redirectUrl.searchParams.set("signup", "1");
  }

  if (mode === "register-brand") {
    redirectUrl.searchParams.set("signup", "1");
  }

  if (pathname === "/auth" && mode) {
    redirectUrl.searchParams.set("mode", mode);
  }

  return redirectUrl;
}

function getSafeMode(rawMode: string) {
  return allowedModes.has(rawMode) ? rawMode : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const redirectTo = getSafeRedirectPath(String(formData.get("redirectTo") ?? ""));
  const mode = getSafeMode(String(formData.get("mode") ?? ""));
  const reservedCreatorUsername = String(formData.get("reservedCreatorUsername") ?? "");
  const result = await registerAuthUser({
    name: String(formData.get("name") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    reservedCreatorUsername,
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: formData.get("role") === "creator" ? "creator" : "brand",
  });

  if (!result.ok) {
    const failureParams: Record<string, string> = { error: result.error, mode: mode ?? "register" };

    if (redirectTo) {
      failureParams.redirectTo = redirectTo;
    }

    return NextResponse.redirect(getSignupRedirectUrl(request, mode, failureParams, reservedCreatorUsername), 303);
  }

  const successUrl = new URL(redirectTo ?? "/auth?status=registered", request.url);
  const verificationResult = await createEmailVerificationRequestForUser(result.user.id);

  if (successUrl.pathname === "/auth") {
    successUrl.searchParams.set("status", "registered");

    if (verificationResult.ok) {
      if (verificationResult.alreadyVerified) {
        successUrl.searchParams.set("verificationStatus", "already-verified");
      } else if (verificationResult.token) {
        try {
          const delivery = await sendEmailVerificationEmail(result.user.name, result.user.email, verificationResult.token);
          successUrl.searchParams.set("verificationStatus", "verification-sent");

          if (delivery.previewToken) {
            successUrl.searchParams.set("verifyEmailToken", delivery.previewToken);
          }
        } catch (error) {
          console.error("Failed to send verification email after registration", error);
          successUrl.searchParams.set("error", "verification-send-failed");
        }
      }
    }
  }

  const response = NextResponse.redirect(successUrl, 303);
  return await attachSessionCookie(response, result.user.id);
}