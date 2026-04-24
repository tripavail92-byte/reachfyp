const reachfypTableStatements = [
  `CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    auth_user_id TEXT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_alt TEXT NOT NULL,
    location TEXT NOT NULL,
    niche_json TEXT NOT NULL,
    badges_json TEXT NOT NULL,
    authenticity INTEGER NOT NULL,
    performance INTEGER NOT NULL,
    audience_quality INTEGER NOT NULL,
    growth_signal TEXT NOT NULL,
    delivery_quality TEXT NOT NULL,
    rating REAL NOT NULL,
    price TEXT NOT NULL,
    summary TEXT NOT NULL,
    package_note TEXT NOT NULL,
    hero_note TEXT NOT NULL,
    packages_json TEXT NOT NULL,
    social_accounts_json TEXT NOT NULL,
    portfolio_json TEXT NOT NULL,
    reviews_json TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    reserved_creator_username TEXT,
    apple_subject TEXT,
    google_subject TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified_at TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS auth_email_verification_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS instant_hires (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    brand_user_id TEXT NOT NULL,
    creator_username TEXT NOT NULL,
    creator_name TEXT NOT NULL,
    package_title TEXT NOT NULL,
    package_price TEXT NOT NULL,
    agreed_price TEXT NOT NULL,
    delivery_deadline TEXT NOT NULL,
    brief TEXT NOT NULL,
    hire_type TEXT NOT NULL,
    status TEXT NOT NULL,
    escrow_status TEXT NOT NULL,
    tracking_link TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    participant_ids_json TEXT NOT NULL,
    last_message_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS deliverables (
    id TEXT PRIMARY KEY,
    hire_id TEXT NOT NULL,
    creator_user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    file_urls_json TEXT NOT NULL,
    external_url TEXT NOT NULL,
    notes TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    review_feedback TEXT,
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    approved_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls_json TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS wallet_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    balance REAL NOT NULL,
    held_balance REAL NOT NULL,
    currency TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    reference_type TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS payout_requests (
    id TEXT PRIMARY KEY,
    creator_user_id TEXT NOT NULL,
    wallet_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    admin_note TEXT,
    created_at TEXT NOT NULL,
    reviewed_at TEXT
  )`,
] as const;

const reachfypIndexStatements = [
  "CREATE UNIQUE INDEX IF NOT EXISTS auth_users_reserved_creator_username_idx ON auth_users(reserved_creator_username)",
  "CREATE UNIQUE INDEX IF NOT EXISTS auth_users_apple_subject_idx ON auth_users(apple_subject)",
  "CREATE UNIQUE INDEX IF NOT EXISTS auth_users_google_subject_idx ON auth_users(google_subject)",
  "CREATE INDEX IF NOT EXISTS auth_password_reset_tokens_user_id_idx ON auth_password_reset_tokens(user_id)",
  "CREATE INDEX IF NOT EXISTS auth_email_verification_tokens_user_id_idx ON auth_email_verification_tokens(user_id)",
] as const;

export const reachfypBootstrapStatements = [...reachfypTableStatements, ...reachfypIndexStatements] as const;

export async function ensureReachfypBaseSchema(database: { exec: (sql: string) => Promise<unknown> | unknown }) {
  for (const statement of reachfypBootstrapStatements) {
    await database.exec(statement);
  }
}

export function getReachfypPostgresBootstrapSql() {
  return `${reachfypBootstrapStatements.join(";\n\n")};\n`;
}