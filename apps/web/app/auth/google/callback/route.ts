import { NextRequest, NextResponse } from "next/server";
import { upsertGoogleAuthUser } from "@reachfyp/api";
import {
  clearGoogleAuthContext,
  exchangeGoogleAuthorizationCode,
  getGoogleDisplayName,
  isGoogleAuthReady,
  readGoogleAuthContext,
  verifyGoogleIdToken,
} from "../../../../lib/auth/google";
import { attachSessionCookie } from "../../../../lib/auth/session";

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

export async function GET(request: NextRequest) {
  const context = await readGoogleAuthContext();
  const searchParams = request.nextUrl.searchParams;
  const fallbackFlow = context?.flow ?? "creator";
  const failureParams = (error: string) => ({
    error,
    ...(context?.reservedCreatorUsername ? { username: context.reservedCreatorUsername } : {}),
  });

  if (!context || !isGoogleAuthReady()) {
    return clearGoogleAuthContext(NextResponse.redirect(getFailureUrl(request, fallbackFlow, failureParams("google-config-missing")), 303));
  }

  if (searchParams.get("state") !== context.state) {
    return clearGoogleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams("invalid-state")), 303));
  }

  if (searchParams.get("error")) {
    return clearGoogleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams("google-auth-failed")), 303));
  }

  try {
    const tokenResponse = await exchangeGoogleAuthorizationCode(String(searchParams.get("code") ?? ""));

    if (!tokenResponse.id_token) {
      throw new Error("missing-id-token");
    }

    const idTokenPayload = await verifyGoogleIdToken(tokenResponse.id_token, context.nonce);
    const email = typeof idTokenPayload.email === "string" ? idTokenPayload.email : "";
    const googleSubject = typeof idTokenPayload.sub === "string" ? idTokenPayload.sub : "";
    const name = typeof idTokenPayload.name === "string" ? idTokenPayload.name : "";

    if (!email || !googleSubject) {
      throw new Error("missing-google-email");
    }

    const upsertResult = upsertGoogleAuthUser({
      googleSubject,
      email,
      name: getGoogleDisplayName(name, email, context.flow),
      role: context.flow === "creator" ? "creator" : "brand",
      reservedCreatorUsername: context.flow === "creator" ? context.reservedCreatorUsername : null,
    });

    if (!upsertResult.ok) {
      return clearGoogleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams(upsertResult.error)), 303));
    }

    const response = NextResponse.redirect(new URL(context.redirectTo, request.url), 303);
    clearGoogleAuthContext(response);
    return attachSessionCookie(response, upsertResult.user.id);
  } catch {
    return clearGoogleAuthContext(NextResponse.redirect(getFailureUrl(request, context.flow, failureParams("google-auth-failed")), 303));
  }
}