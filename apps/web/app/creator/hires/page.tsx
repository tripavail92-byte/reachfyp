import Link from "next/link";
import { getCreatorRecordByAuthUserId, listInstantHiresForCreator, listNotificationsForUser } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

export default async function CreatorHiresPage() {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=creator-sign-in&redirectTo=%2Fcreator%2Fhires");
  }

  if (currentUser.role !== "creator") {
    redirect("/creators");
  }

  const creatorProfile = getCreatorRecordByAuthUserId(currentUser.id);
  const hires = listInstantHiresForCreator(currentUser.id);
  const notifications = listNotificationsForUser(currentUser.id);
  const queueGroups = [
    {
      title: "Needs delivery",
      subtitle: "Accepted hires and revision requests waiting on creator work.",
      items: hires.filter((hire) => hire.status === "accepted" || hire.status === "revision_requested"),
    },
    {
      title: "Awaiting brand review",
      subtitle: "Deliverables are in review and escrow is still held.",
      items: hires.filter((hire) => hire.status === "submitted"),
    },
    {
      title: "Completed",
      subtitle: "Approved hires with released escrow and visible creator wallet impact.",
      items: hires.filter((hire) => hire.status === "approved"),
    },
    {
      title: "Cancelled",
      subtitle: "Refunded or cancelled work kept for audit visibility.",
      items: hires.filter((hire) => hire.status === "cancelled"),
    },
  ];
  const unreadNotifications = notifications.filter((notification) => !notification.readAt).slice(0, 3);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creator/hires" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Creator hires</p>
              <h1 className="hero-card__title">Track claimed package hires, deliverables, and payout state.</h1>
            </div>
            <div className="sort-badge">Creator-visible hire route</div>
          </div>
          <p className="hero-card__copy">
            Claimed creator profiles now get their own hire workspace. Earlier instant hires rebound here automatically when a seeded marketplace profile is claimed by a real creator account.
          </p>
          {creatorProfile ? (
            <div className="auth-actions">
              <Link className="chip chip--solid" href="/creator/payouts">
                Open payout requests
              </Link>
              <Link className="chip" href="/dashboard/notifications">
                View notifications
              </Link>
              <Link className="chip" href={`/creators/${creatorProfile.username}`}>
                Open public profile
              </Link>
            </div>
          ) : null}
        </GlassPanel>

        {!creatorProfile ? (
          <section className="auth-layout" aria-label="Claim creator profile first">
            <GlassPanel className="auth-panel auth-panel--highlight">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Claim required</p>
                  <h2 className="product-card__title">Create or claim your public creator profile before opening creator hires.</h2>
                </div>
                <span className="badge">No claimed profile yet</span>
              </div>
              <p className="product-card__copy">
                Save a creator profile with your marketplace username to claim existing seed inventory and rebind past instant hires to your account.
              </p>
              <div className="auth-actions">
                <Link className="chip chip--solid" href="/creator/profile">
                  Open creator profile
                </Link>
                <Link className="chip" href="/creators">
                  Browse creators
                </Link>
              </div>
            </GlassPanel>
          </section>
        ) : hires.length === 0 ? (
          <section className="auth-layout" aria-label="No creator hires yet">
            <GlassPanel className="auth-panel auth-panel--highlight">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">No hires yet</p>
                  <h2 className="product-card__title">Instant hires will appear here after brands book your public packages.</h2>
                </div>
                <span className="badge">@{creatorProfile.username}</span>
              </div>
              <p className="product-card__copy">
                This route turns on automatically for claimed creators. Once a package is hired, you will submit deliverables, review revision notes, and track local payout release from here.
              </p>
              <div className="auth-actions">
                <Link className="chip chip--solid" href={`/creators/${creatorProfile.username}`}>
                  Preview public profile
                </Link>
              </div>
            </GlassPanel>
          </section>
        ) : (
          <section className="profile-sections">
            <section className="profile-score-grid" aria-label="Creator hire queue metrics">
              <GlassPanel className="profile-score-card">
                <span className="metric-pill__label">Open queue</span>
                <strong className="profile-score-card__value profile-score-card__value--small">{queueGroups[0].items.length}</strong>
                <p className="profile-score-card__copy">Accepted and revision-requested hires requiring creator action.</p>
              </GlassPanel>
              <GlassPanel className="profile-score-card">
                <span className="metric-pill__label">Awaiting review</span>
                <strong className="profile-score-card__value profile-score-card__value--small">{queueGroups[1].items.length}</strong>
                <p className="profile-score-card__copy">Submitted work currently in the brand review queue.</p>
              </GlassPanel>
              <GlassPanel className="profile-score-card">
                <span className="metric-pill__label">Released payouts</span>
                <strong className="profile-score-card__value profile-score-card__value--small">{queueGroups[2].items.length}</strong>
                <p className="profile-score-card__copy">Approved hires that already increased the creator wallet balance.</p>
              </GlassPanel>
              <GlassPanel className="profile-score-card">
                <span className="metric-pill__label">Unread alerts</span>
                <strong className="profile-score-card__value profile-score-card__value--small">{unreadNotifications.length}</strong>
                <p className="profile-score-card__copy">Lifecycle events and replies waiting in the notification feed.</p>
              </GlassPanel>
            </section>

            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Queue overview</h2>
                  <p className="results-toolbar__subtitle">The queue is split by next action so the primary creator task stays obvious.</p>
                </div>
                <Link className="chip" href="/dashboard/notifications">
                  Open notifications
                </Link>
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
                          <p className="profile-list-card__copy">Deadline: {hire.deliveryDeadline}</p>
                          <p className="profile-list-card__copy">Status: {hire.status} · Escrow: {hire.escrowStatus}</p>
                          <div className="auth-actions">
                            <Link className="chip chip--solid" href={`/creator/hires/${hire.id}`}>
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
                          <p className="profile-list-card__copy">This queue is currently clear.</p>
                        </div>
                      )}
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </GlassPanel>

            {unreadNotifications.length > 0 ? (
              <GlassPanel className="profile-section-card">
                <div className="profile-section-card__header">
                  <div>
                    <h2 className="results-toolbar__title">Unread notifications</h2>
                    <p className="results-toolbar__subtitle">Recent hire and message events surfaced alongside the queue.</p>
                  </div>
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
          </section>
        )}
      </div>
    </main>
  );
}
