import { resetPasswordWithToken } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    const redirectUrl = new URL("/auth/reset-password", request.url);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("error", "password-mismatch");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const result = await resetPasswordWithToken(token, password);

  if (!result.ok) {
    const redirectUrl = new URL("/auth/reset-password", request.url);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("error", result.error);
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.redirect(new URL("/auth?status=password-reset", request.url), 303);
}