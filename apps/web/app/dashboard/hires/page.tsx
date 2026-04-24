import Link from "next/link";
import { listInstantHiresForBrand, listNotificationsForUser } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

export default async function BrandHiresPage() {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=brand-sign-in&redirectTo=%2Fdashboard%2Fhires");
  }

  if (currentUser.role === "creator") {
    redirect("/creator/hires");
  }

  if (currentUser.role === "admin") {
    redirect("/admin/hires");
  }

  const hires = await listInstantHiresForBrand(currentUser.id);
  const notifications = await listNotificationsForUser(currentUser.id);
  const queueGroups = [
    {
      title: "Needs review",
      subtitle: "Submitted work and active decisions that can change escrow state.",
      items: hires.filter((hire) => hire.status === "submitted"),
    },
    {
      title: "Creator in progress",
      subtitle: "Accepted hires and revision loops currently waiting on creator work.",
      items: hires.filter((hire) => hire.status === "accepted" || hire.status === "revision_requested"),
    },
    {
      title: "Completed",
      subtitle: "Approved hires with released escrow and creator payout visibility.",
      items: hires.filter((hire) => hire.status === "approved"),
    },
    {
      title: "Cancelled",
      subtitle: "Refunded or cancelled hires kept for audit and admin review.",
      items: hires.filter((hire) => hire.status === "cancelled"),
    },
  ];
  const unreadNotifications = notifications.filter((notification) => !notification.readAt).slice(0, 4);
  const reviewNow = queueGroups[0].items.slice(0, 3);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/dashboard/hires" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Brand hire queue</p>
              <h1 className="hero-card__title">Operate live package hires, review deliverables, and track escrow from one queue.</h1>
            </div>
            <div className="sort-badge">Brand operations</div>
          </div>
          <p className="hero-card__copy">
            This queue turns the instant-hire detail route into a real operating surface. The page is grouped by the next decision instead of a flat history list, so review work stays at the top.
          </p>
          <div className="auth-actions">
            <Link className="chip chip--solid" href="/dashboard/notifications">
              Open notifications
            </Link>
            <Link className="chip" href="/creators">
              Hire another creator
            </Link>
          </div>
        </GlassPanel>

        <section className="profile-score-grid" aria-label="Brand hire queue metrics">
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Needs review</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{queueGroups[0].items.length}</strong>
            <p className="profile-score-card__copy">Submitted creator work waiting for a brand review decision.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">In progress</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{queueGroups[1].items.length}</strong>
            <p className="profile-score-card__copy">Accepted or revision-loop hires still moving toward a final deliverable.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Released payouts</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{queueGroups[2].items.length}</strong>
            <p className="profile-score-card__copy">Approved work with escrow already released to the creator wallet.</p>
          </GlassPanel>
          <GlassPanel className="profile-score-card">
            <span className="metric-pill__label">Unread alerts</span>
            <strong className="profile-score-card__value profile-score-card__value--small">{unreadNotifications.length}</strong>
            <p className="profile-score-card__copy">Recent hire and message events waiting in the notification feed.</p>
          </GlassPanel>
        </section>

        <section className="profile-sections">
          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Review now</h2>
                <p className="results-toolbar__subtitle">Submitted work stays above the broader queue so the brand decision that changes escrow state is the first thing on the page.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {reviewNow.length > 0 ? reviewNow.map((hire) => (
                <div key={hire.id} className="profile-list-card">
                  <h3 className="panel-card-title">{hire.packageTitle}</h3>
                  <p className="profile-list-card__copy">Creator: {hire.creatorName}</p>
                  <p className="profile-list-card__copy">Deadline: {hire.deliveryDeadline}</p>
                  <p className="profile-list-card__copy">Escrow is still {hire.escrowStatus} until you approve or request changes.</p>
                  <div className="auth-actions">
                    <Link className="chip chip--solid" href={`/dashboard/hires/${hire.id}`}>
                      Review deliverable
                    </Link>
                    <Link className="chip" href={`/dashboard/messages/${hire.conversationId}`}>
                      Open thread
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Nothing waiting for review</h3>
                  <p className="profile-list-card__copy">New deliverable submissions will surface here before they get buried in the wider queue.</p>
                </div>
              )}
            </div>
          </GlassPanel>

          {unreadNotifications.length > 0 ? (
            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Unread notifications</h2>
                  <p className="results-toolbar__subtitle">Latest queue events surfaced beside the brand queue so the page stays actionable.</p>
                </div>
                <Link className="chip" href="/dashboard/notifications">
                  Open all notifications
                </Link>
              </div>
              <div className="profile-list-grid">
                {unreadNotifications.map((notification) => (
                  <div key={notification.id} className="profile-list-card">
                    <h3 className="panel-card-title">{notification.title}</h3>
                    <p className="profile-list-card__copy">{notification.body}</p>
                    <Link className="chip" href={notification.link}>
                      Open event
                    </Link>
                  </div>
                ))}
              </div>
            </GlassPanel>
          ) : null}

          <GlassPanel className="profile-section-card">
            <div className="profile-section-card__header">
              <div>
                <h2 className="results-toolbar__title">Queue groups</h2>
                <p className="results-toolbar__subtitle">Each group is split by the next operational decision so action priority stays clear.</p>
              </div>
            </div>
            <div className="profile-list-grid">
              {queueGroups.map((group) => (
                <GlassPanel key={group.title} className="profile-list-card">
                  <h3 className="panel-card-title">{group.title}</h3>
                  <p className="profile-list-card__copy">{group.subtitle}</p>
                  <p className="profile-list-card__copy">{group.items.length} hire{group.items.length === 1 ? "" : "s"}</p>
                  <div className="profile-list-grid">
                    {group.items.length > 0 ? group.items.map((hire) => (
                      <div key={hire.id} className="profile-list-card">
                        <h4 className="panel-card-title">{hire.packageTitle}</h4>
                        <p className="profile-list-card__copy">Creator: {hire.creatorName}</p>
                        <p className="profile-list-card__copy">Deadline: {hire.deliveryDeadline}</p>
                        <p className="profile-list-card__copy">Status: {hire.status} · Escrow: {hire.escrowStatus}</p>
                        <div className="auth-actions">
                          <Link className="chip chip--solid" href={`/dashboard/hires/${hire.id}`}>
                            Open hire
                          </Link>
                          <Link className="chip" href={`/dashboard/messages/${hire.conversationId}`}>
                            Open thread
                          </Link>
                        </div>
                      </div>
                    )) : (
                      <div className="profile-list-card">
                        <h4 className="panel-card-title">Nothing here</h4>
                        <p className="profile-list-card__copy">This group is currently clear.</p>
                      </div>
                    )}
                  </div>
                </GlassPanel>
              ))}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}