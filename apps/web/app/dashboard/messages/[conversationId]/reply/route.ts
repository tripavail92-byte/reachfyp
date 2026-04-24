import { postMessageToConversation } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../../lib/auth/session";

function getRedirectUrl(request: NextRequest, conversationId: string, params: Record<string, string>) {
  const redirectUrl = new URL(`/dashboard/messages/${conversationId}`, request.url);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return redirectUrl;
}

export async function POST(request: NextRequest, context: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await context.params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL(`/auth?mode=sign-in&redirectTo=${encodeURIComponent(`/dashboard/messages/${conversationId}`)}`, request.url), 303);
  }

  const formData = await request.formData();
  const content = String(formData.get("content") ?? "").trim();
  const result = postMessageToConversation({
    conversationId,
    senderId: currentUser.id,
    content,
  });

  if (!result.ok) {
    return NextResponse.redirect(getRedirectUrl(request, conversationId, { error: result.error }), 303);
  }

  return NextResponse.redirect(getRedirectUrl(request, conversationId, { status: "sent" }), 303);
}