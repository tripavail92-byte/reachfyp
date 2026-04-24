export type CreatorMarketplaceFilterKey =
  | "verified-audience"
  | "top-performer"
  | "ugc"
  | "beauty"
  | "under-750";

export type CreatorMarketplaceSort = "ranking" | "authenticity" | "rating" | "price-low";

export type CreatorMarketplaceQuery = {
  filters: CreatorMarketplaceFilterKey[];
  sort: CreatorMarketplaceSort;
  page: number;
  pageSize: number;
  previewState?: "live" | "empty" | "error";
};

export type CreatorMarketplaceItem = {
  id: string;
  username: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  niche: string[];
  badges: string[];
  authenticity: number;
  performance: number;
  rating: number;
  price: string;
  summary: string;
  packageNote: string;
  rankingScore: number;
};

export type CreatorMarketplaceResponse = {
  items: CreatorMarketplaceItem[];
  total: number;
  appliedFilters: CreatorMarketplaceFilterKey[];
  sort: CreatorMarketplaceSort;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextPage: number | null;
};

export const creatorMarketplaceFilterOptions: Array<{
  key: CreatorMarketplaceFilterKey;
  label: string;
}> = [
  { key: "verified-audience", label: "Verified audience" },
  { key: "top-performer", label: "Top performer" },
  { key: "ugc", label: "UGC" },
  { key: "beauty", label: "Beauty" },
  { key: "under-750", label: "Under $750" },
];

export const creatorMarketplaceSortOptions: Array<{
  key: CreatorMarketplaceSort;
  label: string;
}> = [
  { key: "ranking", label: "Ranking score" },
  { key: "authenticity", label: "Highest authenticity" },
  { key: "rating", label: "Highest rating" },
  { key: "price-low", label: "Lowest starting price" },
];

export function createCreatorMarketplaceQueryString(query: CreatorMarketplaceQuery) {
  const searchParams = new URLSearchParams();

  if (query.filters.length > 0) {
    searchParams.set("filters", query.filters.join(","));
  }

  searchParams.set("sort", query.sort);
  searchParams.set("page", String(query.page));
  searchParams.set("pageSize", String(query.pageSize));

  if (query.previewState && query.previewState !== "live") {
    searchParams.set("previewState", query.previewState);
  }

  return searchParams.toString();
}
