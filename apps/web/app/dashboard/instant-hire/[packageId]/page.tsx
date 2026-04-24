import Link from "next/link";
import { getCreatorPackageByCheckoutId, getWalletAccountByUserId } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { notFound, redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../../lib/auth/session";
import { MarketplaceTopNav } from "../../../marketplace-top-nav";

type InstantHireCheckoutPageProps = {
  params: Promise<{
    packageId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

const instantHireErrorMessages: Record<string, string> = {
  "invalid-deadline": "Choose a delivery deadline in the future.",
  "insufficient-wallet-balance": "The local brand wallet does not have enough available balance for this hold.",
  "missing-brief": "Add a short brief before confirming the instant hire.",
  "package-not-found": "The selected package could not be found.",
};

export default async function InstantHireCheckoutPage({ params, searchParams }: InstantHireCheckoutPageProps) {
  const { packageId } = await params;
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect(`/auth?mode=brand-checkout-register&redirectTo=${encodeURIComponent(`/dashboard/instant-hire/${packageId}`)}`);
  }

  const packageSelection = getCreatorPackageByCheckoutId(packageId);

  if (!packageSelection) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.error ? instantHireErrorMessages[resolvedSearchParams.error] : undefined;
  const brandWallet = currentUser.role === "brand" ? getWalletAccountByUserId(currentUser.id) : undefined;

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creators" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Brand instant hire checkout</p>
              <h1 className="hero-card__title">Confirm the package, deadline, and brief before the instant hire is created.</h1>
            </div>
            <div className="sort-badge">Architecture-aligned server command</div>
          </div>
          <p className="hero-card__copy">
            This route matches the brand checkout path in the architecture. The local foundation now creates an accepted instant hire record, boots a hire conversation, and writes the local wallet hold in one server-owned transaction.
          </p>
          {errorMessage ? <span className="badge badge--accent">{errorMessage}</span> : null}
        </GlassPanel>

        {currentUser.role !== "brand" ? (
          <section className="auth-layout" aria-label="Brand account required">
            <GlassPanel className="auth-panel auth-panel--highlight">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Role boundary</p>
                  <h2 className="product-card__title">Instant hire entry requires an authenticated brand account.</h2>
                </div>
                <span className="badge">Current role: {currentUser.role}</span>
              </div>
              <p className="product-card__copy">
                Creator accounts can manage supply setup, but only brand accounts can confirm direct package hires and create accepted instant-hire records.
              </p>
              <div className="auth-actions">
                <Link className="chip chip--solid" href={`/creators/${packageSelection.creator.username}`}>
                  Back to creator profile
                </Link>
                <form action="/auth/sign-out" method="post">
                  <button className="chip" type="submit">
                    Sign out and switch account
                  </button>
                </form>
              </div>
            </GlassPanel>
          </section>
        ) : (
          <section className="auth-layout" aria-label="Instant hire checkout layout">
            <GlassPanel className="auth-panel">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Selected package</p>
                  <h2 className="product-card__title">{packageSelection.package.title}</h2>
                </div>
                <span className="badge">{packageSelection.package.price}</span>
              </div>
              <div className="product-card__stack">
                <span className="chip">Creator {packageSelection.creator.name}</span>
                <span className="chip">Turnaround {packageSelection.package.turnaround}</span>
                <span className="chip">Status becomes accepted immediately</span>
                <span className="chip">Escrow hold writes to wallet ledger</span>
              </div>
              <p className="product-card__copy">{packageSelection.package.details}</p>
              <form action={`/dashboard/instant-hire/${packageId}/confirm`} className="auth-form" method="post">
                <label className="auth-field">
                  <span className="auth-field__label">Delivery deadline</span>
                  <input className="auth-input" defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} min={new Date().toISOString().slice(0, 10)} name="deliveryDeadline" required type="date" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Brief</span>
                  <textarea className="auth-input auth-input--textarea" name="brief" placeholder="Key messaging, CTA, content angle, and must-include notes." required rows={5} />
                </label>
                <div className="auth-actions">
                  <button className="chip chip--solid" type="submit">
                    Confirm instant hire
                  </button>
                  <Link className="chip" href={`/creators/${packageSelection.creator.username}`}>
                    Back to creator profile
                  </Link>
                </div>
              </form>
            </GlassPanel>

            <GlassPanel className="auth-panel auth-panel--highlight">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Checkout summary</p>
                  <h2 className="product-card__title">Server-owned command boundary</h2>
                </div>
                <span className="badge">Brand-only entry</span>
              </div>
              <div className="profile-list-grid">
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Accepted immediately</h3>
                  <p className="profile-list-card__copy">The instant-hire record is created with `hire_type=instant` and `status=accepted` in one server-owned command.</p>
                </div>
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Local escrow hold</h3>
                  <p className="profile-list-card__copy">The brand wallet balance is reduced and held balance increases locally at hire creation. Stripe-backed holds still land in the next backend slice.</p>
                </div>
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Message thread bootstrap</h3>
                  <p className="profile-list-card__copy">A hire-scoped conversation row and the first messages are created automatically from this checkout command.</p>
                </div>
                <div className="profile-list-card">
                  <h3 className="panel-card-title">Tracking link</h3>
                  <p className="profile-list-card__copy">A tracking token is generated at hire creation so the later hires module can attach delivery and performance events to this same record.</p>
                </div>
              </div>
              {brandWallet ? (
                <div className="profile-list-grid">
                  <div className="profile-list-card">
                    <h3 className="panel-card-title">Available balance</h3>
                    <p className="profile-list-card__copy">${brandWallet.balance.toFixed(2)}</p>
                  </div>
                  <div className="profile-list-card">
                    <h3 className="panel-card-title">Held balance</h3>
                    <p className="profile-list-card__copy">${brandWallet.heldBalance.toFixed(2)}</p>
                  </div>
                  <div className="profile-list-card">
                    <h3 className="panel-card-title">Checkout amount</h3>
                    <p className="profile-list-card__copy">{packageSelection.package.price}</p>
                  </div>
                </div>
              ) : null}
            </GlassPanel>
          </section>
        )}
      </div>
    </main>
  );
}