export type SocialSyncMetrics = {
  followerCount: number;
  engagementRate: number | null;
  postCount: number | null;
  avgViews: number | null;
  isVerified: boolean;
  displayFollowers: string;
};

export type SocialSyncResult =
  | ({ ok: true } & SocialSyncMetrics)
  | { ok: false; error: string };

function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M followers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k followers`;
  return `${n} followers`;
}

// ---------------------------------------------------------------------------
// YouTube — uses YouTube Data API v3, no user OAuth required
// ---------------------------------------------------------------------------
export async function syncYouTubePlatformAccount(
  handle: string,
  apiKey: string,
): Promise<SocialSyncResult> {
  // Strip leading @ if present
  const normalizedHandle = handle.replace(/^@/, "");
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forHandle=@${encodeURIComponent(normalizedHandle)}&key=${apiKey}`;

  let channelRes: Response;
  try {
    channelRes = await fetch(channelUrl, { headers: { Accept: "application/json" } });
  } catch {
    return { ok: false, error: "youtube-network-error" };
  }

  if (!channelRes.ok) {
    return { ok: false, error: `youtube-api-${channelRes.status}` };
  }

  const channelData = await channelRes.json() as {
    items?: Array<{
      statistics: {
        subscriberCount?: string;
        videoCount?: string;
        viewCount?: string;
        hiddenSubscriberCount?: boolean;
      };
      snippet: { title: string };
    }>;
  };

  const channel = channelData.items?.[0];
  if (!channel) {
    return { ok: false, error: "youtube-channel-not-found" };
  }

  const { statistics } = channel;
  if (statistics.hiddenSubscriberCount) {
    return { ok: false, error: "youtube-subscribers-hidden" };
  }

  const followerCount = Number(statistics.subscriberCount ?? 0);
  const postCount = Number(statistics.videoCount ?? null) || null;
  const totalViews = Number(statistics.viewCount ?? 0);
  const avgViews = postCount && postCount > 0 ? Math.round(totalViews / postCount) : null;

  return {
    ok: true,
    followerCount,
    engagementRate: null, // YouTube Data API v3 doesn't expose engagement rate in a single call
    postCount,
    avgViews,
    isVerified: true, // confirmed via official API lookup
    displayFollowers: formatFollowerCount(followerCount),
  };
}

// ---------------------------------------------------------------------------
// X (Twitter) — uses Twitter API v2, app-only bearer token, no user OAuth
// ---------------------------------------------------------------------------
export async function syncXPlatformAccount(
  handle: string,
  bearerToken: string,
): Promise<SocialSyncResult> {
  const normalizedHandle = handle.replace(/^@/, "");
  const userUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(normalizedHandle)}?user.fields=public_metrics,verified`;

  let userRes: Response;
  try {
    userRes = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
    });
  } catch {
    return { ok: false, error: "x-network-error" };
  }

  if (userRes.status === 401) return { ok: false, error: "x-invalid-bearer-token" };
  if (userRes.status === 404) return { ok: false, error: "x-user-not-found" };
  if (!userRes.ok) return { ok: false, error: `x-api-${userRes.status}` };

  const userData = await userRes.json() as {
    data?: {
      public_metrics: {
        followers_count: number;
        tweet_count: number;
        listed_count: number;
      };
      verified?: boolean;
    };
    errors?: Array<{ detail: string }>;
  };

  if (!userData.data) {
    return { ok: false, error: userData.errors?.[0]?.detail ?? "x-user-not-found" };
  }

  const { public_metrics, verified } = userData.data;
  const followerCount = public_metrics.followers_count;
  const postCount = public_metrics.tweet_count;

  return {
    ok: true,
    followerCount,
    engagementRate: null, // no per-tweet stats in single user lookup
    postCount,
    avgViews: null,
    isVerified: verified ?? false,
    displayFollowers: formatFollowerCount(followerCount),
  };
}

// ---------------------------------------------------------------------------
// Instagram — uses Instagram Basic Display API / Graph API
// Requires user OAuth access token stored per creator
// ---------------------------------------------------------------------------
export async function syncInstagramPlatformAccount(
  accessToken: string,
): Promise<SocialSyncResult> {
  // Fetch basic profile info
  const profileUrl = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`;

  let profileRes: Response;
  try {
    profileRes = await fetch(profileUrl, { headers: { Accept: "application/json" } });
  } catch {
    return { ok: false, error: "instagram-network-error" };
  }

  if (profileRes.status === 400 || profileRes.status === 401) {
    return { ok: false, error: "instagram-token-expired" };
  }
  if (!profileRes.ok) return { ok: false, error: `instagram-api-${profileRes.status}` };

  const profileData = await profileRes.json() as {
    id?: string;
    username?: string;
    media_count?: number;
    error?: { message: string };
  };

  if (profileData.error) {
    return { ok: false, error: "instagram-token-expired" };
  }

  const postCount = profileData.media_count ?? null;

  // Fetch recent media to compute engagement rate
  const mediaUrl = `https://graph.instagram.com/me/media?fields=like_count,comments_count,media_type&limit=20&access_token=${accessToken}`;
  let mediaRes: Response;
  try {
    mediaRes = await fetch(mediaUrl, { headers: { Accept: "application/json" } });
  } catch {
    return {
      ok: true,
      followerCount: 0,
      engagementRate: null,
      postCount,
      avgViews: null,
      isVerified: true,
      displayFollowers: "Audience snapshot pending",
    };
  }

  let engagementRate: number | null = null;
  if (mediaRes.ok) {
    const mediaData = await mediaRes.json() as {
      data?: Array<{ like_count?: number; comments_count?: number; media_type?: string }>;
    };
    const items = mediaData.data ?? [];
    if (items.length > 0) {
      // We can't get follower count from Basic Display API — it was removed
      // Mark as needing Business Account for full metrics
      const totalInteractions = items.reduce((sum, item) => sum + (item.like_count ?? 0) + (item.comments_count ?? 0), 0);
      const avgInteractions = totalInteractions / items.length;
      // Rough estimate: engagement_rate = avg_interactions / estimated_reach (not accurate without follower count)
      engagementRate = null; // Can only compute properly with Business Account follower count
      void avgInteractions; // acknowledged — can't compute without follower count
    }
  }

  return {
    ok: true,
    followerCount: 0, // Instagram Basic Display API removed follower count; needs Graph API Business Account
    engagementRate,
    postCount,
    avgViews: null,
    isVerified: true,
    displayFollowers: "Connected — follower count requires Instagram Business Account",
  };
}

// ---------------------------------------------------------------------------
// TikTok — uses TikTok Display API
// Requires user OAuth access token
// ---------------------------------------------------------------------------
export async function syncTikTokPlatformAccount(
  accessToken: string,
): Promise<SocialSyncResult> {
  const userUrl = "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,is_verified";

  let userRes: Response;
  try {
    userRes = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  } catch {
    return { ok: false, error: "tiktok-network-error" };
  }

  if (userRes.status === 401) return { ok: false, error: "tiktok-token-expired" };
  if (!userRes.ok) return { ok: false, error: `tiktok-api-${userRes.status}` };

  const userData = await userRes.json() as {
    data?: {
      user?: {
        follower_count?: number;
        video_count?: number;
        likes_count?: number;
        is_verified?: boolean;
      };
    };
    error?: { code: string; message: string };
  };

  if (userData.error?.code && userData.error.code !== "ok") {
    return { ok: false, error: "tiktok-token-expired" };
  }

  const user = userData.data?.user;
  if (!user) {
    return { ok: false, error: "tiktok-user-not-found" };
  }

  const followerCount = user.follower_count ?? 0;
  const postCount = user.video_count ?? null;
  const totalLikes = user.likes_count ?? 0;
  const engagementRate = postCount && postCount > 0 && followerCount > 0
    ? Math.min(totalLikes / postCount / followerCount, 1)
    : null;

  return {
    ok: true,
    followerCount,
    engagementRate,
    postCount,
    avgViews: null,
    isVerified: user.is_verified ?? false,
    displayFollowers: formatFollowerCount(followerCount),
  };
}

// ---------------------------------------------------------------------------
// LinkedIn — public profile scraping not available; placeholder
// ---------------------------------------------------------------------------
export async function syncLinkedInPlatformAccount(): Promise<SocialSyncResult> {
  return { ok: false, error: "linkedin-manual-only" };
}

// ---------------------------------------------------------------------------
// OAuth URL builders
// ---------------------------------------------------------------------------
export function buildInstagramOAuthUrl(appId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "user_profile,user_media",
    response_type: "code",
    state,
  });
  return `https://api.instagram.com/oauth/authorize?${params}`;
}

export function buildTikTokOAuthUrl(clientKey: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: "user.info.basic,user.info.profile,user.info.stats",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

export async function exchangeInstagramCode(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string,
): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  let tokenRes: Response;
  try {
    tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body,
    });
  } catch {
    return { ok: false, error: "instagram-token-exchange-failed" };
  }

  if (!tokenRes.ok) return { ok: false, error: `instagram-token-exchange-${tokenRes.status}` };

  const tokenData = await tokenRes.json() as {
    access_token?: string;
    error_type?: string;
    error_message?: string;
  };

  if (!tokenData.access_token) {
    return { ok: false, error: tokenData.error_message ?? "instagram-token-exchange-failed" };
  }

  // Exchange short-lived token for a long-lived token (60 days)
  const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`;
  try {
    const longRes = await fetch(longLivedUrl, { headers: { Accept: "application/json" } });
    if (longRes.ok) {
      const longData = await longRes.json() as { access_token?: string };
      if (longData.access_token) {
        return { ok: true, accessToken: longData.access_token };
      }
    }
  } catch {
    // Fall back to short-lived token
  }

  return { ok: true, accessToken: tokenData.access_token };
}

export async function exchangeTikTokCode(
  code: string,
  clientKey: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ ok: true; accessToken: string; refreshToken: string | null } | { ok: false; error: string }> {
  let tokenRes: Response;
  try {
    tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
  } catch {
    return { ok: false, error: "tiktok-token-exchange-failed" };
  }

  if (!tokenRes.ok) return { ok: false, error: `tiktok-token-exchange-${tokenRes.status}` };

  const tokenData = await tokenRes.json() as {
    data?: { access_token: string; refresh_token?: string };
    error?: { code: string; message: string };
  };

  if (!tokenData.data?.access_token) {
    return { ok: false, error: tokenData.error?.message ?? "tiktok-token-exchange-failed" };
  }

  return {
    ok: true,
    accessToken: tokenData.data.access_token,
    refreshToken: tokenData.data.refresh_token ?? null,
  };
}
