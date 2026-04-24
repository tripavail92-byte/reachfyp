import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie } from "../../../../lib/auth/session";
import {
  clearAppleAuthContext,
  exchangeAppleAuthorizationCode,
  getAppleDisplayName,
  isAppleAuthReady,
  parseAppleUserPayload,
  readAppleAuthContext,
  verifyAppleIdToken,
} from "../../../../lib/auth/apple";
import { upsertAppleAuthUser } from "@reachfyp/api";

function getFailureUrl(request: NextRequest, flow: "creator" | "brand", params: Record<string, string>) {
  const pathname = flow === "creator" ? "/creator" : "/brand";
  const redirectUrl = new URL(pathname, request.url);

  if (flow === "creator" || flow === "brand") {
    redirectUrl.searchParams.set("signup", "1");
  }

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest) {
  const context = await readAppleAuthContext();
  const formData = await request.formData();
  const fallbackFlow = formData.get("state") && context?.flow ? context.flow : "creator";
  const failureParams = (error: string) => ({
    error,
    ...(context?.reservedCreatorUsername ? { username: context.reservedCreatorUsername } : {}),
  });

  if (!context || !isAppleAuthReady()) {
    return clearAppleAuthContext(NextResponse.redirect(getFailureUrl(request, fallbackFlow, failureParams("apple-config-missing")), 303));
  }

  if (String(formData.get("state") ?? "") !== context.state) {
    return clearAppleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams("invalid-state")), 303));
  }

  if (formData.get("error")) {
    return clearAppleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams("apple-auth-failed")), 303));
  }

  try {
    const tokenResponse = await exchangeAppleAuthorizationCode(String(formData.get("code") ?? ""));

    if (!tokenResponse.id_token) {
      throw new Error("missing-id-token");
    }

    const idTokenPayload = await verifyAppleIdToken(tokenResponse.id_token, context.nonce);
    const email = typeof idTokenPayload.email === "string" ? idTokenPayload.email : "";
    const appleSubject = typeof idTokenPayload.sub === "string" ? idTokenPayload.sub : "";

    if (!email || !appleSubject) {
      throw new Error("missing-apple-email");
    }

    const rawUserPayload = parseAppleUserPayload(typeof formData.get("user") === "string" ? String(formData.get("user")) : null);
    const upsertResult = upsertAppleAuthUser({
      appleSubject,
      email,
      name: getAppleDisplayName(context.flow, email, rawUserPayload),
      role: context.flow === "creator" ? "creator" : "brand",
      reservedCreatorUsername: context.flow === "creator" ? context.reservedCreatorUsername : null,
    });

    if (!upsertResult.ok) {
      return clearAppleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams(upsertResult.error)), 303));
    }

    const response = NextResponse.redirect(new URL(context.redirectTo, request.url), 303);
    clearAppleAuthContext(response);
    return attachSessionCookie(response, upsertResult.user.id);
  } catch {
    return clearAppleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams("apple-auth-failed")), 303));
  }
}