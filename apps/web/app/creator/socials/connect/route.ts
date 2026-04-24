import { upsertCreatorSocialAccountForAuthUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = new URL("/creator/profile", request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  const formData = await request.formData();
  const platform = String(formData.get("platform") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const followers = String(formData.get("followers") ?? "").trim();

  if (!platform || !handle || !url) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "missing-social-fields" }), 303);
  }

  if (!/^https?:\/\//.test(url)) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "invalid-social-url" }), 303);
  }

  const result = await upsertCreatorSocialAccountForAuthUser({
    authUserId: currentUser.id,
    platform,
    handle,
    url,
    followers: followers || "Audience snapshot pending",
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, { status: result.created ? "social-connected" : "social-updated" }), 303);
}