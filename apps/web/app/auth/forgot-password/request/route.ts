import { createPasswordResetRequest } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const result = createPasswordResetRequest(email);
  const redirectUrl = new URL("/auth/forgot-password?status=reset-requested", request.url);

  if (process.env.NODE_ENV !== "production" && result.token) {
    redirectUrl.searchParams.set("devResetToken", result.token);
  }

  return NextResponse.redirect(redirectUrl, 303);
}