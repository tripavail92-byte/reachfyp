import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreatorPackageCheckoutId, getCreatorRecordByUsername, listCreatorRecordUsernames, listRelatedCreatorRecords } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { InteractiveImageFrame } from "../../interactive-image-frame";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

type CreatorProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateStaticParams() {
  return (await listCreatorRecordUsernames()).map((username) => ({ username }));
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { username } = await params;
  const creator = await getCreatorRecordByUsername(username);

  if (!creator) {
    notFound();
  }

  const relatedCreators = await listRelatedCreatorRecords(creator.username, 2);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creators" />

        <section className="profile-layout">
          <GlassPanel className="profile-hero">
            <InteractiveImageFrame
              alt={creator.imageAlt}
              containerClassName="profile-hero__media"
              imageClassName="profile-hero__image"
              priority
              sizes="(max-width: 720px) 100vw, 320px"
              src={creator.imageUrl}
            >
              <div className="profile-hero__media-overlay" aria-hidden="true" />
            </InteractiveImageFrame>
            <div className="profile-hero__content">
              <div className="creator-card__badges">
                {creator.badges.map((badge) => (
                  <span key={badge} className="badge badge--accent">
                    {badge}
                  </span>
                ))}
              </div>
              <p className="foundation-eyebrow">Creator profile</p>
              <div className="profile-hero__heading">
                <div>
                  <h1 className="profile-hero__title">{creator.name}</h1>
                  <p className="profile-hero__meta">
                    @{creator.username} · {creator.location}
                  </p>
                </div>
                <span className="badge">From {creator.price}</span>
              </div>
              <div className="creator-card__tags">
                {creator.niche.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="profile-hero__summary">{creator.summary}</p>
              <p className="profile-hero__note">{creator.heroNote}</p>
              {creator.socialAccounts.length > 0 ? (
                <div className="creator-card__tags">
                  {creator.socialAccounts.map((account) => (
                    <Link key={account.platform} className="chip" href={account.url} target="_blank">
                      {account.platform} {account.handle}
                    </Link>
                  ))}
                </div>
              ) : null}
              <div className="profile-hero__actions">
                <Link className="chip chip--solid" href="/creators">
                  Back to creators
                </Link>
                {creator.packages[0] ? (
                  <Link className="chip" href={`/dashboard/instant-hire/${getCreatorPackageCheckoutId(creator.username, creator.packages[0].title)}`}>
                    Hire instantly
                  </Link>
                ) : null}
              </div>
            </div>
          </GlassPanel>

          <section className="profile-score-grid" aria-label="Creator score area">
            <GlassPanel className="profile-score-card">
              <span className="metric-pill__label">Authenticity score</span>
              <strong className="profile-score-card__value">{creator.authenticity}</strong>
              <p className="profile-score-card__copy">Audience trust and quality signals remain stable across recent content.</p>
            </GlassPanel>
            <GlassPanel className="profile-score-card">
              <span className="metric-pill__label">Performance score</span>
              <strong className="profile-score-card__value">{creator.performance}</strong>
              <p className="profile-score-card__copy">Content delivery performs above baseline for this category and price tier.</p>
            </GlassPanel>
            <GlassPanel className="profile-score-card">
              <span className="metric-pill__label">Audience quality</span>
              <strong className="profile-score-card__value">{creator.audienceQuality}</strong>
              <p className="profile-score-card__copy">Comment quality and downstream engagement remain clean and brand-safe.</p>
            </GlassPanel>
            <GlassPanel className="profile-score-card">
              <span className="metric-pill__label">Growth signal</span>
              <strong className="profile-score-card__value profile-score-card__value--small">{creator.growthSignal}</strong>
              <p className="profile-score-card__copy">Recent momentum suggests healthy demand without follower-first inflation.</p>
            </GlassPanel>
            <GlassPanel className="profile-score-card">
              <span className="metric-pill__label">Delivery quality</span>
              <strong className="profile-score-card__value profile-score-card__value--small">{creator.deliveryQuality}</strong>
              <p className="profile-score-card__copy">Repeat brand work and review sentiment support dependable execution.</p>
            </GlassPanel>
          </section>

          <section className="profile-sections">
            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Social presence</h2>
                  <p className="results-toolbar__subtitle">Connected channels and the latest sync markers available on this creator profile.</p>
                </div>
              </div>
              <div className="profile-list-grid">
                {creator.socialAccounts.map((account) => (
                  <div key={account.platform} className="profile-list-card">
                    <h3 className="panel-card-title">{account.platform}</h3>
                    <p className="profile-list-card__copy">{account.handle} · {account.followers}</p>
                    <p className="profile-list-card__copy">{account.syncStatus}</p>
                    <Link className="chip" href={account.url} target="_blank">
                      Open {account.platform}
                    </Link>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Packages</h2>
                  <p className="results-toolbar__subtitle">Instant-hire-ready packages structured for fast brand decisions.</p>
                </div>
              </div>
              <div className="profile-package-grid">
                {creator.packages.map((pack) => (
                  <div key={pack.title} className="profile-package-card">
                    <div className="profile-package-card__heading">
                      <h3 className="panel-card-title">{pack.title}</h3>
                      <span className="badge">{pack.price}</span>
                    </div>
                    <p className="profile-package-card__copy">{pack.details}</p>
                    <div className="auth-actions">
                      <span className="chip">Turnaround {pack.turnaround}</span>
                      <Link className="chip chip--solid" href={`/dashboard/instant-hire/${getCreatorPackageCheckoutId(creator.username, pack.title)}`}>
                        Hire instantly
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Portfolio</h2>
                  <p className="results-toolbar__subtitle">Representative outcomes from recent work relevant to this creator profile.</p>
                </div>
              </div>
              <div className="profile-list-grid">
                {creator.portfolio.map((item) => (
                  <div key={item.title} className="profile-list-card">
                    <h3 className="panel-card-title">{item.title}</h3>
                    <p className="profile-list-card__copy">{item.result}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Reviews</h2>
                  <p className="results-toolbar__subtitle">Qualitative trust proof to support fast creator selection.</p>
                </div>
                <span className="sort-badge">Rating {creator.rating}</span>
              </div>
              <div className="profile-list-grid">
                {creator.reviews.map((review) => (
                  <div key={review.source} className="profile-list-card">
                    <h3 className="panel-card-title">{review.source}</h3>
                    <p className="profile-list-card__copy">{review.quote}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">FAQ</h2>
                  <p className="results-toolbar__subtitle">Short planning notes brands usually need before moving into hire flow.</p>
                </div>
              </div>
              <div className="profile-list-grid">
                <div className="profile-list-card">
                  <h3 className="panel-card-title">What does this creator optimize for?</h3>
                  <p className="profile-list-card__copy">Performance-led creative briefs with high audience trust and repeatable package delivery.</p>
                </div>
                <div className="profile-list-card">
                  <h3 className="panel-card-title">What should ship next?</h3>
                  <p className="profile-list-card__copy">Instant hire now runs through a brand-gated checkout route tied directly to each package on this creator profile.</p>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="profile-section-card">
              <div className="profile-section-card__header">
                <div>
                  <h2 className="results-toolbar__title">Related creators</h2>
                  <p className="results-toolbar__subtitle">Adjacent creators for comparison without leaving the discovery flow.</p>
                </div>
              </div>
              <div className="profile-related-grid">
                {relatedCreators.map((related) => (
                  <Link key={related.username} className="profile-related-card" href={`/creators/${related.username}`}>
                    <InteractiveImageFrame
                      alt={related.imageAlt}
                      containerClassName="profile-related-card__media"
                      imageClassName="profile-related-card__image"
                      sizes="(max-width: 720px) 100vw, 220px"
                      src={related.imageUrl}
                    />
                    <strong>{related.name}</strong>
                    <span>{related.location}</span>
                    <span>Authenticity {related.authenticity}</span>
                  </Link>
                ))}
              </div>
            </GlassPanel>
          </section>
        </section>
      </div>
    </main>
  );
}