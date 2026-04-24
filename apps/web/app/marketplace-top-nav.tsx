import Link from "next/link";
import { getCurrentSessionUser } from "../lib/auth/session";
import { ThemeToggleButton } from "./theme-toggle-button";

const topNavLinks = [
  { href: "/", label: "Home" },
  { href: "/creators", label: "Creators" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/pricing", label: "Pricing" },
] as const;



type MarketplaceTopNavProps = {
  activeHref: string;
};

export async function MarketplaceTopNav({ activeHref }: MarketplaceTopNavProps) {
  const currentUser = await getCurrentSessionUser();
  const primaryLinks = topNavLinks;
  const roleLinks = currentUser?.role === "creator"
    ? [
        { href: "/creator/profile", label: "Creator Profile" },
        { href: "/creator/hires", label: "Creator Hires" },
        { href: "/creator/payouts", label: "Creator Payouts" },
        { href: "/dashboard/notifications", label: "Notifications" },
      ]
    : currentUser?.role === "brand"
      ? [
          { href: "/dashboard/hires", label: "Brand Hires" },
          { href: "/dashboard/notifications", label: "Notifications" },
        ]
      : currentUser?.role === "admin"
        ? [
            { href: "/admin/hires", label: "Admin Hires" },
            { href: "/admin/payouts", label: "Admin Payouts" },
            { href: "/dashboard/notifications", label: "Notifications" },
          ]
        : [];

  return (
    <nav className="top-nav" aria-label="Primary">
      <Link className="top-nav__brand" href="/">
        reachfyp
        <span className="top-nav__brand-mark" aria-hidden="true">
          ●
        </span>
      </Link>
      <div className="top-nav__links">
        {primaryLinks.map((link) => (
          <Link key={link.href} className={link.href === activeHref ? "top-nav__link top-nav__link--active" : "top-nav__link"} href={link.href}>
            {link.label}
          </Link>
        ))}
        {roleLinks.map((link) => (
          <Link key={link.href} className={link.href === activeHref ? "top-nav__link top-nav__link--active" : "top-nav__link"} href={link.href}>
            {link.label}
          </Link>
        ))}
        {!currentUser ? (
          <>
            <Link className="top-nav__link" href="/auth">
              Login
            </Link>
            <Link className="chip" href="/brand">
              Join as Brand
            </Link>
            <Link className="chip chip--solid" href="/creator">
              Join as Creator
            </Link>
          </>
        ) : null}
        {currentUser ? (
          <>
            <Link className={activeHref === "/auth" ? "top-nav__account top-nav__account--active" : "top-nav__account"} href="/auth">
              <span>{currentUser.name}</span>
              <span className="top-nav__account-meta">{currentUser.role}</span>
            </Link>
            <form action="/auth/sign-out" className="top-nav__inline-form" method="post">
              <button className="chip top-nav__signout" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : null}
        <ThemeToggleButton />
      </div>
    </nav>
  );
}