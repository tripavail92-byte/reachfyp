import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import serverEnv, { hasInstagramOAuthConfig, hasTikTokOAuthConfig } from "../../../../lib/env/server";
import {
  exchangeInstagramCode,
  exchangeTikTokCode,
  syncCreatorSocialAccountForAuthUser,
  upsertCreatorSocialAccountForAuthUser,
  upsertSocialTokenForCreator,
} from "@reachfyp/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  const profileUrl = new URL("/creator/profile", request.url);

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? "";
  const code = searchParams.get("code") ?? "";
  const state = searchParams.get("state") ?? "";
  const error = searchParams.get("error");

  // Verify state cookie
  const storedState = request.cookies.get("social_oauth_state")?.value;

  if (error) {
    profileUrl.searchParams.set("error", `oauth-denied-${platform}`);
    const response = NextResponse.redirect(profileUrl, 303);
    response.cookies.delete("social_oauth_state");
    return response;
  }

  if (!code || !state || state !== storedState) {
    profileUrl.searchParams.set("error", "oauth-state-mismatch");
    const response = NextResponse.redirect(profileUrl, 303);
    response.cookies.delete("social_oauth_state");
    return response;
  }

  const clearStateCookie = (res: NextResponse) => {
    res.cookies.delete("social_oauth_state");
    return res;
  };

  switch (platform.toLowerCase()) {
    case "instagram": {
      if (!hasInstagramOAuthConfig()) {
        profileUrl.searchParams.set("error", "instagram-oauth-not-configured");
        return clearStateCookie(NextResponse.redirect(profileUrl, 303));
      }

      const tokenResult = await exchangeInstagramCode(
        code,
        serverEnv.instagramAppId,
        serverEnv.instagramAppSecret,
        serverEnv.instagramRedirectUri,
      );

      if (!tokenResult.ok) {
        profileUrl.searchParams.set("error", tokenResult.error);
        return clearStateCookie(NextResponse.redirect(profileUrl, 303));
      }

      // Store token
      await upsertSocialTokenForCreator({
        creatorAuthUserId: currentUser.id,
        platform: "instagram",
        accessToken: tokenResult.accessToken,
      });

      // Ensure social account record exists (using handle from profile lookup)
      await upsertCreatorSocialAccountForAuthUser({
        authUserId: currentUser.id,
        platform: "Instagram",
        handle: "Connected",
        url: "https://instagram.com",
        followers: "Syncing...",
      });

      // Trigger sync with real data
      await syncCreatorSocialAccountForAuthUser(currentUser.id, "Instagram");

      profileUrl.searchParams.set("status", "social-connected");
      return clearStateCookie(NextResponse.redirect(profileUrl, 303));
    }

    case "tiktok": {
      if (!hasTikTokOAuthConfig()) {
        profileUrl.searchParams.set("error", "tiktok-oauth-not-configured");
        return clearStateCookie(NextResponse.redirect(profileUrl, 303));
      }

      const tokenResult = await exchangeTikTokCode(
        code,
        serverEnv.tiktokClientKey,
        serverEnv.tiktokClientSecret,
        serverEnv.tiktokRedirectUri,
      );

      if (!tokenResult.ok) {
        profileUrl.searchParams.set("error", tokenResult.error);
        return clearStateCookie(NextResponse.redirect(profileUrl, 303));
      }

      await upsertSocialTokenForCreator({
        creatorAuthUserId: currentUser.id,
        platform: "tiktok",
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
      });

      await upsertCreatorSocialAccountForAuthUser({
        authUserId: currentUser.id,
        platform: "TikTok",
        handle: "Connected",
        url: "https://tiktok.com",
        followers: "Syncing...",
      });

      await syncCreatorSocialAccountForAuthUser(currentUser.id, "TikTok");

      profileUrl.searchParams.set("status", "social-connected");
      return clearStateCookie(NextResponse.redirect(profileUrl, 303));
    }

    default: {
      profileUrl.searchParams.set("error", "platform-not-supported");
      return clearStateCookie(NextResponse.redirect(profileUrl, 303));
    }
  }
}
