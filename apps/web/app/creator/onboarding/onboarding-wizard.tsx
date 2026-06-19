"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const NICHE_OPTIONS = [
  "Lifestyle",
  "Beauty",
  "Fashion",
  "Travel",
  "Health & Fitness",
  "Food & Drink",
  "Tech",
  "Gaming",
  "Comedy & Entertainment",
  "Education",
  "Business & Finance",
  "Parenting",
];

const PLATFORM_OPTIONS = ["Instagram", "TikTok", "YouTube", "X", "LinkedIn"];
const FOLLOWER_BANDS = ["0–1k", "1k–10k", "10k–50k", "50k–100k", "100k–500k", "500k–1M", "1M+"];
const PACKAGE_TYPES = [
  "Instagram Reel",
  "Instagram Photo Post",
  "Instagram Story",
  "TikTok Video",
  "YouTube Integration",
  "UGC Video",
  "UGC Photo Pack",
  "Product Review",
];
const TURNAROUND_OPTIONS = ["2 days", "3 days", "5 days", "7 days", "10 days", "14 days"];

const PRESET_PHOTOS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
];

const PLATFORM_FEE = 0.15;

const STEP_TITLES = [
  "About you",
  "Your niche",
  "Your channels",
  "Your photo",
  "Your packages",
  "Review & publish",
];

const publishErrorMessages: Record<string, string> = {
  "bio-too-short": "Your bio needs at least 100 characters.",
  "invalid-username": "That handle isn't valid — use letters, numbers, and hyphens only.",
  "username-taken": "That handle is already taken. Try another.",
  "creator-username-unavailable": "That handle is already taken. Try another.",
  "missing-fields": "Please complete all required fields.",
  "missing-socials": "Add at least one social channel.",
  "missing-packages": "Add at least one package.",
  "invalid-image-url": "Use a valid https image URL for your photo.",
  "invalid-package-price": "Each package needs a valid price.",
  "not-authorized": "Please sign in as a creator to continue.",
};

type SocialDraft = { platform: string; handle: string; followers: string };
type PackageDraft = { title: string; price: string; turnaround: string; details: string };

type OnboardingWizardProps = {
  initialHandle: string;
  initialName: string;
};

function normalizeHandle(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priceToNumber(raw: string) {
  const value = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function OnboardingWizard({ initialHandle, initialName }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);

  const [handle, setHandle] = useState(initialHandle);
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [niche, setNiche] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [socials, setSocials] = useState<SocialDraft[]>([]);
  const [packages, setPackages] = useState<PackageDraft[]>([]);

  // Inline editors for the add-rows
  const [socialDraft, setSocialDraft] = useState<SocialDraft>({ platform: "Instagram", handle: "", followers: FOLLOWER_BANDS[0] });
  const [packageDraft, setPackageDraft] = useState<PackageDraft>({ title: PACKAGE_TYPES[0], price: "", turnaround: TURNAROUND_OPTIONS[2], details: "" });

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const normalizedHandle = normalizeHandle(handle);

  function toggleNiche(option: string) {
    setNiche((current) => {
      if (current.includes(option)) {
        return current.filter((value) => value !== option);
      }
      if (current.length >= 6) {
        return current;
      }
      return [...current, option];
    });
  }

  function suggestBio() {
    const focus = niche.length > 0 ? niche.slice(0, 3).join(", ").toLowerCase() : "lifestyle and product";
    const where = location.trim() ? ` based in ${location.trim()}` : "";
    const who = name.trim() || "I";
    const draft = `${who} is a ${focus} content creator${where}, producing authentic short-form video — reviews, unboxings, and how-to tutorials — that resonates with engaged audiences and helps brands turn views into real results. Open to UGC and paid partnerships.`;
    setSummary(draft);
  }

  function addSocial() {
    if (!socialDraft.handle.trim()) {
      return;
    }
    setSocials((current) => [
      ...current.filter((social) => social.platform !== socialDraft.platform),
      { ...socialDraft, handle: socialDraft.handle.trim() },
    ]);
    setSocialDraft({ platform: "Instagram", handle: "", followers: FOLLOWER_BANDS[0] });
  }

  function removeSocial(index: number) {
    setSocials((current) => current.filter((_, i) => i !== index));
  }

  function addPackage() {
    if (!packageDraft.title.trim() || priceToNumber(packageDraft.price) <= 0 || !packageDraft.details.trim()) {
      return;
    }
    setPackages((current) => [...current, { ...packageDraft }]);
    setPackageDraft({ title: PACKAGE_TYPES[0], price: "", turnaround: TURNAROUND_OPTIONS[2], details: "" });
  }

  function removePackage(index: number) {
    setPackages((current) => current.filter((_, i) => i !== index));
  }

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(normalizedHandle) && name.trim().length >= 2 && location.trim().length > 0 && summary.trim().length >= 100;
      case 1:
        return niche.length > 0;
      case 2:
        return socials.length > 0;
      case 3:
        return /^https?:\/\//.test(imageUrl.trim());
      case 4:
        return packages.length > 0;
      default:
        return true;
    }
  }, [step, normalizedHandle, name, location, summary, niche, socials, imageUrl, packages]);

  async function publish() {
    setPublishing(true);
    setPublishError(null);

    try {
      const response = await fetch("/creator/onboarding/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: normalizedHandle,
          name: name.trim(),
          location: location.trim(),
          summary: summary.trim(),
          imageUrl: imageUrl.trim(),
          niche,
          socials,
          packages,
        }),
      });

      const data = (await response.json()) as { ok: boolean; username?: string; error?: string };

      if (data.ok && data.username) {
        window.location.href = `/creators/${data.username}`;
        return;
      }

      setPublishError(publishErrorMessages[data.error ?? ""] ?? "Something went wrong publishing your profile. Please try again.");
    } catch {
      setPublishError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setPublishing(false);
    }
  }

  const progress = Math.round(((step + 1) / STEP_TITLES.length) * 100);
  const summaryCount = summary.trim().length;

  return (
    <section className="onboarding" aria-label="Creator onboarding">
      <div className="onboarding-progress" aria-hidden="true">
        <div className="onboarding-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <p className="foundation-eyebrow onboarding-steptag">
        Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
      </p>

      {step === 0 ? (
        <div className="onboarding-step">
          <h2 className="onboarding-step__title">Tell brands who you are</h2>
          <p className="onboarding-step__copy">This becomes the top of your public profile. A clear bio is the single biggest driver of brand replies.</p>

          <label className="auth-field">
            <span className="auth-field__label">Your handle</span>
            <div className="onboarding-handle">
              <span className="onboarding-handle__prefix">reachfyp.com/</span>
              <input className="auth-input onboarding-handle__input" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="yourname" />
            </div>
            {normalizedHandle ? <span className="auth-hint">Your profile: reachfyp.com/{normalizedHandle}</span> : null}
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Display name</span>
            <input className="auth-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Aria Stone" />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Location</span>
            <input className="auth-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lahore, PK" />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">
              Describe yourself and your content
              <button type="button" className="onboarding-suggest" onClick={suggestBio}>✨ Draft a starter bio</button>
            </span>
            <textarea className="auth-input auth-input--textarea" rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What you make, who it's for, and the results you create for brands." />
            <span className={`auth-hint${summaryCount > 0 && summaryCount < 100 ? " onboarding-hint--warn" : ""}`}>
              {summaryCount}/100 characters minimum
            </span>
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="onboarding-step">
          <h2 className="onboarding-step__title">What kind of content do you post?</h2>
          <p className="onboarding-step__copy">Pick up to 6. Brands filter the marketplace by these, so choose what you actually create.</p>
          <div className="onboarding-options">
            {NICHE_OPTIONS.map((option) => {
              const selected = niche.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  className={`onboarding-option${selected ? " onboarding-option--selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => toggleNiche(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="auth-hint">{niche.length}/6 selected</p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="onboarding-step">
          <h2 className="onboarding-step__title">Add your channels</h2>
          <p className="onboarding-step__copy">Self-report your handles and audience size — no account login needed. Add at least one.</p>

          {socials.length > 0 ? (
            <div className="onboarding-rowlist">
              {socials.map((social, index) => (
                <div key={`${social.platform}-${index}`} className="onboarding-rowcard">
                  <div>
                    <strong className="panel-card-title">{social.platform}</strong>
                    <p className="profile-list-card__copy">@{social.handle.replace(/^@+/, "")} · {social.followers}</p>
                  </div>
                  <button type="button" className="onboarding-remove" onClick={() => removeSocial(index)}>Remove</button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="onboarding-addrow">
            <label className="auth-field">
              <span className="auth-field__label">Platform</span>
              <select className="auth-input" value={socialDraft.platform} onChange={(event) => setSocialDraft({ ...socialDraft, platform: event.target.value })}>
                {PLATFORM_OPTIONS.map((platform) => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </label>
            <label className="auth-field">
              <span className="auth-field__label">Handle</span>
              <input className="auth-input" value={socialDraft.handle} onChange={(event) => setSocialDraft({ ...socialDraft, handle: event.target.value })} placeholder="yourhandle" />
            </label>
            <label className="auth-field">
              <span className="auth-field__label">Followers</span>
              <select className="auth-input" value={socialDraft.followers} onChange={(event) => setSocialDraft({ ...socialDraft, followers: event.target.value })}>
                {FOLLOWER_BANDS.map((band) => (
                  <option key={band} value={band}>{band}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="chip" onClick={addSocial} disabled={!socialDraft.handle.trim()}>+ Add channel</button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="onboarding-step">
          <h2 className="onboarding-step__title">Add a profile photo</h2>
          <p className="onboarding-step__copy">Paste an image URL, or pick a placeholder to get started — you can change it later.</p>

          <div className="onboarding-photo">
            <div className="onboarding-photo__preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl.trim() ? <img src={imageUrl.trim()} alt="Profile preview" /> : <span className="onboarding-photo__placeholder">No photo yet</span>}
            </div>
            <div className="onboarding-photo__presets">
              {PRESET_PHOTOS.map((url) => (
                <button
                  type="button"
                  key={url}
                  className={`onboarding-photo__chip${imageUrl.trim() === url ? " onboarding-photo__chip--selected" : ""}`}
                  onClick={() => setImageUrl(url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Preset option" />
                </button>
              ))}
            </div>
          </div>

          <label className="auth-field">
            <span className="auth-field__label">Image URL</span>
            <input className="auth-input" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="onboarding-step">
          <h2 className="onboarding-step__title">Add your content packages</h2>
          <p className="onboarding-step__copy">
            These are what brands buy. reachfyp takes a {Math.round(PLATFORM_FEE * 100)}% fee, so you keep {Math.round((1 - PLATFORM_FEE) * 100)}% of every sale.
          </p>

          {packages.length > 0 ? (
            <div className="onboarding-rowlist">
              {packages.map((pkg, index) => {
                const price = priceToNumber(pkg.price);
                return (
                  <div key={`${pkg.title}-${index}`} className="onboarding-rowcard">
                    <div>
                      <strong className="panel-card-title">{pkg.title} · ${Math.round(price)}</strong>
                      <p className="profile-list-card__copy">{pkg.turnaround} · you earn ${Math.round(price * (1 - PLATFORM_FEE))}</p>
                      <p className="profile-list-card__copy">{pkg.details}</p>
                    </div>
                    <button type="button" className="onboarding-remove" onClick={() => removePackage(index)}>Remove</button>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="onboarding-addrow">
            <label className="auth-field">
              <span className="auth-field__label">Package</span>
              <select className="auth-input" value={packageDraft.title} onChange={(event) => setPackageDraft({ ...packageDraft, title: event.target.value })}>
                {PACKAGE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="auth-field">
              <span className="auth-field__label">Price (USD)</span>
              <input className="auth-input" inputMode="numeric" value={packageDraft.price} onChange={(event) => setPackageDraft({ ...packageDraft, price: event.target.value })} placeholder="150" />
            </label>
            <label className="auth-field">
              <span className="auth-field__label">Turnaround</span>
              <select className="auth-input" value={packageDraft.turnaround} onChange={(event) => setPackageDraft({ ...packageDraft, turnaround: event.target.value })}>
                {TURNAROUND_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="auth-field">
            <span className="auth-field__label">What&apos;s included</span>
            <textarea className="auth-input auth-input--textarea" rows={3} value={packageDraft.details} onChange={(event) => setPackageDraft({ ...packageDraft, details: event.target.value })} placeholder="e.g. 1 × 30s vertical video, 1 revision, full usage rights." />
          </label>
          {priceToNumber(packageDraft.price) > 0 ? (
            <p className="onboarding-fee-note">On a ${Math.round(priceToNumber(packageDraft.price))} sale you keep ${Math.round(priceToNumber(packageDraft.price) * (1 - PLATFORM_FEE))} after the {Math.round(PLATFORM_FEE * 100)}% fee.</p>
          ) : null}
          <button type="button" className="chip" onClick={addPackage} disabled={!packageDraft.title.trim() || priceToNumber(packageDraft.price) <= 0 || !packageDraft.details.trim()}>+ Add package</button>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="onboarding-step">
          <h2 className="onboarding-step__title">Review and publish</h2>
          <p className="onboarding-step__copy">This is what brands will see at reachfyp.com/{normalizedHandle}. You can edit everything later from your profile.</p>

          <div className="onboarding-review">
            <div className="onboarding-review__row"><span>Handle</span><strong>reachfyp.com/{normalizedHandle}</strong></div>
            <div className="onboarding-review__row"><span>Name</span><strong>{name}</strong></div>
            <div className="onboarding-review__row"><span>Location</span><strong>{location}</strong></div>
            <div className="onboarding-review__row"><span>Niche</span><strong>{niche.join(", ")}</strong></div>
            <div className="onboarding-review__row"><span>Channels</span><strong>{socials.map((social) => `${social.platform} (${social.followers})`).join(", ")}</strong></div>
            <div className="onboarding-review__row"><span>Packages</span><strong>{packages.map((pkg) => `${pkg.title} $${Math.round(priceToNumber(pkg.price))}`).join(", ")}</strong></div>
          </div>

          {publishError ? <p className="auth-feedback auth-feedback--error">{publishError}</p> : null}
        </div>
      ) : null}

      <div className="onboarding-nav">
        {step > 0 ? (
          <button type="button" className="chip" onClick={() => setStep((current) => current - 1)} disabled={publishing}>Back</button>
        ) : (
          <Link className="chip" href="/creator/profile">Exit</Link>
        )}

        {step < STEP_TITLES.length - 1 ? (
          <button type="button" className="chip chip--solid" onClick={() => setStep((current) => current + 1)} disabled={!stepValid}>Continue</button>
        ) : (
          <button type="button" className="chip chip--solid" onClick={publish} disabled={publishing}>{publishing ? "Publishing…" : "Publish profile"}</button>
        )}
      </div>
    </section>
  );
}
