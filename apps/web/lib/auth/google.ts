import { randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import serverEnv, { hasGoogleAuthConfig } from "../env/server";

const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CONTEXT_COOKIE = "reachfyp_google_oauth";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleAuthFlow = "creator" | "brand";

export type GoogleAuthContext = {
  state: string;
  nonce: string;
  flow: GoogleAuthFlow;
  redirectTo: string;
  reservedCreatorUsername?: string | null;
};

function getGoogleCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}

function encodeContext(context: GoogleAuthContext) {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

function decodeContext(rawValue: string) {
  try {
    return JSON.parse(Buffer.from(rawValue, "base64url").toString("utf8")) as GoogleAuthContext;
  } catch {
    return null;
  }
}

export async function readGoogleAuthContext() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(GOOGLE_CONTEXT_COOKIE)?.value;

  return rawValue ? decodeContext(rawValue) : null;
}

export function attachGoogleAuthContext(response: NextResponse, context: GoogleAuthContext) {
  response.cookies.set(GOOGLE_CONTEXT_COOKIE, encodeContext(context), getGoogleCookieOptions());
  return response;
}

export function clearGoogleAuthContext(response: NextResponse) {
  response.cookies.set(GOOGLE_CONTEXT_COOKIE, "", { ...getGoogleCookieOptions(), maxAge: 0 });
  return response;
}

export function createGoogleAuthContext(flow: GoogleAuthFlow, redirectTo: string, reservedCreatorUsername?: string | null): GoogleAuthContext {
  return {
    state: randomBytes(16).toString("hex"),
    nonce: randomBytes(16).toString("hex"),
    flow,
    redirectTo,
    reservedCreatorUsername,
  };
}

export function getGoogleAuthorizationUrl(context: GoogleAuthContext) {
  const params = new URLSearchParams({
    client_id: serverEnv.googleClientId,
    redirect_uri: serverEnv.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: context.state,
    nonce: context.nonce,
    prompt: "select_account",
  });

  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: serverEnv.googleClientId,
    client_secret: serverEnv.googleClientSecret,
    redirect_uri: serverEnv.googleRedirectUri,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("google-token-exchange-failed");
  }

  return response.json() as Promise<{ id_token?: string }>;
}

export async function verifyGoogleIdToken(idToken: string, nonce: string) {
  const verification = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: [GOOGLE_ISSUER, "accounts.google.com"],
    audience: serverEnv.googleClientId,
  });

  if (verification.payload.nonce !== nonce) {
    throw new Error("google-nonce-mismatch");
  }

  return verification.payload;
}

export function getGoogleDisplayName(name: string | undefined, email: string, flow: GoogleAuthFlow) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return email.split("@")[0] || (flow === "brand" ? "Brand user" : "Creator user");
}

export function isGoogleAuthReady() {
  return hasGoogleAuthConfig();
}