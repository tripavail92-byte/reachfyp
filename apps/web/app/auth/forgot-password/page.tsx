import Link from "next/link";
import { ThemeToggleButton } from "../../theme-toggle-button";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    status?: string;
    devResetToken?: string;
  }>;
};

const forgotPasswordStatus: Record<string, string> = {
  "reset-requested": "If an account exists for that email, a reset link has been issued.",
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const statusMessage = resolvedSearchParams?.status ? forgotPasswordStatus[resolvedSearchParams.status] : undefined;
  const devResetToken = resolvedSearchParams?.devResetToken;

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
          <h1 className="auth-card__title">Reset your password</h1>
          {statusMessage ? <p className="auth-feedback auth-feedback--success">{statusMessage}</p> : null}
          <p className="auth-hint">Enter your account email. The response stays generic so the page does not reveal whether an account exists.</p>
          <form action="/auth/forgot-password/request" className="auth-form" method="post">
            <label className="auth-field">
              <span className="auth-field__label">Email</span>
              <input className="auth-input" name="email" placeholder="you@example.com" required type="email" />
            </label>
            <button className="auth-submit" type="submit">
              Send reset link
            </button>
          </form>
          {process.env.NODE_ENV !== "production" && devResetToken ? (
            <p className="auth-hint">
              Development preview: <Link href={`/auth/reset-password?token=${encodeURIComponent(devResetToken)}`}>open reset link</Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}