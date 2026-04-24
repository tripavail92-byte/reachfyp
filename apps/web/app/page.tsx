import { getCreatorRankingScore, listCreatorRecords } from "@reachfyp/api";
import Link from "next/link";
import { InteractiveImageFrame } from "./interactive-image-frame";
import { ThemeToggleButton } from "./theme-toggle-button";

const navigationLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Featured",
    href: "#featured-creators",
  },
  {
    label: "Signals",
    href: "#market-signals",
  },
  {
    label: "Creators",
    href: "/creators",
  },
  {
    label: "Campaigns",
    href: "/campaigns",
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
] as const;

const searchFilters = ["Content type", "Followers", "Location", "Price", "Gender", "Age", "Ethnicity", "Language"] as const;

const marketplaceSignals = [
  {
    title: "Authenticity scoring",
    description: "Scorecards spotlight audience trust, comment quality, and real delivery signals before brands shortlist anyone.",
  },
  {
    title: "Performance ranking",
    description: "Ranking-first discovery keeps the highest-signal creators at the top instead of follower-count vanity sorting.",
  },
  {
    title: "Instant hire path",
    description: "Every featured profile is structured to move from discovery into fast package comparison and hire intent.",
  },
] as const;

const featuredThemes = ["rose", "pearl", "sunset", "berry"] as const;

export default function HomePage() {
  const featuredCreators = listCreatorRecords().slice(0, 4);

  return (
    <main className="home-page">
      <div className="home-shell">
        <nav className="home-nav">
          <Link className="home-brand" href="/">
            reachfyp
            <span className="home-brand__dot" aria-hidden="true">
              ●
            </span>
            </Link>
          <div className="home-nav__links">
            {navigationLinks.map((item) => (
              <Link key={item.label} className="home-nav__link" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="home-nav__actions">
            <Link className="home-nav__link" href="/auth">
              Login
            </Link>
            <Link className="home-nav__cta home-nav__cta--ghost" href="/brand">
              Join as Brand
            </Link>
            <Link className="home-nav__cta" href="/creator">
              Join as Creator
            </Link>
            <ThemeToggleButton />
          </div>
        </nav>

        <header className="home-hero" id="creator-search">
          <p className="home-hero__eyebrow">Premium creator discovery for brands</p>
          <h1 className="home-hero__title">
            <span className="home-hero__title-line">Influencer discovery, </span>
            <span className="home-hero__title-line">ranked for instant hire.</span>
          </h1>
          <p className="home-hero__copy">
            Search creators across Instagram, TikTok, YouTube, and UGC in a premium pink marketplace that feels polished,
            easy to scan, and built for faster campaign decisions.
          </p>

          <div className="home-search-panel">
            <div className="home-search-bar">
              <div className="home-search-field">
                <span className="home-search-field__label">Platform</span>
                <strong className="home-search-field__value">Instagram, TikTok, YouTube, UGC</strong>
              </div>
              <div className="home-search-field home-search-field--wide">
                <span className="home-search-field__label">Category</span>
                <strong className="home-search-field__value">Beauty, lifestyle, tech, performance creators</strong>
              </div>
              <Link className="home-search-button" href="/creators">
                Explore
              </Link>
            </div>

            <div className="home-filter-row">
              {searchFilters.map((filter, index) => (
                <button key={filter} className={`home-filter-chip${index >= 5 ? " home-filter-chip--premium" : ""}`} type="button">
                  {filter}
                </button>
              ))}
              <Link className="home-clear-link" href="/creators">
                Clear all
              </Link>
            </div>
          </div>
        </header>

        <section className="home-featured" id="featured-creators">
          <div className="home-featured__header">
            <div>
              <h2 className="home-featured__title">Featured</h2>
              <p className="home-featured__copy">Hire top influencers across all platforms.</p>
              <div className="home-featured__stats">
                <span className="home-inline-stat">{featuredCreators.length} featured now</span>
                <span className="home-inline-stat">Authenticity-first ranking</span>
                <span className="home-inline-stat">Profile to brief flow</span>
              </div>
            </div>
            <Link className="home-featured__link" href="/creators">
              See all
            </Link>
          </div>

          <div className="home-featured__grid">
            {featuredCreators.map((creator, index) => {
              const rankingScore = getCreatorRankingScore(creator);

              return (
                <Link key={creator.id} className="home-feature-card" href={`/creators/${creator.username}`}>
                  <InteractiveImageFrame
                    alt={creator.imageAlt}
                    containerClassName={`home-feature-card__media home-feature-card__media--${featuredThemes[index % featuredThemes.length]}`}
                    imageClassName="home-feature-card__image"
                    sizes="(max-width: 780px) 100vw, (max-width: 1100px) 50vw, 25vw"
                    src={creator.imageUrl}
                  >
                    <div className="home-feature-card__overlay" aria-hidden="true" />
                    <div className="home-feature-card__media-top">
                      <span className="media-badge media-badge--primary">Top creator</span>
                      <span className="media-badge">{creator.badges[0] ?? "Ranked"}</span>
                    </div>
                    <div className="home-feature-card__media-bottom">
                      <span className="media-badge media-badge--ghost">{creator.niche[0]}</span>
                      <span className="media-badge media-badge--ghost">{creator.rating} star</span>
                    </div>
                  </InteractiveImageFrame>

                  <div className="home-feature-card__body">
                    <div className="home-feature-card__heading">
                      <h3 className="home-feature-card__name">{creator.name}</h3>
                      <span className="home-feature-card__price">{creator.price}</span>
                    </div>

                    <p className="home-feature-card__summary">{creator.summary}</p>

                    <div className="home-feature-card__footer">
                      <span className="home-feature-card__location">{creator.location}</span>
                      <span className="home-feature-card__stat">Ranking {rankingScore}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="home-signal-grid" id="market-signals">
          {marketplaceSignals.map((signal) => (
            <article key={signal.title} className="home-signal-card">
              <p className="home-signal-card__eyebrow">Core product spine</p>
              <h2 className="home-signal-card__title">{signal.title}</h2>
              <p className="home-signal-card__copy">{signal.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

