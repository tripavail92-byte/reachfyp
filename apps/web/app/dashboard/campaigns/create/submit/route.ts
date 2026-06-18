import { createCampaign } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/auth?mode=brand-sign-in", request.url), 303);
  }

  if (currentUser.role !== "brand" && currentUser.role !== "admin") {
    return NextResponse.redirect(new URL("/creator/hires", request.url), 303);
  }

  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const budget = String(formData.get("budget") ?? "").trim();
  const platformsRaw = String(formData.get("platforms") ?? "").trim();
  const nicheRaw = String(formData.get("niche") ?? "").trim();
  const deliverables = String(formData.get("deliverables") ?? "").trim();
  const requirements = String(formData.get("requirements") ?? "").trim();
  const timelineStart = String(formData.get("timelineStart") ?? "").trim();
  const timelineEnd = String(formData.get("timelineEnd") ?? "").trim();

  const createUrl = new URL("/dashboard/campaigns/create", request.url);

  if (!title || !objective || !description || !budget || !platformsRaw || !nicheRaw || !deliverables || !timelineStart || !timelineEnd) {
    createUrl.searchParams.set("error", "missing-fields");
    return NextResponse.redirect(createUrl, 303);
  }

  if (timelineEnd < timelineStart) {
    createUrl.searchParams.set("error", "invalid-dates");
    return NextResponse.redirect(createUrl, 303);
  }

  if (!/^\d+(\.\d+)?$/.test(budget)) {
    createUrl.searchParams.set("error", "invalid-budget");
    return NextResponse.redirect(createUrl, 303);
  }

  const platforms = platformsRaw.split(",").map((p) => p.trim()).filter(Boolean);
  const niche = nicheRaw.split(",").map((n) => n.trim()).filter(Boolean);

  const campaign = await createCampaign({
    brandUserId: currentUser.id,
    title,
    objective,
    description,
    budget,
    currency: "USD",
    platforms,
    niche,
    deliverables,
    timelineStart,
    timelineEnd,
    requirements,
    status: "open",
  });

  return NextResponse.redirect(new URL(`/dashboard/campaigns/${campaign.id}`, request.url), 303);
}
