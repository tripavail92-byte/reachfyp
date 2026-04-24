import { jwtVerify, createRemoteJWKSet, importPKCS8, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import serverEnv, { hasAppleAuthConfig } from "../env/server";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_AUTHORIZE_URL = `${APPLE_ISSUER}/auth/authorize`;
const APPLE_TOKEN_URL = `${APPLE_ISSUER}/auth/token`;
const APPLE_CONTEXT_COOKIE = "reachfyp_apple_oauth";
const APPLE_JWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

export type AppleAuthFlow = "creator" | "brand";

export type AppleAuthContext = {
  state: string;
  nonce: string;
  flow: AppleAuthFlow;
  redirectTo: string;
  reservedCreatorUsername?: string | null;
};

type AppleUserPayload = {
  name?: {
    firstName?: string;
    lastName?: string;
  };
};

function getAppleCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}

function encodeContext(context: AppleAuthContext) {
  return Buffer.from(JSON.stringify(context), "utf8").toString("base64url");
}

function decodeContext(rawValue: string) {
  try {
    return JSON.parse(Buffer.from(rawValue, "base64url").toString("utf8")) as AppleAuthContext;
  } catch {
    return null;
  }
}

export async function readAppleAuthContext() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(APPLE_CONTEXT_COOKIE)?.value;

  return rawValue ? decodeContext(rawValue) : null;
}

export function attachAppleAuthContext(response: NextResponse, context: AppleAuthContext) {
  response.cookies.set(APPLE_CONTEXT_COOKIE, encodeContext(context), getAppleCookieOptions());
  return response;
}

export function clearAppleAuthContext(response: NextResponse) {
  response.cookies.set(APPLE_CONTEXT_COOKIE, "", { ...getAppleCookieOptions(), maxAge: 0 });
  return response;
}

export function getAppleAuthorizationUrl(context: AppleAuthContext) {
  const params = new URLSearchParams({
    client_id: serverEnv.appleClientId,
    redirect_uri: serverEnv.appleRedirectUri,
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state: context.state,
    nonce: context.nonce,
  });

  return `${APPLE_AUTHORIZE_URL}?${params.toString()}`;
}

async function createAppleClientSecret() {
  const signingKey = await importPKCS8(serverEnv.applePrivateKey, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: serverEnv.appleKeyId })
    .setIssuer(serverEnv.appleTeamId)
    .setSubject(serverEnv.appleClientId)
    .setAudience(APPLE_ISSUER)
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(signingKey);
}

export async function exchangeAppleAuthorizationCode(code: string) {
  const clientSecret = await createAppleClientSecret();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: serverEnv.appleClientId,
    client_secret: clientSecret,
    redirect_uri: serverEnv.appleRedirectUri,
  });

  const response = await fetch(APPLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("apple-token-exchange-failed");
  }

  return response.json() as Promise<{ id_token?: string }>;
}

export async function verifyAppleIdToken(idToken: string, nonce: string) {
  const verification = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: serverEnv.appleClientId,
  });

  if (verification.payload.nonce !== nonce) {
    throw new Error("apple-nonce-mismatch");
  }

  return verification.payload;
}

export function getAppleDisplayName(flow: AppleAuthFlow, email: string, userPayload?: AppleUserPayload | null) {
  const firstName = userPayload?.name?.firstName?.trim();
  const lastName = userPayload?.name?.lastName?.trim();

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  if (flow === "brand") {
    return email.split("@")[0] || "Brand user";
  }

  return email.split("@")[0] || "Creator user";
}

export function parseAppleUserPayload(rawUser: string | null) {
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AppleUserPayload;
  } catch {
    return null;
  }
}

export function isAppleAuthReady() {
  return hasAppleAuthConfig();
}