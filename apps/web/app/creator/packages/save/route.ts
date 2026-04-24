import { upsertCreatorPackageForAuthUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = new URL("/creator/profile", request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
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
  const originalTitle = String(formData.get("originalTitle") ?? "").trim() || undefined;
  const title = String(formData.get("title") ?? "").trim();
  const turnaround = String(formData.get("turnaround") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const price = normalizePrice(String(formData.get("price") ?? ""));

  if (!title || !turnaround || !details) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "missing-package-fields" }), 303);
  }

  if (!price) {
    return NextResponse.redirect(getRedirectUrl(request, { error: "invalid-package-price" }), 303);
  }

  const result = upsertCreatorPackageForAuthUser({
    authUserId: currentUser.id,
    originalTitle,
    title,
    price,
    turnaround,
    details,
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, { status: result.created ? "package-created" : "package-updated" }), 303);
}