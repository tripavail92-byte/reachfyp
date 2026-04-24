import { createInstantHireRecord } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, packageId: string, params: Record<string, string>) {
  const redirectUrl = new URL(`/dashboard/instant-hire/${packageId}`, request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest, context: { params: Promise<{ packageId: string }> }) {
  const { packageId } = await context.params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL(`/auth?mode=register-brand&redirectTo=${encodeURIComponent(`/dashboard/instant-hire/${packageId}`)}`, request.url), 303);
  }

  if (currentUser.role !== "brand") {
    return NextResponse.redirect(getRedirectUrl(request, packageId, { error: "package-not-found" }), 303);
  }

  const formData = await request.formData();
  const deliveryDeadline = String(formData.get("deliveryDeadline") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();

  if (!brief) {
    return NextResponse.redirect(getRedirectUrl(request, packageId, { error: "missing-brief" }), 303);
  }

  if (!deliveryDeadline || Number.isNaN(Date.parse(deliveryDeadline)) || new Date(`${deliveryDeadline}T00:00:00`).getTime() < new Date(new Date().toISOString().slice(0, 10)).getTime()) {
    return NextResponse.redirect(getRedirectUrl(request, packageId, { error: "invalid-deadline" }), 303);
  }

  const result = createInstantHireRecord({
    packageId,
    brandUserId: currentUser.id,
    deliveryDeadline,
    brief,
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, packageId, { error: result.error }), 303);
  }

  return NextResponse.redirect(new URL(`/dashboard/hires/${result.hire.id}?status=created`, request.url), 303);
}