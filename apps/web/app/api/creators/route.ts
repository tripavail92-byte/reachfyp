import { NextRequest, NextResponse } from "next/server";
import type {
  CreatorMarketplaceFilterKey,
  CreatorMarketplaceResponse,
  CreatorMarketplaceSort,
} from "@reachfyp/schemas";
import { creatorMarketplaceFilterOptions, creatorMarketplaceSortOptions } from "@reachfyp/schemas";
import { getCreatorMarketplaceResponse } from "@reachfyp/api";

function parseFilters(rawFilters: string | null) {
  const allowedFilters = new Set<CreatorMarketplaceFilterKey>(creatorMarketplaceFilterOptions.map((option) => option.key));

  if (!rawFilters) {
    return [];
  }

  return rawFilters
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is CreatorMarketplaceFilterKey => allowedFilters.has(value as CreatorMarketplaceFilterKey));
}

function parseSort(rawSort: string | null): CreatorMarketplaceSort {
  const matchedSort = creatorMarketplaceSortOptions.find((option) => option.key === rawSort);
  return matchedSort?.key ?? "ranking";
}

function parsePositiveInteger(rawValue: string | null, fallback: number) {
  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function parsePreviewState(rawValue: string | null) {
  if (rawValue === "empty" || rawValue === "error") {
    return rawValue;
  }

  return "live" as const;
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams.get("filters"));
  const sort = parseSort(request.nextUrl.searchParams.get("sort"));
  const page = parsePositiveInteger(request.nextUrl.searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(request.nextUrl.searchParams.get("pageSize"), 2);
  const previewState = parsePreviewState(request.nextUrl.searchParams.get("previewState"));

  if (previewState === "error") {
    return NextResponse.json({ message: "Previewed request failure for marketplace error-state verification." }, { status: 500 });
  }

  const response = await getCreatorMarketplaceResponse({
    filters,
    sort,
    page,
    pageSize,
    previewState,
  });

  const validatedResponse: CreatorMarketplaceResponse = response;

  return NextResponse.json(validatedResponse);
}