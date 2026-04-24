import { createPasswordResetRequest } from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "../../../../lib/mailer/auth-mailer";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const result = await createPasswordResetRequest(email);
  const redirectUrl = new URL("/auth/forgot-password?status=reset-requested", request.url);

  if (result.token) {
    try {
      const delivery = await sendPasswordResetEmail(email, result.token);

      if (delivery.previewToken) {
        redirectUrl.searchParams.set("devResetToken", delivery.previewToken);
      }
    } catch (error) {
      console.error("Failed to send password reset email", error);
    }
  }

  return NextResponse.redirect(redirectUrl, 303);
}