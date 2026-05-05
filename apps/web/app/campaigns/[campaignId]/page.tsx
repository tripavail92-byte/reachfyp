import Link from "next/link";
import { getCampaignById, getCreatorRecordByAuthUserId, listApplicationsForCreator } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { notFound } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

export const dynamic = "force-dynamic";

type CampaignDetailPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { campaignId } = await params;
  const [campaign, currentUser] = await Promise.all([
    getCampaignById(campaignId),
    getCurrentSessionUser(),
  ]);

  if (!campaign || campaign.status !== "open") {
    notFound();
  }

  const isCreator = currentUser?.role === "creator";

  // Check if creator already applied
  let alreadyApplied = false;
  let creatorProfile = null;
  if (isCreator && currentUser) {
    const [applications, profile] = await Promise.all([
      listApplicationsForCreator(currentUser.id),
      getCreatorRecordByAuthUserId(currentUser.id),
    ]);
    alreadyApplied = applications.some(
      (a) => a.campaignId === campaignId && a.status !== "withdrawn",
    );
    creatorProfile = profile;
  }

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/campaigns" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">{campaign.objective}</p>
              <h1 className="hero-card__title">{campaign.title}</h1>
            </div>
            <span className="sort-badge">Budget {campaign.budget} {campaign.currency}</span>
          </div>
          <p className="hero-card__copy">{campaign.description}</p>
          <div className="metric-strip">
            {campaign.platforms.map((p) => (
              <span key={p} className="chip">{p}</span>
            ))}
            {campaign.niche.map((n) => (
              <span key={n} className="chip">{n}</span>
            ))}
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Campaign details">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Start date</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{campaign.timelineStart}</strong>
            <p className="profile-score-card__copy">Campaign start</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">End date</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{campaign.timelineEnd}</strong>
            <p className="profile-score-card__copy">Delivery deadline</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Budget</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{campaign.budget}</strong>
            <p className="profile-score-card__copy">{campaign.currency}</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Objective</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{campaign.objective}</strong>
            <p className="profile-score-card__copy">Campaign goal</p>
          </GlassPanel>
        </section>

        <section className="profile-sections" aria-label="Campaign brief">
          <GlassPanel className="auth-panel">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">Deliverables</p>
                <h2 className="product-card__title">What the brand needs delivered</h2>
              </div>
            </div>
            <p className="product-card__copy">{campaign.deliverables}</p>
          </GlassPanel>

          {campaign.requirements && (
            <GlassPanel className="auth-panel">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Requirements</p>
                  <h2 className="product-card__title">Creator requirements</h2>
                </div>
              </div>
              <p className="product-card__copy">{campaign.requirements}</p>
            </GlassPanel>
          )}
        </section>

        {isCreator ? (
          <section className="auth-layout" aria-label="Apply to campaign" id="apply">
            {alreadyApplied ? (
              <GlassPanel className="auth-panel auth-panel--highlight">
                <div className="product-card__header">
                  <div>
                    <p className="foundation-eyebrow">Application submitted</p>
                    <h2 className="product-card__title">Your application is under review.</h2>
                  </div>
                  <span className="badge badge--accent">Pending</span>
                </div>
                <p className="product-card__copy">
                  The brand will review your message and proposed price. Check your applications in your creator profile.
                </p>
                <div className="auth-actions">
                  <Link className="chip" href="/creator/hires">
                    View applications
                  </Link>
                </div>
              </GlassPanel>
            ) : creatorProfile ? (
              <GlassPanel className="auth-panel">
                <div className="product-card__header">
                  <div>
                    <p className="foundation-eyebrow">Apply to campaign</p>
                    <h2 className="product-card__title">Submit your application as @{creatorProfile.username}</h2>
                  </div>
                </div>
                <form action={`/campaigns/${campaignId}/apply`} className="auth-form" method="post">
                  <label className="auth-field">
                    <span className="auth-field__label">Message to brand</span>
                    <textarea
                      className="auth-input auth-input--textarea"
                      name="message"
                      placeholder="Explain why you are a great fit for this campaign and how you plan to deliver."
                      required
                      rows={5}
                    />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field__label">Proposed price (USD)</span>
                    <input
                      className="auth-input"
                      name="proposedPrice"
                      placeholder="800"
                      required
                      type="text"
                    />
                  </label>
                  <div className="auth-actions">
                    <button className="chip chip--solid" type="submit">
                      Submit application
                    </button>
                    <Link className="chip" href="/campaigns">
                      Back to campaigns
                    </Link>
                  </div>
                </form>
              </GlassPanel>
            ) : (
              <GlassPanel className="auth-panel auth-panel--highlight">
                <div className="product-card__header">
                  <div>
                    <p className="foundation-eyebrow">Profile required</p>
                    <h2 className="product-card__title">Create a public creator profile before applying.</h2>
                  </div>
                </div>
                <div className="auth-actions">
                  <Link className="chip chip--solid" href="/creator/profile">
                    Create profile
                  </Link>
                </div>
              </GlassPanel>
            )}
          </section>
        ) : !currentUser ? (
          <GlassPanel className="product-card product-card--feature">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">Creator account required</p>
                <h2 className="product-card__title">Sign up or sign in as a creator to apply.</h2>
              </div>
              <Link className="chip chip--solid" href="/auth?mode=register-creator">
                Sign up as creator
              </Link>
            </div>
          </GlassPanel>
        ) : null}
      </div>
    </main>
  );
}
