import Link from "next/link";
import { getInstantHireDetailById } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { notFound, redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { MarketplaceTopNav } from "../../../marketplace-top-nav";

type HireDetailPageProps = {
  params: Promise<{
    hireId: string;
  }>;
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

const hireStatusMessages: Record<string, string> = {
  created: "The local instant hire, conversation thread, and escrow hold were created successfully.",
  approved: "The deliverable was approved and the held escrow was released into the creator wallet.",
  refunded: "The hire was cancelled and the held escrow returned to the brand wallet.",
  "revision-requested": "Revision feedback was recorded and the hire moved back to the creator for another submission.",
};

const hireErrorMessages: Record<string, string> = {
  "deliverable-not-found": "That deliverable could not be found on this hire.",
  "invalid-hire-state": "That lifecycle action is not valid for the current hire state.",
  "missing-feedback": "Add revision notes or a refund reason before submitting the action.",
  "not-authorized": "Only the brand on this hire can run review and refund actions.",
};

export default async function HireDetailPage({ params, searchParams }: HireDetailPageProps) {
  const { hireId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect(`/auth?mode=sign-in&redirectTo=${encodeURIComponent(`/dashboard/hires/${hireId}`)}`);
  }

  const hireDetail = await getInstantHireDetailById(hireId);

  if (!hireDetail) {
    notFound();
  }

  const allowedUserIds = [hireDetail.hire.brandUserId, hireDetail.hire.creatorAuthUserId].filter(Boolean);

  if (currentUser.role !== "admin" && !allowedUserIds.includes(currentUser.id)) {
    redirect(`/dashboard/instant-hire/${hireDetail.hire.packageId}`);
  }

  if (currentUser.role === "creator" && currentUser.id === hireDetail.hire.creatorAuthUserId) {
    redirect(`/creator/hires/${hireDetail.hire.id}`);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const feedbackMessage =
    (resolvedSearchParams?.error ? hireErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? hireStatusMessages[resolvedSearchParams.status] : undefined);
  const latestTransaction = hireDetail.brandTransactions[0];
  const latestCreatorTransaction = hireDetail.creatorTransactions[0];
  const brandCanReview = currentUser.role === "brand" && currentUser.id === hireDetail.hire.brandUserId;

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref={currentUser.role === "admin" ? "/admin/hires" : "/dashboard/hires"} />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Hire detail</p>
              <h1 className="hero-card__title">{hireDetail.hire.packageTitle} for {hireDetail.hire.creatorName}</h1>
            </div>
            <div className="sort-badge">Accepted instant hire</div>
          </div>
          <p className="hero-card__copy">
            This route is now the brand operations surface behind the instant-hire checkout. It reads the server-owned hire record, deliverable history, conversation thread, and wallet state from the same command boundary that owns escrow transitions.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
          <div className="auth-actions">
            <Link className="chip chip--solid" href={`/dashboard/messages/${hireDetail.conversation.id}`}>
              Open message thread
            </Link>
            <Link className="chip" href="/dashboard/hires">
              Open brand queue
            </Link>
            <Link className="chip" href="/dashboard/notifications">
              Open notifications
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Hire summary metrics">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Hire status</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.status}</strong>
            <p className="profile-score-card__copy">Instant hires skip invited and land directly in accepted status.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Escrow state</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.escrowStatus}</strong>
            <p className="profile-score-card__copy">Brand balance is reduced and held balance is increased in the local wallet ledger.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Delivery deadline</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.deliveryDeadline}</strong>
            <p className="profile-score-card__copy">The checkout deadline becomes the server-owned deadline on the accepted hire record.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Tracking token</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.trackingLink}</strong>
            <p className="profile-score-card__copy">This token is ready for later delivery and performance events.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Deliverables</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.deliverables.length}</strong>
            <p className="profile-score-card__copy">Each creator submission is stored with its own revision number and review feedback.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Conversation updates</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.messages.length}</strong>
            <p className="profile-score-card__copy">Messages and operational actions now live together so review never depends on a dead-end thread.</p>
          </GlassPanel>
        </section>

        <section className="profile-sections">
          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Primary actions</h2>
                <p className="results-toolbar__subtitle">Review, payout, and refund controls are pulled to the top so the next brand decision is visible before the ledger history.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              <div className="profile-list-card">
                <h3 className="panel-card-title">Conversation</h3>
                <p className="profile-list-card__copy">Use the live thread for clarification before approving or refunding. New replies can now be posted directly in the message route.</p>
                <Link className="chip chip--solid" href={`/dashboard/messages/${hireDetail.conversation.id}`}>
                  Open thread
                </Link>
              </div>
              <div className="profile-list-card">
                <h3 className="panel-card-title">Queue context</h3>
                <p className="profile-list-card__copy">Return to the brand queue or notification feed without losing the current hire context.</p>
                <div className="auth-actions">
                  <Link className="chip" href="/dashboard/hires">Brand queue</Link>
                  <Link className="chip" href="/dashboard/notifications">Notifications</Link>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Wallet and escrow</h2>
                <p className="results-toolbar__subtitle">Server-owned wallet transitions created at the same time as the hire.</p>
              </div>
              <Link className="chip" href={`/dashboard/messages/${hireDetail.conversation.id}`}>Open message thread</Link>
            </div>
            <div className="profile-list-grid">
              <div className="profile-list-card">
                <h3 className="panel-card-title">Brand available balance</h3>
                <p className="profile-list-card__copy">${hireDetail.brandWallet.balance.toFixed(2)}</p>
              </div>
              <div className="profile-list-card">
                <h3 className="panel-card-title">Brand held balance</h3>
                <p className="profile-list-card__copy">${hireDetail.brandWallet.heldBalance.toFixed(2)}</p>
              </div>
              <div className="profile-list-card">
                <h3 className="panel-card-title">Latest escrow ledger entry</h3>
                <p className="profile-list-card__copy">{latestTransaction ? `${latestTransaction.type} · $${latestTransaction.amount.toFixed(2)}` : "No wallet transaction found."}</p>
              </div>
              <div className="profile-list-card">
                <h3 className="panel-card-title">Creator payout ledger</h3>
                <p className="profile-list-card__copy">{latestCreatorTransaction ? `${latestCreatorTransaction.type} · $${latestCreatorTransaction.amount.toFixed(2)}` : "No creator wallet transaction yet."}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Deliverables and review state</h2>
                <p className="results-toolbar__subtitle">The review cards stay in the middle of the page so decisions happen before the lower-level history sections.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {hireDetail.deliverables.length > 0 ? (
                hireDetail.deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="profile-list-card">
                    <h3 className="panel-card-title">Revision {deliverable.revisionNumber}: {deliverable.title}</h3>
                    <p className="profile-list-card__copy">Status: {deliverable.status}</p>
                    <p className="profile-list-card__copy">{deliverable.description}</p>
                    <p className="profile-list-card__copy">Live URL: {deliverable.externalUrl}</p>
                    {deliverable.notes ? <p className="profile-list-card__copy">Notes: {deliverable.notes}</p> : null}
                    {deliverable.reviewFeedback ? <p className="profile-list-card__copy">Feedback: {deliverable.reviewFeedback}</p> : null}
                    {brandCanReview && deliverable.status === "submitted" ? (
                      <div className="auth-layout" aria-label="Hire review actions">
                        <form action={`/dashboard/hires/${hireDetail.hire.id}/lifecycle`} className="auth-form" method="post">
                          <input name="action" type="hidden" value="request-revision" />
                          <input name="deliverableId" type="hidden" value={deliverable.id} />
                          <label className="auth-field">
                            <span className="auth-field__label">Revision feedback</span>
                            <textarea className="auth-input auth-input--textarea" name="feedback" placeholder="Explain what should change in the next cut." required rows={3} />
                          </label>
                          <button className="chip" type="submit">
                            Request revision
                          </button>
                        </form>
                        <form action={`/dashboard/hires/${hireDetail.hire.id}/lifecycle`} className="auth-form" method="post">
                          <input name="action" type="hidden" value="approve" />
                          <input name="deliverableId" type="hidden" value={deliverable.id} />
                          <label className="auth-field">
                            <span className="auth-field__label">Approval note</span>
                            <textarea className="auth-input auth-input--textarea" name="feedback" placeholder="Optional note for the creator after approval." rows={3} />
                          </label>
                          <button className="chip chip--solid" type="submit">
                            Approve and release escrow
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No deliverables yet</h3>
                  <p className="profile-list-card__copy">The creator-visible route will submit the first deliverable here once work begins.</p>
                </div>
              )}
            </div>
          </GlassPanel>

          {brandCanReview && hireDetail.hire.escrowStatus === "held-local" && hireDetail.hire.status !== "approved" && hireDetail.hire.status !== "cancelled" ? (
            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Refund transition</h2>
                  <p className="results-toolbar__subtitle">Use this only when the hire should be cancelled and the held escrow returned to the brand wallet.</p>
                </div>
              </div>
              <form action={`/dashboard/hires/${hireDetail.hire.id}/lifecycle`} className="auth-form" method="post">
                <input name="action" type="hidden" value="refund" />
                <label className="auth-field">
                  <span className="auth-field__label">Refund reason</span>
                  <textarea className="auth-input auth-input--textarea" name="reason" placeholder="Explain why the hire is being cancelled and refunded." required rows={3} />
                </label>
                <div className="auth-actions">
                  <button className="chip" type="submit">
                    Cancel hire and refund escrow
                  </button>
                </div>
              </form>
            </GlassPanel>
          ) : null}

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Conversation bootstrap</h2>
                <p className="results-toolbar__subtitle">A hire-scoped thread is created automatically as part of the instant-hire command.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {hireDetail.messages.map((message) => (
                <div key={message.id} className="profile-list-card">
                  <h3 className="panel-card-title">{message.senderId === "system" ? "System" : message.senderId === hireDetail.hire.brandUserId ? "Brand brief" : "Creator"}</h3>
                  <p className="profile-list-card__copy">{message.content}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}