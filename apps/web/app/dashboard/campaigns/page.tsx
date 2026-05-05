import Link from "next/link";
import { listCampaignsForBrand } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function BrandCampaignsPage() {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=brand-sign-in&redirectTo=%2Fdashboard%2Fcampaigns");
  }

  if (currentUser.role === "creator") {
    redirect("/creator/hires");
  }

  const campaigns = await listCampaignsForBrand(currentUser.id);

  const open = campaigns.filter((c) => c.status === "open");
  const inProgress = campaigns.filter((c) => c.status === "in_progress");
  const completed = campaigns.filter((c) => c.status === "completed" || c.status === "cancelled");

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/dashboard/campaigns" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Campaign manager</p>
              <h1 className="hero-card__title">Create briefs, review creator applications, and track campaign hires.</h1>
            </div>
            <div className="sort-badge">Brand operations</div>
          </div>
          <p className="hero-card__copy">
            Each campaign you create is published to the open marketplace where creators can browse and apply.
            Review applications and accept the creators that fit your brief.
          </p>
          <div className="auth-actions">
            <Link className="chip chip--solid" href="/dashboard/campaigns/create">
              Create campaign
            </Link>
            <Link className="chip" href="/campaigns">
              Browse marketplace
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Campaign metrics">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Open campaigns</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{open.length}</strong>
            <p className="profile-score-card__copy">Accepting creator applications now.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">In progress</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{inProgress.length}</strong>
            <p className="profile-score-card__copy">Campaigns with accepted creators delivering work.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Completed</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{completed.length}</strong>
            <p className="profile-score-card__copy">Finished and cancelled campaigns.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Total campaigns</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{campaigns.length}</strong>
            <p className="profile-score-card__copy">All campaigns across all statuses.</p>
          </GlassPanel>
        </section>

        {campaigns.length === 0 ? (
          <GlassPanel className="product-card product-card--feature">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">No campaigns yet</p>
                <h2 className="product-card__title">Create your first campaign to start receiving creator applications.</h2>
              </div>
              <Link className="chip chip--solid" href="/dashboard/campaigns/create">
                Create campaign
              </Link>
            </div>
          </GlassPanel>
        ) : (
          <section className="profile-sections" aria-label="Campaign list">
            {campaigns.map((campaign) => (
              <GlassPanel key={campaign.id} className="product-card">
                <div className="product-card__header">
                  <div>
                    <p className="foundation-eyebrow">{campaign.objective}</p>
                    <h2 className="product-card__title">{campaign.title}</h2>
                  </div>
                  <span className="badge">{statusLabels[campaign.status] ?? campaign.status}</span>
                </div>
                <p className="product-card__copy">{campaign.description}</p>
                <div className="metric-strip">
                  <span className="metric-pill">
                    <span className="metric-pill__label">Budget</span>
                    <span className="metric-pill__value">{campaign.budget} {campaign.currency}</span>
                  </span>
                  <span className="metric-pill">
                    <span className="metric-pill__label">Deadline</span>
                    <span className="metric-pill__value">{campaign.timelineEnd}</span>
                  </span>
                  {campaign.platforms.slice(0, 3).map((p) => (
                    <span key={p} className="chip">{p}</span>
                  ))}
                </div>
                <div className="auth-actions">
                  <Link className="chip chip--solid" href={`/dashboard/campaigns/${campaign.id}`}>
                    Review applications
                  </Link>
                  <Link className="chip" href={`/campaigns/${campaign.id}`}>
                    Public brief
                  </Link>
                </div>
              </GlassPanel>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
