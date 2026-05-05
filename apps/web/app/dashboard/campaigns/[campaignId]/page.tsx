import Link from "next/link";
import { getCampaignById, listApplicationsForCampaign } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { notFound, redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { MarketplaceTopNav } from "../../../marketplace-top-nav";

export const dynamic = "force-dynamic";

type BrandCampaignDetailPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams?: Promise<{ status?: string; error?: string }>;
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default async function BrandCampaignDetailPage({ params, searchParams }: BrandCampaignDetailPageProps) {
  const { campaignId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect(`/auth?mode=brand-sign-in&redirectTo=%2Fdashboard%2Fcampaigns%2F${campaignId}`);
  }

  if (currentUser.role === "creator") {
    redirect(`/campaigns/${campaignId}`);
  }

  const [campaign, applications] = await Promise.all([
    getCampaignById(campaignId),
    listApplicationsForCampaign(campaignId, currentUser.id),
  ]);

  if (!campaign) {
    notFound();
  }

  const resolvedParams = searchParams ? await searchParams : undefined;

  const pending = applications.filter((a) => a.status === "pending");
  const accepted = applications.filter((a) => a.status === "accepted");
  const rejected = applications.filter((a) => a.status === "rejected" || a.status === "withdrawn");

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/dashboard/campaigns" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">{campaign.objective}</p>
              <h1 className="hero-card__title">{campaign.title}</h1>
            </div>
            <span className="sort-badge">{campaign.status}</span>
          </div>
          <p className="hero-card__copy">{campaign.description}</p>
          {resolvedParams?.status === "reviewed" ? (
            <span className="badge badge--accent">Application decision saved.</span>
          ) : null}
          <div className="auth-actions">
            <Link className="chip" href="/dashboard/campaigns">
              All campaigns
            </Link>
            <Link className="chip" href={`/campaigns/${campaign.id}`}>
              Public brief
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Application counts">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Pending review</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{pending.length}</strong>
            <p className="profile-score-card__copy">Applications waiting for your decision.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Accepted</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{accepted.length}</strong>
            <p className="profile-score-card__copy">Creators moving into the hire workflow.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Total applications</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{applications.length}</strong>
            <p className="profile-score-card__copy">All applications received for this campaign.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Budget</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{campaign.budget}</strong>
            <p className="profile-score-card__copy">{campaign.currency}</p>
          </GlassPanel>
        </section>

        {applications.length === 0 ? (
          <GlassPanel className="product-card">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">No applications yet</p>
                <h2 className="product-card__title">Creators have not applied to this campaign yet.</h2>
              </div>
            </div>
            <p className="product-card__copy">
              Your campaign is live at{" "}
              <Link className="chip" href={`/campaigns/${campaign.id}`}>
                /campaigns/{campaign.id}
              </Link>
              . Creators can browse and apply from there.
            </p>
          </GlassPanel>
        ) : (
          <section className="profile-sections" aria-label="Applications">
            {pending.length > 0 && (
              <>
                <h2 className="foundation-eyebrow" style={{ padding: "0 0 8px" }}>Pending review</h2>
                {pending.map((application) => (
                  <GlassPanel key={application.id} className="product-card">
                    <div className="product-card__header">
                      <div>
                        <p className="foundation-eyebrow">@{application.creatorUsername}</p>
                        <h3 className="product-card__title">{application.creatorName}</h3>
                      </div>
                      <span className="badge">{application.proposedPrice} USD</span>
                    </div>
                    <p className="product-card__copy">{application.message}</p>
                    <div className="metric-strip">
                      <span className="metric-pill">
                        <span className="metric-pill__label">Applied</span>
                        <span className="metric-pill__value">{new Date(application.appliedAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="auth-actions">
                      <Link className="chip" href={`/creators/${application.creatorUsername}`} target="_blank">
                        View profile
                      </Link>
                      <form action={`/dashboard/campaigns/${campaignId}/review-application`} method="post" style={{ display: "inline-flex", gap: "8px" }}>
                        <input type="hidden" name="applicationId" value={application.id} />
                        <button className="chip chip--solid" name="decision" type="submit" value="accepted">
                          Accept
                        </button>
                        <button className="chip" name="decision" type="submit" value="rejected">
                          Decline
                        </button>
                      </form>
                    </div>
                  </GlassPanel>
                ))}
              </>
            )}

            {accepted.length > 0 && (
              <>
                <h2 className="foundation-eyebrow" style={{ padding: "16px 0 8px" }}>Accepted creators</h2>
                {accepted.map((application) => (
                  <GlassPanel key={application.id} className="product-card">
                    <div className="product-card__header">
                      <div>
                        <p className="foundation-eyebrow">@{application.creatorUsername}</p>
                        <h3 className="product-card__title">{application.creatorName}</h3>
                      </div>
                      <span className="badge badge--accent">{statusLabels[application.status]}</span>
                    </div>
                    <p className="product-card__copy">{application.message}</p>
                    <div className="auth-actions">
                      <Link className="chip" href={`/creators/${application.creatorUsername}`} target="_blank">
                        View profile
                      </Link>
                    </div>
                  </GlassPanel>
                ))}
              </>
            )}

            {rejected.length > 0 && (
              <>
                <h2 className="foundation-eyebrow" style={{ padding: "16px 0 8px" }}>Declined / withdrawn</h2>
                {rejected.map((application) => (
                  <GlassPanel key={application.id} className="product-card">
                    <div className="product-card__header">
                      <div>
                        <p className="foundation-eyebrow">@{application.creatorUsername}</p>
                        <h3 className="product-card__title">{application.creatorName}</h3>
                      </div>
                      <span className="badge">{statusLabels[application.status] ?? application.status}</span>
                    </div>
                    <p className="product-card__copy" style={{ opacity: 0.6 }}>{application.message}</p>
                  </GlassPanel>
                ))}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
