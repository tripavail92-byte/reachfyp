import { randomUUID } from "node:crypto";
import { getReachfypDatabase } from "./creator-database";
import { ensureReachfypBaseSchema } from "./database-schema";

export type CampaignStatus = "draft" | "open" | "in_progress" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type Campaign = {
  id: string;
  brandUserId: string;
  title: string;
  objective: string;
  description: string;
  budget: string;
  currency: string;
  platforms: string[];
  niche: string[];
  deliverables: string;
  timelineStart: string;
  timelineEnd: string;
  requirements: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
};

export type CampaignApplication = {
  id: string;
  campaignId: string;
  creatorAuthUserId: string;
  creatorUsername: string;
  creatorName: string;
  packageId: string | null;
  message: string;
  proposedPrice: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
};

export type CreateCampaignInput = {
  brandUserId: string;
  title: string;
  objective: string;
  description: string;
  budget: string;
  currency?: string;
  platforms: string[];
  niche: string[];
  deliverables: string;
  timelineStart: string;
  timelineEnd: string;
  requirements: string;
  status?: CampaignStatus;
};

export type ApplyToCampaignInput = {
  campaignId: string;
  creatorAuthUserId: string;
  creatorUsername: string;
  creatorName: string;
  packageId?: string | null;
  message: string;
  proposedPrice: string;
};

type CampaignRow = {
  id: string;
  brand_user_id: string;
  title: string;
  objective: string;
  description: string;
  budget: string;
  currency: string;
  platforms_json: string;
  niche_json: string;
  deliverables: string;
  timeline_start: string;
  timeline_end: string;
  requirements: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ApplicationRow = {
  id: string;
  campaign_id: string;
  creator_auth_user_id: string;
  creator_username: string;
  creator_name: string;
  package_id: string | null;
  message: string;
  proposed_price: string;
  status: string;
  applied_at: string;
  reviewed_at: string | null;
};

function fromCampaignRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    brandUserId: row.brand_user_id,
    title: row.title,
    objective: row.objective,
    description: row.description,
    budget: row.budget,
    currency: row.currency,
    platforms: JSON.parse(row.platforms_json) as string[],
    niche: JSON.parse(row.niche_json) as string[],
    deliverables: row.deliverables,
    timelineStart: row.timeline_start,
    timelineEnd: row.timeline_end,
    requirements: row.requirements,
    status: row.status as CampaignStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromApplicationRow(row: ApplicationRow): CampaignApplication {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    creatorAuthUserId: row.creator_auth_user_id,
    creatorUsername: row.creator_username,
    creatorName: row.creator_name,
    packageId: row.package_id,
    message: row.message,
    proposedPrice: row.proposed_price,
    status: row.status as ApplicationStatus,
    appliedAt: row.applied_at,
    reviewedAt: row.reviewed_at,
  };
}

async function ensureCampaignTables() {
  const db = await getReachfypDatabase();
  await ensureReachfypBaseSchema(db);
  return db;
}

// ---------------------------------------------------------------------------
// Campaign CRUD
// ---------------------------------------------------------------------------

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const db = await ensureCampaignTables();
  const now = new Date().toISOString();
  const id = randomUUID();

  const row: CampaignRow = {
    id,
    brand_user_id: input.brandUserId,
    title: input.title.trim(),
    objective: input.objective.trim(),
    description: input.description.trim(),
    budget: input.budget.trim(),
    currency: input.currency ?? "USD",
    platforms_json: JSON.stringify(input.platforms),
    niche_json: JSON.stringify(input.niche),
    deliverables: input.deliverables.trim(),
    timeline_start: input.timelineStart,
    timeline_end: input.timelineEnd,
    requirements: input.requirements.trim(),
    status: input.status ?? "open",
    created_at: now,
    updated_at: now,
  };

  await db.prepare(`
    INSERT INTO campaigns (
      id, brand_user_id, title, objective, description, budget, currency,
      platforms_json, niche_json, deliverables, timeline_start, timeline_end,
      requirements, status, created_at, updated_at
    ) VALUES (
      :id, :brand_user_id, :title, :objective, :description, :budget, :currency,
      :platforms_json, :niche_json, :deliverables, :timeline_start, :timeline_end,
      :requirements, :status, :created_at, :updated_at
    )
  `).run(row);

  return fromCampaignRow(row);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const db = await ensureCampaignTables();
  const row = await db.prepare("SELECT * FROM campaigns WHERE id = ? LIMIT 1").get<CampaignRow>([id]);
  return row ? fromCampaignRow(row) : null;
}

export async function listOpenCampaigns(): Promise<Campaign[]> {
  const db = await ensureCampaignTables();
  const rows = await db
    .prepare("SELECT * FROM campaigns WHERE status = 'open' ORDER BY created_at DESC")
    .all<CampaignRow>([]);
  return rows.map(fromCampaignRow);
}

export async function listCampaignsForBrand(brandUserId: string): Promise<Campaign[]> {
  const db = await ensureCampaignTables();
  const rows = await db
    .prepare("SELECT * FROM campaigns WHERE brand_user_id = ? ORDER BY created_at DESC")
    .all<CampaignRow>([brandUserId]);
  return rows.map(fromCampaignRow);
}

export async function updateCampaignStatus(
  campaignId: string,
  brandUserId: string,
  status: CampaignStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await ensureCampaignTables();
  const result = await db.prepare(
    "UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ? AND brand_user_id = ?"
  ).run([status, new Date().toISOString(), campaignId, brandUserId]);

  if (result.changes === 0) {
    return { ok: false, error: "campaign-not-found-or-not-owned" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Campaign Applications
// ---------------------------------------------------------------------------

export async function applyToCampaign(
  input: ApplyToCampaignInput,
): Promise<{ ok: true; application: CampaignApplication } | { ok: false; error: string }> {
  const db = await ensureCampaignTables();

  // Confirm campaign exists and is open
  const campaign = await db
    .prepare("SELECT id, status FROM campaigns WHERE id = ? LIMIT 1")
    .get<{ id: string; status: string }>([input.campaignId]);

  if (!campaign) return { ok: false, error: "campaign-not-found" };
  if (campaign.status !== "open") return { ok: false, error: "campaign-not-open" };

  // Prevent duplicate applications
  const existing = await db
    .prepare(
      "SELECT id FROM campaign_applications WHERE campaign_id = ? AND creator_auth_user_id = ? AND status != 'withdrawn' LIMIT 1"
    )
    .get<{ id: string }>([input.campaignId, input.creatorAuthUserId]);

  if (existing) return { ok: false, error: "already-applied" };

  const now = new Date().toISOString();
  const id = randomUUID();

  const row: ApplicationRow = {
    id,
    campaign_id: input.campaignId,
    creator_auth_user_id: input.creatorAuthUserId,
    creator_username: input.creatorUsername,
    creator_name: input.creatorName,
    package_id: input.packageId ?? null,
    message: input.message.trim(),
    proposed_price: input.proposedPrice.trim(),
    status: "pending",
    applied_at: now,
    reviewed_at: null,
  };

  await db.prepare(`
    INSERT INTO campaign_applications (
      id, campaign_id, creator_auth_user_id, creator_username, creator_name,
      package_id, message, proposed_price, status, applied_at, reviewed_at
    ) VALUES (
      :id, :campaign_id, :creator_auth_user_id, :creator_username, :creator_name,
      :package_id, :message, :proposed_price, :status, :applied_at, :reviewed_at
    )
  `).run(row);

  return { ok: true, application: fromApplicationRow(row) };
}

export async function listApplicationsForCampaign(
  campaignId: string,
  brandUserId: string,
): Promise<CampaignApplication[]> {
  const db = await ensureCampaignTables();

  // Verify brand owns the campaign
  const campaign = await db
    .prepare("SELECT id FROM campaigns WHERE id = ? AND brand_user_id = ? LIMIT 1")
    .get<{ id: string }>([campaignId, brandUserId]);

  if (!campaign) return [];

  const rows = await db
    .prepare("SELECT * FROM campaign_applications WHERE campaign_id = ? ORDER BY applied_at DESC")
    .all<ApplicationRow>([campaignId]);

  return rows.map(fromApplicationRow);
}

export async function listApplicationsForCreator(
  creatorAuthUserId: string,
): Promise<CampaignApplication[]> {
  const db = await ensureCampaignTables();
  const rows = await db
    .prepare("SELECT * FROM campaign_applications WHERE creator_auth_user_id = ? ORDER BY applied_at DESC")
    .all<ApplicationRow>([creatorAuthUserId]);
  return rows.map(fromApplicationRow);
}

export async function reviewCampaignApplication(
  applicationId: string,
  brandUserId: string,
  status: "accepted" | "rejected",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await ensureCampaignTables();

  // Verify the application belongs to a campaign owned by this brand
  const appRow = await db
    .prepare("SELECT a.id, a.status, c.brand_user_id FROM campaign_applications a JOIN campaigns c ON a.campaign_id = c.id WHERE a.id = ? LIMIT 1")
    .get<{ id: string; status: string; brand_user_id: string }>([applicationId]);

  if (!appRow) return { ok: false, error: "application-not-found" };
  if (appRow.brand_user_id !== brandUserId) return { ok: false, error: "not-authorized" };
  if (appRow.status !== "pending") return { ok: false, error: "application-already-reviewed" };

  await db.prepare(
    "UPDATE campaign_applications SET status = ?, reviewed_at = ? WHERE id = ?"
  ).run([status, new Date().toISOString(), applicationId]);

  return { ok: true };
}

export async function withdrawCampaignApplication(
  applicationId: string,
  creatorAuthUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await ensureCampaignTables();
  const result = await db.prepare(
    "UPDATE campaign_applications SET status = 'withdrawn', reviewed_at = ? WHERE id = ? AND creator_auth_user_id = ? AND status = 'pending'"
  ).run([new Date().toISOString(), applicationId, creatorAuthUserId]);

  if (result.changes === 0) return { ok: false, error: "application-not-found-or-not-withdrawable" };
  return { ok: true };
}
