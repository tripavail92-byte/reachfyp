import Link from "next/link";
import { getCreatorPackageByCheckoutId } from "@reachfyp/api";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "../../lib/auth/session";
import { ThemeToggleButton } from "../theme-toggle-button";

type AuthMode =
  | "sign-in"
  | "register"
  | "brand-sign-in"
  | "creator-sign-in"
  | "admin-sign-in"
  | "register-brand"
  | "register-creator"
  | "brand-checkout-sign-in"
  | "brand-checkout-register";

type AuthPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
    mode?: string;
    redirectTo?: string;
    verificationStatus?: string;
    verifyEmailToken?: string;
  }>;
};

const authFeedbackByStatus: Record<string, string> = {
  registered: "Account created. You are signed in.",
  "signed-in": "You are signed in.",
  "signed-out": "You have been signed out.",
  "password-reset": "Password updated. Sign in with your new password.",
  "email-verified": "Email verified successfully.",
  "verification-sent": "Verification email sent.",
  "already-verified": "Your email is already verified.",
};

const authFeedbackByError: Record<string, string> = {
  "email-in-use": "An account with that email already exists.",
  "invalid-credentials": "Email or password is incorrect.",
  "invalid-email": "Enter a valid email address.",
  "invalid-reset-token": "That reset link is invalid or expired.",
  "invalid-verification-token": "That verification link is invalid or expired.",
  "name-too-short": "Enter your full name.",
  "password-mismatch": "Passwords do not match.",
  "password-too-short": "Password must be at least 8 characters.",
  "registration-failed": "Could not create account. Please try again.",
  "sign-in-required": "Sign in first to continue.",
};

function resolveAuthMode(rawMode?: string): AuthMode {
  switch (rawMode) {
    case "register":
    case "brand-sign-in":
    case "creator-sign-in":
    case "admin-sign-in":
    case "register-brand":
    case "register-creator":
    case "brand-checkout-sign-in":
    case "brand-checkout-register":
      return rawMode;
    case "sign-in":
    default:
      return "sign-in";
  }
}

function buildAuthHref(mode: AuthMode, redirectTo?: string) {
  const params = new URLSearchParams({ mode });
  if (redirectTo) params.set("redirectTo", redirectTo);
  return `/auth?${params.toString()}`;
}

function getExpectedRole(mode: AuthMode) {
  if (mode === "creator-sign-in" || mode === "register-creator") return "creator" as const;
  if (mode === "admin-sign-in") return "admin" as const;
  if (
    mode === "brand-sign-in" ||
    mode === "register-brand" ||
    mode === "brand-checkout-sign-in" ||
    mode === "brand-checkout-register"
  )
    return "brand" as const;
  return null;
}

function getCheckoutPackageId(redirectTo?: string) {
  const match = redirectTo?.match(/^\/dashboard\/instant-hire\/([^/?]+)/);
  return match?.[1] ?? null;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const authMode = resolveAuthMode(resolvedSearchParams?.mode);
  const redirectTo = resolvedSearchParams?.redirectTo;
  const currentUser = await getCurrentSessionUser();
  const checkoutPackageId = getCheckoutPackageId(redirectTo);
  const checkoutPackage = checkoutPackageId ? getCreatorPackageByCheckoutId(checkoutPackageId) : null;
  const feedbackMessage =
    (resolvedSearchParams?.error ? authFeedbackByError[resolvedSearchParams.error] : undefined) ??
    (resolvedSearchParams?.verificationStatus ? authFeedbackByStatus[resolvedSearchParams.verificationStatus] : undefined) ??
    (resolvedSearchParams?.status ? authFeedbackByStatus[resolvedSearchParams.status] : undefined);
  const feedbackIsError = Boolean(resolvedSearchParams?.error);
  const verifyEmailToken = resolvedSearchParams?.verifyEmailToken;

  const isRegisterView =
    authMode === "register" ||
    authMode === "register-brand" ||
    authMode === "register-creator" ||
    authMode === "brand-checkout-register";

  const isCheckout = authMode === "brand-checkout-sign-in" || authMode === "brand-checkout-register";
  const isAdminOnly = authMode === "admin-sign-in";
  const isCreatorFlow = authMode === "creator-sign-in" || authMode === "register-creator";
  const isBrandFlow =
    authMode === "brand-sign-in" ||
    authMode === "register-brand" ||
    authMode === "brand-checkout-sign-in" ||
    authMode === "brand-checkout-register";

  const signInMode: AuthMode = isCreatorFlow
    ? "creator-sign-in"
    : isAdminOnly
      ? "admin-sign-in"
      : isCheckout
        ? "brand-checkout-sign-in"
        : isBrandFlow
          ? "brand-sign-in"
          : "sign-in";

  const registerMode: AuthMode | null = isCreatorFlow
    ? "register-creator"
    : isAdminOnly
      ? null
      : isCheckout
        ? "brand-checkout-register"
        : isBrandFlow
          ? "register-brand"
          : "register";

  const expectedRole = getExpectedRole(authMode);
  const roleLocked =
    registerMode === "register-brand" ||
    registerMode === "register-creator" ||
    registerMode === "brand-checkout-register";
  const registerRole = registerMode === "register-creator" ? "creator" : "brand";

  const eyebrow = isCreatorFlow
    ? "Creator"
    : isBrandFlow && isCheckout
      ? "Checkout"
      : isBrandFlow
        ? "Brand"
        : isAdminOnly
          ? "Admin"
          : null;

  const cardTitle = isRegisterView
    ? isCreatorFlow
      ? "Join as a creator"
      : isCheckout
        ? "Create a brand account"
        : isBrandFlow
          ? "Join as a brand"
          : "Create your account"
    : isCheckout
      ? "Sign in to continue"
      : isAdminOnly
        ? "Admin sign in"
        : "Welcome back";

  const canContinueToRedirect = Boolean(redirectTo) && (!expectedRole || currentUser?.role === expectedRole);
  const signedInContinueHref = canContinueToRedirect
    ? (redirectTo ?? "/creators")
    : currentUser?.role === "creator"
      ? "/creator/profile"
      : currentUser?.role === "admin"
        ? "/admin/hires"
        : "/creators";

  const continueLabel = canContinueToRedirect
    ? isCheckout
      ? "Continue to checkout"
      : "Continue where you left off"
    : currentUser?.role === "creator"
      ? "Go to creator workspace"
      : currentUser?.role === "admin"
        ? "Go to admin panel"
        : "Browse creators";

    if (authMode === "register-creator") {
      redirect("/creator");
    }

    if (authMode === "register-brand") {
      redirect("/brand?signup=1");
    }

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <Link className="auth-topbar__brand" href="/">
          reachfyp
          <span className="auth-topbar__dot">●</span>
        </Link>
        <div className="auth-topbar__actions">
          <Link className="auth-topbar__back" href="/creators">
            Browse creators
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <div className="auth-center">
        {isCheckout && checkoutPackage ? (
          <div className="auth-checkout-strip">
            <p className="auth-checkout-strip__label">Selected package</p>
            <p className="auth-checkout-strip__item">
              {checkoutPackage.package.title} · {checkoutPackage.package.price}
            </p>
            <p className="auth-checkout-strip__meta">
              {checkoutPackage.creator.name} · {checkoutPackage.package.turnaround}
            </p>
          </div>
        ) : null}

        <div className="auth-card">
          {eyebrow ? <p className="auth-card__eyebrow">{eyebrow}</p> : null}
          <h1 className="auth-card__title">{cardTitle}</h1>

          {feedbackMessage ? (
            <p className={`auth-feedback ${feedbackIsError ? "auth-feedback--error" : "auth-feedback--success"}`}>
              {feedbackMessage}
            </p>
          ) : null}

          {currentUser ? (
            <>
              <p className="auth-hint">
                Signed in as <strong>{currentUser.name}</strong> ({currentUser.role})
              </p>
              {!currentUser.emailVerifiedAt ? (
                <div className="auth-field" style={{ gap: "0.65rem" }}>
                  <p className="auth-hint" style={{ margin: 0 }}>
                    Verify your email to harden account recovery and future notifications.
                  </p>
                  <form action="/auth/verify-email/request" method="post">
                    <button className="auth-tab" type="submit">
                      Send verification email
                    </button>
                  </form>
                  {process.env.NODE_ENV !== "production" && verifyEmailToken ? (
                    <p className="auth-hint" style={{ margin: 0 }}>
                      Development preview: <Link href={`/auth/verify-email?token=${encodeURIComponent(verifyEmailToken)}`}>open verification link</Link>
                    </p>
                  ) : null}
                </div>
              ) : null}
              {expectedRole && currentUser.role !== expectedRole ? (
                <p className="auth-feedback auth-feedback--error">
                  This page needs a {expectedRole} account. Sign out to switch.
                </p>
              ) : (
                <Link
                  className="auth-submit"
                  href={signedInContinueHref}
                  style={{ textAlign: "center", display: "block" }}
                >
                  {continueLabel}
                </Link>
              )}
              <form action="/auth/sign-out" method="post">
                <button className="auth-tab" style={{ width: "100%" }} type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              {registerMode ? (
                <div className="auth-tabs">
                  <Link
                    className={`auth-tab${!isRegisterView ? " auth-tab--active" : ""}`}
                    href={buildAuthHref(signInMode, redirectTo)}
                  >
                    Sign in
                  </Link>
                  <Link
                    className={`auth-tab${isRegisterView ? " auth-tab--active" : ""}`}
                    href={buildAuthHref(registerMode, redirectTo)}
                  >
                    Sign up
                  </Link>
                </div>
              ) : null}

              {isRegisterView ? (
                <form action="/auth/register" className="auth-form" method="post">
                  <label className="auth-field">
                    <span className="auth-field__label">{isBrandFlow ? "Full name" : "Full name"}</span>
                    <input className="auth-input" name="name" placeholder="Alex Morgan" required type="text" />
                  </label>
                  {isBrandFlow ? (
                    <label className="auth-field">
                      <span className="auth-field__label">Brand name</span>
                      <input className="auth-input" name="companyName" placeholder="North Studio" type="text" />
                    </label>
                  ) : null}
                  <label className="auth-field">
                    <span className="auth-field__label">Email</span>
                    <input className="auth-input" name="email" placeholder="you@example.com" required type="email" />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field__label">Password</span>
                    <input
                      className="auth-input"
                      minLength={8}
                      name="password"
                      placeholder="At least 8 characters"
                      required
                      type="password"
                    />
                  </label>
                  {roleLocked ? (
                    <>
                      <input name="role" type="hidden" value={registerRole} />
                      <div className="auth-field">
                        <span className="auth-field__label">Account type</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--app-accent)" }}>
                          {registerRole === "creator" ? "Creator" : "Brand"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <label className="auth-field">
                      <span className="auth-field__label">I am a</span>
                      <select className="auth-input" defaultValue="brand" name="role">
                        <option value="brand">Brand — I want to hire creators</option>
                        <option value="creator">Creator — I want to get hired</option>
                      </select>
                    </label>
                  )}
                  <input name="mode" type="hidden" value={authMode} />
                  {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
                  <button className="auth-submit" type="submit">
                    Sign up
                  </button>
                </form>
              ) : (
                <form action="/auth/sign-in" className="auth-form" method="post">
                  <label className="auth-field">
                    <span className="auth-field__label">Email</span>
                    <input className="auth-input" name="email" placeholder="you@example.com" required type="email" />
                  </label>
                  <label className="auth-field">
                    <span className="auth-field__label">Password</span>
                    <input
                      className="auth-input"
                      minLength={8}
                      name="password"
                      placeholder="Enter your password"
                      required
                      type="password"
                    />
                  </label>
                  <input name="mode" type="hidden" value={authMode} />
                  {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
                  <button className="auth-submit" type="submit">
                    Sign in
                  </button>
                  <p className="auth-hint">
                    Forgot your password? <Link href="/auth/forgot-password">Reset it here</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
