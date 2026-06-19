import {
  clearReservedCreatorUsername,
  parsePriceToCents,
  upsertCreatorPackageForAuthUser,
  upsertCreatorRecordForAuthUser,
  upsertCreatorSocialAccountForAuthUser,
} from "@reachfyp/api";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "../../../../lib/auth/session";

// The wizard collects everything client-side and publishes once. This handler
// validates the payload, derives the few fields the creator record needs
// (starting price, package note, hero note, image alt) and writes the profile
// plus each package and social account through the existing data layer.

type SocialInput = { platform: string; handle: string; followers: string };
type PackageInput = { title: string; price: string; turnaround: string; details: string };

type PublishBody = {
  handle?: string;
  name?: string;
  location?: string;
  summary?: string;
  imageUrl?: string;
  niche?: string[];
  socials?: SocialInput[];
  packages?: PackageInput[];
};

function normalizeUsername(rawUsername: string) {
  return rawUsername
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePriceLabel(rawPrice: string) {
  const cents = parsePriceToCents(rawPrice);

  if (!Number.isFinite(cents) || cents <= 0) {
    return null;
  }

  return `$${Math.round(cents / 100)}`;
}

function buildSocialUrl(platform: string, handle: string) {
  const clean = handle.trim().replace(/^@+/, "");

  switch (platform.toLowerCase()) {
    case "instagram":
      return `https://instagram.com/${clean}`;
    case "tiktok":
      return `https://www.tiktok.com/@${clean}`;
    case "youtube":
      return `https://youtube.com/@${clean}`;
    case "x":
    case "twitter":
      return `https://x.com/${clean}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${clean}`;
    default:
      return `https://${clean}`;
  }
}

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false as const, error }, { status });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentSessionUser();

  if (!currentUser || currentUser.role !== "creator") {
    return fail("not-authorized", 401);
  }

  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return fail("invalid-request");
  }

  const username = normalizeUsername(String(body.handle ?? ""));
  const name = String(body.name ?? "").trim();
  const location = String(body.location ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();
  const niche = (Array.isArray(body.niche) ? body.niche : [])
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 6);
  const socials = (Array.isArray(body.socials) ? body.socials : []).filter(
    (social) => social && String(social.platform).trim() && String(social.handle).trim(),
  );
  const packages = (Array.isArray(body.packages) ? body.packages : []).filter(
    (pkg) => pkg && String(pkg.title).trim() && String(pkg.turnaround).trim() && String(pkg.details).trim(),
  );

  if (!username || !name || !location || !summary || niche.length === 0) {
    return fail("missing-fields");
  }

  if (!/^[a-z0-9-]+$/.test(username)) {
    return fail("invalid-username");
  }

  if (summary.length < 100) {
    return fail("bio-too-short");
  }

  if (!/^https?:\/\//.test(imageUrl)) {
    return fail("invalid-image-url");
  }

  if (socials.length === 0) {
    return fail("missing-socials");
  }

  if (packages.length === 0) {
    return fail("missing-packages");
  }

  // Derive the creator-record fields the profile needs from the package data.
  const packagePrices = packages
    .map((pkg) => parsePriceToCents(pkg.price))
    .filter((cents) => Number.isFinite(cents) && cents > 0);

  if (packagePrices.length !== packages.length) {
    return fail("invalid-package-price");
  }

  const startingPrice = `$${Math.round(Math.min(...packagePrices) / 100)}`;
  const packageNote = `${packages[0].title} · ${packages[0].turnaround}`;
  const heroNote = `Work with ${name} — ${niche.join(", ")} creator based in ${location}.`;
  const imageAlt = `${name} — creator profile photo`;

  const profileResult = await upsertCreatorRecordForAuthUser({
    authUserId: currentUser.id,
    username,
    name,
    imageUrl,
    imageAlt,
    location,
    niche,
    price: startingPrice,
    summary,
    packageNote,
    heroNote,
  });

  if (!profileResult.ok) {
    return fail(profileResult.error);
  }

  for (const pkg of packages) {
    const priceLabel = normalizePriceLabel(pkg.price);

    if (!priceLabel) {
      return fail("invalid-package-price");
    }

    const packageResult = await upsertCreatorPackageForAuthUser({
      authUserId: currentUser.id,
      title: pkg.title.trim(),
      price: priceLabel,
      turnaround: pkg.turnaround.trim(),
      details: pkg.details.trim(),
    });

    if (!packageResult.ok) {
      return fail(packageResult.error);
    }
  }

  for (const social of socials) {
    const socialResult = await upsertCreatorSocialAccountForAuthUser({
      authUserId: currentUser.id,
      platform: social.platform.trim(),
      handle: social.handle.trim(),
      url: buildSocialUrl(social.platform, social.handle),
      followers: String(social.followers ?? "").trim() || "Audience snapshot pending",
    });

    if (!socialResult.ok) {
      return fail(socialResult.error);
    }
  }

  await clearReservedCreatorUsername(currentUser.id);

  return NextResponse.json({ ok: true as const, username });
}
