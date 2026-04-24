import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, destroyCurrentSession } from "../../../lib/auth/session";

export async function POST(request: NextRequest) {
  await destroyCurrentSession();

  const response = NextResponse.redirect(new URL("/auth?status=signed-out", request.url), 303);
  return clearSessionCookie(response);
}