import Link from "next/link";
import { clearReservedCreatorUsername, getCreatorRecordByAuthUserId, normalizeCreatorUsername } from "@reachfyp/api";
import { GlassPanel } from "@reachfyp/ui";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../../lib/auth/session";
import { MarketplaceTopNav } from "../../marketplace-top-nav";

const socialPlatformOptions = ["Instagram", "TikTok", "YouTube", "X", "LinkedIn"] as const;

type CreatorProfileEditorPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
    claimedUsername?: string;
  }>;
};

const profileStatusMessages: Record<string, string> = {
  claimed: "This creator account is now attached to an existing marketplace profile and any earlier hires were rebound to your account.",
  created: "Your creator profile is live and editable.",
  deleted: "Your creator profile was deleted.",
  "package-created": "Your package is live on the public profile.",
  "package-deleted": "That package was removed from your public profile.",
  "package-updated": "Your package changes were saved.",
  "social-connected": "The social account is connected to your creator profile.",
  "social-disconnected": "The social account was removed from your profile.",
  "social-synced": "The social account sync marker was refreshed.",
  "social-updated": "The social account details were updated.",
  updated: "Your creator profile changes were saved.",
};

const profileErrorMessages: Record<string, string> = {
  "invalid-image-url": "Use a valid image URL that starts with http or https.",
  "invalid-package-price": "Enter a valid package price.",
  "invalid-price": "Enter a valid starting price.",
  "invalid-social-url": "Use a valid social profile URL that starts with http or https.",
  "invalid-username": "Use a username with only letters, numbers, and hyphens.",
  "missing-package-fields": "Fill in all package fields before saving.",
  "missing-fields": "Fill in the required profile fields before saving.",
  "missing-social-fields": "Fill in the social platform, handle, and URL before saving.",
  "package-not-found": "That package could not be found for this profile.",
  "package-title-in-use": "Package titles must stay unique within a creator profile.",
  "profile-not-found": "Create your public creator profile before adding packages or social accounts.",
  "social-account-not-found": "That social account could not be found for this creator profile.",
  "username-in-use": "That username is already taken.",
};

export default async function CreatorProfileEditorPage({ searchParams }: CreatorProfileEditorPageProps) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser) {
    redirect("/auth?mode=creator-sign-in&redirectTo=%2Fcreator%2Fprofile");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const creatorProfile = await getCreatorRecordByAuthUserId(currentUser.id);
  if (creatorProfile && currentUser.reservedCreatorUsername) {
    await clearReservedCreatorUsername(currentUser.id);
  }
  const claimedUsername = normalizeCreatorUsername(String(resolvedSearchParams?.claimedUsername ?? ""));
  const feedbackMessage =
    (resolvedSearchParams?.error ? profileErrorMessages[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.status ? profileStatusMessages[resolvedSearchParams.status] : undefined) ??
    (!creatorProfile && (claimedUsername || currentUser.reservedCreatorUsername)
      ? `You reserved @${claimedUsername || currentUser.reservedCreatorUsername}. Finish the profile details below to publish it.`
      : undefined);

  return (
    <main className="app-shell">
      <div className="shell-container">
        <MarketplaceTopNav activeHref="/creator/profile" />

        <GlassPanel className="hero-card">
          <div className="hero-card__header">
            <div>
              <p className="foundation-eyebrow">Creator profile editor</p>
              <h1 className="hero-card__title">Create and maintain the public creator profile tied to your account.</h1>
            </div>
            <div className="sort-badge">Owner-scoped profile CRUD</div>
          </div>
          <p className="hero-card__copy">
            This is the first real creator-side write flow. It lets a signed-in creator create, update, or remove one public profile while keeping the existing marketplace and public profile routes intact.
          </p>
          {feedbackMessage ? <span className="badge badge--accent">{feedbackMessage}</span> : null}
        </GlassPanel>

        {currentUser.role !== "creator" ? (
          <section className="auth-layout" aria-label="Creator account required">
            <GlassPanel className="auth-panel auth-panel--highlight">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Role boundary</p>
                  <h2 className="product-card__title">This editor is only available to creator accounts.</h2>
                </div>
                <span className="badge">Current role: {currentUser.role}</span>
              </div>
              <p className="product-card__copy">
                Brand and admin accounts can keep using discovery and planning flows, but public creator profile writes are owner-scoped to creator users.
              </p>
              <div className="auth-actions">
                <Link className="chip chip--solid" href="/creators">
                  Back to creators
                </Link>
                <Link className="chip" href="/auth?status=signed-out">
                  Switch account
                </Link>
              </div>
            </GlassPanel>
          </section>
        ) : (
          <section className="auth-layout" aria-label="Creator profile editor layout">
            <GlassPanel className="auth-panel">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Profile details</p>
                  <h2 className="product-card__title">{creatorProfile ? "Update your public creator profile" : "Create your public creator profile"}</h2>
                </div>
                {creatorProfile ? <span className="badge">@{creatorProfile.username}</span> : <span className="badge">Not published yet</span>}
              </div>
              <form action="/creator/profile/save" className="auth-form" method="post">
                <label className="auth-field">
                  <span className="auth-field__label">Username</span>
                  <input className="auth-input" defaultValue={creatorProfile?.username ?? claimedUsername ?? currentUser.reservedCreatorUsername ?? currentUser.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")} name="username" placeholder="maya-cole" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Display name</span>
                  <input className="auth-input" defaultValue={creatorProfile?.name ?? currentUser.name} name="name" placeholder="Maya Cole" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Location</span>
                  <input className="auth-input" defaultValue={creatorProfile?.location ?? ""} name="location" placeholder="New York, US" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Starting price</span>
                  <input className="auth-input" defaultValue={creatorProfile?.price?.replace(/[^0-9.]/g, "") ?? ""} name="price" placeholder="450" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Image URL</span>
                  <input className="auth-input" defaultValue={creatorProfile?.imageUrl ?? ""} name="imageUrl" placeholder="https://images.unsplash.com/..." required type="url" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Image alt</span>
                  <input className="auth-input" defaultValue={creatorProfile?.imageAlt ?? ""} name="imageAlt" placeholder="Creator portrait with natural light." required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Niche tags</span>
                  <input className="auth-input" defaultValue={creatorProfile?.niche.join(", ") ?? ""} name="niche" placeholder="Beauty, UGC, TikTok" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Summary</span>
                  <textarea className="auth-input auth-input--textarea" defaultValue={creatorProfile?.summary ?? ""} name="summary" placeholder="Short summary for the creator card and profile header." required rows={4} />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Package note</span>
                  <input className="auth-input" defaultValue={creatorProfile?.packageNote ?? ""} name="packageNote" placeholder="2 videos, 5-day turnaround" required type="text" />
                </label>
                <label className="auth-field">
                  <span className="auth-field__label">Hero note</span>
                  <textarea className="auth-input auth-input--textarea" defaultValue={creatorProfile?.heroNote ?? ""} name="heroNote" placeholder="Longer note used on the public creator profile." required rows={4} />
                </label>
                <div className="auth-actions">
                  <button className="chip chip--solid" type="submit">
                    {creatorProfile ? "Save profile" : "Create profile"}
                  </button>
                  {creatorProfile ? (
                    <Link className="chip" href={`/creators/${creatorProfile.username}`}>
                      View public profile
                    </Link>
                  ) : null}
                </div>
              </form>
            </GlassPanel>

            <GlassPanel className="auth-panel auth-panel--highlight">
              <div className="product-card__header">
                <div>
                  <p className="foundation-eyebrow">Publish state</p>
                  <h2 className="product-card__title">Keep this profile in sync with the public marketplace.</h2>
                </div>
                {creatorProfile ? <Link className="chip" href={`/creators/${creatorProfile.username}`}>Open public profile</Link> : <span className="chip">No public profile yet</span>}
              </div>
              <div className="product-card__stack">
                <span className="chip">One creator profile per account</span>
                <span className="chip">Public listing updates after each save</span>
                <span className="chip">Packages and social sync now attach here</span>
                <Link className="chip" href="/creator/hires">
                  Open creator hires
                </Link>
              </div>
              <p className="product-card__copy">
                Packages, social sync, and creator-visible hires now sit on top of the owner-controlled profile base. Saving a seed username claims that marketplace profile for your account.
              </p>
              {creatorProfile ? (
                <form action="/creator/profile/delete" className="auth-actions" method="post">
                  <button className="chip" type="submit">
                    Delete public profile
                  </button>
                </form>
              ) : null}
            </GlassPanel>

            {creatorProfile ? (
              <>
                <GlassPanel className="profile-section-card">
                  <div className="profile-section-card__header">
                    <div>
                      <h2 className="results-toolbar__title">Packages workspace</h2>
                      <p className="results-toolbar__subtitle">Create, update, and remove the instant-hire-ready packages shown on your public creator page.</p>
                    </div>
                    <Link className="chip" href={`/creators/${creatorProfile.username}`}>
                      Preview public packages
                    </Link>
                  </div>
                  <div className="profile-package-grid">
                    {creatorProfile.packages.map((pack) => (
                      <form key={pack.title} action="/creator/packages/save" className="auth-panel" method="post">
                        <input name="originalTitle" type="hidden" value={pack.title} />
                        <label className="auth-field">
                          <span className="auth-field__label">Package title</span>
                          <input className="auth-input" defaultValue={pack.title} name="title" required type="text" />
                        </label>
                        <label className="auth-field">
                          <span className="auth-field__label">Package price</span>
                          <input className="auth-input" defaultValue={pack.price.replace(/[^0-9.]/g, "")} name="price" required type="text" />
                        </label>
                        <label className="auth-field">
                          <span className="auth-field__label">Turnaround</span>
                          <input className="auth-input" defaultValue={pack.turnaround} name="turnaround" required type="text" />
                        </label>
                        <label className="auth-field">
                          <span className="auth-field__label">Details</span>
                          <textarea className="auth-input auth-input--textarea" defaultValue={pack.details} name="details" required rows={4} />
                        </label>
                        <div className="auth-actions">
                          <button className="chip chip--solid" type="submit">
                            Save package
                          </button>
                        </div>
                      </form>
                    ))}
                    <GlassPanel className="auth-panel auth-panel--highlight">
                      <div className="product-card__header">
                        <div>
                          <p className="foundation-eyebrow">New package</p>
                          <h3 className="product-card__title">Add another public offer</h3>
                        </div>
                        <span className="badge">Owner-scoped CRUD</span>
                      </div>
                      <form action="/creator/packages/save" className="auth-form" method="post">
                        <label className="auth-field">
                          <span className="auth-field__label">Package title</span>
                          <input className="auth-input" name="title" placeholder="UGC Retargeting Pack" required type="text" />
                        </label>
                        <label className="auth-field">
                          <span className="auth-field__label">Package price</span>
                          <input className="auth-input" name="price" placeholder="790" required type="text" />
                        </label>
                        <label className="auth-field">
                          <span className="auth-field__label">Turnaround</span>
                          <input className="auth-input" name="turnaround" placeholder="6 days" required type="text" />
                        </label>
                        <label className="auth-field">
                          <span className="auth-field__label">Details</span>
                          <textarea className="auth-input auth-input--textarea" name="details" placeholder="Deliverables, angle coverage, and revision scope." required rows={4} />
                        </label>
                        <div className="auth-actions">
                          <button className="chip chip--solid" type="submit">
                            Add package
                          </button>
                        </div>
                      </form>
                    </GlassPanel>
                  </div>
                  {creatorProfile.packages.length > 0 ? (
                    <div className="profile-list-grid">
                      {creatorProfile.packages.map((pack) => (
                        <form key={`${pack.title}-delete`} action="/creator/packages/delete" className="profile-list-card" method="post">
                          <input name="title" type="hidden" value={pack.title} />
                          <h3 className="panel-card-title">Remove {pack.title}</h3>
                          <p className="profile-list-card__copy">Delete this package from the public profile when the offer is no longer active.</p>
                          <button className="chip" type="submit">
                            Delete package
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </GlassPanel>

                <GlassPanel className="profile-section-card">
                  <div className="profile-section-card__header">
                    <div>
                      <h2 className="results-toolbar__title">Social connect and sync</h2>
                      <p className="results-toolbar__subtitle">Connect public platform profiles and refresh sync markers from the creator workspace.</p>
                    </div>
                    <span className="sort-badge">Foundation for OAuth sync</span>
                  </div>
                  <div className="profile-list-grid">
                    {creatorProfile.socialAccounts.length > 0 ? (
                      creatorProfile.socialAccounts.map((account) => (
                        <GlassPanel key={account.platform} className="profile-list-card">
                          <h3 className="panel-card-title">{account.platform}</h3>
                          <p className="profile-list-card__copy">{account.handle} · {account.followers}</p>
                          <p className="profile-list-card__copy">{account.syncStatus}{account.lastSyncedAt ? ` · ${new Date(account.lastSyncedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</p>
                          <div className="auth-actions">
                            <Link className="chip" href={account.url} target="_blank">
                              Open profile
                            </Link>
                            <form action="/creator/socials/sync" method="post">
                              <input name="platform" type="hidden" value={account.platform} />
                              <button className="chip chip--solid" type="submit">
                                Sync now
                              </button>
                            </form>
                            <form action="/creator/socials/delete" method="post">
                              <input name="platform" type="hidden" value={account.platform} />
                              <button className="chip" type="submit">
                                Disconnect
                              </button>
                            </form>
                          </div>
                        </GlassPanel>
                      ))
                    ) : (
                      <div className="profile-list-card">
                        <h3 className="panel-card-title">No social accounts connected yet</h3>
                        <p className="profile-list-card__copy">Connect at least one social profile so future OAuth sync and audience proofs have a persisted owner-scoped base.</p>
                      </div>
                    )}
                  </div>
                  <GlassPanel className="auth-panel auth-panel--highlight">
                    <div className="product-card__header">
                      <div>
                        <p className="foundation-eyebrow">Connect account</p>
                        <h3 className="product-card__title">Add or update a public social profile</h3>
                      </div>
                      <span className="badge">One account per platform</span>
                    </div>
                    <form action="/creator/socials/connect" className="auth-form" method="post">
                      <label className="auth-field">
                        <span className="auth-field__label">Platform</span>
                        <select className="auth-input" defaultValue={socialPlatformOptions[0]} name="platform">
                          {socialPlatformOptions.map((platform) => (
                            <option key={platform} value={platform}>
                              {platform}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="auth-field">
                        <span className="auth-field__label">Handle</span>
                        <input className="auth-input" name="handle" placeholder="@creatorhandle" required type="text" />
                      </label>
                      <label className="auth-field">
                        <span className="auth-field__label">Profile URL</span>
                        <input className="auth-input" name="url" placeholder="https://instagram.com/creatorhandle" required type="url" />
                      </label>
                      <label className="auth-field">
                        <span className="auth-field__label">Audience snapshot</span>
                        <input className="auth-input" name="followers" placeholder="85K followers" required type="text" />
                      </label>
                      <div className="auth-actions">
                        <button className="chip chip--solid" type="submit">
                          Connect or update
                        </button>
                      </div>
                    </form>
                  </GlassPanel>
                </GlassPanel>
              </>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}