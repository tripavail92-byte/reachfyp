import { reviewCampaignApplication } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/auth?mode=brand-sign-in", request.url), 303);
  }

  if (currentUser.role === "creator") {
    return NextResponse.redirect(new URL("/creator/hires", request.url), 303);
  }

  const formData = await request.formData();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();

  const detailUrl = new URL(`/dashboard/campaigns/${campaignId}`, request.url);

  if (!applicationId || (decision !== "accepted" && decision !== "rejected")) {
    detailUrl.searchParams.set("error", "invalid-review-input");
    return NextResponse.redirect(detailUrl, 303);
  }

  const result = await reviewCampaignApplication(applicationId, currentUser.id, decision as "accepted" | "rejected");

  if (!result.ok) {
    detailUrl.searchParams.set("error", result.error);
    return NextResponse.redirect(detailUrl, 303);
  }

  // If acceptance created a hire, go directly to the hire detail page
  if (decision === "accepted" && result.hireId) {
    return NextResponse.redirect(new URL(`/dashboard/hires/${result.hireId}`, request.url), 303);
  }

  detailUrl.searchParams.set("status", "reviewed");
  return NextResponse.redirect(detailUrl, 303);
}
