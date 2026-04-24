import { authenticateAuthUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie } from "../../../lib/auth/session";

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

function getRedirectUrl(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = new URL("/auth", request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

function getSafeMode(rawMode: string) {
  return allowedModes.has(rawMode) ? rawMode : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = getSafeRedirectPath(String(formData.get("redirectTo") ?? ""));
  const mode = getSafeMode(String(formData.get("mode") ?? ""));
  const authenticatedUser = await authenticateAuthUser(email, password);

  if (!authenticatedUser) {
    const failureParams: Record<string, string> = { error: "invalid-credentials", mode: mode ?? "sign-in" };

    if (redirectTo) {
      failureParams.redirectTo = redirectTo;
    }

    return NextResponse.redirect(getRedirectUrl(request, failureParams), 303);
  }

  const response = NextResponse.redirect(new URL(redirectTo ?? "/auth?status=signed-in", request.url), 303);
  return await attachSessionCookie(response, authenticatedUser.id);
}