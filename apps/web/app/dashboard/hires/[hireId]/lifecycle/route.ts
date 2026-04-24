import { approveDeliverableForHire, refundInstantHire, requestRevisionForDeliverable } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, hireId: string, params: Record<string, string>) {
  const redirectUrl = new URL(`/dashboard/hires/${hireId}`, request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest, context: { params: Promise<{ hireId: string }> }) {
  const { hireId } = await context.params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "brand") {
    return NextResponse.redirect(new URL(`/auth?mode=sign-in&redirectTo=${encodeURIComponent(`/dashboard/hires/${hireId}`)}`, request.url), 303);
  }

  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();
  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (action === "request-revision") {
    const result = await requestRevisionForDeliverable({
      hireId,
      deliverableId,
      brandUserId: currentUser.id,
      feedback,
    });

    if (!result.ok) {
      return NextResponse.redirect(getRedirectUrl(request, hireId, { error: result.error }), 303);
    }

    return NextResponse.redirect(getRedirectUrl(request, hireId, { status: "revision-requested" }), 303);
  }

  if (action === "approve") {
    const result = await approveDeliverableForHire({
      hireId,
      deliverableId,
      brandUserId: currentUser.id,
      feedback,
    });

    if (!result.ok) {
      return NextResponse.redirect(getRedirectUrl(request, hireId, { error: result.error }), 303);
    }

    return NextResponse.redirect(getRedirectUrl(request, hireId, { status: "approved" }), 303);
  }

  if (action === "refund") {
    const result = await refundInstantHire({
      hireId,
      brandUserId: currentUser.id,
      reason,
    });

    if (!result.ok) {
      return NextResponse.redirect(getRedirectUrl(request, hireId, { error: result.error }), 303);
    }

    return NextResponse.redirect(getRedirectUrl(request, hireId, { status: "refunded" }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, hireId, { error: "invalid-hire-state" }), 303);
}