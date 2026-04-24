import { reviewPayoutRequest } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = new URL("/admin/payouts", request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest, context: { params: Promise<{ payoutRequestId: string }> }) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.redirect(new URL("/auth?mode=sign-in", request.url), 303);
  }

  const { payoutRequestId } = await context.params;
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  const result = reviewPayoutRequest({
    payoutRequestId,
    adminNote,
    action: action === "approve" ? "approve" : "reject",
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, { status: "reviewed" }), 303);
}