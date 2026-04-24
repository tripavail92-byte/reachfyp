import { verifyEmailWithToken } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await verifyEmailWithToken(token);

  if (!result.ok) {
    return NextResponse.redirect(new URL("/auth?error=invalid-verification-token", request.url), 303);
  }

  return NextResponse.redirect(new URL("/auth?status=email-verified", request.url), 303);
}