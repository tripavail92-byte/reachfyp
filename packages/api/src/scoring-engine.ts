/**
 * Creator scoring engine.
 *
 * Computes authenticity_score, audience_quality_score, performance_score,
 * ranking_score, growth_signal, and delivery_quality from raw signals.
 *
 * All scores are integers 0–100.
 * ranking_score = round(authenticity * 0.55 + performance * 0.45)
 */

export type ScoringSignals = {
  // Social metrics (nullable if not yet synced)
  followerCount: number | null;
  engagementRate: number | null; // 0–1 decimal
  postCount: number | null;
  avgViews: number | null;
  platformCount: number; // number of connected social platforms

  // Delivery history (0–1 rates; null = no history yet)
  deliveryOnTimeRate: number | null;
  revisionRate: number | null; // revisions_requested / deliverables_submitted
  avgReviewRating: number | null; // 0–5

  // Tracking outcomes (totals for last 30 days; null = no tracking data)
  trackingClicks30d: number | null;
  trackingConversions30d: number | null;
};

export type ComputedScores = {
  authenticity: number;
  audienceQuality: number;
  performance: number;
  rankingScore: number;
  growthSignal: string;
  deliveryQuality: string;
  scoringSignalsJson: string;
};

// ---------------------------------------------------------------------------
// Engagement rate benchmarks by follower tier
// ---------------------------------------------------------------------------
function expectedEngagementRate(followerCount: number): number {
  if (followerCount < 10_000) return 0.035;   // micro: expect ≥3.5%
  if (followerCount < 100_000) return 0.025;  // mid: expect ≥2.5%
  if (followerCount < 1_000_000) return 0.015; // macro: expect ≥1.5%
  return 0.008;                                // mega: expect ≥0.8%
}

// ---------------------------------------------------------------------------
// Authenticity score (0–100)
//
// Signals:
//   engagement_quality (40%) — actual ER vs expected ER for the follower tier
//   audience_quality   (30%) — view-to-follower ratio where available
//   platform_trust     (15%) — more connected platforms = more credible
//   anomaly_guard      (15%) — penalise suspiciously high ER (>50%)
// ---------------------------------------------------------------------------
function computeAuthenticityScore(signals: ScoringSignals): number {
  const { followerCount, engagementRate, avgViews, platformCount } = signals;

  // Engagement quality component
  let engagementQuality = 50; // neutral default
  if (followerCount !== null && followerCount > 0 && engagementRate !== null) {
    const expected = expectedEngagementRate(followerCount);
    const ratio = engagementRate / expected; // 1.0 = on target
    if (engagementRate > 0.50) {
      // Suspiciously high ER — likely inflated/fake engagement
      engagementQuality = 20;
    } else {
      // Cap at 100 when 2× expected
      engagementQuality = Math.min(100, Math.round(ratio * 50 + 25));
    }
  }

  // Audience quality component (view-to-follower)
  let audienceQuality = 50;
  if (followerCount !== null && followerCount > 0 && avgViews !== null) {
    const viewRatio = avgViews / followerCount;
    // 10% reach is excellent for most platforms
    audienceQuality = Math.min(100, Math.round(viewRatio * 1000));
    audienceQuality = Math.max(10, audienceQuality);
  }

  // Platform trust component
  const platformTrust = Math.min(100, platformCount * 25); // 4+ platforms = 100

  // Anomaly guard — penalise extreme ER
  let anomalyGuard = 80; // default OK
  if (engagementRate !== null && engagementRate > 0.50) {
    anomalyGuard = 10;
  } else if (engagementRate !== null && engagementRate > 0.30) {
    anomalyGuard = 40;
  }

  const raw =
    engagementQuality * 0.40 +
    audienceQuality * 0.30 +
    platformTrust * 0.15 +
    anomalyGuard * 0.15;

  return Math.min(100, Math.max(10, Math.round(raw)));
}

// ---------------------------------------------------------------------------
// Audience quality score (0–100)
// Separate metric focused on follower authenticity proxy
// ---------------------------------------------------------------------------
function computeAudienceQualityScore(signals: ScoringSignals): number {
  const { followerCount, engagementRate, avgViews } = signals;

  if (followerCount === null || followerCount === 0) return 70; // default

  // If engagement is very low relative to follower count, suggest bot inflation
  let erScore = 60;
  if (engagementRate !== null) {
    const expected = expectedEngagementRate(followerCount);
    if (engagementRate < expected * 0.25) {
      erScore = 20; // very low ER → likely inflated
    } else if (engagementRate < expected * 0.5) {
      erScore = 40;
    } else if (engagementRate > expected * 2) {
      erScore = 50; // unusually high can also indicate engagement pods
    } else {
      erScore = Math.min(100, Math.round((engagementRate / expected) * 60 + 10));
    }
  }

  // View-to-follower sanity check
  let viewScore = 70;
  if (avgViews !== null) {
    const viewRatio = avgViews / followerCount;
    if (viewRatio < 0.005) viewScore = 20;      // <0.5% reach = very suspicious
    else if (viewRatio < 0.02) viewScore = 45;
    else if (viewRatio < 0.10) viewScore = 75;
    else viewScore = 90;
  }

  const weight = avgViews !== null ? 0.5 : 1.0;
  const raw = erScore * weight + (avgViews !== null ? viewScore * 0.5 : 0);
  return Math.min(100, Math.max(10, Math.round(raw)));
}

// ---------------------------------------------------------------------------
// Performance score (0–100)
//
// Signals:
//   delivery_on_time  (40%) — from hire history
//   revision_rate     (30%) — low revision rate = better quality
//   review_rating     (30%) — from brand reviews
// ---------------------------------------------------------------------------
function computePerformanceScore(signals: ScoringSignals): number {
  const { deliveryOnTimeRate, revisionRate, avgReviewRating } = signals;

  // Default for new creators with no history
  if (deliveryOnTimeRate === null && revisionRate === null && avgReviewRating === null) {
    return 70;
  }

  const onTimeScore = deliveryOnTimeRate !== null
    ? Math.round(deliveryOnTimeRate * 100)
    : 70;

  // Low revision rate is good; invert it
  const revisionScore = revisionRate !== null
    ? Math.round((1 - Math.min(revisionRate, 1)) * 100)
    : 70;

  const ratingScore = avgReviewRating !== null
    ? Math.round((avgReviewRating / 5) * 100)
    : 70;

  const raw = onTimeScore * 0.40 + revisionScore * 0.30 + ratingScore * 0.30;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ---------------------------------------------------------------------------
// Growth signal description
// ---------------------------------------------------------------------------
function computeGrowthSignal(signals: ScoringSignals): string {
  const { followerCount, engagementRate, trackingClicks30d } = signals;

  if (followerCount === null) return "Connect a social account to activate growth signals";

  if (engagementRate !== null && followerCount > 0) {
    const expected = expectedEngagementRate(followerCount);
    if (engagementRate > expected * 1.5) {
      return "Above-benchmark engagement across connected platforms";
    }
    if (engagementRate > expected) {
      return "On-target engagement for this audience size";
    }
    if (engagementRate < expected * 0.5) {
      return "Engagement below benchmark — sync again after posting";
    }
  }

  if (trackingClicks30d !== null && trackingClicks30d > 100) {
    return "Active tracking traffic from recent campaigns";
  }

  if (followerCount > 100_000) return "Established macro audience";
  if (followerCount > 10_000) return "Growing mid-tier creator";
  return "Early-stage creator building audience";
}

// ---------------------------------------------------------------------------
// Delivery quality description
// ---------------------------------------------------------------------------
function computeDeliveryQuality(signals: ScoringSignals): string {
  const { deliveryOnTimeRate, revisionRate, avgReviewRating } = signals;

  if (deliveryOnTimeRate === null) return "No completed hires yet";

  if (deliveryOnTimeRate >= 0.95 && (revisionRate === null || revisionRate < 0.15)) {
    return "Excellent delivery record";
  }
  if (deliveryOnTimeRate >= 0.80) {
    return "Reliable delivery with minor revisions";
  }
  if (deliveryOnTimeRate < 0.60) {
    return "Delivery history shows delays — brand review recommended";
  }

  if (avgReviewRating !== null && avgReviewRating >= 4.5) {
    return "High brand satisfaction rating";
  }

  return "Standard delivery track record";
}

// ---------------------------------------------------------------------------
// Badges recomputation
// ---------------------------------------------------------------------------
export function computeCreatorBadges(
  authenticity: number,
  audienceQuality: number,
  performance: number,
): string[] {
  const badges: string[] = [];

  if (authenticity >= 80) badges.push("Real Engagement");
  if (audienceQuality >= 75) badges.push("Verified audience");
  if (performance >= 85) badges.push("Top performer");

  return badges;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export function computeCreatorScores(signals: ScoringSignals): ComputedScores {
  const authenticity = computeAuthenticityScore(signals);
  const audienceQuality = computeAudienceQualityScore(signals);
  const performance = computePerformanceScore(signals);
  const rankingScore = Math.round(authenticity * 0.55 + performance * 0.45);
  const growthSignal = computeGrowthSignal(signals);
  const deliveryQuality = computeDeliveryQuality(signals);

  return {
    authenticity,
    audienceQuality,
    performance,
    rankingScore,
    growthSignal,
    deliveryQuality,
    scoringSignalsJson: JSON.stringify(signals),
  };
}

// ---------------------------------------------------------------------------
// Build signals from live DB data
// ---------------------------------------------------------------------------
export type HireHistorySignals = {
  totalHires: number;
  onTimeHires: number;
  totalRevisionRequests: number;
  totalDeliverables: number;
  avgRating: number | null;
  trackingClicks30d: number;
  trackingConversions30d: number;
};

export function buildScoringSignalsFromData(
  socialAccounts: Array<{
    followerCount: number | null;
    engagementRate: number | null;
    postCount: number | null;
    avgViews: number | null;
  }>,
  hireHistory: HireHistorySignals,
): ScoringSignals {
  // Aggregate social metrics across all connected accounts
  const accountsWithData = socialAccounts.filter((a) => a.followerCount !== null && a.followerCount > 0);

  let followerCount: number | null = null;
  let engagementRate: number | null = null;
  let postCount: number | null = null;
  let avgViews: number | null = null;

  if (accountsWithData.length > 0) {
    followerCount = accountsWithData.reduce((sum, a) => sum + (a.followerCount ?? 0), 0);

    const accountsWithER = accountsWithData.filter((a) => a.engagementRate !== null);
    if (accountsWithER.length > 0) {
      engagementRate =
        accountsWithER.reduce((sum, a) => sum + (a.engagementRate ?? 0), 0) / accountsWithER.length;
    }

    const accountsWithPosts = accountsWithData.filter((a) => a.postCount !== null);
    if (accountsWithPosts.length > 0) {
      postCount = accountsWithPosts.reduce((sum, a) => sum + (a.postCount ?? 0), 0);
    }

    const accountsWithViews = accountsWithData.filter((a) => a.avgViews !== null);
    if (accountsWithViews.length > 0) {
      avgViews =
        Math.round(accountsWithViews.reduce((sum, a) => sum + (a.avgViews ?? 0), 0) / accountsWithViews.length);
    }
  }

  const deliveryOnTimeRate =
    hireHistory.totalHires > 0
      ? hireHistory.onTimeHires / hireHistory.totalHires
      : null;

  const revisionRate =
    hireHistory.totalDeliverables > 0
      ? hireHistory.totalRevisionRequests / hireHistory.totalDeliverables
      : null;

  return {
    followerCount,
    engagementRate,
    postCount,
    avgViews,
    platformCount: socialAccounts.length,
    deliveryOnTimeRate,
    revisionRate,
    avgReviewRating: hireHistory.avgRating,
    trackingClicks30d: hireHistory.trackingClicks30d,
    trackingConversions30d: hireHistory.trackingConversions30d,
  };
}
