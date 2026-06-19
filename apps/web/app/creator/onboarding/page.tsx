import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";
import { OnboardingWizard } from "./onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function CreatorOnboardingPage() {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=register-creator&redirectTo=%2Fcreator%2Fonboarding");
  }

  if (currentUser.role !== "creator") {
    redirect("/creators");
  }

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creator/profile" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Creator setup</p>
              <h1 className="hero-card__title">Build your creator profile in a few quick steps.</h1>
            </div>
            <div className="sort-badge">Guided onboarding</div>
          </div>
          <p className="hero-card__copy">
            Add your bio, niche, channels, photo, and packages. When you publish, your profile goes live in the marketplace and brands can hire you instantly.
          </p>
        </GlassPanel>

        <OnboardingWizard initialHandle={currentUser.reservedCreatorUsername ?? ""} initialName={currentUser.name ?? ""} />
      </div>
    </main>
  );
}
