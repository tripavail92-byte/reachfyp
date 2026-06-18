import Link from "next/link";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { MarketplaceTopNav } from "../../../marketplace-top-nav";

export const dynamic = "force-dynamic";

type CreateCampaignPageProps = {
  searchParams?: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  "missing-fields": "Fill in all required fields before submitting.",
  "invalid-dates": "The end date must be after the start date.",
  "invalid-budget": "Enter a valid budget amount.",
};

const platformOptions = ["Instagram", "TikTok", "YouTube", "X", "Facebook", "LinkedIn"] as const;
const objectiveOptions = ["Awareness", "Traffic", "Conversions", "UGC", "Brand lift"] as const;

export default async function CreateCampaignPage({ searchParams }: CreateCampaignPageProps) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=brand-sign-in&redirectTo=%2Fdashboard%2Fcampaigns%2Fcreate");
  }

  if (currentUser.role !== "brand" && currentUser.role !== "admin") {
    redirect("/creator/hires");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const feedbackMessage = resolvedParams?.error ? errorMessages[resolvedParams.error] : undefined;

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/dashboard/campaigns" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">New campaign</p>
              <h1 className="hero-card__title">Write a brief that attracts creators already ranked for your niche.</h1>
            </div>
            <div className="sort-badge">Brand operations</div>
          </div>
          <p className="hero-card__copy">
            Your campaign will be listed in the open marketplace. Creators can browse, filter by niche and platform,
            and apply with a message and proposed price.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
        </GlassPanel>

        <section className="auth-layout" aria-label="Campaign creation form">
          <GlassPanel className="auth-panel">
            <div className="product-card__header">
              <div>
                <p className="foundation-eyebrow">Brief details</p>
                <h2 className="product-card__title">Campaign brief</h2>
              </div>
            </div>
            <form action="/dashboard/campaigns/create/submit" className="auth-form" method="post">
              <label className="auth-field">
                <span className="auth-field__label">Campaign title</span>
                <input className="auth-input" name="title" placeholder="Spring beauty launch" required type="text" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Objective</span>
                <select className="auth-input" name="objective" required>
                  <option value="">Select objective</option>
                  {objectiveOptions.map((o) => (
                    <option key={o} value={o.toLowerCase()}>{o}</option>
                  ))}
                </select>
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Description</span>
                <textarea
                  className="auth-input auth-input--textarea"
                  name="description"
                  placeholder="Describe your campaign goals, brand voice, and what you are looking for from creators."
                  required
                  rows={5}
                />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Budget (USD)</span>
                <input className="auth-input" name="budget" placeholder="5000" required type="text" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Platforms (comma-separated)</span>
                <input className="auth-input" name="platforms" placeholder={platformOptions.join(", ")} required type="text" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Niche tags (comma-separated)</span>
                <input className="auth-input" name="niche" placeholder="Beauty, UGC, Skincare" required type="text" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Deliverables</span>
                <textarea
                  className="auth-input auth-input--textarea"
                  name="deliverables"
                  placeholder="3 × 30-second Instagram Reels, 1 × TikTok unboxing video."
                  required
                  rows={4}
                />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Requirements</span>
                <textarea
                  className="auth-input auth-input--textarea"
                  name="requirements"
                  placeholder="Minimum 10k followers, beauty niche, based in US or UK."
                  rows={3}
                />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Start date</span>
                <input className="auth-input" name="timelineStart" required type="date" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">End date</span>
                <input className="auth-input" name="timelineEnd" required type="date" />
              </label>
              <div className="auth-actions">
                <button className="chip chip--solid" type="submit">
                  Publish campaign
                </button>
                <Link className="chip" href="/dashboard/campaigns">
                  Cancel
                </Link>
              </div>
            </form>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}
