import { applyToCampaign, getCreatorRecordByAuthUserId } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  const formData = await request.formData();
  const message = String(formData.get("message") ?? "").trim();
  const proposedPrice = String(formData.get("proposedPrice") ?? "").trim();

  const detailUrl = new URL(`/campaigns/${campaignId}`, request.url);

  if (!message || !proposedPrice) {
    detailUrl.searchParams.set("error", "missing-application-fields");
    return NextResponse.redirect(detailUrl, 303);
  }

  const creatorProfile = await getCreatorRecordByAuthUserId(currentUser.id);
  if (!creatorProfile) {
    detailUrl.searchParams.set("error", "profile-required");
    return NextResponse.redirect(detailUrl, 303);
  }

  const result = await applyToCampaign({
    campaignId,
    creatorAuthUserId: currentUser.id,
    creatorUsername: creatorProfile.username,
    creatorName: creatorProfile.name,
    message,
    proposedPrice,
  });

  if (!result.ok) {
    detailUrl.searchParams.set("error", result.error);
    return NextResponse.redirect(detailUrl, 303);
  }

  detailUrl.searchParams.set("status", "applied");
  return NextResponse.redirect(detailUrl, 303);
}
