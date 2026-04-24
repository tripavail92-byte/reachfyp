import type {
  CreatorMarketplaceFilterKey,
  CreatorMarketplaceItem,
  CreatorMarketplaceQuery,
  CreatorMarketplaceResponse,
} from "@reachfyp/schemas";
import { listReservedCreatorUsernames } from "./auth-records";
import {
  deleteStoredCreatorRecordForAuthUser,
  deleteStoredCreatorPackageForAuthUser,
  deleteStoredCreatorSocialAccountForAuthUser,
  getStoredCreatorRecordByAuthUserId,
  listStoredCreatorRecords,
  syncStoredCreatorSocialAccountForAuthUser,
  upsertStoredCreatorPackageForAuthUser,
  upsertStoredCreatorRecordForAuthUser,
  upsertStoredCreatorSocialAccountForAuthUser,
} from "./creator-database";
import { creatorSeedRecords } from "./creator-seed-data";
export type { CreatorPackageUpsertInput, CreatorProfileUpsertInput, CreatorSocialAccountUpsertInput } from "./creator-database";

export type CreatorPackage = {
  title: string;
  price: string;
  turnaround: string;
  details: string;
};

export type CreatorSocialAccount = {
  platform: string;
  handle: string;
  url: string;
  followers: string;
  syncStatus: string;
  lastSyncedAt: string | null;
};

export type CreatorRecord = {
  id: string;
  username: string;
  authUserId?: string | null;
  name: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  niche: string[];
  badges: string[];
  authenticity: number;
  performance: number;
  audienceQuality: number;
  growthSignal: string;
  deliveryQuality: string;
  rating: number;
  price: string;
  summary: string;
  packageNote: string;
  heroNote: string;
  packages: CreatorPackage[];
  socialAccounts: CreatorSocialAccount[];
  portfolio: Array<{
    title: string;
    result: string;
  }>;
  reviews: Array<{
    source: string;
    quote: string;
  }>;
};

export type CreatorPackageSelection = {
  creator: CreatorRecord;
  package: CreatorPackage;
  packageId: string;
};

export type CreatorUsernameAvailability = {
  rawUsername: string;
  username: string;
  status: "empty" | "invalid" | "available" | "claimable" | "taken";
  wasNormalized: boolean;
  creator?: CreatorRecord;
};

async function getCreatorRecords() {
  return listStoredCreatorRecords(creatorSeedRecords);
}

function slugifyPackageTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCreatorPriceValue(price: string) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

export function normalizeCreatorUsername(rawUsername: string) {
  return rawUsername
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCreatorRankingScore(creator: CreatorRecord) {
  return Math.round(creator.authenticity * 0.55 + creator.performance * 0.45);
}

function matchesMarketplaceFilter(creator: CreatorRecord, filter: CreatorMarketplaceFilterKey) {
  switch (filter) {
    case "verified-audience":
      return creator.badges.includes("Verified audience");
    case "top-performer":
      return creator.badges.includes("Top performer");
    case "ugc":
      return creator.niche.includes("UGC");
    case "beauty":
      return creator.niche.includes("Beauty");
    case "under-750":
      return getCreatorPriceValue(creator.price) < 750;
    default:
      return true;
  }
}

function toMarketplaceItem(creator: CreatorRecord): CreatorMarketplaceItem {
  return {
    id: creator.id,
    username: creator.username,
    name: creator.name,
    imageUrl: creator.imageUrl,
    imageAlt: creator.imageAlt,
    location: creator.location,
    niche: creator.niche,
    badges: creator.badges,
    authenticity: creator.authenticity,
    performance: creator.performance,
    rating: creator.rating,
    price: creator.price,
    summary: creator.summary,
    packageNote: creator.packageNote,
    rankingScore: getCreatorRankingScore(creator),
  };
}

function sortMarketplaceItems(items: CreatorMarketplaceItem[], sort: CreatorMarketplaceQuery["sort"]) {
  return [...items].sort((left, right) => {
    switch (sort) {
      case "authenticity":
        return right.authenticity - left.authenticity;
      case "rating":
        return right.rating - left.rating;
      case "price-low":
        return getCreatorPriceValue(left.price) - getCreatorPriceValue(right.price);
      case "ranking":
      default:
        return right.rankingScore - left.rankingScore;
    }
  });
}

export async function listCreatorRecords() {
  return getCreatorRecords();
}

export async function listCreatorRecordUsernames() {
  return (await getCreatorRecords()).map((creator) => creator.username);
}

export async function getCreatorRecordTotal() {
  return (await getCreatorRecords()).length;
}

export async function getCreatorRecordByUsername(username: string) {
  return (await getCreatorRecords()).find((creator) => creator.username === username);
}

export async function getCreatorUsernameAvailability(rawUsername: string): Promise<CreatorUsernameAvailability> {
  const raw = rawUsername.trim().toLowerCase();
  const username = normalizeCreatorUsername(rawUsername);

  if (!raw) {
    return {
      rawUsername,
      username,
      status: "empty",
      wasNormalized: false,
    };
  }

  if (!username) {
    return {
      rawUsername,
      username,
      status: "invalid",
      wasNormalized: false,
    };
  }

  const creator = await getCreatorRecordByUsername(username);
  const reservedCreatorUsernames = new Set(await listReservedCreatorUsernames());

  if (!creator) {
    if (reservedCreatorUsernames.has(username)) {
      return {
        rawUsername,
        username,
        status: "taken",
        wasNormalized: raw !== username,
      };
    }

    return {
      rawUsername,
      username,
      status: "available",
      wasNormalized: raw !== username,
    };
  }

  if (!creator.authUserId) {
    return {
      rawUsername,
      username,
      status: "claimable",
      wasNormalized: raw !== username,
      creator,
    };
  }

  return {
    rawUsername,
    username,
    status: "taken",
    wasNormalized: raw !== username,
    creator,
  };
}

export function getCreatorPackageCheckoutId(username: string, packageTitle: string) {
  return `${username}--${slugifyPackageTitle(packageTitle)}`;
}

export async function getCreatorPackageByCheckoutId(packageId: string): Promise<CreatorPackageSelection | undefined> {
  const separatorIndex = packageId.indexOf("--");

  if (separatorIndex < 1) {
    return undefined;
  }

  const username = packageId.slice(0, separatorIndex);
  const packageSlug = packageId.slice(separatorIndex + 2);
  const creator = await getCreatorRecordByUsername(username);

  if (!creator) {
    return undefined;
  }

  const selectedPackage = creator.packages.find((pack) => slugifyPackageTitle(pack.title) === packageSlug);

  if (!selectedPackage) {
    return undefined;
  }

  return {
    creator,
    package: selectedPackage,
    packageId,
  };
}

export async function getCreatorRecordByAuthUserId(authUserId: string) {
  return getStoredCreatorRecordByAuthUserId(creatorSeedRecords, authUserId);
}

export async function upsertCreatorRecordForAuthUser(input: import("./creator-database").CreatorProfileUpsertInput) {
  return upsertStoredCreatorRecordForAuthUser(creatorSeedRecords, input);
}

export async function deleteCreatorRecordForAuthUser(authUserId: string) {
  return deleteStoredCreatorRecordForAuthUser(creatorSeedRecords, authUserId);
}

export async function upsertCreatorPackageForAuthUser(input: import("./creator-database").CreatorPackageUpsertInput) {
  return upsertStoredCreatorPackageForAuthUser(creatorSeedRecords, input);
}

export async function deleteCreatorPackageForAuthUser(authUserId: string, packageTitle: string) {
  return deleteStoredCreatorPackageForAuthUser(creatorSeedRecords, authUserId, packageTitle);
}

export async function upsertCreatorSocialAccountForAuthUser(input: import("./creator-database").CreatorSocialAccountUpsertInput) {
  return upsertStoredCreatorSocialAccountForAuthUser(creatorSeedRecords, input);
}

export async function deleteCreatorSocialAccountForAuthUser(authUserId: string, platform: string) {
  return deleteStoredCreatorSocialAccountForAuthUser(creatorSeedRecords, authUserId, platform);
}

export async function syncCreatorSocialAccountForAuthUser(authUserId: string, platform: string) {
  return syncStoredCreatorSocialAccountForAuthUser(creatorSeedRecords, authUserId, platform);
}

export async function listRelatedCreatorRecords(username: string, limit = 2) {
  return (await getCreatorRecords())
    .filter((creator) => creator.username !== username)
    .slice(0, limit);
}

export async function getCreatorMarketplaceResponse(query: CreatorMarketplaceQuery): Promise<CreatorMarketplaceResponse> {
  if (query.previewState === "empty") {
    return {
      items: [],
      total: 0,
      appliedFilters: query.filters,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: false,
      nextPage: null,
    };
  }

  const filteredCreators = (await getCreatorRecords()).filter((creator) => query.filters.every((filter) => matchesMarketplaceFilter(creator, filter)));
  const allItems = sortMarketplaceItems(filteredCreators.map(toMarketplaceItem), query.sort);
  const startIndex = (query.page - 1) * query.pageSize;
  const endIndex = startIndex + query.pageSize;
  const items = allItems.slice(startIndex, endIndex);
  const hasMore = endIndex < allItems.length;

  return {
    items,
    total: allItems.length,
    appliedFilters: query.filters,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
    hasMore,
    nextPage: hasMore ? query.page + 1 : null,
  };
}