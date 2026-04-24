import { getCreatorRankingScore, getCreatorUsernameAvailability, listCreatorRecords } from "@reachfyp/api";
import Link from "next/link";
import { InteractiveImageFrame } from "../interactive-image-frame";
import { ThemeToggleButton } from "../theme-toggle-button";
import { creatorSignupErrorMessages } from "../creator-signup/error-messages";
import { getSignupDeviceContext } from "../../lib/auth/signup-device";

const creatorBrands = ["Wealthsimple", "ClickUp", "Hopper", "United Nations", "McDonald's"] as const;
const creatorCategories = ["Lifestyle", "Fashion", "Beauty", "Travel", "Health & Fitness", "Family", "Music & Dance", "Comedy"] as const;
const creatorSteps = [
  {
    number: "1",
    title: "Reserve your creator handle",
    description: "Pick the public username you want to publish so your profile, offers, and messages stay tied to one storefront.",
  },
  {
    number: "2",
    title: "Create your account",
    description: "Finish signup with Google, Apple, or email, then continue into profile setup with the handle already carried forward.",
  },
  {
    number: "3",
    title: "Launch your profile",
    description: "Add your niche, pricing, social accounts, and packages so brands can discover and hire you faster.",
  },
] as const;

const creatorFeatures = [
  {
    title: "Direct brand opportunities",
    description: "Show up in marketplace discovery and keep your profile ready for immediate package purchases.",
  },
  {
    title: "Unified hire workspace",
    description: "Track deliverables, revisions, and payout status from the same creator account that owns your public page.",
  },
  {
    title: "Profile-first setup",
    description: "Your username becomes the anchor for your storefront, portfolio, and creator-facing operations.",
  },
  {
    title: "Platform flexibility",
    description: "Position Instagram, TikTok, YouTube, and UGC offers in one profile instead of splitting demand across tools.",
  },
  {
    title: "Fast claim flow",
    description: "If a seeded marketplace profile already exists, you can claim that handle during onboarding instead of rebuilding from zero.",
  },
  {
    title: "Built-in payout path",
    description: "Creator payouts and hire history stay attached to the same account once your public profile goes live.",
  },
] as const;

type CreatorJoinPageProps = {
  searchParams?: Promise<{
    username?: string;
    error?: string;
    signup?: string;
  }>;
};

export default async function CreatorJoinPage({ searchParams }: CreatorJoinPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const deviceContext = await getSignupDeviceContext();
  const featuredCreators = (await listCreatorRecords()).slice(0, 4);
  const usernameAvailability = await getCreatorUsernameAvailability(String(resolvedSearchParams?.username ?? ""));
  const chosenUsername = usernameAvailability.username || "your-name";
  const claimHref = `/creator?username=${encodeURIComponent(chosenUsername)}&signup=1`;
  const canClaimUsername = usernameAvailability.status === "available" || usernameAvailability.status === "claimable";
  const showSignupModal = resolvedSearchParams?.signup === "1" && canClaimUsername;
  const redirectTo = `/creator/profile?claimedUsername=${encodeURIComponent(chosenUsername)}`;
  const appleSignupHref = `/auth/apple/start?flow=creator&username=${encodeURIComponent(chosenUsername)}&redirectTo=${encodeURIComponent(redirectTo)}`;
  const googleSignupHref = `/auth/google/start?flow=creator&username=${encodeURIComponent(chosenUsername)}&redirectTo=${encodeURIComponent(redirectTo)}`;
  const feedbackMessage = resolvedSearchParams?.error ? creatorSignupErrorMessages[resolvedSearchParams.error] : undefined;
  const shouldOpenEmailForm = Boolean(
    resolvedSearchParams?.error &&
      !resolvedSearchParams.error.startsWith("google-") &&
      !resolvedSearchParams.error.startsWith("apple-") &&
      resolvedSearchParams.error !== "invalid-state",
  );

  return (
    <main className="join-page join-page--creator">
      <header className="join-topbar">
        <Link className="join-topbar__brand" href="/">
          reachfyp
          <span className="join-topbar__dot">●</span>
        </Link>
        <div className="join-topbar__links">
          <Link href="/creators">Search creators</Link>
          <Link href="/brand">For brands</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/auth?mode=creator-sign-in">Login</Link>
          <ThemeToggleButton />
        </div>
      </header>

      <section className="join-hero">
        <div className="join-hero__content">
          <p className="join-eyebrow">Creator onboarding</p>
          <h1 className="join-hero__title">Turn your creator name into a bookable profile brands can hire from.</h1>
          <p className="join-hero__copy">
            Reserve your public handle first, then move into account creation and profile setup without losing the storefront identity you want to publish.
          </p>

          <form action="/creator" className="join-claim-form" method="get">
            <span className="join-claim-form__prefix">reachfyp.com/</span>
            <input
              className="join-claim-form__input"
              defaultValue={usernameAvailability.rawUsername}
              name="username"
              placeholder="yourname"
              type="text"
            />
            <button className="join-claim-form__button" type="submit">
              Check handle
            </button>
          </form>

          {usernameAvailability.status === "available" || usernameAvailability.status === "claimable" ? (
            <div className="join-status join-status--success">
              <div>
                <strong>@{chosenUsername}</strong>
                <p>
                  {usernameAvailability.status === "claimable"
                    ? "This public handle already exists in marketplace seed data and can be claimed by your account during setup."
                    : "This handle is open and ready to carry into signup."}
                </p>
                {usernameAvailability.wasNormalized ? <p>We cleaned the formatting to match the public URL.</p> : null}
              </div>
              <Link className="join-status__action" href={claimHref}>
                Claim handle
              </Link>
            </div>
          ) : null}

          {usernameAvailability.status === "taken" ? (
            <p className="join-status join-status--error">That handle is already attached to another creator account. Try a different public name.</p>
          ) : null}

          {usernameAvailability.status === "invalid" ? (
            <p className="join-status join-status--error">Use letters or numbers so we can turn it into a public handle.</p>
          ) : null}
        </div>

        <aside className="join-proof-card">
          <p className="join-proof-card__label">How it works</p>
          <ul className="join-proof-card__list">
            {creatorSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="join-band">
        <div>
          <p className="join-band__title">Brands already browsing creator supply</p>
          <p className="join-band__copy">Profiles, packages, and replies perform better when your public handle is stable from day one.</p>
        </div>
        <div className="join-logo-row">
          {creatorBrands.map((brand) => (
            <span key={brand} className="join-logo-row__item">
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Popular niches</p>
            <h2 className="join-section__title">Show up where brands are already shopping.</h2>
          </div>
        </div>
        <div className="join-chip-row">
          {creatorCategories.map((category) => (
            <span key={category} className="join-chip-row__item">
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Featured creators</p>
            <h2 className="join-section__title">See how public profiles look once the onboarding is complete.</h2>
          </div>
          <Link className="join-section__link" href="/creators">
            Browse marketplace
          </Link>
        </div>
        <div className="join-featured-grid">
          {featuredCreators.map((creator, index) => (
            <Link key={creator.id} className="home-feature-card" href={`/creators/${creator.username}`}>
              <InteractiveImageFrame
                alt={creator.imageAlt}
                containerClassName={`home-feature-card__media home-feature-card__media--${["rose", "pearl", "sunset", "berry"][index % 4]}`}
                imageClassName="home-feature-card__image"
                sizes="(max-width: 780px) 100vw, (max-width: 1100px) 50vw, 25vw"
                src={creator.imageUrl}
              >
                <div className="home-feature-card__overlay" aria-hidden="true" />
                <div className="home-feature-card__media-top">
                  <span className="media-badge media-badge--primary">Top creator</span>
                  <span className="media-badge">{creator.badges[0] ?? "Verified"}</span>
                </div>
                <div className="home-feature-card__media-bottom">
                  <span className="media-badge media-badge--ghost">{creator.niche[0]}</span>
                  <span className="media-badge media-badge--ghost">Rank {getCreatorRankingScore(creator)}</span>
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
                  <span className="home-feature-card__stat">@{creator.username}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">What you unlock</p>
            <h2 className="join-section__title">Creator setup that leads directly into real operations.</h2>
          </div>
        </div>
        <div className="join-feature-grid">
          {creatorFeatures.map((feature) => (
            <article key={feature.title} className="join-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="join-cta-band">
        <div>
          <p className="join-eyebrow">Ready to claim your name?</p>
          <h2 className="join-cta-band__title">Start with the public handle, then finish signup without leaving this page.</h2>
        </div>
        {canClaimUsername ? (
          <Link className="join-cta-band__action" href={claimHref}>
            Continue with @{chosenUsername}
          </Link>
        ) : (
          <Link className="join-cta-band__action" href="/creator">
            Try another handle
          </Link>
        )}
      </section>

      {showSignupModal ? (
        <div className="join-modal" role="dialog" aria-modal="true" aria-labelledby="creator-signup-title">
          <Link aria-label="Close signup" className="join-modal__backdrop" href={`/creator?username=${encodeURIComponent(chosenUsername)}`} />
          <div className="join-modal__panel auth-card join-signup-card">
            <div className="join-modal__header">
              <div>
                <p className="auth-card__eyebrow">Creator signup</p>
                <h2 className="auth-card__title" id="creator-signup-title">
                  Create your account
                </h2>
              </div>
              <Link className="join-modal__close" href={`/creator?username=${encodeURIComponent(chosenUsername)}`}>
                Close
              </Link>
            </div>

            <p className="join-signup-card__preview">reachfyp.com/{chosenUsername}</p>
            <p className="auth-hint">
              {usernameAvailability.status === "claimable"
                ? "This handle can be claimed during profile setup after you finish creating your account."
                : "This handle is available and will be carried into your profile setup."}
            </p>

            {feedbackMessage ? <p className="auth-feedback auth-feedback--error">{feedbackMessage}</p> : null}

            <div className="join-signup-card__providers">
              <Link className="join-signup-card__provider join-signup-card__provider--google" href={googleSignupHref}>
                <span className="join-signup-card__provider-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M21.64 12.2c0-.64-.06-1.25-.16-1.84H12v3.48h5.41a4.63 4.63 0 0 1-2 3.04v2.52h3.24c1.9-1.75 2.99-4.33 2.99-7.2Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.52c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.58-4.12H3.07v2.6A10 10 0 0 0 12 22Z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.42 13.88A5.98 5.98 0 0 1 6.1 12c0-.65.12-1.27.32-1.88v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.38 3.13 1.07 4.48l3.35-2.6Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.98c1.47 0 2.78.5 3.82 1.48l2.87-2.87C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.35 2.6C7.2 7.74 9.4 5.98 12 5.98Z"
                      fill="#EA4335"
                    />
                  </svg>
                </span>
                <span>Sign up with Google</span>
              </Link>
              {deviceContext.showAppleOption ? (
                <Link className="join-signup-card__provider join-signup-card__provider--apple" href={appleSignupHref}>
                  <span className="join-signup-card__provider-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M15.2 3.2c.9-1.1 1.5-2.6 1.3-4.2-1.3.1-2.9.9-3.8 2-.8.9-1.5 2.4-1.3 3.8 1.5.1 2.9-.8 3.8-1.6ZM19.5 12.8c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2-3.9-2-.9-.1-2 .2-3 .7-.8.4-1.5.7-2.2.7-.8 0-1.6-.3-2.4-.7-.9-.4-1.9-.7-2.9-.6-1.7 0-3.4 1-4.3 2.6-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.4 2.6 1.4-.1 1.9-.9 3.6-.9 1.7 0 2.2.9 3.6.8 1.5 0 2.4-1.3 3.3-2.6 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.2Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span>Sign up with Apple</span>
                </Link>
              ) : null}
            </div>

            <details className="join-signup-card__email-details" open={shouldOpenEmailForm}>
              <summary className="join-signup-card__email-trigger">Use email instead</summary>

              <form action="/auth/register" className="auth-form join-signup-card__email-form" method="post">
                <label className="auth-field">
                  <span className="auth-field__label">Full name</span>
                  <input className="auth-input" name="name" placeholder="Alex Morgan" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Email</span>
                  <input className="auth-input" name="email" placeholder="you@example.com" required type="email" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Password</span>
                  <input className="auth-input" minLength={8} name="password" placeholder="Create a password" required type="password" />
                </label>
                <input name="mode" type="hidden" value="register-creator" />
                <input name="role" type="hidden" value="creator" />
                <input name="reservedCreatorUsername" type="hidden" value={chosenUsername} />
                <input name="redirectTo" type="hidden" value={redirectTo} />
                <button className="auth-submit" type="submit">
                  Sign up
                </button>
              </form>
            </details>

            <p className="join-signup-card__legal">
              By signing up, you agree to our <Link href="/pricing">pricing terms</Link> and marketplace rules.
            </p>
            <p className="auth-switch">
              Already have an account? <Link href={`/auth?mode=creator-sign-in&redirectTo=${encodeURIComponent(redirectTo)}`}>Login</Link>
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}