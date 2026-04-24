import Link from "next/link";
import { ThemeToggleButton } from "../../theme-toggle-button";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
    error?: string;
  }>;
};

const resetPasswordErrors: Record<string, string> = {
  "invalid-reset-token": "That reset link is invalid or expired.",
  "password-mismatch": "Passwords do not match.",
  "password-too-short": "Password must be at least 8 characters.",
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = resolvedSearchParams?.token;
  const errorMessage = resolvedSearchParams?.error ? resetPasswordErrors[resolvedSearchParams.error] : undefined;

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <Link className="auth-topbar__brand" href="/">
          reachfyp
          <span className="auth-topbar__dot">●</span>
        </Link>
        <div className="auth-topbar__actions">
          <Link className="auth-topbar__back" href="/auth">
            Back to sign in
          </Link>
          <ThemeToggleButton />
        </div>
      </header>

      <div className="auth-center">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Account Recovery</p>
          <h1 className="auth-card__title">Choose a new password</h1>
          {errorMessage ? <p className="auth-feedback auth-feedback--error">{errorMessage}</p> : null}
          {!token ? (
            <p className="auth-feedback auth-feedback--error">That reset link is missing or invalid.</p>
          ) : (
            <form action="/auth/reset-password/update" className="auth-form" method="post">
              <label className="auth-field">
                <span className="auth-field__label">New password</span>
                <input className="auth-input" minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
              </label>
              <label className="auth-field">
                <span className="auth-field__label">Confirm password</span>
                <input className="auth-input" minLength={8} name="confirmPassword" placeholder="Repeat your password" required type="password" />
              </label>
              <input name="token" type="hidden" value={token} />
              <button className="auth-submit" type="submit">
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}