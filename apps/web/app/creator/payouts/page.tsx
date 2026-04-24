import { getWalletAccountByUserId, listPayoutRequestsForCreator } from "@reachfyp/api";
import Link from "next/link";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

type CreatorPayoutsPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

const payoutStatusMessages: Record<string, string> = {
  requested: "Your payout request is queued for admin review.",
};

const payoutErrorMessages: Record<string, string> = {
  "invalid-hire-state": "The requested payout amount exceeds your currently available wallet balance after pending requests.",
  "missing-fields": "Enter an amount and a note before creating a payout request.",
  "not-authorized": "Only creator accounts with a wallet balance can request payouts.",
};

export default async function CreatorPayoutsPage({ searchParams }: CreatorPayoutsPageProps) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=creator-sign-in&redirectTo=%2Fcreator%2Fpayouts");
  }

  if (currentUser.role !== "creator") {
    redirect("/creators");
  }

  const wallet = await getWalletAccountByUserId(currentUser.id);
  const payoutRequests = await listPayoutRequestsForCreator(currentUser.id);
  const pendingAmount = payoutRequests.filter((request) => request.status === "pending").reduce((total, request) => total + request.amount, 0);
  const availableToRequest = Math.max((wallet?.balance ?? 0) - pendingAmount, 0);
  const pendingRequests = payoutRequests.filter((request) => request.status === "pending");
  const reviewedRequests = payoutRequests.filter((request) => request.status !== "pending");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const feedbackMessage =
    (resolvedSearchParams?.error ? payoutErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? payoutStatusMessages[resolvedSearchParams.status] : undefined);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creator/payouts" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Creator payouts</p>
              <h1 className="hero-card__title">Request wallet payouts and track admin review status.</h1>
            </div>
          </div>
          <p className="hero-card__copy">
            Approved hires increase the creator wallet immediately. This route turns that local wallet into a server-owned payout queue so creators can request withdrawals without bypassing admin review.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
          <div className="auth-actions">
            <Link className="chip" href="/creator/hires">
              Back to creator hires
            </Link>
            <Link className="chip" href="/dashboard/notifications">
              Open notifications
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Creator payout summary">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Wallet balance</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{wallet ? `$${wallet.balance.toFixed(2)}` : "$0.00"}</strong>
            <p className="profile-score-card__copy">Released hire payouts land here before a creator requests cash-out.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Pending requests</span>
            <strong className="profile-score-card__value profile-score-card__value--small">${pendingAmount.toFixed(2)}</strong>
            <p className="profile-score-card__copy">Pending requests reduce what can be requested again until admin review completes.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Available now</span>
            <strong className="profile-score-card__value profile-score-card__value--small">${availableToRequest.toFixed(2)}</strong>
            <p className="profile-score-card__copy">This is the remaining amount a creator can request after pending payouts are reserved.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Total requests</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{payoutRequests.length}</strong>
            <p className="profile-score-card__copy">All payout requests stay visible for creator-side tracking.</p>
          </GlassPanel>
        </section>

        <section className="profile-sections">
          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Request a payout</h2>
                <p className="results-toolbar__subtitle">The request form stays above history so the next creator action is visible first.</p>
              </div>
            </div>
            <form action="/creator/payouts/request" className="auth-form" method="post">
              <label className="auth-field">
                <span className="auth-field__label">Amount</span>
                <input className="auth-input" name="amount" placeholder="250" required type="text" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Payout note</span>
                <textarea className="auth-input auth-input--textarea" name="note" placeholder="Explain the destination or context for this payout request." required rows={3} />
              </label>
              <div className="auth-actions">
                <button className="chip chip--solid" type="submit">
                  Request payout
                </button>
              </div>
            </form>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Pending review</h2>
                <p className="results-toolbar__subtitle">Active payout requests stay in a separate queue so creators can see reserved balance before scanning older history.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {pendingRequests.length > 0 ? pendingRequests.map((request) => (
                <div key={request.id} className="profile-list-card">
                  <h3 className="panel-card-title">${request.amount.toFixed(2)} · {request.status}</h3>
                  <p className="profile-list-card__copy">{request.note}</p>
                  {request.adminNote ? <p className="profile-list-card__copy">Admin note: {request.adminNote}</p> : null}
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No pending payout requests</h3>
                  <p className="profile-list-card__copy">New requests will appear here while they wait for an admin decision.</p>
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Request history</h2>
                <p className="results-toolbar__subtitle">Reviewed payouts keep the decision note attached so creators can audit the wallet without leaving this route.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {reviewedRequests.length > 0 ? reviewedRequests.map((request) => (
                <div key={request.id} className="profile-list-card">
                  <h3 className="panel-card-title">${request.amount.toFixed(2)} · {request.status}</h3>
                  <p className="profile-list-card__copy">{request.note}</p>
                  {request.adminNote ? <p className="profile-list-card__copy">Admin note: {request.adminNote}</p> : null}
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No reviewed requests yet</h3>
                  <p className="profile-list-card__copy">Approved and rejected payout history will accumulate here after the first review cycle.</p>
                </div>
              )}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}