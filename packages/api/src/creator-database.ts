import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import type { CreatorPackage, CreatorRecord, CreatorSocialAccount } from "./creator-records";

export type CreatorProfileUpsertInput = {
  authUserId: string;
  username: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  niche: string[];
  price: string;
  summary: string;
  packageNote: string;
  heroNote: string;
};

export type CreatorPackageUpsertInput = {
  authUserId: string;
  originalTitle?: string;
  title: string;
  price: string;
  turnaround: string;
  details: string;
};

export type CreatorSocialAccountUpsertInput = {
  authUserId: string;
  platform: string;
  handle: string;
  url: string;
  followers: string;
};

type CreatorRow = {
  id: string;
  username: string;
  auth_user_id: string | null;
  name: string;
  image_url: string;
  image_alt: string;
  location: string;
  niche_json: string;
  badges_json: string;
  authenticity: number;
  performance: number;
  audience_quality: number;
  growth_signal: string;
  delivery_quality: string;
  rating: number;
  price: string;
  summary: string;
  package_note: string;
  hero_note: string;
  packages_json: string;
  social_accounts_json: string | null;
  portfolio_json: string;
  reviews_json: string;
};

const packageDirectory = dirname(fileURLToPath(import.meta.url));
const creatorDatabasePath = join(packageDirectory, "..", "data", "creator-records.sqlite");
const creatorColumnDefinitions = [
  { name: "auth_user_id", definition: "TEXT" },
  { name: "social_accounts_json", definition: "TEXT" },
] as const;
const defaultCreatorMetrics = {
  authenticity: 72,
  performance: 70,
  audienceQuality: 71,
  growthSignal: "Creator profile just published",
  deliveryQuality: "Creator setup in progress",
  rating: 4.8,
} as const;

let database: DatabaseSync | null = null;

function ensureCreatorColumns(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(creators)").all() as Array<{ name: string }>;
  const existingColumnNames = new Set(columns.map((column) => column.name));

  creatorColumnDefinitions.forEach((column) => {
    if (!existingColumnNames.has(column.name)) {
      db.exec(`ALTER TABLE creators ADD COLUMN ${column.name} ${column.definition}`);
    }
  });

  db.prepare("UPDATE creators SET social_accounts_json = '[]' WHERE social_accounts_json IS NULL").run();
}

function tableExists(db: DatabaseSync, tableName: string) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1").get(tableName) as { name: string } | undefined;
  return Boolean(row);
}

export function getReachfypDatabase() {
  if (database) {
    return database;
  }

  mkdirSync(dirname(creatorDatabasePath), { recursive: true });

  database = new DatabaseSync(creatorDatabasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS creators (
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
    )
  `);

  ensureCreatorColumns(database);

  return database;
}

function toCreatorRow(creator: CreatorRecord, authUserId: string | null = null): CreatorRow {
  return {
    id: creator.id,
    username: creator.username,
    auth_user_id: authUserId,
    name: creator.name,
    image_url: creator.imageUrl,
    image_alt: creator.imageAlt,
    location: creator.location,
    niche_json: JSON.stringify(creator.niche),
    badges_json: JSON.stringify(creator.badges),
    authenticity: creator.authenticity,
    performance: creator.performance,
    audience_quality: creator.audienceQuality,
    growth_signal: creator.growthSignal,
    delivery_quality: creator.deliveryQuality,
    rating: creator.rating,
    price: creator.price,
    summary: creator.summary,
    package_note: creator.packageNote,
    hero_note: creator.heroNote,
    packages_json: JSON.stringify(creator.packages),
    social_accounts_json: JSON.stringify(creator.socialAccounts),
    portfolio_json: JSON.stringify(creator.portfolio),
    reviews_json: JSON.stringify(creator.reviews),
  };
}

function parseCreatorPackages(rawPackages: string) {
  return JSON.parse(rawPackages) as CreatorPackage[];
}

function parseCreatorSocialAccounts(rawSocialAccounts: string | null) {
  return JSON.parse(rawSocialAccounts ?? "[]") as CreatorSocialAccount[];
}

function fromCreatorRow(row: CreatorRow): CreatorRecord {
  return {
    id: row.id,
    username: row.username,
    authUserId: row.auth_user_id,
    name: row.name,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    location: row.location,
    niche: JSON.parse(row.niche_json),
    badges: JSON.parse(row.badges_json),
    authenticity: row.authenticity,
    performance: row.performance,
    audienceQuality: row.audience_quality,
    growthSignal: row.growth_signal,
    deliveryQuality: row.delivery_quality,
    rating: row.rating,
    price: row.price,
    summary: row.summary,
    packageNote: row.package_note,
    heroNote: row.hero_note,
    packages: parseCreatorPackages(row.packages_json),
    socialAccounts: parseCreatorSocialAccounts(row.social_accounts_json),
    portfolio: JSON.parse(row.portfolio_json),
    reviews: JSON.parse(row.reviews_json),
  };
}

function getUpdateCreatorStatement(db: DatabaseSync) {
  return db.prepare(`
    UPDATE creators
    SET id = :id,
        username = :username,
        auth_user_id = :auth_user_id,
        name = :name,
        image_url = :image_url,
        image_alt = :image_alt,
        location = :location,
        niche_json = :niche_json,
        badges_json = :badges_json,
        authenticity = :authenticity,
        performance = :performance,
        audience_quality = :audience_quality,
        growth_signal = :growth_signal,
        delivery_quality = :delivery_quality,
        rating = :rating,
        price = :price,
        summary = :summary,
        package_note = :package_note,
        hero_note = :hero_note,
        packages_json = :packages_json,
        social_accounts_json = :social_accounts_json,
        portfolio_json = :portfolio_json,
        reviews_json = :reviews_json
    WHERE auth_user_id = :auth_user_id
  `);
}

function getInsertCreatorStatement(db: DatabaseSync) {
  return db.prepare(`
    INSERT INTO creators (
      id,
      username,
      auth_user_id,
      name,
      image_url,
      image_alt,
      location,
      niche_json,
      badges_json,
      authenticity,
      performance,
      audience_quality,
      growth_signal,
      delivery_quality,
      rating,
      price,
      summary,
      package_note,
      hero_note,
      packages_json,
      social_accounts_json,
      portfolio_json,
      reviews_json
    ) VALUES (
      :id,
      :username,
      :auth_user_id,
      :name,
      :image_url,
      :image_alt,
      :location,
      :niche_json,
      :badges_json,
      :authenticity,
      :performance,
      :audience_quality,
      :growth_signal,
      :delivery_quality,
      :rating,
      :price,
      :summary,
      :package_note,
      :hero_note,
      :packages_json,
      :social_accounts_json,
      :portfolio_json,
      :reviews_json
    )
  `);
}

function getUpdateCreatorByUsernameStatement(db: DatabaseSync) {
  return db.prepare(`
    UPDATE creators
    SET id = :id,
        username = :username,
        auth_user_id = :auth_user_id,
        name = :name,
        image_url = :image_url,
        image_alt = :image_alt,
        location = :location,
        niche_json = :niche_json,
        badges_json = :badges_json,
        authenticity = :authenticity,
        performance = :performance,
        audience_quality = :audience_quality,
        growth_signal = :growth_signal,
        delivery_quality = :delivery_quality,
        rating = :rating,
        price = :price,
        summary = :summary,
        package_note = :package_note,
        hero_note = :hero_note,
        packages_json = :packages_json,
        social_accounts_json = :social_accounts_json,
        portfolio_json = :portfolio_json,
        reviews_json = :reviews_json
    WHERE username = :match_username
  `);
}

function saveCreatorRecordForAuthUser(
  db: DatabaseSync,
  creatorRecord: CreatorRecord,
  authUserId: string,
  shouldInsert: boolean,
  matchUsername?: string,
) {
  const row = toCreatorRow(creatorRecord, authUserId);

  if (shouldInsert) {
    getInsertCreatorStatement(db).run(row);
    return;
  }

  if (matchUsername) {
    getUpdateCreatorByUsernameStatement(db).run({
      ...row,
      match_username: matchUsername,
    });
    return;
  }

  getUpdateCreatorStatement(db).run(row);
}

function rebindClaimedCreatorOperationalState(db: DatabaseSync, creatorUsername: string, authUserId: string) {
  const syntheticParticipantId = `creator:${creatorUsername}`;

  if (tableExists(db, "wallet_accounts")) {
    const authWallet = db.prepare("SELECT * FROM wallet_accounts WHERE user_id = ? LIMIT 1").get(authUserId) as { id: string; balance: number; held_balance: number } | undefined;
    const syntheticWallet = db.prepare("SELECT * FROM wallet_accounts WHERE user_id = ? LIMIT 1").get(syntheticParticipantId) as { id: string; balance: number; held_balance: number } | undefined;

    if (authWallet && syntheticWallet && authWallet.id !== syntheticWallet.id) {
      db.prepare(
        `UPDATE wallet_accounts
         SET balance = ?, held_balance = ?, updated_at = ?
         WHERE id = ?`
      ).run(authWallet.balance + syntheticWallet.balance, authWallet.held_balance + syntheticWallet.held_balance, new Date().toISOString(), authWallet.id);

      db.prepare("UPDATE wallet_transactions SET wallet_id = ? WHERE wallet_id = ?").run(authWallet.id, syntheticWallet.id);
      db.prepare("UPDATE instant_hires SET creator_wallet_id = ? WHERE creator_wallet_id = ?").run(authWallet.id, syntheticWallet.id);
      db.prepare("DELETE FROM wallet_accounts WHERE id = ?").run(syntheticWallet.id);
    } else if (syntheticWallet && !authWallet) {
      db.prepare("UPDATE wallet_accounts SET user_id = ?, updated_at = ? WHERE id = ?").run(authUserId, new Date().toISOString(), syntheticWallet.id);
    }
  }

  if (tableExists(db, "instant_hires")) {
    db.prepare(
      `UPDATE instant_hires
       SET creator_participant_id = ?,
           creator_auth_user_id = ?
       WHERE creator_username = ?
         AND (creator_participant_id = ? OR creator_auth_user_id IS NULL)`
    ).run(authUserId, authUserId, creatorUsername, syntheticParticipantId);
  }

  if (tableExists(db, "conversations")) {
    const conversationRows = db
      .prepare("SELECT id, participant_ids_json FROM conversations WHERE participant_ids_json LIKE ?")
      .all(`%${syntheticParticipantId}%`) as Array<{ id: string; participant_ids_json: string }>;

    conversationRows.forEach((conversation) => {
      const nextParticipantIds = (JSON.parse(conversation.participant_ids_json) as string[]).map((participantId) => participantId === syntheticParticipantId ? authUserId : participantId);

      db.prepare("UPDATE conversations SET participant_ids_json = ? WHERE id = ?").run(JSON.stringify([...new Set(nextParticipantIds)]), conversation.id);
    });
  }

  if (tableExists(db, "messages")) {
    db.prepare("UPDATE messages SET sender_id = ? WHERE sender_id = ?").run(authUserId, syntheticParticipantId);
  }

  if (tableExists(db, "deliverables")) {
    db.prepare("UPDATE deliverables SET creator_user_id = ? WHERE creator_user_id = ?").run(authUserId, syntheticParticipantId);
  }
}

function seedCreatorDatabase(seedRecords: CreatorRecord[]) {
  const db = getReachfypDatabase();
  const existingCount = db.prepare("SELECT COUNT(*) as count FROM creators").get() as { count: number };

  if (existingCount.count > 0) {
    return;
  }

  const insertStatement = db.prepare(`
    INSERT INTO creators (
      id,
      username,
      auth_user_id,
      name,
      image_url,
      image_alt,
      location,
      niche_json,
      badges_json,
      authenticity,
      performance,
      audience_quality,
      growth_signal,
      delivery_quality,
      rating,
      price,
      summary,
      package_note,
      hero_note,
      packages_json,
      social_accounts_json,
      portfolio_json,
      reviews_json
    ) VALUES (
      :id,
      :username,
      :auth_user_id,
      :name,
      :image_url,
      :image_alt,
      :location,
      :niche_json,
      :badges_json,
      :authenticity,
      :performance,
      :audience_quality,
      :growth_signal,
      :delivery_quality,
      :rating,
      :price,
      :summary,
      :package_note,
      :hero_note,
      :packages_json,
      :social_accounts_json,
      :portfolio_json,
      :reviews_json
    )
  `);

  db.exec("BEGIN");

  try {
    seedRecords.forEach((record) => {
      insertStatement.run(toCreatorRow(record));
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function listStoredCreatorRecords(seedRecords: CreatorRecord[]) {
  seedCreatorDatabase(seedRecords);

  const rows = getReachfypDatabase().prepare("SELECT * FROM creators ORDER BY username ASC").all() as CreatorRow[];
  return rows.map(fromCreatorRow);
}

export function getStoredCreatorRecordByAuthUserId(seedRecords: CreatorRecord[], authUserId: string) {
  seedCreatorDatabase(seedRecords);

  const row = getReachfypDatabase().prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(authUserId) as CreatorRow | undefined;
  return row ? fromCreatorRow(row) : undefined;
}

export function upsertStoredCreatorRecordForAuthUser(seedRecords: CreatorRecord[], input: CreatorProfileUpsertInput) {
  seedCreatorDatabase(seedRecords);

  const db = getReachfypDatabase();
  const existingByAuthUser = db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(input.authUserId) as CreatorRow | undefined;
  const existingByUsername = db.prepare("SELECT * FROM creators WHERE username = ? LIMIT 1").get(input.username) as CreatorRow | undefined;
  const claimableSeedProfile = !existingByAuthUser && existingByUsername && !existingByUsername.auth_user_id;

  if (existingByUsername && existingByUsername.auth_user_id !== input.authUserId && !claimableSeedProfile) {
    return { ok: false as const, error: "username-in-use" as const };
  }

  const baseCreator: CreatorRecord = existingByAuthUser
    ? fromCreatorRow(existingByAuthUser)
    : claimableSeedProfile
      ? fromCreatorRow(existingByUsername)
    : {
        id: input.username,
        username: input.username,
        name: input.name,
        imageUrl: input.imageUrl,
        imageAlt: input.imageAlt,
        location: input.location,
        niche: input.niche,
        badges: [],
        authenticity: defaultCreatorMetrics.authenticity,
        performance: defaultCreatorMetrics.performance,
        audienceQuality: defaultCreatorMetrics.audienceQuality,
        growthSignal: defaultCreatorMetrics.growthSignal,
        deliveryQuality: defaultCreatorMetrics.deliveryQuality,
        rating: defaultCreatorMetrics.rating,
        price: input.price,
        summary: input.summary,
        packageNote: input.packageNote,
        heroNote: input.heroNote,
        packages: [],
        socialAccounts: [],
        portfolio: [],
        reviews: [],
      };

  const creatorRecord: CreatorRecord = {
    ...baseCreator,
    id: input.username,
    username: input.username,
    name: input.name,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt,
    location: input.location,
    niche: input.niche,
    price: input.price,
    summary: input.summary,
    packageNote: input.packageNote,
    heroNote: input.heroNote,
  };

  db.exec("BEGIN");

  try {
    saveCreatorRecordForAuthUser(
      db,
      creatorRecord,
      input.authUserId,
      !existingByAuthUser && !claimableSeedProfile,
      claimableSeedProfile ? existingByUsername.username : undefined,
    );

    if (claimableSeedProfile) {
      rebindClaimedCreatorOperationalState(db, existingByUsername.username, input.authUserId);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return {
    ok: true as const,
    created: !existingByAuthUser && !claimableSeedProfile,
    claimed: Boolean(claimableSeedProfile),
    creator: creatorRecord,
  };
}

export function upsertStoredCreatorPackageForAuthUser(seedRecords: CreatorRecord[], input: CreatorPackageUpsertInput) {
  seedCreatorDatabase(seedRecords);

  const db = getReachfypDatabase();
  const existingByAuthUser = db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(input.authUserId) as CreatorRow | undefined;

  if (!existingByAuthUser) {
    return { ok: false as const, error: "profile-not-found" as const };
  }

  const creator = fromCreatorRow(existingByAuthUser);
  const duplicatePackage = creator.packages.find(
    (pack) => pack.title === input.title && (!input.originalTitle || pack.title !== input.originalTitle),
  );

  if (duplicatePackage) {
    return { ok: false as const, error: "package-title-in-use" as const };
  }

  const nextPackages = creator.packages
    .filter((pack) => pack.title !== input.originalTitle)
    .concat({
      title: input.title,
      price: input.price,
      turnaround: input.turnaround,
      details: input.details,
    });

  const nextCreator: CreatorRecord = {
    ...creator,
    packageNote: nextPackages[0] ? `${nextPackages[0].title}, ${nextPackages[0].turnaround}` : creator.packageNote,
    packages: nextPackages,
  };

  saveCreatorRecordForAuthUser(db, nextCreator, input.authUserId, false);
  return { ok: true as const, created: !input.originalTitle, creator: nextCreator };
}

export function deleteStoredCreatorPackageForAuthUser(seedRecords: CreatorRecord[], authUserId: string, packageTitle: string) {
  seedCreatorDatabase(seedRecords);

  const db = getReachfypDatabase();
  const existingByAuthUser = db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(authUserId) as CreatorRow | undefined;

  if (!existingByAuthUser) {
    return { ok: false as const, error: "profile-not-found" as const };
  }

  const creator = fromCreatorRow(existingByAuthUser);
  const nextPackages = creator.packages.filter((pack) => pack.title !== packageTitle);

  if (nextPackages.length === creator.packages.length) {
    return { ok: false as const, error: "package-not-found" as const };
  }

  const nextCreator: CreatorRecord = {
    ...creator,
    packageNote: nextPackages[0] ? `${nextPackages[0].title}, ${nextPackages[0].turnaround}` : "Packages publishing next",
    packages: nextPackages,
  };

  saveCreatorRecordForAuthUser(db, nextCreator, authUserId, false);
  return { ok: true as const, creator: nextCreator };
}

export function upsertStoredCreatorSocialAccountForAuthUser(seedRecords: CreatorRecord[], input: CreatorSocialAccountUpsertInput) {
  seedCreatorDatabase(seedRecords);

  const db = getReachfypDatabase();
  const existingByAuthUser = db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(input.authUserId) as CreatorRow | undefined;

  if (!existingByAuthUser) {
    return { ok: false as const, error: "profile-not-found" as const };
  }

  const creator = fromCreatorRow(existingByAuthUser);
  const existingAccount = creator.socialAccounts.find((account) => account.platform === input.platform);
  const nextAccount: CreatorSocialAccount = {
    platform: input.platform,
    handle: input.handle,
    url: input.url,
    followers: input.followers,
    syncStatus: existingAccount ? existingAccount.syncStatus : "Connected, awaiting first sync",
    lastSyncedAt: existingAccount?.lastSyncedAt ?? null,
  };

  const nextCreator: CreatorRecord = {
    ...creator,
    socialAccounts: creator.socialAccounts.filter((account) => account.platform !== input.platform).concat(nextAccount),
  };

  saveCreatorRecordForAuthUser(db, nextCreator, input.authUserId, false);
  return { ok: true as const, created: !existingAccount, creator: nextCreator };
}

export function deleteStoredCreatorSocialAccountForAuthUser(seedRecords: CreatorRecord[], authUserId: string, platform: string) {
  seedCreatorDatabase(seedRecords);

  const db = getReachfypDatabase();
  const existingByAuthUser = db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(authUserId) as CreatorRow | undefined;

  if (!existingByAuthUser) {
    return { ok: false as const, error: "profile-not-found" as const };
  }

  const creator = fromCreatorRow(existingByAuthUser);
  const nextSocialAccounts = creator.socialAccounts.filter((account) => account.platform !== platform);

  if (nextSocialAccounts.length === creator.socialAccounts.length) {
    return { ok: false as const, error: "social-account-not-found" as const };
  }

  const nextCreator: CreatorRecord = {
    ...creator,
    socialAccounts: nextSocialAccounts,
  };

  saveCreatorRecordForAuthUser(db, nextCreator, authUserId, false);
  return { ok: true as const, creator: nextCreator };
}

export function syncStoredCreatorSocialAccountForAuthUser(seedRecords: CreatorRecord[], authUserId: string, platform: string) {
  seedCreatorDatabase(seedRecords);

  const db = getReachfypDatabase();
  const existingByAuthUser = db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get(authUserId) as CreatorRow | undefined;

  if (!existingByAuthUser) {
    return { ok: false as const, error: "profile-not-found" as const };
  }

  const creator = fromCreatorRow(existingByAuthUser);
  const syncedAt = new Date().toISOString();
  let foundAccount = false;
  const nextSocialAccounts = creator.socialAccounts.map((account) => {
    if (account.platform !== platform) {
      return account;
    }

    foundAccount = true;
    return {
      ...account,
      syncStatus: "Synced just now",
      lastSyncedAt: syncedAt,
    };
  });

  if (!foundAccount) {
    return { ok: false as const, error: "social-account-not-found" as const };
  }

  const nextCreator: CreatorRecord = {
    ...creator,
    socialAccounts: nextSocialAccounts,
  };

  saveCreatorRecordForAuthUser(db, nextCreator, authUserId, false);
  return { ok: true as const, creator: nextCreator };
}

export function deleteStoredCreatorRecordForAuthUser(seedRecords: CreatorRecord[], authUserId: string) {
  seedCreatorDatabase(seedRecords);

  const result = getReachfypDatabase().prepare("DELETE FROM creators WHERE auth_user_id = ?").run(authUserId);
  return result.changes > 0;
}
