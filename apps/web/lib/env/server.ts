function normalizeMultilineSecret(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const serverEnv = {
  appUrl,
  appleClientId: process.env.APPLE_CLIENT_ID ?? "",
  appleTeamId: process.env.APPLE_TEAM_ID ?? "",
  appleKeyId: process.env.APPLE_KEY_ID ?? "",
  applePrivateKey: normalizeMultilineSecret(process.env.APPLE_PRIVATE_KEY ?? ""),
  appleRedirectUri: process.env.APPLE_REDIRECT_URI ?? `${appUrl}/auth/apple/callback`,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? `${appUrl}/auth/google/callback`,
} as const;

export function hasAppleAuthConfig() {
  return Boolean(
    serverEnv.appleClientId && serverEnv.appleTeamId && serverEnv.appleKeyId && serverEnv.applePrivateKey && serverEnv.appleRedirectUri,
  );
}

export function hasGoogleAuthConfig() {
  return Boolean(serverEnv.googleClientId && serverEnv.googleClientSecret && serverEnv.googleRedirectUri);
}

export default serverEnv;