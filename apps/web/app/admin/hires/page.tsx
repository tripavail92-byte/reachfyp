import Link from "next/link";
import { listAllInstantHires } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

type AdminHiresPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

const adminHireStatusMessages: Record<string, string> = {
  moderated: "The admin moderation action was applied to the selected hire.",
};

const adminHireErrorMessages: Record<string, string> = {
  "deliverable-not-found": "Admin release requires an existing deliverable on the hire.",
  "invalid-hire-state": "That moderation action is not valid for the current hire state.",
  "missing-feedback": "Add a moderation note before applying the action.",
};

export default async function AdminHiresPage({ searchParams }: AdminHiresPageProps) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=admin-sign-in&redirectTo=%2Fadmin%2Fhires");
  }

  if (currentUser.role !== "admin") {
    redirect("/creators");
  }

  const hires = await listAllInstantHires();
  const actionableHires = hires.filter(
    (hire) => hire.escrowStatus === "held-local" && hire.status !== "approved" && hire.status !== "cancelled",
  );
  const closedHires = hires.filter((hire) => !actionableHires.some((actionableHire) => actionableHire.id === hire.id));
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const feedbackMessage =
    (resolvedSearchParams?.error ? adminHireErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? adminHireStatusMessages[resolvedSearchParams.status] : undefined);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/admin/hires" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Admin hire moderation</p>
              <h1 className="hero-card__title">Resolve exceptional hire states without bypassing the server-owned ledger.</h1>
            </div>
            <div className="sort-badge">Admin operations</div>
          </div>
          <p className="hero-card__copy">
            Admin moderation is intentionally separate from brand review. The admin route can force release or force refund while still updating hire state, wallet ledgers, conversation history, and notifications through the same backend boundary.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
          <div className="auth-actions">
            <Link className="chip" href="/admin/payouts">
              Open payout operations
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Admin moderation summary">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Needs admin action</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{actionableHires.length}</strong>
            <p className="profile-score-card__copy">Held hires that can still be force released or force refunded.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Submitted work</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hires.filter((hire) => hire.status === "submitted").length}</strong>
            <p className="profile-score-card__copy">Delivered hires that may need admin intervention instead of a brand-only review.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Cancelled</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hires.filter((hire) => hire.status === "cancelled").length}</strong>
            <p className="profile-score-card__copy">Refunded or cancelled outcomes preserved for audit history.</p>
          </GlassPanel>
        </section>

        <section className="profile-sections">
          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Needs admin action</h2>
                <p className="results-toolbar__subtitle">The live moderation forms stay only on actionable hires so the queue reads like an operations inbox instead of a mixed audit dump.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {actionableHires.length > 0 ? actionableHires.map((hire) => (
                <div key={hire.id} className="profile-list-card">
                  <h3 className="panel-card-title">{hire.packageTitle}</h3>
                  <p className="profile-list-card__copy">Creator: {hire.creatorName}</p>
                  <p className="profile-list-card__copy">Status: {hire.status} · Escrow: {hire.escrowStatus}</p>
                  <div className="auth-actions">
                    <Link className="chip" href={`/dashboard/hires/${hire.id}`}>
                      Open hire detail
                    </Link>
                    <Link className="chip" href={`/dashboard/messages/${hire.conversationId}`}>
                      Open thread
                    </Link>
                  </div>
                  <div className="auth-layout" aria-label="Admin moderation actions">
                    <form action={`/admin/hires/${hire.id}/moderate`} className="auth-form" method="post">
                      <input name="action" type="hidden" value="force_release" />
                      <label className="auth-field">
                        <span className="auth-field__label">Force release note</span>
                        <textarea className="auth-input auth-input--textarea" name="note" placeholder="Explain why admin is releasing the held escrow." required rows={3} />
                      </label>
                      <button className="chip chip--solid" type="submit">
                        Force release escrow
                      </button>
                    </form>
                    <form action={`/admin/hires/${hire.id}/moderate`} className="auth-form" method="post">
                      <input name="action" type="hidden" value="force_refund" />
                      <label className="auth-field">
                        <span className="auth-field__label">Force refund note</span>
                        <textarea className="auth-input auth-input--textarea" name="note" placeholder="Explain why admin is refunding the held escrow." required rows={3} />
                      </label>
                      <button className="chip" type="submit">
                        Force refund escrow
                      </button>
                    </form>
                  </div>
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No active moderation items</h3>
                  <p className="profile-list-card__copy">All current hires are either resolved, released, or already cancelled.</p>
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Audit history</h2>
                <p className="results-toolbar__subtitle">Resolved and non-actionable hires stay visible here without repeating the moderation forms.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {closedHires.length > 0 ? closedHires.map((hire) => (
                <div key={hire.id} className="profile-list-card">
                  <h3 className="panel-card-title">{hire.packageTitle}</h3>
                  <p className="profile-list-card__copy">Creator: {hire.creatorName}</p>
                  <p className="profile-list-card__copy">Status: {hire.status} · Escrow: {hire.escrowStatus}</p>
                  <div className="auth-actions">
                    <Link className="chip chip--solid" href={`/dashboard/hires/${hire.id}`}>
                      Open hire detail
                    </Link>
                    <Link className="chip" href={`/dashboard/messages/${hire.conversationId}`}>
                      Open thread
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No audit history yet</h3>
                  <p className="profile-list-card__copy">Resolved moderation outcomes will accumulate here as the queue grows.</p>
                </div>
              )}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}