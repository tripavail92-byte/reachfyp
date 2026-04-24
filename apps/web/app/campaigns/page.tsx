import Link from "next/link";
import { GlassPanel } from "@reachfyp/ui";
import { MarketplaceTopNav } from "../marketplace-top-nav";

const campaignStages = [
  {
    title: "Brief structure",
    description: "Set category, market, deliverables, and budget guardrails before talent review starts.",
  },
  {
    title: "Ranked shortlist",
    description: "Pull in creators that already match authenticity, price, and fit signals without spreadsheet cleanup.",
  },
  {
    title: "Instant hire path",
    description: "Move from approved profile to package decision without dropping the premium discovery flow.",
  },
] as const;

export default function CampaignsPage() {
  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/campaigns" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Campaigns</p>
              <h1 className="hero-card__title">Turn ranked creator discovery into a cleaner campaign brief workflow.</h1>
            </div>
            <div className="sort-badge">Responsive premium workflow</div>
          </div>
          <p className="hero-card__copy">
            This route extends the same premium system into campaign planning so brands can move from shortlist to live brief without the UI
            dropping in quality or clarity.
          </p>
          <div className="metric-strip">
            <div className="metric-pill">
              <span className="metric-pill__label">Active brief template</span>
              <span className="metric-pill__value">UGC launch</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Primary outcome</span>
              <span className="metric-pill__value">Fast creator selection</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Recommended next step</span>
              <span className="metric-pill__value">Review creator shortlist</span>
            </div>
          </div>
        </GlassPanel>

        <section className="product-grid product-grid--three" aria-label="Campaign flow">
          {campaignStages.map((stage, index) => (
            <GlassPanel key={stage.title} className="product-card">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Step 0{index + 1}</p>
                  <h2 className="product-card__title">{stage.title}</h2>
                </div>
                <span className="badge">Campaign ready</span>
              </div>
              <p className="product-card__copy">{stage.description}</p>
            </GlassPanel>
          ))}
        </section>

        <section className="product-grid product-grid--two" aria-label="Campaign planning details">
          <GlassPanel className="product-card">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">Live brief</p>
                <h2 className="product-card__title">Spring beauty launch</h2>
              </div>
              <span className="badge badge--accent">Draft</span>
            </div>
            <p className="product-card__copy">Looking for short-form creators with clean scripting, strong save intent, and dependable product framing.</p>
            <div className="product-card__stack">
              <span className="chip">Budget $3k - $8k</span>
              <span className="chip">Deliverables 8 videos</span>
              <span className="chip">Priority UGC + TikTok</span>
            </div>
          </GlassPanel>

          <GlassPanel className="product-card product-card--feature">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">Next move</p>
                <h2 className="product-card__title">Start with ranked creators, then unlock auth for team access.</h2>
              </div>
              <Link className="chip chip--solid" href="/auth">
                Open auth
              </Link>
            </div>
            <p className="product-card__copy">
              Campaign planning is now part of the same design system. The next layer is protected team access, saved workflows, and brief-specific approvals.
            </p>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}