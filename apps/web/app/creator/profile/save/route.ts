import { upsertCreatorRecordForAuthUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = new URL("/creator/profile", request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

function normalizeUsername(rawUsername: string) {
  return rawUsername
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeNiche(rawNiche: string) {
  return rawNiche
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizePrice(rawPrice: string) {
  const numericValue = Number(rawPrice.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return `$${Math.round(numericValue)}`;
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  const formData = await request.formData();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const niche = normalizeNiche(String(formData.get("niche") ?? ""));
  const summary = String(formData.get("summary") ?? "").trim();
  const packageNote = String(formData.get("packageNote") ?? "").trim();
  const heroNote = String(formData.get("heroNote") ?? "").trim();
  const price = normalizePrice(String(formData.get("price") ?? ""));

  if (!username || !name || !location || !imageAlt || niche.length === 0 || !summary || !packageNote || !heroNote) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "missing-fields" }), 303);
  }

  if (!/^[a-z0-9-]+$/.test(username)) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "invalid-username" }), 303);
  }

  if (!/^https?:\/\//.test(imageUrl)) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "invalid-image-url" }), 303);
  }

  if (!price) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "invalid-price" }), 303);
  }

  const result = upsertCreatorRecordForAuthUser({
    authUserId: currentUser.id,
    username,
    name,
    imageUrl,
    imageAlt,
    location,
    niche,
    price,
    summary,
    packageNote,
    heroNote,
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, { status: result.claimed ? "claimed" : result.created ? "created" : "updated" }), 303);
}