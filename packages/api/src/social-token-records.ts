import { randomUUID } from "node:crypto";
import { getReachfypDatabase } from "./creator-database";

type SocialTokenRow = {
  id: string;
  creator_auth_user_id: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialToken = {
  id: string;
  creatorAuthUserId: string;
  platform: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  scope: string | null;
  createdAt: string;
  updatedAt: string;
};

function fromTokenRow(row: SocialTokenRow): SocialToken {
  return {
    id: row.id,
    creatorAuthUserId: row.creator_auth_user_id,
    platform: row.platform,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    scope: row.scope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSocialTokenForCreator(
  creatorAuthUserId: string,
  platform: string,
): Promise<SocialToken | null> {
  const db = await getReachfypDatabase();
  const row = await db
    .prepare("SELECT * FROM creator_social_tokens WHERE creator_auth_user_id = ? AND platform = ? LIMIT 1")
    .get<SocialTokenRow>([creatorAuthUserId, platform.toLowerCase()]);
  return row ? fromTokenRow(row) : null;
}

export async function upsertSocialTokenForCreator(input: {
  creatorAuthUserId: string;
  platform: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  scope?: string | null;
}): Promise<SocialToken> {
  const db = await getReachfypDatabase();
  const now = new Date().toISOString();
  const platform = input.platform.toLowerCase();

  const existing = await db
    .prepare("SELECT id FROM creator_social_tokens WHERE creator_auth_user_id = ? AND platform = ? LIMIT 1")
    .get<{ id: string }>([input.creatorAuthUserId, platform]);

  if (existing) {
    await db.prepare(
      "UPDATE creator_social_tokens SET access_token = ?, refresh_token = ?, token_expires_at = ?, scope = ?, updated_at = ? WHERE id = ?"
    ).run([
      input.accessToken,
      input.refreshToken ?? null,
      input.tokenExpiresAt ?? null,
      input.scope ?? null,
      now,
      existing.id,
    ]);

    return fromTokenRow({
      id: existing.id,
      creator_auth_user_id: input.creatorAuthUserId,
      platform,
      access_token: input.accessToken,
      refresh_token: input.refreshToken ?? null,
      token_expires_at: input.tokenExpiresAt ?? null,
      scope: input.scope ?? null,
      created_at: now,
      updated_at: now,
    });
  }

  const id = randomUUID();
  const row: SocialTokenRow = {
    id,
    creator_auth_user_id: input.creatorAuthUserId,
    platform,
    access_token: input.accessToken,
    refresh_token: input.refreshToken ?? null,
    token_expires_at: input.tokenExpiresAt ?? null,
    scope: input.scope ?? null,
    created_at: now,
    updated_at: now,
  };

  await db.prepare(`
    INSERT INTO creator_social_tokens (
      id, creator_auth_user_id, platform, access_token, refresh_token,
      token_expires_at, scope, created_at, updated_at
    ) VALUES (
      :id, :creator_auth_user_id, :platform, :access_token, :refresh_token,
      :token_expires_at, :scope, :created_at, :updated_at
    )
  `).run(row);

  return fromTokenRow(row);
}

export async function deleteSocialTokenForCreator(
  creatorAuthUserId: string,
  platform: string,
): Promise<void> {
  const db = await getReachfypDatabase();
  await db
    .prepare("DELETE FROM creator_social_tokens WHERE creator_auth_user_id = ? AND platform = ?")
    .run([creatorAuthUserId, platform.toLowerCase()]);
}
