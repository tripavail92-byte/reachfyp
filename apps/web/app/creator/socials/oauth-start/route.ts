import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import serverEnv, { hasInstagramOAuthConfig, hasTikTokOAuthConfig } from "../../../../lib/env/server";
import { buildInstagramOAuthUrl, buildTikTokOAuthUrl } from "@reachfyp/api";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? "";
  const state = randomUUID();

  // State is stored in a short-lived cookie to verify callback
  const responseUrl = new URL("/creator/profile", request.url);

  switch (platform.toLowerCase()) {
    case "instagram": {
      if (!hasInstagramOAuthConfig()) {
        responseUrl.searchParams.set("error", "instagram-oauth-not-configured");
        return NextResponse.redirect(responseUrl, 303);
      }
      const oauthUrl = buildInstagramOAuthUrl(
        serverEnv.instagramAppId,
        serverEnv.instagramRedirectUri,
        state,
      );
      const response = NextResponse.redirect(oauthUrl, 303);
      response.cookies.set("social_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300, // 5 minutes
        path: "/",
      });
      return response;
    }
    case "tiktok": {
      if (!hasTikTokOAuthConfig()) {
        responseUrl.searchParams.set("error", "tiktok-oauth-not-configured");
        return NextResponse.redirect(responseUrl, 303);
      }
      const oauthUrl = buildTikTokOAuthUrl(
        serverEnv.tiktokClientKey,
        serverEnv.tiktokRedirectUri,
        state,
      );
      const response = NextResponse.redirect(oauthUrl, 303);
      response.cookies.set("social_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      return response;
    }
    default: {
      responseUrl.searchParams.set("error", "platform-not-supported");
      return NextResponse.redirect(responseUrl, 303);
    }
  }
}
