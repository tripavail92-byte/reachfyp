import { submitDeliverableForHire } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, hireId: string, params: Record<string, string>) {
  const redirectUrl = new URL(`/creator/hires/${hireId}`, request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

function normalizeFileUrls(rawValue: string) {
  return rawValue
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest, context: { params: Promise<{ hireId: string }> }) {
  const { hireId } = await context.params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const fileUrls = normalizeFileUrls(String(formData.get("fileUrls") ?? ""));

  const result = await submitDeliverableForHire({
    hireId,
    creatorUserId: currentUser.id,
    title,
    description,
    externalUrl,
    notes,
    fileUrls,
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, hireId, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, hireId, { status: "submitted" }), 303);
}