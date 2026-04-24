import { randomUUID } from "node:crypto";
import { getReachfypDatabase } from "./creator-database";
import { listTableColumns, type ReachfypDatabase } from "./database-client";
import { ensureReachfypBaseSchema } from "./database-schema";
import { getCreatorPackageByCheckoutId } from "./creator-records";
import { listAuthUsersByRole } from "./auth-records";

export type InstantHireStatus = "accepted" | "submitted" | "revision_requested" | "approved" | "cancelled";
export type InstantHireEscrowStatus = "held-local" | "released-local" | "refunded-local";
export type DeliverableStatus = "submitted" | "revision_requested" | "approved";
export type NotificationType =
  | "hire_created"
  | "deliverable_submitted"
  | "revision_requested"
  | "hire_approved"
  | "hire_refunded"
  | "message_received"
  | "payout_requested"
  | "payout_approved"
  | "payout_rejected"
  | "admin_hire_action";
export type PayoutRequestStatus = "pending" | "approved" | "rejected";

export type InstantHireRecord = {
  id: string;
  packageId: string;
  brandUserId: string;
  creatorParticipantId: string;
  creatorAuthUserId: string | null;
  creatorUsername: string;
  creatorName: string;
  packageTitle: string;
  packagePrice: string;
  agreedPrice: string;
  deliveryDeadline: string;
  brief: string;
  hireType: "instant";
  status: InstantHireStatus;
  escrowStatus: InstantHireEscrowStatus;
  trackingLink: string;
  conversationId: string;
  brandWalletId: string;
  creatorWalletId: string;
  escrowTransactionId: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliverableRecord = {
  id: string;
  hireId: string;
  creatorUserId: string;
  title: string;
  description: string;
  fileUrls: string[];
  externalUrl: string;
  notes: string;
  revisionNumber: number;
  status: DeliverableStatus;
  reviewFeedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
};

export type ConversationRecord = {
  id: string;
  type: "hire";
  referenceId: string;
  participantIds: string[];
  lastMessageAt: string;
  createdAt: string;
};

export type MessageRecord = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrls: string[];
  readAt: string | null;
  createdAt: string;
};

export type WalletAccount = {
  id: string;
  userId: string;
  balance: number;
  heldBalance: number;
  currency: string;
  updatedAt: string;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: "deposit" | "withdrawal" | "escrow_hold" | "escrow_release" | "payout" | "refund" | "admin_adjustment";
  amount: number;
  currency: string;
  referenceType: string;
  referenceId: string;
  note: string;
  createdAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export type PayoutRequestRecord = {
  id: string;
  creatorUserId: string;
  walletId: string;
  amount: number;
  currency: string;
  status: PayoutRequestStatus;
  note: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type InstantHireDetail = {
  hire: InstantHireRecord;
  conversation: ConversationRecord;
  messages: MessageRecord[];
  deliverables: DeliverableRecord[];
  brandWallet: WalletAccount;
  creatorWallet: WalletAccount;
  brandTransactions: WalletTransaction[];
  creatorTransactions: WalletTransaction[];
};

type InstantHireRow = {
  id: string;
  package_id: string;
  brand_user_id: string;
  creator_participant_id: string | null;
  creator_auth_user_id: string | null;
  creator_username: string;
  creator_name: string;
  package_title: string;
  package_price: string;
  agreed_price: string;
  delivery_deadline: string;
  brief: string;
  hire_type: string;
  status: string;
  escrow_status: string;
  tracking_link: string;
  conversation_id: string | null;
  brand_wallet_id: string | null;
  creator_wallet_id: string | null;
  escrow_transaction_id: string | null;
  created_at: string;
  updated_at: string | null;
};

type DeliverableRow = {
  id: string;
  hire_id: string;
  creator_user_id: string;
  title: string;
  description: string;
  file_urls_json: string;
  external_url: string;
  notes: string;
  revision_number: number;
  status: DeliverableStatus;
  review_feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
};

type ConversationRow = {
  id: string;
  type: string;
  reference_id: string;
  participant_ids_json: string;
  last_message_at: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_urls_json: string;
  read_at: string | null;
  created_at: string;
};

type WalletAccountRow = {
  id: string;
  user_id: string;
  balance: number;
  held_balance: number;
  currency: string;
  updated_at: string;
};

type WalletTransactionRow = {
  id: string;
  wallet_id: string;
  type: WalletTransaction["type"];
  amount: number;
  currency: string;
  reference_type: string;
  reference_id: string;
  note: string;
  created_at: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

type PayoutRequestRow = {
  id: string;
  creator_user_id: string;
  wallet_id: string;
  amount: number;
  currency: string;
  status: PayoutRequestStatus;
  note: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const localSystemSenderId = "system";
const defaultBrandWalletBalance = 10000;

async function ensureTableColumns(
  tableName: string,
  columns: Array<{
    name: string;
    definition: string;
  }>,
) {
  const db = await getReachfypDatabase();
  const existingColumns = await listTableColumns(db, tableName);
  const existingColumnNames = new Set(existingColumns.map((column) => column.name));

  for (const column of columns) {
    if (!existingColumnNames.has(column.name)) {
      await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.definition}`);
    }
  }
}

async function ensureInstantHireTables() {
  const db = await getReachfypDatabase();
  await ensureReachfypBaseSchema(db);

  await ensureTableColumns("instant_hires", [
    { name: "creator_participant_id", definition: "TEXT" },
    { name: "creator_auth_user_id", definition: "TEXT" },
    { name: "conversation_id", definition: "TEXT" },
    { name: "brand_wallet_id", definition: "TEXT" },
    { name: "creator_wallet_id", definition: "TEXT" },
    { name: "escrow_transaction_id", definition: "TEXT" },
    { name: "updated_at", definition: "TEXT" },
  ]);

  await db.prepare("UPDATE instant_hires SET updated_at = created_at WHERE updated_at IS NULL").run();

  return db;
}

function parsePrice(price: string) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

function getCreatorParticipantId(creatorUsername: string, creatorAuthUserId: string | null) {
  return creatorAuthUserId ?? `creator:${creatorUsername}`;
}

function toInstantHireRecord(row: InstantHireRow): InstantHireRecord {
  return {
    id: row.id,
    packageId: row.package_id,
    brandUserId: row.brand_user_id,
    creatorParticipantId: row.creator_participant_id ?? getCreatorParticipantId(row.creator_username, row.creator_auth_user_id),
    creatorAuthUserId: row.creator_auth_user_id,
    creatorUsername: row.creator_username,
    creatorName: row.creator_name,
    packageTitle: row.package_title,
    packagePrice: row.package_price,
    agreedPrice: row.agreed_price,
    deliveryDeadline: row.delivery_deadline,
    brief: row.brief,
    hireType: "instant",
    status: row.status as InstantHireStatus,
    escrowStatus: row.escrow_status as InstantHireEscrowStatus,
    trackingLink: row.tracking_link,
    conversationId: row.conversation_id ?? "",
    brandWalletId: row.brand_wallet_id ?? "",
    creatorWalletId: row.creator_wallet_id ?? "",
    escrowTransactionId: row.escrow_transaction_id ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function toDeliverableRecord(row: DeliverableRow): DeliverableRecord {
  return {
    id: row.id,
    hireId: row.hire_id,
    creatorUserId: row.creator_user_id,
    title: row.title,
    description: row.description,
    fileUrls: JSON.parse(row.file_urls_json) as string[],
    externalUrl: row.external_url,
    notes: row.notes,
    revisionNumber: row.revision_number,
    status: row.status,
    reviewFeedback: row.review_feedback,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    approvedAt: row.approved_at,
  };
}

function toConversationRecord(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    type: "hire",
    referenceId: row.reference_id,
    participantIds: JSON.parse(row.participant_ids_json) as string[],
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

function toMessageRecord(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    mediaUrls: JSON.parse(row.media_urls_json) as string[],
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function toWalletAccount(row: WalletAccountRow): WalletAccount {
  return {
    id: row.id,
    userId: row.user_id,
    balance: row.balance,
    heldBalance: row.held_balance,
    currency: row.currency,
    updatedAt: row.updated_at,
  };
}

function toWalletTransaction(row: WalletTransactionRow): WalletTransaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

function toNotificationRecord(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function toPayoutRequestRecord(row: PayoutRequestRow): PayoutRequestRecord {
  return {
    id: row.id,
    creatorUserId: row.creator_user_id,
    walletId: row.wallet_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    note: row.note,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

async function getWalletAccountRowByUserId(userId: string) {
  return (await ensureInstantHireTables()).prepare("SELECT * FROM wallet_accounts WHERE user_id = ? LIMIT 1").get<WalletAccountRow>([userId]);
}

async function getWalletAccountRowById(walletId: string) {
  return (await ensureInstantHireTables()).prepare("SELECT * FROM wallet_accounts WHERE id = ? LIMIT 1").get<WalletAccountRow>([walletId]);
}

async function ensureWalletAccount(db: ReachfypDatabase, userId: string, defaultBalance: number, currency: string, timestamp: string) {
  const existingWallet = await getWalletAccountRowByUserId(userId);

  if (existingWallet) {
    return existingWallet;
  }

  const walletRow: WalletAccountRow = {
    id: randomUUID(),
    user_id: userId,
    balance: defaultBalance,
    held_balance: 0,
    currency,
    updated_at: timestamp,
  };

  await db.prepare(
    `INSERT INTO wallet_accounts (id, user_id, balance, held_balance, currency, updated_at)
     VALUES (:id, :user_id, :balance, :held_balance, :currency, :updated_at)`
  ).run(walletRow);

  return walletRow;
}

async function createWalletTransaction(db: ReachfypDatabase, input: {
  walletId: string;
  type: WalletTransaction["type"];
  amount: number;
  currency: string;
  referenceType: string;
  referenceId: string;
  note: string;
  createdAt: string;
}) {
  const transactionId = randomUUID();
  await db.prepare(
    `INSERT INTO wallet_transactions (id, wallet_id, type, amount, currency, reference_type, reference_id, note, created_at)
     VALUES (:id, :wallet_id, :type, :amount, :currency, :reference_type, :reference_id, :note, :created_at)`
  ).run({
    id: transactionId,
    wallet_id: input.walletId,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    note: input.note,
    created_at: input.createdAt,
  });

  return transactionId;
}

async function getConversationRowById(conversationId: string) {
  return (await ensureInstantHireTables()).prepare("SELECT * FROM conversations WHERE id = ? LIMIT 1").get<ConversationRow>([conversationId]);
}

async function getMessageRowsByConversationId(conversationId: string) {
  return (await ensureInstantHireTables())
    .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC")
    .all<MessageRow>([conversationId]);
}

async function getDeliverableRowById(deliverableId: string) {
  return (await ensureInstantHireTables()).prepare("SELECT * FROM deliverables WHERE id = ? LIMIT 1").get<DeliverableRow>([deliverableId]);
}

async function getDeliverableRowsByHireId(hireId: string) {
  return (await ensureInstantHireTables())
    .prepare("SELECT * FROM deliverables WHERE hire_id = ? ORDER BY revision_number ASC, submitted_at ASC")
    .all<DeliverableRow>([hireId]);
}

async function getLatestDeliverableRowByHireId(hireId: string) {
  return (await ensureInstantHireTables())
    .prepare("SELECT * FROM deliverables WHERE hire_id = ? ORDER BY revision_number DESC, submitted_at DESC LIMIT 1")
    .get<DeliverableRow>([hireId]);
}

async function getWalletTransactionRowsByWalletId(walletId: string) {
  return (await ensureInstantHireTables())
    .prepare("SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC")
    .all<WalletTransactionRow>([walletId]);
}

async function getNotificationRowsByUserId(userId: string) {
  return (await ensureInstantHireTables())
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC")
    .all<NotificationRow>([userId]);
}

async function getPayoutRequestRowById(payoutRequestId: string) {
  return (await ensureInstantHireTables()).prepare("SELECT * FROM payout_requests WHERE id = ? LIMIT 1").get<PayoutRequestRow>([payoutRequestId]);
}

async function getPendingPayoutAmountForCreator(creatorUserId: string) {
  const row = await (await ensureInstantHireTables())
    .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payout_requests WHERE creator_user_id = ? AND status = 'pending'")
    .get<{ total: number }>([creatorUserId]);

  return row?.total ?? 0;
}

async function createNotification(db: ReachfypDatabase, input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  createdAt: string;
}) {
  await db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, link, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run([`notif_${randomUUID()}`, input.userId, input.type, input.title, input.body, input.link, null, input.createdAt]);
}

async function notifyAdmins(db: ReachfypDatabase, input: {
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  createdAt: string;
}) {
  for (const adminUser of await listAuthUsersByRole("admin")) {
    await createNotification(db, {
      userId: adminUser.id,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      createdAt: input.createdAt,
    });
  }
}

export async function getWalletAccountByUserId(userId: string) {
  const walletRow = await getWalletAccountRowByUserId(userId);
  return walletRow ? toWalletAccount(walletRow) : undefined;
}

export async function getConversationById(conversationId: string) {
  const row = await getConversationRowById(conversationId);
  return row ? toConversationRecord(row) : undefined;
}

export async function listMessagesForConversation(conversationId: string) {
  return (await getMessageRowsByConversationId(conversationId)).map(toMessageRecord);
}

export async function listDeliverablesForHire(hireId: string) {
  return (await getDeliverableRowsByHireId(hireId)).map(toDeliverableRecord);
}

export async function listInstantHiresForCreator(creatorUserId: string) {
  const rows = await (await ensureInstantHireTables())
    .prepare("SELECT * FROM instant_hires WHERE creator_auth_user_id = ? ORDER BY created_at DESC")
    .all<InstantHireRow>([creatorUserId]);

  return rows.map(toInstantHireRecord);
}

export async function listInstantHiresForBrand(brandUserId: string) {
  const rows = await (await ensureInstantHireTables())
    .prepare("SELECT * FROM instant_hires WHERE brand_user_id = ? ORDER BY created_at DESC")
    .all<InstantHireRow>([brandUserId]);

  return rows.map(toInstantHireRecord);
}

export async function listAllInstantHires() {
  const rows = await (await ensureInstantHireTables()).prepare("SELECT * FROM instant_hires ORDER BY created_at DESC").all<InstantHireRow>();
  return rows.map(toInstantHireRecord);
}

export async function listNotificationsForUser(userId: string) {
  return (await getNotificationRowsByUserId(userId)).map(toNotificationRecord);
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const db = await ensureInstantHireTables();
  const readAt = new Date().toISOString();
  const result = await db.prepare("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL").run([readAt, notificationId, userId]);
  return result.changes > 0;
}

export async function markAllNotificationsRead(userId: string) {
  const readAt = new Date().toISOString();
  return (await (await ensureInstantHireTables()).prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").run([readAt, userId])).changes;
}

export async function markConversationMessagesRead(conversationId: string, viewerId: string) {
  const readAt = new Date().toISOString();
  return (await (await ensureInstantHireTables()).prepare("UPDATE messages SET read_at = ? WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL").run([readAt, conversationId, viewerId])).changes;
}

export async function postMessageToConversation(input: {
  conversationId: string;
  senderId: string;
  content: string;
}) {
  const conversation = await getConversationById(input.conversationId);

  if (!conversation || !conversation.participantIds.includes(input.senderId)) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  const content = input.content.trim();

  if (!content) {
    return { ok: false as const, error: "missing-fields" as const };
  }

  const db = await ensureInstantHireTables();
  const createdAt = new Date().toISOString();

  await db.transaction(async (transactionDatabase) => {
    await appendConversationMessage(transactionDatabase, {
      conversationId: input.conversationId,
      senderId: input.senderId,
      content,
      createdAt,
    });

    for (const participantId of conversation.participantIds.filter((value) => value !== input.senderId && !value.startsWith("creator:"))) {
      await createNotification(transactionDatabase, {
          userId: participantId,
          type: "message_received",
          title: "New hire message",
          body: content.slice(0, 140),
          link: `/dashboard/messages/${input.conversationId}`,
          createdAt,
        });
    }
  });

  return { ok: true as const };
}

export async function listPayoutRequestsForCreator(creatorUserId: string) {
  return (await (await ensureInstantHireTables())
    .prepare("SELECT * FROM payout_requests WHERE creator_user_id = ? ORDER BY created_at DESC")
    .all<PayoutRequestRow>([creatorUserId])).map(toPayoutRequestRecord);
}

export async function listAllPayoutRequests() {
  return (await (await ensureInstantHireTables()).prepare("SELECT * FROM payout_requests ORDER BY created_at DESC").all<PayoutRequestRow>()).map(toPayoutRequestRecord);
}

export async function getInstantHireRecordById(hireId: string) {
  const row = await (await ensureInstantHireTables()).prepare("SELECT * FROM instant_hires WHERE id = ? LIMIT 1").get<InstantHireRow>([hireId]);
  return row ? toInstantHireRecord(row) : undefined;
}

export async function getInstantHireDetailById(hireId: string): Promise<InstantHireDetail | undefined> {
  const hire = await getInstantHireRecordById(hireId);

  if (!hire) {
    return undefined;
  }

  const conversation = await getConversationById(hire.conversationId);
  const brandWallet = await getWalletAccountByUserId(hire.brandUserId);
  const creatorWallet = await getWalletAccountByUserId(hire.creatorParticipantId);

  if (!conversation || !brandWallet || !creatorWallet) {
    return undefined;
  }

  return {
    hire,
    conversation,
    messages: await listMessagesForConversation(conversation.id),
    deliverables: await listDeliverablesForHire(hire.id),
    brandWallet,
    creatorWallet,
    brandTransactions: (await getWalletTransactionRowsByWalletId(brandWallet.id)).map(toWalletTransaction),
    creatorTransactions: (await getWalletTransactionRowsByWalletId(creatorWallet.id)).map(toWalletTransaction),
  };
}

async function appendConversationMessage(db: ReachfypDatabase, input: {
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}) {
  await db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, content, media_urls_json, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run([`msg_${randomUUID()}`, input.conversationId, input.senderId, input.content, JSON.stringify([]), input.readAt ?? null, input.createdAt]);

  await db.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run([input.createdAt, input.conversationId]);
}

async function updateInstantHireState(db: ReachfypDatabase, input: {
  hireId: string;
  status: InstantHireStatus;
  escrowStatus?: InstantHireEscrowStatus;
  updatedAt: string;
}) {
  if (input.escrowStatus) {
    await db.prepare("UPDATE instant_hires SET status = ?, escrow_status = ?, updated_at = ? WHERE id = ?").run([input.status, input.escrowStatus, input.updatedAt, input.hireId]);
    return;
  }

  await db.prepare("UPDATE instant_hires SET status = ?, updated_at = ? WHERE id = ?").run([input.status, input.updatedAt, input.hireId]);
}

export async function createPayoutRequest(input: {
  creatorUserId: string;
  amount: number;
  note: string;
}) {
  const wallet = await getWalletAccountByUserId(input.creatorUserId);
  const note = input.note.trim();

  if (!wallet) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0 || !note) {
    return { ok: false as const, error: "missing-fields" as const };
  }

  const availableForRequest = wallet.balance - await getPendingPayoutAmountForCreator(input.creatorUserId);

  if (availableForRequest < input.amount) {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const db = await ensureInstantHireTables();
  const createdAt = new Date().toISOString();
  const payoutRequestId = `payout_${randomUUID()}`;

  await db.transaction(async (transactionDatabase) => {
    await transactionDatabase.prepare(
      `INSERT INTO payout_requests (id, creator_user_id, wallet_id, amount, currency, status, note, admin_note, created_at, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run([payoutRequestId, input.creatorUserId, wallet.id, input.amount, wallet.currency, "pending", note, null, createdAt, null]);

    await createNotification(transactionDatabase, {
      userId: input.creatorUserId,
      type: "payout_requested",
      title: "Payout request submitted",
      body: `Your payout request for $${input.amount.toFixed(2)} is waiting for admin review.`,
      link: "/creator/payouts",
      createdAt,
    });

    await notifyAdmins(transactionDatabase, {
      type: "payout_requested",
      title: "New payout request",
      body: `A creator requested a payout of $${input.amount.toFixed(2)}.`,
      link: "/admin/payouts",
      createdAt,
    });
  });

  const payoutRequest = await getPayoutRequestRowById(payoutRequestId);
  return payoutRequest ? { ok: true as const, payoutRequest: toPayoutRequestRecord(payoutRequest) } : { ok: false as const, error: "missing-fields" as const };
}

export async function reviewPayoutRequest(input: {
  payoutRequestId: string;
  adminNote: string;
  action: "approve" | "reject";
}) {
  const payoutRequest = await getPayoutRequestRowById(input.payoutRequestId);

  if (!payoutRequest || payoutRequest.status !== "pending") {
    return { ok: false as const, error: "deliverable-not-found" as const };
  }

  const adminNote = input.adminNote.trim();

  if (!adminNote) {
    return { ok: false as const, error: "missing-feedback" as const };
  }

  const wallet = await getWalletAccountRowById(payoutRequest.wallet_id);

  if (!wallet) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  if (input.action === "approve" && wallet.balance < payoutRequest.amount) {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const reviewedAt = new Date().toISOString();
  const db = await ensureInstantHireTables();

  await db.transaction(async (transactionDatabase) => {
    await transactionDatabase.prepare("UPDATE payout_requests SET status = ?, admin_note = ?, reviewed_at = ? WHERE id = ?").run([input.action === "approve" ? "approved" : "rejected", adminNote, reviewedAt, payoutRequest.id]);

    if (input.action === "approve") {
      await transactionDatabase.prepare("UPDATE wallet_accounts SET balance = ?, updated_at = ? WHERE id = ?").run([wallet.balance - payoutRequest.amount, reviewedAt, wallet.id]);

      await createWalletTransaction(transactionDatabase, {
        walletId: wallet.id,
        type: "withdrawal",
        amount: payoutRequest.amount,
        currency: wallet.currency,
        referenceType: "payout_request",
        referenceId: payoutRequest.id,
        note: `Admin approved payout request ${payoutRequest.id}`,
        createdAt: reviewedAt,
      });
    }

    await createNotification(transactionDatabase, {
      userId: payoutRequest.creator_user_id,
      type: input.action === "approve" ? "payout_approved" : "payout_rejected",
      title: input.action === "approve" ? "Payout request approved" : "Payout request rejected",
      body: adminNote,
      link: "/creator/payouts",
      createdAt: reviewedAt,
    });
  });

  const reviewed = await getPayoutRequestRowById(payoutRequest.id);
  return reviewed ? { ok: true as const, payoutRequest: toPayoutRequestRecord(reviewed) } : { ok: false as const, error: "deliverable-not-found" as const };
}

export async function adminModerateInstantHire(input: {
  hireId: string;
  action: "force_release" | "force_refund";
  note: string;
}) {
  const hire = await getInstantHireRecordById(input.hireId);

  if (!hire || hire.escrowStatus !== "held-local" || hire.status === "approved" || hire.status === "cancelled") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const note = input.note.trim();

  if (!note) {
    return { ok: false as const, error: "missing-feedback" as const };
  }

  const actedAt = new Date().toISOString();
  const agreedPriceValue = parsePrice(hire.agreedPrice);
  const brandWallet = await getWalletAccountRowById(hire.brandWalletId);
  const creatorWallet = await getWalletAccountRowById(hire.creatorWalletId);
  const latestDeliverable = await getLatestDeliverableRowByHireId(hire.id);

  if (!brandWallet || !creatorWallet) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  if (input.action === "force_release" && (!latestDeliverable || brandWallet.held_balance < agreedPriceValue)) {
    return { ok: false as const, error: "deliverable-not-found" as const };
  }

  if (input.action === "force_refund" && brandWallet.held_balance < agreedPriceValue) {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const db = await ensureInstantHireTables();

  await db.transaction(async (transactionDatabase) => {
    if (input.action === "force_release") {
      await transactionDatabase.prepare("UPDATE deliverables SET status = ?, review_feedback = ?, reviewed_at = ?, approved_at = ? WHERE id = ?").run(["approved", note, actedAt, actedAt, latestDeliverable!.id]);
      await transactionDatabase.prepare("UPDATE wallet_accounts SET held_balance = ?, updated_at = ? WHERE id = ?").run([brandWallet.held_balance - agreedPriceValue, actedAt, brandWallet.id]);
      await transactionDatabase.prepare("UPDATE wallet_accounts SET balance = ?, updated_at = ? WHERE id = ?").run([creatorWallet.balance + agreedPriceValue, actedAt, creatorWallet.id]);

      await createWalletTransaction(transactionDatabase, {
        walletId: brandWallet.id,
        type: "escrow_release",
        amount: agreedPriceValue,
        currency: brandWallet.currency,
        referenceType: "campaign_hire",
        referenceId: hire.id,
        note: `Admin released escrow for ${hire.packageTitle}`,
        createdAt: actedAt,
      });

      await createWalletTransaction(transactionDatabase, {
        walletId: creatorWallet.id,
        type: "payout",
        amount: agreedPriceValue,
        currency: creatorWallet.currency,
        referenceType: "campaign_hire",
        referenceId: hire.id,
        note: `Admin payout release for ${hire.packageTitle}`,
        createdAt: actedAt,
      });

      await updateInstantHireState(transactionDatabase, {
        hireId: hire.id,
        status: "approved",
        escrowStatus: "released-local",
        updatedAt: actedAt,
      });
    } else {
      await transactionDatabase.prepare("UPDATE wallet_accounts SET balance = ?, held_balance = ?, updated_at = ? WHERE id = ?").run([brandWallet.balance + agreedPriceValue, brandWallet.held_balance - agreedPriceValue, actedAt, brandWallet.id]);

      await createWalletTransaction(transactionDatabase, {
        walletId: brandWallet.id,
        type: "refund",
        amount: agreedPriceValue,
        currency: brandWallet.currency,
        referenceType: "campaign_hire",
        referenceId: hire.id,
        note: `Admin refunded escrow for ${hire.packageTitle}`,
        createdAt: actedAt,
      });

      await updateInstantHireState(transactionDatabase, {
        hireId: hire.id,
        status: "cancelled",
        escrowStatus: "refunded-local",
        updatedAt: actedAt,
      });
    }

    await appendConversationMessage(transactionDatabase, {
      conversationId: hire.conversationId,
      senderId: localSystemSenderId,
      content: `Admin moderation action: ${input.action}. ${note}`,
      createdAt: actedAt,
    });

    await createNotification(transactionDatabase, {
      userId: hire.brandUserId,
      type: "admin_hire_action",
      title: "Admin updated a hire",
      body: note,
      link: `/dashboard/hires/${hire.id}`,
      createdAt: actedAt,
    });

    if (hire.creatorAuthUserId) {
      await createNotification(transactionDatabase, {
        userId: hire.creatorAuthUserId,
        type: "admin_hire_action",
        title: "Admin updated a hire",
        body: note,
        link: `/creator/hires/${hire.id}`,
        createdAt: actedAt,
      });
    }
  });

  return { ok: true as const, hire: await getInstantHireRecordById(hire.id) };
}

export async function submitDeliverableForHire(input: {
  hireId: string;
  creatorUserId: string;
  title: string;
  description: string;
  externalUrl: string;
  notes: string;
  fileUrls?: string[];
}) {
  const hire = await getInstantHireRecordById(input.hireId);

  if (!hire) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  if (!hire.creatorAuthUserId || hire.creatorAuthUserId !== input.creatorUserId) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const externalUrl = input.externalUrl.trim();
  const notes = input.notes.trim();
  const fileUrls = (input.fileUrls ?? []).map((value) => value.trim()).filter(Boolean);

  if (!title || !description || !externalUrl) {
    return { ok: false as const, error: "missing-fields" as const };
  }

  if (!/^https?:\/\//.test(externalUrl) || fileUrls.some((value) => !/^https?:\/\//.test(value))) {
    return { ok: false as const, error: "invalid-external-url" as const };
  }

  if (hire.status === "approved" || hire.status === "cancelled" || hire.escrowStatus !== "held-local") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const latestDeliverable = await getLatestDeliverableRowByHireId(hire.id);

  if (latestDeliverable?.status === "submitted") {
    return { ok: false as const, error: "deliverable-already-submitted" as const };
  }

  const submittedAt = new Date().toISOString();
  const deliverableId = `del_${randomUUID()}`;
  const revisionNumber = latestDeliverable ? latestDeliverable.revision_number + 1 : 1;
  const db = await ensureInstantHireTables();

  await db.transaction(async (transactionDatabase) => {
    await transactionDatabase.prepare(
      `INSERT INTO deliverables (
        id,
        hire_id,
        creator_user_id,
        title,
        description,
        file_urls_json,
        external_url,
        notes,
        revision_number,
        status,
        review_feedback,
        submitted_at,
        reviewed_at,
        approved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run([deliverableId, hire.id, input.creatorUserId, title, description, JSON.stringify(fileUrls), externalUrl, notes, revisionNumber, "submitted", null, submittedAt, null, null]);

    await updateInstantHireState(transactionDatabase, {
      hireId: hire.id,
      status: "submitted",
      updatedAt: submittedAt,
    });

    await appendConversationMessage(transactionDatabase, {
      conversationId: hire.conversationId,
      senderId: input.creatorUserId,
      content: `Deliverable ${revisionNumber} submitted: ${title}\n${description}\n${externalUrl}${notes ? `\n\nNotes: ${notes}` : ""}`,
      createdAt: submittedAt,
    });

    await createNotification(transactionDatabase, {
      userId: hire.brandUserId,
      type: "deliverable_submitted",
      title: "New deliverable submitted",
      body: `${hire.creatorName} submitted revision ${revisionNumber} for ${hire.packageTitle}.`,
      link: `/dashboard/hires/${hire.id}`,
      createdAt: submittedAt,
    });

  });

  const deliverable = await getDeliverableRowById(deliverableId);
  const nextHire = await getInstantHireRecordById(hire.id);

  if (!deliverable || !nextHire) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  return { ok: true as const, deliverable: toDeliverableRecord(deliverable), hire: nextHire };
}

export async function requestRevisionForDeliverable(input: {
  hireId: string;
  deliverableId: string;
  brandUserId: string;
  feedback: string;
}) {
  const hire = await getInstantHireRecordById(input.hireId);

  if (!hire) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  if (hire.brandUserId !== input.brandUserId) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  if (hire.status === "approved" || hire.status === "cancelled" || hire.escrowStatus !== "held-local") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const feedback = input.feedback.trim();

  if (!feedback) {
    return { ok: false as const, error: "missing-feedback" as const };
  }

  const deliverable = await getDeliverableRowById(input.deliverableId);

  if (!deliverable || deliverable.hire_id !== hire.id) {
    return { ok: false as const, error: "deliverable-not-found" as const };
  }

  if (deliverable.status !== "submitted") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const reviewedAt = new Date().toISOString();
  const db = await ensureInstantHireTables();

  await db.transaction(async (transactionDatabase) => {
    await transactionDatabase.prepare("UPDATE deliverables SET status = ?, review_feedback = ?, reviewed_at = ? WHERE id = ?").run(["revision_requested", feedback, reviewedAt, deliverable.id]);

    await updateInstantHireState(transactionDatabase, {
      hireId: hire.id,
      status: "revision_requested",
      updatedAt: reviewedAt,
    });

    await appendConversationMessage(transactionDatabase, {
      conversationId: hire.conversationId,
      senderId: input.brandUserId,
      content: `Revision requested on deliverable ${deliverable.revision_number}: ${feedback}`,
      createdAt: reviewedAt,
    });

    if (hire.creatorAuthUserId) {
      await createNotification(transactionDatabase, {
        userId: hire.creatorAuthUserId,
        type: "revision_requested",
        title: "Revision requested",
        body: feedback,
        link: `/creator/hires/${hire.id}`,
        createdAt: reviewedAt,
      });
    }

  });

  const nextDeliverable = await getDeliverableRowById(deliverable.id);
  return { ok: true as const, hire: await getInstantHireRecordById(hire.id), deliverable: nextDeliverable ? toDeliverableRecord(nextDeliverable) : undefined };
}

export async function approveDeliverableForHire(input: {
  hireId: string;
  deliverableId: string;
  brandUserId: string;
  feedback?: string;
}) {
  const hire = await getInstantHireRecordById(input.hireId);

  if (!hire) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  if (hire.brandUserId !== input.brandUserId) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  if (hire.status === "approved" || hire.status === "cancelled" || hire.escrowStatus !== "held-local") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const deliverable = await getDeliverableRowById(input.deliverableId);

  if (!deliverable || deliverable.hire_id !== hire.id) {
    return { ok: false as const, error: "deliverable-not-found" as const };
  }

  if (deliverable.status !== "submitted") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const brandWallet = await getWalletAccountRowById(hire.brandWalletId);
  const creatorWallet = await getWalletAccountRowById(hire.creatorWalletId);

  if (!brandWallet || !creatorWallet) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  const approvedAt = new Date().toISOString();
  const agreedPriceValue = parsePrice(hire.agreedPrice);
  const feedback = input.feedback?.trim();

  if (brandWallet.held_balance < agreedPriceValue) {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const db = await ensureInstantHireTables();

  await db.transaction(async (transactionDatabase) => {
    await transactionDatabase.prepare("UPDATE deliverables SET status = ?, review_feedback = ?, reviewed_at = ?, approved_at = ? WHERE id = ?").run(["approved", feedback ?? deliverable.review_feedback, approvedAt, approvedAt, deliverable.id]);

    await transactionDatabase.prepare(
      `UPDATE wallet_accounts
       SET held_balance = ?, updated_at = ?
       WHERE id = ?`
    ).run([brandWallet.held_balance - agreedPriceValue, approvedAt, brandWallet.id]);

    await transactionDatabase.prepare(
      `UPDATE wallet_accounts
       SET balance = ?, updated_at = ?
       WHERE id = ?`
    ).run([creatorWallet.balance + agreedPriceValue, approvedAt, creatorWallet.id]);

    await createWalletTransaction(transactionDatabase, {
      walletId: brandWallet.id,
      type: "escrow_release",
      amount: agreedPriceValue,
      currency: brandWallet.currency,
      referenceType: "campaign_hire",
      referenceId: hire.id,
      note: `Escrow released for ${hire.packageTitle}`,
      createdAt: approvedAt,
    });

    await createWalletTransaction(transactionDatabase, {
      walletId: creatorWallet.id,
      type: "payout",
      amount: agreedPriceValue,
      currency: creatorWallet.currency,
      referenceType: "campaign_hire",
      referenceId: hire.id,
      note: `Creator payout for ${hire.packageTitle}`,
      createdAt: approvedAt,
    });

    await updateInstantHireState(transactionDatabase, {
      hireId: hire.id,
      status: "approved",
      escrowStatus: "released-local",
      updatedAt: approvedAt,
    });

    await appendConversationMessage(transactionDatabase, {
      conversationId: hire.conversationId,
      senderId: localSystemSenderId,
      content: `Deliverable ${deliverable.revision_number} approved and escrow released to the creator wallet.`,
      createdAt: approvedAt,
    });

    if (feedback) {
      await appendConversationMessage(transactionDatabase, {
        conversationId: hire.conversationId,
        senderId: input.brandUserId,
        content: feedback,
        createdAt: new Date(Date.parse(approvedAt) + 1).toISOString(),
      });
    }

    await createNotification(transactionDatabase, {
      userId: hire.brandUserId,
      type: "hire_approved",
      title: "Escrow released",
      body: `You approved ${hire.packageTitle} and released the held escrow.`,
      link: `/dashboard/hires/${hire.id}`,
      createdAt: approvedAt,
    });

    if (hire.creatorAuthUserId) {
      await createNotification(transactionDatabase, {
        userId: hire.creatorAuthUserId,
        type: "hire_approved",
        title: "Deliverable approved",
        body: `Your work for ${hire.packageTitle} was approved and paid out.`,
        link: `/creator/hires/${hire.id}`,
        createdAt: approvedAt,
      });
    }

  });

  const nextDeliverable = await getDeliverableRowById(deliverable.id);
  return { ok: true as const, hire: await getInstantHireRecordById(hire.id), deliverable: nextDeliverable ? toDeliverableRecord(nextDeliverable) : undefined };
}

export async function refundInstantHire(input: {
  hireId: string;
  brandUserId: string;
  reason: string;
}) {
  const hire = await getInstantHireRecordById(input.hireId);

  if (!hire) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  if (hire.brandUserId !== input.brandUserId) {
    return { ok: false as const, error: "not-authorized" as const };
  }

  if (hire.status === "approved" || hire.status === "cancelled" || hire.escrowStatus !== "held-local") {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const reason = input.reason.trim();

  if (!reason) {
    return { ok: false as const, error: "missing-feedback" as const };
  }

  const brandWallet = await getWalletAccountRowById(hire.brandWalletId);

  if (!brandWallet) {
    return { ok: false as const, error: "hire-not-found" as const };
  }

  const refundAt = new Date().toISOString();
  const agreedPriceValue = parsePrice(hire.agreedPrice);

  if (brandWallet.held_balance < agreedPriceValue) {
    return { ok: false as const, error: "invalid-hire-state" as const };
  }

  const db = await ensureInstantHireTables();

  await db.transaction(async (transactionDatabase) => {
    await transactionDatabase.prepare(
      `UPDATE wallet_accounts
       SET balance = ?, held_balance = ?, updated_at = ?
       WHERE id = ?`
    ).run([brandWallet.balance + agreedPriceValue, brandWallet.held_balance - agreedPriceValue, refundAt, brandWallet.id]);

    await createWalletTransaction(transactionDatabase, {
      walletId: brandWallet.id,
      type: "refund",
      amount: agreedPriceValue,
      currency: brandWallet.currency,
      referenceType: "campaign_hire",
      referenceId: hire.id,
      note: `Escrow refunded for ${hire.packageTitle}`,
      createdAt: refundAt,
    });

    await updateInstantHireState(transactionDatabase, {
      hireId: hire.id,
      status: "cancelled",
      escrowStatus: "refunded-local",
      updatedAt: refundAt,
    });

    await appendConversationMessage(transactionDatabase, {
      conversationId: hire.conversationId,
      senderId: localSystemSenderId,
      content: `Hire cancelled and escrow refunded to the brand wallet for ${hire.packageTitle}.`,
      createdAt: refundAt,
    });

    await appendConversationMessage(transactionDatabase, {
      conversationId: hire.conversationId,
      senderId: input.brandUserId,
      content: reason,
      createdAt: new Date(Date.parse(refundAt) + 1).toISOString(),
    });

    await createNotification(transactionDatabase, {
      userId: hire.brandUserId,
      type: "hire_refunded",
      title: "Hire refunded",
      body: reason,
      link: `/dashboard/hires/${hire.id}`,
      createdAt: refundAt,
    });

    if (hire.creatorAuthUserId) {
      await createNotification(transactionDatabase, {
        userId: hire.creatorAuthUserId,
        type: "hire_refunded",
        title: "Hire cancelled",
        body: reason,
        link: `/creator/hires/${hire.id}`,
        createdAt: refundAt,
      });
    }

  });

  return { ok: true as const, hire: await getInstantHireRecordById(hire.id) };
}

export async function createInstantHireRecord(input: {
  packageId: string;
  brandUserId: string;
  deliveryDeadline: string;
  brief: string;
}) {
  const packageSelection = await getCreatorPackageByCheckoutId(input.packageId);

  if (!packageSelection) {
    return { ok: false as const, error: "package-not-found" as const };
  }

  const agreedPriceValue = parsePrice(packageSelection.package.price);

  if (!Number.isFinite(agreedPriceValue) || agreedPriceValue <= 0) {
    return { ok: false as const, error: "package-not-found" as const };
  }

  const db = await ensureInstantHireTables();
  const createdAt = new Date().toISOString();
  const hireId = `hire_${randomUUID()}`;
  const conversationId = `conv_${randomUUID()}`;
  const trackingLink = `trk_${hireId}`;
  const creatorParticipantId = getCreatorParticipantId(packageSelection.creator.username, packageSelection.creator.authUserId ?? null);

  try {
    await db.transaction(async (transactionDatabase) => {
      const brandWallet = await ensureWalletAccount(transactionDatabase, input.brandUserId, defaultBrandWalletBalance, "USD", createdAt);
      const creatorWallet = await ensureWalletAccount(transactionDatabase, creatorParticipantId, 0, "USD", createdAt);

      if (brandWallet.balance < agreedPriceValue) {
        throw new Error("insufficient-wallet-balance");
      }

      const escrowTransactionId = await createWalletTransaction(transactionDatabase, {
        walletId: brandWallet.id,
        type: "escrow_hold",
        amount: agreedPriceValue,
        currency: "USD",
        referenceType: "campaign_hire",
        referenceId: hireId,
        note: `Escrow hold for ${packageSelection.package.title}`,
        createdAt,
      });

      await transactionDatabase.prepare(
        `UPDATE wallet_accounts
         SET balance = ?, held_balance = ?, updated_at = ?
         WHERE id = ?`
      ).run([brandWallet.balance - agreedPriceValue, brandWallet.held_balance + agreedPriceValue, createdAt, brandWallet.id]);

      await transactionDatabase.prepare(
        `INSERT INTO conversations (id, type, reference_id, participant_ids_json, last_message_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run([conversationId, "hire", hireId, JSON.stringify([input.brandUserId, creatorParticipantId]), createdAt, createdAt]);

      await transactionDatabase.prepare(
        `INSERT INTO messages (id, conversation_id, sender_id, content, media_urls_json, read_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run([
        `msg_${randomUUID()}`,
        conversationId,
        localSystemSenderId,
        `Instant hire created for ${packageSelection.creator.name} on package ${packageSelection.package.title}.`,
        JSON.stringify([]),
        createdAt,
        createdAt,
      ]);

      const briefMessageCreatedAt = new Date(Date.now() + 1).toISOString();

      await transactionDatabase.prepare(
        `INSERT INTO messages (id, conversation_id, sender_id, content, media_urls_json, read_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run([
        `msg_${randomUUID()}`,
        conversationId,
        input.brandUserId,
        input.brief,
        JSON.stringify([]),
        null,
        briefMessageCreatedAt,
      ]);

      await transactionDatabase.prepare("UPDATE conversations SET last_message_at = ? WHERE id = ?").run([briefMessageCreatedAt, conversationId]);

      await transactionDatabase.prepare(
        `INSERT INTO instant_hires (
        id,
        package_id,
        brand_user_id,
        creator_participant_id,
        creator_auth_user_id,
        creator_username,
        creator_name,
        package_title,
        package_price,
        agreed_price,
        delivery_deadline,
        brief,
        hire_type,
        status,
        escrow_status,
        tracking_link,
        conversation_id,
        brand_wallet_id,
        creator_wallet_id,
        escrow_transaction_id,
        created_at,
        updated_at
      ) VALUES (
        :id,
        :package_id,
        :brand_user_id,
        :creator_participant_id,
        :creator_auth_user_id,
        :creator_username,
        :creator_name,
        :package_title,
        :package_price,
        :agreed_price,
        :delivery_deadline,
        :brief,
        :hire_type,
        :status,
        :escrow_status,
        :tracking_link,
        :conversation_id,
        :brand_wallet_id,
        :creator_wallet_id,
        :escrow_transaction_id,
        :created_at,
        :updated_at
      )`
      ).run({
        id: hireId,
        package_id: input.packageId,
        brand_user_id: input.brandUserId,
        creator_participant_id: creatorParticipantId,
        creator_auth_user_id: packageSelection.creator.authUserId ?? null,
        creator_username: packageSelection.creator.username,
        creator_name: packageSelection.creator.name,
        package_title: packageSelection.package.title,
        package_price: packageSelection.package.price,
        agreed_price: packageSelection.package.price,
        delivery_deadline: input.deliveryDeadline,
        brief: input.brief,
        hire_type: "instant",
        status: "accepted",
        escrow_status: "held-local",
        tracking_link: trackingLink,
        conversation_id: conversationId,
        brand_wallet_id: brandWallet.id,
        creator_wallet_id: creatorWallet.id,
        escrow_transaction_id: escrowTransactionId,
        created_at: createdAt,
        updated_at: createdAt,
      });

      await createNotification(transactionDatabase, {
        userId: input.brandUserId,
        type: "hire_created",
        title: "Instant hire created",
        body: `Your hire for ${packageSelection.package.title} is live and escrow is held.`,
        link: `/dashboard/hires/${hireId}`,
        createdAt,
      });

      if (packageSelection.creator.authUserId) {
        await createNotification(transactionDatabase, {
          userId: packageSelection.creator.authUserId,
          type: "hire_created",
          title: "New instant hire",
          body: `A brand hired your ${packageSelection.package.title} package.`,
          link: `/creator/hires/${hireId}`,
          createdAt,
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "insufficient-wallet-balance") {
      return { ok: false as const, error: "insufficient-wallet-balance" as const };
    }

    throw error;
  }

  const hire = await getInstantHireRecordById(hireId);
  return hire ? { ok: true as const, hire } : { ok: false as const, error: "package-not-found" as const };
}