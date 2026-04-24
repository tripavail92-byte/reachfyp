import { deleteCreatorSocialAccountForAuthUser } from "@reachfyp/api";
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
  const result = deleteCreatorSocialAccountForAuthUser(currentUser.id, platform);

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, { status: "social-disconnected" }), 303);
}