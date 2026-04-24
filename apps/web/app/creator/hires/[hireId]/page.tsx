import Link from "next/link";
import { getCreatorRecordByAuthUserId, getInstantHireDetailById } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { notFound, redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { MarketplaceTopNav } from "../../../marketplace-top-nav";

type CreatorHireDetailPageProps = {
  params: Promise<{
    hireId: string;
  }>;
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

const creatorStatusMessages: Record<string, string> = {
  submitted: "Your deliverable was submitted into the hire thread and the hire moved into brand review.",
};

const creatorErrorMessages: Record<string, string> = {
  "deliverable-already-submitted": "A deliverable is already waiting for brand review on this hire.",
  "invalid-external-url": "Use valid http or https links for the live post and optional asset files.",
  "invalid-hire-state": "This hire is no longer accepting creator submissions in its current state.",
  "missing-fields": "Enter a title, description, and external URL before submitting a deliverable.",
  "not-authorized": "This hire is not attached to your claimed creator account.",
};

export default async function CreatorHireDetailPage({ params, searchParams }: CreatorHireDetailPageProps) {
  const { hireId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect(`/auth?mode=creator-sign-in&redirectTo=${encodeURIComponent(`/creator/hires/${hireId}`)}`);
  }

  if (currentUser.role !== "creator") {
    redirect("/creators");
  }

  const creatorProfile = getCreatorRecordByAuthUserId(currentUser.id);

  if (!creatorProfile) {
    redirect("/creator/profile");
  }

  const hireDetail = getInstantHireDetailById(hireId);

  if (!hireDetail) {
    notFound();
  }

  if (hireDetail.hire.creatorAuthUserId !== currentUser.id) {
    redirect("/creator/hires");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const feedbackMessage =
    (resolvedSearchParams?.error ? creatorErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? creatorStatusMessages[resolvedSearchParams.status] : undefined);
  const latestDeliverable = hireDetail.deliverables[hireDetail.deliverables.length - 1];
  const canSubmitDeliverable =
    hireDetail.hire.escrowStatus === "held-local" &&
    hireDetail.hire.status !== "submitted" &&
    hireDetail.hire.status !== "approved" &&
    hireDetail.hire.status !== "cancelled";

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creator/hires" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Creator hire detail</p>
              <h1 className="hero-card__title">{hireDetail.hire.packageTitle} for {hireDetail.hire.creatorName}</h1>
            </div>
            <Link className="chip" href="/creator/hires">
              Back to creator hires
            </Link>
          </div>
          <p className="hero-card__copy">
            This route gives claimed creators a direct operational surface for deliverable submissions, revision feedback, and payout state without falling back to synthetic participant identities.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
          <div className="auth-actions">
            <Link className="chip chip--solid" href={`/dashboard/messages/${hireDetail.conversation.id}`}>
              Open message thread
            </Link>
            <Link className="chip" href="/creator/payouts">
              Open payouts
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Creator hire summary">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Hire status</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.status}</strong>
            <p className="profile-score-card__copy">The brand review state updates immediately after each creator submission or brand review action.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Escrow state</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.escrowStatus}</strong>
            <p className="profile-score-card__copy">Held funds stay local until the brand approves a deliverable or cancels and refunds the hire.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Deadline</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.hire.deliveryDeadline}</strong>
            <p className="profile-score-card__copy">Use the conversation thread to align delivery timing if the brief needs clarification.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Creator wallet</span>
            <strong className="profile-score-card__value profile-score-card__value--small">${hireDetail.creatorWallet.balance.toFixed(2)}</strong>
            <p className="profile-score-card__copy">Your wallet balance increases only after the brand approves and the held escrow is released.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Revisions</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{hireDetail.deliverables.length}</strong>
            <p className="profile-score-card__copy">Each new creator submission is preserved so the latest ask and latest cut stay visible together.</p>
          </GlassPanel>
        </section>

        <section className="profile-sections">
          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Next action</h2>
                <p className="results-toolbar__subtitle">The main creator action stays above the historical record so the page reads as an operational workspace.</p>
              </div>
            </div>

            {canSubmitDeliverable ? (
              <form action={`/creator/hires/${hireDetail.hire.id}/deliverables`} className="auth-form" method="post">
                <label className="auth-field">
                  <span className="auth-field__label">Deliverable title</span>
                  <input className="auth-input" name="title" placeholder="UGC V1 cutdown" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Description</span>
                  <textarea className="auth-input auth-input--textarea" name="description" placeholder="Lead with what changed and what the brand should review first." required rows={4} />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">External URL</span>
                  <input className="auth-input" name="externalUrl" placeholder="https://drive.google.com/..." required type="url" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Asset file URLs</span>
                  <textarea className="auth-input auth-input--textarea" name="fileUrls" placeholder="Optional asset links separated by commas or new lines." rows={3} />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Creator notes</span>
                  <textarea className="auth-input auth-input--textarea" name="notes" placeholder="Optional review notes for the brand." rows={3} />
                </label>
                <div className="auth-actions">
                  <button className="chip chip--solid" type="submit">
                    Submit deliverable
                  </button>
                  <Link className="chip" href={`/dashboard/messages/${hireDetail.conversation.id}`}>
                    Ask a question first
                  </Link>
                </div>
              </form>
            ) : (
              <div className="profile-list-grid">
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Submission locked</h3>
                  <p className="profile-list-card__copy">This hire is already in review, approved, or refunded. Use the thread and payouts workspace for the next step instead of submitting another cut here.</p>
                </div>
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Brief and thread</h2>
                <p className="results-toolbar__subtitle">The original brand brief and the live hire conversation stay on the same server-owned record.</p>
              </div>
              <Link className="chip" href={`/dashboard/messages/${hireDetail.conversation.id}`}>Open message thread</Link>
            </div>
            <div className="profile-list-grid">
              <div className="profile-list-card">
                <h3 className="panel-card-title">Brand brief</h3>
                <p className="profile-list-card__copy">{hireDetail.hire.brief}</p>
              </div>
              {latestDeliverable?.status === "revision_requested" && latestDeliverable.reviewFeedback ? (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Latest revision feedback</h3>
                  <p className="profile-list-card__copy">{latestDeliverable.reviewFeedback}</p>
                </div>
              ) : null}
            </div>
          </GlassPanel>

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Revision history</h2>
                <p className="results-toolbar__subtitle">Past cuts and feedback stay grouped below the main action area so history does not compete with the next task.</p>
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
                  </div>
                ))
              ) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">No deliverable submitted yet</h3>
                  <p className="profile-list-card__copy">Use the submission form above to move this hire into brand review.</p>
                </div>
              )}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}