import { markAllNotificationsRead, markNotificationRead } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/auth?mode=sign-in", request.url), 303);
  }

  const formData = await request.formData();
  const notificationId = String(formData.get("notificationId") ?? "").trim();

  if (notificationId) {
    markNotificationRead(notificationId, currentUser.id);
    return NextResponse.redirect(new URL("/dashboard/notifications?status=read", request.url), 303);
  }

  markAllNotificationsRead(currentUser.id);
  return NextResponse.redirect(new URL("/dashboard/notifications?status=read-all", request.url), 303);
}