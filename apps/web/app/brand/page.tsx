import { getCreatorRankingScore, listCreatorRecords } from "@reachfyp/api";
import Link from "next/link";
import { InteractiveImageFrame } from "../interactive-image-frame";
import { ThemeToggleButton } from "../theme-toggle-button";
import { brandSignupErrorMessages } from "../brand-signup/error-messages";
import { getSignupDeviceContext } from "../../lib/auth/signup-device";

const trustedTeams = ["Wealthsimple", "ClickUp", "Hopper", "United Nations", "McDonald's"] as const;
const brandSteps = [
  {
    title: "Search creators",
    description: "Browse vetted creator supply across major platforms and filter quickly down to the right fit.",
  },
  {
    title: "Purchase and message securely",
    description: "Hire through the platform, keep the conversation in one thread, and hold payment until delivery is approved.",
  },
  {
    title: "Receive content and track results",
    description: "Manage campaign activity and delivered assets without bouncing between spreadsheets, DMs, and ad hoc folders.",
  },
] as const;

const brandFeatures = [
  {
    title: "No subscription barrier",
    description: "Discovery stays open so your team can evaluate supply before committing to a purchase path.",
  },
  {
    title: "Vetted marketplace supply",
    description: "Creator profiles are structured for clear pricing, proof, and package selection instead of cold outreach guesswork.",
  },
  {
    title: "Secure purchase flow",
    description: "Funds stay protected until the creator work is submitted and approved inside the hire lifecycle.",
  },
  {
    title: "Campaign intake",
    description: "Collect targeting, requirements, and creative notes in one place before outreach begins.",
  },
  {
    title: "Performance visibility",
    description: "Keep delivered content, analytics review, and follow-up decisions anchored to the same operating surface.",
  },
  {
    title: "Fast repeat hiring",
    description: "Once a brand account exists, discovery and checkout stop detouring through generic anonymous flows.",
  },
] as const;

const brandMetrics = [
  {
    value: "48 hrs",
    label: "Average time from shortlist to first creator conversation",
  },
  {
    value: "3x",
    label: "More creator options reviewed before a final hire decision",
  },
  {
    value: "1 thread",
    label: "Shared workspace for briefs, approvals, payout protection, and delivery",
  },
  {
    value: "0 chaos",
    label: "No spreadsheet handoff between sourcing, messaging, and campaign follow-up",
  },
] as const;

const brandCaseStudies = [
  {
    brand: "Fintech launch sprint",
    headline: "A lean growth team filled a three-creator launch plan in one review cycle.",
    result: "12 approved assets delivered in 9 days",
    summary:
      "The team filtered finance and productivity creators, packaged the brief once, and kept revisions inside the same hire thread instead of splitting across email and DMs.",
  },
  {
    brand: "Travel offer refresh",
    headline: "A seasonal campaign moved from scattered outreach to structured instant hire.",
    result: "Shortlist built in under 30 minutes",
    summary:
      "With supply, pricing, and package expectations visible up front, the brand avoided manual quoting rounds and moved straight into protected purchase flow.",
  },
  {
    brand: "Enterprise awareness push",
    headline: "A multi-stakeholder campaign kept approvals and deliverables in one operating surface.",
    result: "2 approval loops instead of 6",
    summary:
      "Internal reviewers, creator replies, and final assets stayed attached to the hire lifecycle, which reduced version drift and made post-campaign review faster.",
  },
] as const;

const brandTestimonials = [
  {
    quote:
      "We stopped wasting time rebuilding creator shortlists every week. The marketplace already had enough structure for our team to make a decision quickly.",
    name: "Avery Patel",
    title: "Growth lead, consumer app",
  },
  {
    quote:
      "The shift was operational, not cosmetic. Search, packages, payment protection, and delivery finally lived in the same workflow.",
    name: "Morgan Chen",
    title: "Performance marketing manager",
  },
  {
    quote:
      "Before this, creator hiring meant a dozen tabs and a lot of Slack cleanup. Now the team knows exactly where campaign state lives.",
    name: "Jordan Rivera",
    title: "Brand partnerships director",
  },
] as const;

const brandFaqs = [
  {
    question: "Do I need to pay before I can browse creators?",
    answer:
      "No. The brand account opens the marketplace and lets your team evaluate supply first. Payment only starts when you move into a protected hire or package purchase.",
  },
  {
    question: "What happens after I create the account?",
    answer:
      "You can search creators immediately, review packages, and begin building a shortlist. When you're ready, the same account carries into secure hiring and campaign coordination.",
  },
  {
    question: "Can multiple teammates use the same workflow?",
    answer:
      "Yes. The goal is to give the brand a single operating surface for research, briefs, approvals, and delivered assets instead of spreading work across personal inboxes.",
  },
  {
    question: "How are creator payments protected?",
    answer:
      "Funds stay inside the platform until the creator submits work and the delivery is approved inside the hire lifecycle. That keeps both sides aligned on expectations and completion.",
  },
  {
    question: "Is this only for large campaigns?",
    answer:
      "No. The same flow works whether you're hiring one creator for a test or coordinating a broader set of packages across a launch window.",
  },
] as const;

type BrandPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function BrandPage({ searchParams }: BrandPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const deviceContext = await getSignupDeviceContext();
  const featuredCreators = (await listCreatorRecords()).slice(0, 4);
  const showSignupModal = resolvedSearchParams?.signup === "1";
  const feedbackMessage = resolvedSearchParams?.error ? brandSignupErrorMessages[resolvedSearchParams.error] : undefined;
  const googleSignupHref = `/auth/google/start?flow=brand&redirectTo=${encodeURIComponent("/creators")}`;
  const appleSignupHref = `/auth/apple/start?flow=brand&redirectTo=${encodeURIComponent("/creators")}`;
  const signupHref = "/brand?signup=1";
  const shouldOpenEmailForm = Boolean(
    resolvedSearchParams?.error &&
      !resolvedSearchParams.error.startsWith("google-") &&
      !resolvedSearchParams.error.startsWith("apple-") &&
      resolvedSearchParams.error !== "invalid-state",
  );

  return (
    <main className="join-page join-page--brand">
      <header className="join-topbar">
        <Link className="join-topbar__brand" href="/">
          reachfyp
          <span className="join-topbar__dot">●</span>
        </Link>
        <div className="join-topbar__links">
          <Link href="/creators">Search</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/creator">For creators</Link>
          <Link href="/auth?mode=brand-sign-in">Login</Link>
          <ThemeToggleButton />
        </div>
      </header>

      <section className="join-hero join-hero--brand">
        <div className="join-hero__content">
          <p className="join-eyebrow">Brand onboarding</p>
          <h1 className="join-hero__title">Run creator discovery, hiring, and campaign coordination from one brand account.</h1>
          <p className="join-hero__copy">
            Start free, browse supply first, then move into secure hiring, messaging, and collaboration once your team is ready to transact.
          </p>
          <div className="join-hero__actions">
            <Link className="join-hero__primary" href={signupHref}>
              Join for free
            </Link>
            <Link className="join-hero__secondary" href="/creators">
              Search influencers
            </Link>
          </div>
        </div>

        <aside className="join-proof-card">
          <p className="join-proof-card__label">Trusted by active teams</p>
          <div className="join-logo-row join-logo-row--stacked">
            {trustedTeams.map((team) => (
              <span key={team} className="join-logo-row__item">
                {team}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Marketplace flow</p>
            <h2 className="join-section__title">Find, hire, and manage creator work without scattered tooling.</h2>
          </div>
        </div>
        <div className="join-steps-grid">
          {brandSteps.map((step, index) => (
            <article key={step.title} className="join-step-card">
              <span className="join-step-card__number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="join-section join-section--metrics">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Why teams switch</p>
            <h2 className="join-section__title">The account is designed to remove operating drag, not just open another profile.</h2>
          </div>
        </div>
        <div className="join-metric-grid">
          {brandMetrics.map((metric) => (
            <article key={metric.label} className="join-metric-card">
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">What the brand account unlocks</p>
            <h2 className="join-section__title">Built for teams that need faster creator decisions and cleaner execution.</h2>
          </div>
        </div>
        <div className="join-feature-grid">
          {brandFeatures.map((feature) => (
            <article key={feature.title} className="join-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Case studies</p>
            <h2 className="join-section__title">Examples of how a structured brand workflow changes campaign execution.</h2>
          </div>
        </div>
        <div className="join-case-study-grid">
          {brandCaseStudies.map((study) => (
            <article key={study.brand} className="join-case-study-card">
              <p className="join-case-study-card__brand">{study.brand}</p>
              <h3>{study.headline}</h3>
              <strong>{study.result}</strong>
              <p>{study.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Testimonials</p>
            <h2 className="join-section__title">Teams use the brand account to shorten decision cycles and keep campaign state visible.</h2>
          </div>
        </div>
        <div className="join-testimonial-grid">
          {brandTestimonials.map((testimonial) => (
            <article key={testimonial.name} className="join-testimonial-card">
              <p className="join-testimonial-card__quote">“{testimonial.quote}”</p>
              <div>
                <strong>{testimonial.name}</strong>
                <p>{testimonial.title}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="join-section">
        <div className="join-section__header">
          <div>
            <p className="join-eyebrow">Available now</p>
            <h2 className="join-section__title">Creator supply ready for briefs, packages, and instant-hire evaluation.</h2>
          </div>
          <Link className="join-section__link" href="/creators">
            View marketplace
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
                  <span className="media-badge">{creator.badges[0] ?? "Responsive"}</span>
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
            <p className="join-eyebrow">Frequently asked questions</p>
            <h2 className="join-section__title">Answers for teams deciding whether to move creator work into a dedicated brand account.</h2>
          </div>
        </div>
        <div className="join-faq-list">
          {brandFaqs.map((faq, index) => (
            <details key={faq.question} className="join-faq-card" open={index === 0}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="join-cta-band">
        <div>
          <p className="join-eyebrow">Create the brand account first</p>
          <h2 className="join-cta-band__title">Then move straight into creator search and protected hiring flows.</h2>
        </div>
        <Link className="join-cta-band__action" href={signupHref}>
          Join for free
        </Link>
      </section>

      {showSignupModal ? (
        <div className="join-modal" role="dialog" aria-modal="true" aria-labelledby="brand-signup-title">
          <Link aria-label="Close signup" className="join-modal__backdrop" href="/brand" />
          <div className="join-modal__panel auth-card join-signup-card">
            <div className="join-modal__header">
              <div>
                <p className="auth-card__eyebrow">Brand signup</p>
                <h2 className="auth-card__title" id="brand-signup-title">
                  Create your account
                </h2>
              </div>
              <Link className="join-modal__close" href="/brand">
                Close
              </Link>
            </div>

            <p className="auth-hint">Set up the team account you will use for creator search, secure purchases, and campaign coordination.</p>

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
                  <span className="auth-field__label">Brand name</span>
                  <input className="auth-input" name="companyName" placeholder="North Studio" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Email</span>
                  <input className="auth-input" name="email" placeholder="alex@northstudio.com" required type="email" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Password</span>
                  <input className="auth-input" minLength={8} name="password" placeholder="Create a password" required type="password" />
                </label>
                <input name="mode" type="hidden" value="register-brand" />
                <input name="role" type="hidden" value="brand" />
                <input name="redirectTo" type="hidden" value="/creators" />
                <button className="auth-submit" type="submit">
                  Sign up
                </button>
              </form>
            </details>

            <p className="join-signup-card__legal">
              By signing up, you agree to our <Link href="/pricing">pricing terms</Link> and marketplace policies.
            </p>
            <p className="auth-switch">
              Already have an account? <Link href="/auth?mode=brand-sign-in&redirectTo=%2Fcreators">Login</Link>
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}