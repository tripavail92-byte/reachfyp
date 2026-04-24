import { getCreatorRecordTotal } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { MarketplaceTopNav } from "../marketplace-top-nav";
import { CreatorsMarketplaceClient } from "./creators-marketplace-client";

type CreatorsMarketplacePageProps = {
  searchParams?: Promise<{
    previewState?: string;
  }>;
};

export default async function CreatorsMarketplacePage({ searchParams }: CreatorsMarketplacePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const previewState =
    resolvedSearchParams?.previewState === "empty" || resolvedSearchParams?.previewState === "error"
      ? resolvedSearchParams.previewState
      : "live";
  const totalCreators = getCreatorRecordTotal();

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creators" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Premium creator marketplace</p>
              <h1 className="hero-card__title">Find creators with real audience trust and premium campaign fit.</h1>
            </div>
            <div className="sort-badge">Responsive premium listing</div>
          </div>
          <p className="hero-card__copy">
            Browse a more polished discovery surface with live filters, sort, load-more behavior, and creator imagery
            driven by the shared marketplace contract and a database-backed creator repository.
          </p>
          <div className="metric-strip">
            <div className="metric-pill">
              <span className="metric-pill__label">Visible creators</span>
              <span className="metric-pill__value">{totalCreators}</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Default sort</span>
              <span className="metric-pill__value">Ranking score</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Primary signal</span>
              <span className="metric-pill__value">Authenticity</span>
            </div>
            <div className="metric-pill">
              <span className="metric-pill__label">Hire path</span>
              <span className="metric-pill__value">Profile first</span>
            </div>
          </div>
        </GlassPanel>
        <CreatorsMarketplaceClient previewState={previewState} totalCreators={totalCreators} />
      </div>
    </main>
  );
}