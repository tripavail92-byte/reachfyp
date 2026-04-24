import { NextRequest, NextResponse } from "next/server";
import { attachGoogleAuthContext, createGoogleAuthContext, getGoogleAuthorizationUrl, isGoogleAuthReady, type GoogleAuthFlow } from "../../../../lib/auth/google";

function getSafeRedirectPath(rawRedirectPath: string) {
  if (!rawRedirectPath.startsWith("/") || rawRedirectPath.startsWith("//")) {
    return null;
  }

  return rawRedirectPath;
}

function getFailureUrl(request: NextRequest, flow: GoogleAuthFlow, params: Record<string, string>) {
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
  const flow: GoogleAuthFlow = searchParams.get("flow") === "brand" ? "brand" : "creator";
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo") ?? "") ?? (flow === "creator" ? "/creator/profile" : "/creators");
  const reservedCreatorUsername = flow === "creator" ? (searchParams.get("username") ?? "") : "";

  if (!isGoogleAuthReady()) {
    return NextResponse.redirect(getFailureUrl(request, flow, { error: "google-config-missing", ...(reservedCreatorUsername ? { username: reservedCreatorUsername } : {}) }), 303);
  }

  const context = createGoogleAuthContext(flow, redirectTo, reservedCreatorUsername);
  const response = NextResponse.redirect(getGoogleAuthorizationUrl(context), 303);
  return attachGoogleAuthContext(response, context);
}