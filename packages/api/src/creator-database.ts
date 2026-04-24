import { getReachfypDatabaseClient, listTableColumns, tableExists, type ReachfypDatabase } from "./database-client";
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

let database: ReachfypDatabase | null = null;

async function ensureCreatorColumns(db: ReachfypDatabase) {
  const columns = await listTableColumns(db, "creators");
  const existingColumnNames = new Set(columns.map((column) => column.name));

  for (const column of creatorColumnDefinitions) {
    if (!existingColumnNames.has(column.name)) {
      await db.exec(`ALTER TABLE creators ADD COLUMN ${column.name} ${column.definition}`);
    }
  }

  await db.prepare("UPDATE creators SET social_accounts_json = '[]' WHERE social_accounts_json IS NULL").run();
}

export async function getReachfypDatabase() {
  if (database) {
    return database;
  }

  database = await getReachfypDatabaseClient();
  await ensureCreatorColumns(database);

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

function getUpdateCreatorStatement(db: ReachfypDatabase) {
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

function getInsertCreatorStatement(db: ReachfypDatabase) {
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

function getUpdateCreatorByUsernameStatement(db: ReachfypDatabase) {
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

async function saveCreatorRecordForAuthUser(
  db: ReachfypDatabase,
  creatorRecord: CreatorRecord,
  authUserId: string,
  shouldInsert: boolean,
  matchUsername?: string,
) {
  const row = toCreatorRow(creatorRecord, authUserId);

  if (shouldInsert) {
    await getInsertCreatorStatement(db).run(row);
    return;
  }

  if (matchUsername) {
    await getUpdateCreatorByUsernameStatement(db).run({
      ...row,
      match_username: matchUsername,
    });
    return;
  }

  await getUpdateCreatorStatement(db).run(row);
}

async function rebindClaimedCreatorOperationalState(db: ReachfypDatabase, creatorUsername: string, authUserId: string) {
  const syntheticParticipantId = `creator:${creatorUsername}`;

  if (await tableExists(db, "wallet_accounts")) {
    const authWallet = await db.prepare("SELECT * FROM wallet_accounts WHERE user_id = ? LIMIT 1").get<{ id: string; balance: number; held_balance: number }>([authUserId]);
    const syntheticWallet = await db.prepare("SELECT * FROM wallet_accounts WHERE user_id = ? LIMIT 1").get<{ id: string; balance: number; held_balance: number }>([syntheticParticipantId]);

    if (authWallet && syntheticWallet && authWallet.id !== syntheticWallet.id) {
      await db.prepare(
        `UPDATE wallet_accounts
         SET balance = ?, held_balance = ?, updated_at = ?
         WHERE id = ?`
      ).run([authWallet.balance + syntheticWallet.balance, authWallet.held_balance + syntheticWallet.held_balance, new Date().toISOString(), authWallet.id]);

      await db.prepare("UPDATE wallet_transactions SET wallet_id = ? WHERE wallet_id = ?").run([authWallet.id, syntheticWallet.id]);
      await db.prepare("UPDATE instant_hires SET creator_wallet_id = ? WHERE creator_wallet_id = ?").run([authWallet.id, syntheticWallet.id]);
      await db.prepare("DELETE FROM wallet_accounts WHERE id = ?").run([syntheticWallet.id]);
    } else if (syntheticWallet && !authWallet) {
      await db.prepare("UPDATE wallet_accounts SET user_id = ?, updated_at = ? WHERE id = ?").run([authUserId, new Date().toISOString(), syntheticWallet.id]);
    }
  }

  if (await tableExists(db, "instant_hires")) {
    await db.prepare(
      `UPDATE instant_hires
       SET creator_participant_id = ?,
           creator_auth_user_id = ?
       WHERE creator_username = ?
         AND (creator_participant_id = ? OR creator_auth_user_id IS NULL)`
    ).run([authUserId, authUserId, creatorUsername, syntheticParticipantId]);
  }

  if (await tableExists(db, "conversations")) {
    const conversationRows = await db
      .prepare("SELECT id, participant_ids_json FROM conversations WHERE participant_ids_json LIKE ?")
      .all<{ id: string; participant_ids_json: string }>([`%${syntheticParticipantId}%`]);

    for (const conversation of conversationRows) {
      const nextParticipantIds = (JSON.parse(conversation.participant_ids_json) as string[]).map((participantId) => participantId === syntheticParticipantId ? authUserId : participantId);

      await db.prepare("UPDATE conversations SET participant_ids_json = ? WHERE id = ?").run([JSON.stringify([...new Set(nextParticipantIds)]), conversation.id]);
    }
  }

  if (await tableExists(db, "messages")) {
    await db.prepare("UPDATE messages SET sender_id = ? WHERE sender_id = ?").run([authUserId, syntheticParticipantId]);
  }

  if (await tableExists(db, "deliverables")) {
    await db.prepare("UPDATE deliverables SET creator_user_id = ? WHERE creator_user_id = ?").run([authUserId, syntheticParticipantId]);
  }
}

async function seedCreatorDatabase(seedRecords: CreatorRecord[]) {
  const db = await getReachfypDatabase();
  const existingCount = await db.prepare("SELECT COUNT(*) as count FROM creators").get<{ count: number }>();

  if ((existingCount?.count ?? 0) > 0) {
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

  await db.transaction(async () => {
    for (const record of seedRecords) {
      await insertStatement.run(toCreatorRow(record));
    }
  });
}

export async function listStoredCreatorRecords(seedRecords: CreatorRecord[]) {
  await seedCreatorDatabase(seedRecords);

  const rows = await (await getReachfypDatabase()).prepare("SELECT * FROM creators ORDER BY username ASC").all<CreatorRow>();
  return rows.map(fromCreatorRow);
}

export async function getStoredCreatorRecordByAuthUserId(seedRecords: CreatorRecord[], authUserId: string) {
  await seedCreatorDatabase(seedRecords);

  const row = await (await getReachfypDatabase()).prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([authUserId]);
  return row ? fromCreatorRow(row) : undefined;
}

export async function upsertStoredCreatorRecordForAuthUser(seedRecords: CreatorRecord[], input: CreatorProfileUpsertInput) {
  await seedCreatorDatabase(seedRecords);

  const db = await getReachfypDatabase();
  const existingByAuthUser = await db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([input.authUserId]);
  const existingByUsername = await db.prepare("SELECT * FROM creators WHERE username = ? LIMIT 1").get<CreatorRow>([input.username]);
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

  await db.transaction(async (transactionDatabase) => {
    await saveCreatorRecordForAuthUser(
      transactionDatabase,
      creatorRecord,
      input.authUserId,
      !existingByAuthUser && !claimableSeedProfile,
      claimableSeedProfile ? existingByUsername.username : undefined,
    );

    if (claimableSeedProfile) {
      await rebindClaimedCreatorOperationalState(transactionDatabase, existingByUsername.username, input.authUserId);
    }
  });

  return {
    ok: true as const,
    created: !existingByAuthUser && !claimableSeedProfile,
    claimed: Boolean(claimableSeedProfile),
    creator: creatorRecord,
  };
}

export async function upsertStoredCreatorPackageForAuthUser(seedRecords: CreatorRecord[], input: CreatorPackageUpsertInput) {
  await seedCreatorDatabase(seedRecords);

  const db = await getReachfypDatabase();
  const existingByAuthUser = await db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([input.authUserId]);

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

  await saveCreatorRecordForAuthUser(db, nextCreator, input.authUserId, false);
  return { ok: true as const, created: !input.originalTitle, creator: nextCreator };
}

export async function deleteStoredCreatorPackageForAuthUser(seedRecords: CreatorRecord[], authUserId: string, packageTitle: string) {
  await seedCreatorDatabase(seedRecords);

  const db = await getReachfypDatabase();
  const existingByAuthUser = await db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([authUserId]);

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

  await saveCreatorRecordForAuthUser(db, nextCreator, authUserId, false);
  return { ok: true as const, creator: nextCreator };
}

export async function upsertStoredCreatorSocialAccountForAuthUser(seedRecords: CreatorRecord[], input: CreatorSocialAccountUpsertInput) {
  await seedCreatorDatabase(seedRecords);

  const db = await getReachfypDatabase();
  const existingByAuthUser = await db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([input.authUserId]);

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

  await saveCreatorRecordForAuthUser(db, nextCreator, input.authUserId, false);
  return { ok: true as const, created: !existingAccount, creator: nextCreator };
}

export async function deleteStoredCreatorSocialAccountForAuthUser(seedRecords: CreatorRecord[], authUserId: string, platform: string) {
  await seedCreatorDatabase(seedRecords);

  const db = await getReachfypDatabase();
  const existingByAuthUser = await db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([authUserId]);

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

  await saveCreatorRecordForAuthUser(db, nextCreator, authUserId, false);
  return { ok: true as const, creator: nextCreator };
}

export async function syncStoredCreatorSocialAccountForAuthUser(seedRecords: CreatorRecord[], authUserId: string, platform: string) {
  await seedCreatorDatabase(seedRecords);

  const db = await getReachfypDatabase();
  const existingByAuthUser = await db.prepare("SELECT * FROM creators WHERE auth_user_id = ? LIMIT 1").get<CreatorRow>([authUserId]);

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

  await saveCreatorRecordForAuthUser(db, nextCreator, authUserId, false);
  return { ok: true as const, creator: nextCreator };
}

export async function deleteStoredCreatorRecordForAuthUser(seedRecords: CreatorRecord[], authUserId: string) {
  await seedCreatorDatabase(seedRecords);

  const result = await (await getReachfypDatabase()).prepare("DELETE FROM creators WHERE auth_user_id = ?").run([authUserId]);
  return result.changes > 0;
}
