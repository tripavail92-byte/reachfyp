import { adminModerateInstantHire } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = new URL("/admin/hires", request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest, context: { params: Promise<{ hireId: string }> }) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.redirect(new URL("/auth?mode=sign-in", request.url), 303);
  }

  const { hireId } = await context.params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const result = await adminModerateInstantHire({
    hireId,
    action: action === "force_release" ? "force_release" : "force_refund",
    note,
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, { status: "moderated" }), 303);
}