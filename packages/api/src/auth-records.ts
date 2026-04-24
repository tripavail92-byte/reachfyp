import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { getReachfypDatabase } from "./creator-database";

export type AuthUserRole = "brand" | "creator" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  companyName?: string | null;
  reservedCreatorUsername?: string | null;
  appleSubject?: string | null;
  googleSubject?: string | null;
  email: string;
  emailVerifiedAt?: string | null;
  role: AuthUserRole;
  createdAt: string;
};

type AuthUserRow = {
  id: string;
  name: string;
  company_name: string | null;
  reserved_creator_username: string | null;
  apple_subject: string | null;
  google_subject: string | null;
  email: string;
  email_verified_at: string | null;
  password_hash: string;
  role: AuthUserRole;
  created_at: string;
};

type AuthSessionRow = {
  user_id: string;
  expires_at: string;
};

type AuthOneTimeTokenRow = {
  user_id: string;
  expires_at: string;
  used_at: string | null;
};

type RegisterAuthUserInput = {
  name: string;
  companyName?: string | null;
  reservedCreatorUsername?: string | null;
  email: string;
  password: string;
  role: AuthUserRole;
};

type CreateAppleAuthUserInput = {
  appleSubject: string;
  email: string;
  name: string;
  role: AuthUserRole;
  companyName?: string | null;
  reservedCreatorUsername?: string | null;
};

type CreateGoogleAuthUserInput = {
  googleSubject: string;
  email: string;
  name: string;
  role: AuthUserRole;
  companyName?: string | null;
  reservedCreatorUsername?: string | null;
};

function getAuthDatabase() {
  const database = getReachfypDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company_name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified_at TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  const authUserColumns = database.prepare("PRAGMA table_info(auth_users)").all() as Array<{ name: string }>;

  if (!authUserColumns.some((column) => column.name === "company_name")) {
    database.exec("ALTER TABLE auth_users ADD COLUMN company_name TEXT");
  }

  if (!authUserColumns.some((column) => column.name === "reserved_creator_username")) {
    database.exec("ALTER TABLE auth_users ADD COLUMN reserved_creator_username TEXT");
  }

  if (!authUserColumns.some((column) => column.name === "apple_subject")) {
    database.exec("ALTER TABLE auth_users ADD COLUMN apple_subject TEXT");
  }

  if (!authUserColumns.some((column) => column.name === "google_subject")) {
    database.exec("ALTER TABLE auth_users ADD COLUMN google_subject TEXT");
  }

  if (!authUserColumns.some((column) => column.name === "email_verified_at")) {
    database.exec("ALTER TABLE auth_users ADD COLUMN email_verified_at TEXT");
  }

  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS auth_users_reserved_creator_username_idx ON auth_users(reserved_creator_username)");
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS auth_users_apple_subject_idx ON auth_users(apple_subject)");
  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS auth_users_google_subject_idx ON auth_users(google_subject)");

  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS auth_email_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    )
  `);

  database.exec("CREATE INDEX IF NOT EXISTS auth_password_reset_tokens_user_id_idx ON auth_password_reset_tokens(user_id)");
  database.exec("CREATE INDEX IF NOT EXISTS auth_email_verification_tokens_user_id_idx ON auth_email_verification_tokens(user_id)");

  return database;
}

function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    reservedCreatorUsername: row.reserved_creator_username,
    appleSubject: row.apple_subject,
    googleSubject: row.google_subject,
    email: row.email,
    emailVerifiedAt: row.email_verified_at,
    role: row.role,
    createdAt: row.created_at,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCreatorUsername(rawUsername: string) {
  return rawUsername
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const expectedHash = Buffer.from(hash, "hex");
  const candidateHash = scryptSync(password, salt, expectedHash.length);

  return timingSafeEqual(expectedHash, candidateHash);
}

function hashSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}

function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function clearExpiredSessions() {
  getAuthDatabase().prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

function clearExpiredOneTimeTokens() {
  const now = new Date().toISOString();
  getAuthDatabase().prepare("DELETE FROM auth_password_reset_tokens WHERE expires_at <= ?").run(now);
  getAuthDatabase().prepare("DELETE FROM auth_email_verification_tokens WHERE expires_at <= ?").run(now);
}

function getUserRowByEmail(email: string) {
  return getAuthDatabase()
    .prepare("SELECT * FROM auth_users WHERE email = ?")
    .get(normalizeEmail(email)) as AuthUserRow | undefined;
}

function getUserRowByAppleSubject(appleSubject: string) {
  return getAuthDatabase().prepare("SELECT * FROM auth_users WHERE apple_subject = ?").get(appleSubject) as AuthUserRow | undefined;
}

function getUserRowByGoogleSubject(googleSubject: string) {
  return getAuthDatabase().prepare("SELECT * FROM auth_users WHERE google_subject = ?").get(googleSubject) as AuthUserRow | undefined;
}

function getUserRowByReservedCreatorUsername(username: string) {
  return getAuthDatabase()
    .prepare("SELECT * FROM auth_users WHERE reserved_creator_username = ?")
    .get(username) as AuthUserRow | undefined;
}

function getUserRowById(userId: string) {
  return getAuthDatabase().prepare("SELECT * FROM auth_users WHERE id = ?").get(userId) as AuthUserRow | undefined;
}

function deleteSessionsForUser(userId: string) {
  getAuthDatabase().prepare("DELETE FROM auth_sessions WHERE user_id = ?").run(userId);
}

function invalidatePasswordResetTokensForUser(userId: string) {
  getAuthDatabase().prepare("DELETE FROM auth_password_reset_tokens WHERE user_id = ?").run(userId);
}

function invalidateEmailVerificationTokensForUser(userId: string) {
  getAuthDatabase().prepare("DELETE FROM auth_email_verification_tokens WHERE user_id = ?").run(userId);
}

function issueOneTimeToken(tableName: "auth_password_reset_tokens" | "auth_email_verification_tokens", userId: string, ttlMs: number) {
  clearExpiredOneTimeTokens();

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

  getAuthDatabase()
    .prepare(
      `INSERT INTO ${tableName} (token_hash, user_id, expires_at, created_at, used_at)
       VALUES (?, ?, ?, ?, NULL)`
    )
    .run(tokenHash, userId, expiresAt, now.toISOString());

  return token;
}

function getValidOneTimeTokenRow(tableName: "auth_password_reset_tokens" | "auth_email_verification_tokens", token: string) {
  clearExpiredOneTimeTokens();

  const row = getAuthDatabase()
    .prepare(`SELECT user_id, expires_at, used_at FROM ${tableName} WHERE token_hash = ?`)
    .get(hashOpaqueToken(token)) as AuthOneTimeTokenRow | undefined;

  if (!row || row.used_at || row.expires_at <= new Date().toISOString()) {
    return null;
  }

  return row;
}

function markOneTimeTokenUsed(tableName: "auth_password_reset_tokens" | "auth_email_verification_tokens", token: string) {
  getAuthDatabase()
    .prepare(`UPDATE ${tableName} SET used_at = ? WHERE token_hash = ?`)
    .run(new Date().toISOString(), hashOpaqueToken(token));
}

function validateReservedCreatorUsername(rawUsername: string | null | undefined, userId?: string) {
  const username = normalizeCreatorUsername(rawUsername ?? "");

  if (!rawUsername) {
    return { ok: true as const, username: null };
  }

  if (!username || !/^[a-z0-9-]+$/.test(username)) {
    return { ok: false as const, error: "invalid-username" as const };
  }

  const creatorRow = getReachfypDatabase()
    .prepare("SELECT auth_user_id FROM creators WHERE username = ? LIMIT 1")
    .get(username) as { auth_user_id: string | null } | undefined;

  if (creatorRow && creatorRow.auth_user_id !== userId) {
    return { ok: false as const, error: "creator-username-unavailable" as const };
  }

  const reservedBy = getUserRowByReservedCreatorUsername(username);

  if (reservedBy && reservedBy.id !== userId) {
    return { ok: false as const, error: "creator-username-unavailable" as const };
  }

  return { ok: true as const, username };
}

function createStoredAuthUser(input: {
  name: string;
  companyName?: string | null;
  reservedCreatorUsername?: string | null;
  email: string;
  emailVerifiedAt?: string | null;
  passwordHash: string;
  role: AuthUserRole;
  appleSubject?: string | null;
  googleSubject?: string | null;
}) {
  const now = new Date().toISOString();
  const userId = randomUUID();

  getAuthDatabase()
    .prepare(
      `INSERT INTO auth_users (id, name, company_name, reserved_creator_username, apple_subject, google_subject, email, email_verified_at, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      input.name,
      input.companyName ?? null,
      input.reservedCreatorUsername ?? null,
      input.appleSubject ?? null,
      input.googleSubject ?? null,
      input.email,
      input.emailVerifiedAt ?? null,
      input.passwordHash,
      input.role,
      now,
    );

  return getUserRowById(userId);
}

export function listAuthUsersByRole(role: AuthUserRole) {
  return (getAuthDatabase().prepare("SELECT * FROM auth_users WHERE role = ? ORDER BY created_at ASC").all(role) as AuthUserRow[]).map(toAuthUser);
}

export function listReservedCreatorUsernames() {
  return (getAuthDatabase()
    .prepare("SELECT reserved_creator_username FROM auth_users WHERE reserved_creator_username IS NOT NULL ORDER BY reserved_creator_username ASC")
    .all() as Array<{ reserved_creator_username: string }>).map((row) => row.reserved_creator_username);
}

export function registerAuthUser(input: RegisterAuthUserInput) {
  const name = input.name.trim();
  const companyName = input.companyName?.trim() || null;
  const email = normalizeEmail(input.email);
  const password = input.password;
  const reservedUsernameCheck = input.role === "creator" ? validateReservedCreatorUsername(input.reservedCreatorUsername) : { ok: true as const, username: null };

  if (name.length < 2) {
    return { ok: false as const, error: "name-too-short" as const };
  }

  if (!reservedUsernameCheck.ok) {
    return reservedUsernameCheck;
  }

  if (!email.includes("@")) {
    return { ok: false as const, error: "invalid-email" as const };
  }

  if (password.length < 8) {
    return { ok: false as const, error: "password-too-short" as const };
  }

  if (getUserRowByEmail(email)) {
    return { ok: false as const, error: "email-in-use" as const };
  }

  const createdUser = createStoredAuthUser({
    name,
    companyName,
    reservedCreatorUsername: reservedUsernameCheck.username,
    email,
    passwordHash: hashPassword(password),
    role: input.role,
  });

  if (!createdUser) {
    return { ok: false as const, error: "registration-failed" as const };
  }

  return { ok: true as const, user: toAuthUser(createdUser) };
}

export function createPasswordResetRequest(email: string) {
  const user = getUserRowByEmail(email);

  if (!user) {
    return { ok: true as const, issued: false as const, token: null };
  }

  invalidatePasswordResetTokensForUser(user.id);

  return {
    ok: true as const,
    issued: true as const,
    token: issueOneTimeToken("auth_password_reset_tokens", user.id, 1000 * 60 * 30),
  };
}

export function resetPasswordWithToken(token: string, password: string) {
  if (password.length < 8) {
    return { ok: false as const, error: "password-too-short" as const };
  }

  const tokenRow = getValidOneTimeTokenRow("auth_password_reset_tokens", token);

  if (!tokenRow) {
    return { ok: false as const, error: "invalid-reset-token" as const };
  }

  const user = getUserRowById(tokenRow.user_id);

  if (!user) {
    return { ok: false as const, error: "invalid-reset-token" as const };
  }

  getAuthDatabase().prepare("UPDATE auth_users SET password_hash = ? WHERE id = ?").run(hashPassword(password), user.id);
  markOneTimeTokenUsed("auth_password_reset_tokens", token);
  invalidatePasswordResetTokensForUser(user.id);
  deleteSessionsForUser(user.id);

  const nextUser = getUserRowById(user.id);
  return nextUser ? { ok: true as const, user: toAuthUser(nextUser) } : { ok: false as const, error: "invalid-reset-token" as const };
}

export function createEmailVerificationRequestForUser(userId: string) {
  const user = getUserRowById(userId);

  if (!user) {
    return { ok: false as const, error: "invalid-user" as const };
  }

  if (user.email_verified_at) {
    return { ok: true as const, issued: false as const, alreadyVerified: true as const, token: null };
  }

  invalidateEmailVerificationTokensForUser(user.id);

  return {
    ok: true as const,
    issued: true as const,
    alreadyVerified: false as const,
    token: issueOneTimeToken("auth_email_verification_tokens", user.id, 1000 * 60 * 60 * 24),
  };
}

export function verifyEmailWithToken(token: string) {
  const tokenRow = getValidOneTimeTokenRow("auth_email_verification_tokens", token);

  if (!tokenRow) {
    return { ok: false as const, error: "invalid-verification-token" as const };
  }

  const user = getUserRowById(tokenRow.user_id);

  if (!user) {
    return { ok: false as const, error: "invalid-verification-token" as const };
  }

  getAuthDatabase().prepare("UPDATE auth_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?").run(new Date().toISOString(), user.id);
  markOneTimeTokenUsed("auth_email_verification_tokens", token);
  invalidateEmailVerificationTokensForUser(user.id);

  const nextUser = getUserRowById(user.id);
  return nextUser ? { ok: true as const, user: toAuthUser(nextUser) } : { ok: false as const, error: "invalid-verification-token" as const };
}

export function upsertAppleAuthUser(input: CreateAppleAuthUserInput) {
  const appleSubject = input.appleSubject.trim();
  const email = normalizeEmail(input.email);
  const verifiedAt = new Date().toISOString();
  const reservedUsernameCheck = input.role === "creator" ? validateReservedCreatorUsername(input.reservedCreatorUsername) : { ok: true as const, username: null };

  if (!appleSubject || !email.includes("@")) {
    return { ok: false as const, error: "invalid-credentials" as const };
  }

  if (!reservedUsernameCheck.ok) {
    return reservedUsernameCheck;
  }

  const existingByApple = getUserRowByAppleSubject(appleSubject);

  if (existingByApple) {
    if (existingByApple.role !== input.role) {
      return { ok: false as const, error: "provider-role-mismatch" as const };
    }

    if (reservedUsernameCheck.username && existingByApple.reserved_creator_username !== reservedUsernameCheck.username) {
      getAuthDatabase()
        .prepare("UPDATE auth_users SET reserved_creator_username = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
        .run(reservedUsernameCheck.username, verifiedAt, existingByApple.id);
    } else {
      getAuthDatabase().prepare("UPDATE auth_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?").run(verifiedAt, existingByApple.id);
    }

    const nextUser = getUserRowById(existingByApple.id);
    return nextUser ? { ok: true as const, user: toAuthUser(nextUser), created: false as const } : { ok: false as const, error: "registration-failed" as const };
  }

  const existingByEmail = getUserRowByEmail(email);

  if (existingByEmail) {
    if (existingByEmail.role !== input.role) {
      return { ok: false as const, error: "provider-role-mismatch" as const };
    }

    getAuthDatabase()
      .prepare("UPDATE auth_users SET apple_subject = ?, reserved_creator_username = COALESCE(?, reserved_creator_username), email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
      .run(appleSubject, reservedUsernameCheck.username, verifiedAt, existingByEmail.id);

    const nextUser = getUserRowById(existingByEmail.id);
    return nextUser ? { ok: true as const, user: toAuthUser(nextUser), created: false as const } : { ok: false as const, error: "registration-failed" as const };
  }

  const createdUser = createStoredAuthUser({
    name: input.name.trim() || email.split("@")[0] || "Apple user",
    companyName: input.companyName?.trim() || null,
    reservedCreatorUsername: reservedUsernameCheck.username,
    email,
    emailVerifiedAt: verifiedAt,
    passwordHash: hashPassword(randomBytes(32).toString("hex")),
    role: input.role,
    appleSubject,
  });

  if (!createdUser) {
    return { ok: false as const, error: "registration-failed" as const };
  }

  return { ok: true as const, user: toAuthUser(createdUser), created: true as const };
}

export function upsertGoogleAuthUser(input: CreateGoogleAuthUserInput) {
  const googleSubject = input.googleSubject.trim();
  const email = normalizeEmail(input.email);
  const verifiedAt = new Date().toISOString();
  const reservedUsernameCheck = input.role === "creator" ? validateReservedCreatorUsername(input.reservedCreatorUsername) : { ok: true as const, username: null };

  if (!googleSubject || !email.includes("@")) {
    return { ok: false as const, error: "invalid-credentials" as const };
  }

  if (!reservedUsernameCheck.ok) {
    return reservedUsernameCheck;
  }

  const existingByGoogle = getUserRowByGoogleSubject(googleSubject);

  if (existingByGoogle) {
    if (existingByGoogle.role !== input.role) {
      return { ok: false as const, error: "provider-role-mismatch" as const };
    }

    if (reservedUsernameCheck.username && existingByGoogle.reserved_creator_username !== reservedUsernameCheck.username) {
      getAuthDatabase()
        .prepare("UPDATE auth_users SET reserved_creator_username = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
        .run(reservedUsernameCheck.username, verifiedAt, existingByGoogle.id);
    } else {
      getAuthDatabase().prepare("UPDATE auth_users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?").run(verifiedAt, existingByGoogle.id);
    }

    const nextUser = getUserRowById(existingByGoogle.id);
    return nextUser ? { ok: true as const, user: toAuthUser(nextUser), created: false as const } : { ok: false as const, error: "registration-failed" as const };
  }

  const existingByEmail = getUserRowByEmail(email);

  if (existingByEmail) {
    if (existingByEmail.role !== input.role) {
      return { ok: false as const, error: "provider-role-mismatch" as const };
    }

    getAuthDatabase()
      .prepare("UPDATE auth_users SET google_subject = ?, reserved_creator_username = COALESCE(?, reserved_creator_username), email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
      .run(googleSubject, reservedUsernameCheck.username, verifiedAt, existingByEmail.id);

    const nextUser = getUserRowById(existingByEmail.id);
    return nextUser ? { ok: true as const, user: toAuthUser(nextUser), created: false as const } : { ok: false as const, error: "registration-failed" as const };
  }

  const createdUser = createStoredAuthUser({
    name: input.name.trim() || email.split("@")[0] || "Google user",
    companyName: input.companyName?.trim() || null,
    reservedCreatorUsername: reservedUsernameCheck.username,
    email,
    emailVerifiedAt: verifiedAt,
    passwordHash: hashPassword(randomBytes(32).toString("hex")),
    role: input.role,
    googleSubject,
  });

  if (!createdUser) {
    return { ok: false as const, error: "registration-failed" as const };
  }

  return { ok: true as const, user: toAuthUser(createdUser), created: true as const };
}

export function clearReservedCreatorUsername(userId: string) {
  getAuthDatabase().prepare("UPDATE auth_users SET reserved_creator_username = NULL WHERE id = ?").run(userId);
}

export function authenticateAuthUser(email: string, password: string) {
  const user = getUserRowByEmail(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return toAuthUser(user);
}

export function createAuthSession(userId: string) {
  clearExpiredSessions();

  const sessionToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(sessionToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString();

  getAuthDatabase()
    .prepare(
      `INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(tokenHash, userId, expiresAt, now.toISOString());

  return sessionToken;
}

export function getAuthUserBySessionToken(sessionToken: string) {
  clearExpiredSessions();

  const session = getAuthDatabase()
    .prepare("SELECT user_id, expires_at FROM auth_sessions WHERE token_hash = ?")
    .get(hashSessionToken(sessionToken)) as AuthSessionRow | undefined;

  if (!session || session.expires_at <= new Date().toISOString()) {
    return null;
  }

  const user = getUserRowById(session.user_id);
  return user ? toAuthUser(user) : null;
}

export function deleteAuthSession(sessionToken: string) {
  getAuthDatabase().prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(hashSessionToken(sessionToken));
}

export function deleteAuthSessionsForUser(userId: string) {
  deleteSessionsForUser(userId);
}