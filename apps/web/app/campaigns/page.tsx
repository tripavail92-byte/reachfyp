import Link from "next/link";
import { listOpenCampaigns } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { getCurrentSessionUser } from "../../lib/auth/session";
import { MarketplaceTopNav } from "../marketplace-top-nav";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [currentUser, campaigns] = await Promise.all([
    getCurrentSessionUser(),
    listOpenCampaigns(),
  ]);

  const isBrand = currentUser?.role === "brand";
  const isCreator = currentUser?.role === "creator";

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/campaigns" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Campaigns</p>
              <h1 className="hero-card__title">Open campaigns from brands looking for creators to deliver real results.</h1>
            </div>
            <div className="sort-badge">{campaigns.length} open now</div>
          </div>
          <p className="hero-card__copy">
            Browse active briefs, filter by platform or niche, and apply with a message and proposed price.
            Accepted applications become a managed hire with the full deliverable and escrow workflow.
          </p>
          {isBrand ? (
            <div className="auth-actions">
              <Link className="chip chip--solid" href="/dashboard/campaigns/create">
                Create campaign
              </Link>
              <Link className="chip" href="/dashboard/campaigns">
                My campaigns
              </Link>
            </div>
          ) : !currentUser ? (
            <div className="auth-actions">
              <Link className="chip chip--solid" href="/auth?mode=register-creator">
                Sign up as creator
              </Link>
            </div>
          ) : null}
        </GlassPanel>

        {campaigns.length === 0 ? (
          <GlassPanel className="product-card">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">No open campaigns</p>
                <h2 className="product-card__title">No campaigns are open right now.</h2>
              </div>
              <span className="badge">Check back soon</span>
            </div>
            <p className="product-card__copy">
              Brands post campaigns here when they are ready to review creator applications.
              {isBrand ? " Use the button above to create the first one." : ""}
            </p>
          </GlassPanel>
        ) : (
          <section className="profile-sections" aria-label="Open campaigns">
            {campaigns.map((campaign) => (
              <GlassPanel key={campaign.id} className="product-card">
                <div className="product-card__header">
                  <div>
                    <p className="foundation-eyebrow">{campaign.objective}</p>
                    <h2 className="product-card__title">{campaign.title}</h2>
                  </div>
                  <span className="badge">Budget {campaign.budget} {campaign.currency}</span>
                </div>
                <p className="product-card__copy">{campaign.description}</p>
                <div className="metric-strip">
                  {campaign.platforms.map((p) => (
                    <span key={p} className="chip">{p}</span>
                  ))}
                  {campaign.niche.map((n) => (
                    <span key={n} className="chip">{n}</span>
                  ))}
                  <span className="metric-pill">
                    <span className="metric-pill__label">Deadline</span>
                    <span className="metric-pill__value">{campaign.timelineEnd}</span>
                  </span>
                </div>
                <div className="auth-actions">
                  <Link className="chip chip--solid" href={`/campaigns/${campaign.id}`}>
                    View brief
                  </Link>
                  {isCreator ? (
                    <Link className="chip" href={`/campaigns/${campaign.id}#apply`}>
                      Apply
                    </Link>
                  ) : null}
                </div>
              </GlassPanel>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
