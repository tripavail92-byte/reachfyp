import Link from "next/link";
import { listAllPayoutRequests, listAuthUsersByRole } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

type AdminPayoutsPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

const adminPayoutStatusMessages: Record<string, string> = {
  reviewed: "The payout request review action was saved.",
};

const adminPayoutErrorMessages: Record<string, string> = {
  "deliverable-not-found": "That payout request could not be found or is already closed.",
  "invalid-hire-state": "The creator wallet no longer has enough balance for this payout approval.",
  "missing-feedback": "Add an admin note before approving or rejecting the request.",
};

export default async function AdminPayoutsPage({ searchParams }: AdminPayoutsPageProps) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=admin-sign-in&redirectTo=%2Fadmin%2Fpayouts");
  }

  if (currentUser.role !== "admin") {
    redirect("/creators");
  }

  const payoutRequests = await listAllPayoutRequests();
  const creatorNameById = new Map((await listAuthUsersByRole("creator")).map((creatorUser) => [creatorUser.id, creatorUser.name]));
  const pendingRequests = payoutRequests.filter((request) => request.status === "pending");
  const reviewedRequests = payoutRequests.filter((request) => request.status !== "pending");
  const pendingAmount = pendingRequests.reduce((total, request) => total + request.amount, 0);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const feedbackMessage =
    (resolvedSearchParams?.error ? adminPayoutErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? adminPayoutStatusMessages[resolvedSearchParams.status] : undefined);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/admin/payouts" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Admin payout operations</p>
              <h1 className="hero-card__title">Review creator payout requests against the live local wallet state.</h1>
            </div>
            <div className="sort-badge">Pending: {payoutRequests.filter((request) => request.status === "pending").length}</div>
          </div>
          <p className="hero-card__copy">
            Payout requests are now a server-owned workflow. Admin approval deducts the creator wallet balance and writes a withdrawal transaction; rejection preserves the wallet and records the decision note.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
          <div className="auth-actions">
            <Link className="chip" href="/admin/hires">
              Open hire moderation
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Admin payout summary">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Pending requests</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{pendingRequests.length}</strong>
            <p className="profile-score-card__copy">Items that still need an approval or rejection decision.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Pending amount</span>
            <strong className="profile-score-card__value profile-score-card__value--small">${pendingAmount.toFixed(2)}</strong>
            <p className="profile-score-card__copy">The amount currently reserved in the payout review queue.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Reviewed requests</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{reviewedRequests.length}</strong>
            <p className="profile-score-card__copy">Completed payout decisions retained for wallet audit history.</p>
          </GlassPanel>
        </section>

        <section className="profile-sections">
          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Pending payout queue</h2>
                <p className="results-toolbar__subtitle">Only active payout decisions keep their forms inline so the route reads like an approval queue first.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                <div key={request.id} className="profile-list-card">
                  <h3 className="panel-card-title">${request.amount.toFixed(2)} · {request.status}</h3>
                  <p className="profile-list-card__copy">Creator: {creatorNameById.get(request.creatorUserId) ?? request.creatorUserId}</p>
                  <p className="profile-list-card__copy">{request.note}</p>
                  <div className="auth-layout" aria-label="Payout review actions">
                    <form action={`/admin/payouts/${request.id}/review`} className="auth-form" method="post">
                      <input name="action" type="hidden" value="approve" />
                      <label className="auth-field">
                        <span className="auth-field__label">Approval note</span>
                        <textarea className="auth-input auth-input--textarea" name="adminNote" placeholder="Explain the approval decision for audit history." required rows={3} />
                      </label>
                      <button className="chip chip--solid" type="submit">
                        Approve payout
                      </button>
                    </form>
                    <form action={`/admin/payouts/${request.id}/review`} className="auth-form" method="post">
                      <input name="action" type="hidden" value="reject" />
                      <label className="auth-field">
                        <span className="auth-field__label">Rejection note</span>
                        <textarea className="auth-input auth-input--textarea" name="adminNote" placeholder="Explain why the payout request is being rejected." required rows={3} />
                      </label>
                      <button className="chip" type="submit">
                        Reject payout
                      </button>
                    </form>
                  </div>
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No pending payout requests</h3>
                  <p className="profile-list-card__copy">New creator payout requests will surface here first when admin action is needed.</p>
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Reviewed history</h2>
                <p className="results-toolbar__subtitle">Approved and rejected requests remain visible without the action forms so the decision trail is easier to scan.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {reviewedRequests.length > 0 ? reviewedRequests.map((request) => (
                <div key={request.id} className="profile-list-card">
                  <h3 className="panel-card-title">${request.amount.toFixed(2)} · {request.status}</h3>
                  <p className="profile-list-card__copy">Creator: {creatorNameById.get(request.creatorUserId) ?? request.creatorUserId}</p>
                  <p className="profile-list-card__copy">{request.note}</p>
                  {request.adminNote ? <p className="profile-list-card__copy">Admin note: {request.adminNote}</p> : null}
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No reviewed payout requests yet</h3>
                  <p className="profile-list-card__copy">Completed payout decisions will accumulate here after the first approvals or rejections.</p>
                </div>
              )}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}