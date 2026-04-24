import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { attachAppleAuthContext, getAppleAuthorizationUrl, isAppleAuthReady, type AppleAuthFlow } from "../../../../lib/auth/apple";

function getSafeRedirectPath(rawRedirectPath: string) {
  if (!rawRedirectPath.startsWith("/") || rawRedirectPath.startsWith("//")) {
    return null;
  }

  return rawRedirectPath;
}

function getFailureUrl(request: NextRequest, flow: AppleAuthFlow, params: Record<string, string>) {
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
  const searchParams = request.nextUrl.searchParams;
  const flow: AppleAuthFlow = searchParams.get("flow") === "brand" ? "brand" : "creator";
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo") ?? "") ?? (flow === "creator" ? "/creator/profile" : "/creators");
  const reservedCreatorUsername = flow === "creator" ? (searchParams.get("username") ?? "") : "";

  if (!isAppleAuthReady()) {
    return NextResponse.redirect(getFailureUrl(request, flow, { error: "apple-config-missing", ...(reservedCreatorUsername ? { username: reservedCreatorUsername } : {}) }), 303);
  }

  const context = {
    state: randomBytes(16).toString("hex"),
    nonce: randomBytes(16).toString("hex"),
    flow,
    redirectTo,
    reservedCreatorUsername,
  };

  const response = NextResponse.redirect(getAppleAuthorizationUrl(context), 303);
  return attachAppleAuthContext(response, context);
}