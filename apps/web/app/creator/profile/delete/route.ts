import { deleteCreatorRecordForAuthUser } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return NextResponse.redirect(new URL("/auth?mode=register-creator", request.url), 303);
  }

  deleteCreatorRecordForAuthUser(currentUser.id);
  return NextResponse.redirect(new URL("/creator/profile?status=deleted", request.url), 303);
}