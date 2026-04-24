import { createAuthSession, deleteAuthSession, getAuthUserBySessionToken } from "@reachfyp/api";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "reachfyp_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentSessionUser() {
  const sessionToken = await getCurrentSessionToken();

  if (!sessionToken) {
    return null;
  }

  return getAuthUserBySessionToken(sessionToken);
}

export function attachSessionCookie(response: NextResponse, userId: string) {
  const sessionToken = createAuthSession(userId);
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}

export async function destroyCurrentSession() {
  const sessionToken = await getCurrentSessionToken();

  if (sessionToken) {
    deleteAuthSession(sessionToken);
  }
}