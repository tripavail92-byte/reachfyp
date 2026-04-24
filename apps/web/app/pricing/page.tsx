import Link from "next/link";
import { GlassPanel } from "@reachfyp/ui";
import { MarketplaceTopNav } from "../marketplace-top-nav";

const pricingTiers = [
  {
    name: "Starter",
    price: "$0 platform fee",
    description: "Use ranked discovery, shortlist creators, and build your first briefs without adding operational drag.",
    details: ["Unlimited creator browsing", "Authenticity-first ranking", "Shortlist and compare creator cards"],
  },
  {
    name: "Growth",
    price: "$299 / month",
    description: "For teams that need campaign planning rhythm, faster creator decisions, and more premium control over briefs.",
    details: ["Saved campaign templates", "Performance-first creator lists", "Collaborative shortlists for brand teams"],
  },
  {
    name: "Scale",
    price: "Custom",
    description: "For brands running multiple creator programs that need tighter review workflows and deeper operational visibility.",
    details: ["Dedicated onboarding", "Workflow extensions for campaign ops", "Custom reporting handoff"],
  },
] as const;

export default function PricingPage() {
  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/pricing" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Pricing</p>
              <h1 className="hero-card__title">Pricing that keeps discovery premium before operations get heavy.</h1>
            </div>
            <div className="sort-badge">Built for instant hire momentum</div>
          </div>
          <p className="hero-card__copy">
            Reachfyp is structured to keep creator discovery fast, ranking-led, and brand-friendly first. Upgrade only when your
            campaign workflow needs more control.
          </p>
          <div className="metric-strip">
            <div className="metric-pill">
              <span className="metric-pill__label">Core signal</span>
              <span className="metric-pill__value">Authenticity-first</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Default workflow</span>
              <span className="metric-pill__value">Discover to brief</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Best for</span>
              <span className="metric-pill__value">Lean brand teams</span>
            </div>
          </div>
        </GlassPanel>

        <section className="product-grid product-grid--three" aria-label="Pricing tiers">
          {pricingTiers.map((tier) => (
            <GlassPanel key={tier.name} className="product-card product-card--pricing">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">{tier.name}</p>
                  <h2 className="product-card__title">{tier.price}</h2>
                </div>
                <span className="badge badge--accent">Premium surface</span>
              </div>
              <p className="product-card__copy">{tier.description}</p>
              <div className="product-card__stack">
                {tier.details.map((detail) => (
                  <span key={detail} className="chip">
                    {detail}
                  </span>
                ))}
              </div>
            </GlassPanel>
          ))}
        </section>

        <GlassPanel className="product-card product-card--feature">
          <div className="product-card__header">
            <div>
              <p className="foundation-eyebrow">What is included now</p>
              <h2 className="product-card__title">The marketplace stays premium before checkout is fully wired.</h2>
            </div>
            <Link className="chip chip--solid" href="/campaigns">
              Start a campaign brief
            </Link>
          </div>
          <p className="product-card__copy">
            You can already search, rank, shortlist, compare, and move from discovery into a brief-friendly flow. The next paid layer is
            campaign operations depth, not access to discovery quality.
          </p>
        </GlassPanel>
      </div>
    </main>
  );
}