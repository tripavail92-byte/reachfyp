"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  CreatorMarketplaceFilterKey,
  CreatorMarketplaceResponse,
  CreatorMarketplaceSort,
} from "@reachfyp/schemas";
import {
  createCreatorMarketplaceQueryString,
  creatorMarketplaceFilterOptions,
  creatorMarketplaceSortOptions,
} from "@reachfyp/schemas";
import { GlassPanel } from "@reachfyp/ui";
import { InteractiveImageFrame } from "../interactive-image-frame";

type CreatorsMarketplaceClientProps = {
  totalCreators: number;
  previewState: "live" | "empty" | "error";
};

type CreatorsLoadState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "success";
      data: CreatorMarketplaceResponse;
    };

const PAGE_SIZE = 2;

function sortFilters(filters: CreatorMarketplaceFilterKey[]) {
  const order = creatorMarketplaceFilterOptions.map((option) => option.key);

  return [...filters].sort((left, right) => order.indexOf(left) - order.indexOf(right));
}

export function CreatorsMarketplaceClient({ totalCreators, previewState }: CreatorsMarketplaceClientProps) {
  const [activeFilters, setActiveFilters] = useState<CreatorMarketplaceFilterKey[]>([]);
  const [sort, setSort] = useState<CreatorMarketplaceSort>("ranking");
  const [reloadKey, setReloadKey] = useState(0);
  const [loadState, setLoadState] = useState<CreatorsLoadState>({ status: "loading" });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadCreators() {
      setLoadState({ status: "loading" });
      setLoadMoreError(null);

      try {
        const queryString = createCreatorMarketplaceQueryString({
          filters: activeFilters,
          sort,
          page: 1,
          pageSize: PAGE_SIZE,
          previewState,
        });

        const response = await fetch(`/api/creators?${queryString}`, {
          cache: "no-store",
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Unexpected response: ${response.status}`);
        }

        const data = (await response.json()) as CreatorMarketplaceResponse;

        setLoadState({ status: "success", data });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setLoadState({
          status: "error",
          message: error instanceof Error ? error.message : "Unable to load creators right now.",
        });
      }
    }

    void loadCreators();

    return () => {
      abortController.abort();
    };
  }, [activeFilters, previewState, reloadKey, sort]);

  async function loadMore() {
    if (loadState.status !== "success" || !loadState.data.hasMore || loadState.data.nextPage === null) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const queryString = createCreatorMarketplaceQueryString({
        filters: activeFilters,
        sort,
        page: loadState.data.nextPage,
        pageSize: PAGE_SIZE,
        previewState,
      });

      const response = await fetch(`/api/creators?${queryString}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unexpected response: ${response.status}`);
      }

      const nextPageData = (await response.json()) as CreatorMarketplaceResponse;

      setLoadState({
        status: "success",
        data: {
          ...nextPageData,
          items: [...loadState.data.items, ...nextPageData.items],
        },
      });
    } catch (error) {
      setLoadMoreError(error instanceof Error ? error.message : "Unable to load more creators right now.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function toggleFilter(filterKey: CreatorMarketplaceFilterKey) {
    setActiveFilters((currentFilters) => {
      const nextFilters = currentFilters.includes(filterKey)
        ? currentFilters.filter((currentFilter) => currentFilter !== filterKey)
        : [...currentFilters, filterKey];

      return sortFilters(nextFilters);
    });
  }

  function resetFilters() {
    setActiveFilters([]);
    setSort("ranking");
    setReloadKey((current) => current + 1);
  }

  const currentTotal = loadState.status === "success" ? loadState.data.total : totalCreators;
  const currentSortLabel = creatorMarketplaceSortOptions.find((option) => option.key === sort)?.label ?? "Ranking score";

  return (
    <>
      <section className="results-toolbar" aria-label="Marketplace controls">
        <div className="results-toolbar__header">
          <div>
            <h2 className="results-toolbar__title">{currentTotal} creators ranked for performance-first discovery</h2>
            <p className="results-toolbar__subtitle">
              Filters, sort, and load-more now run through live client state using the marketplace query contract.
            </p>
          </div>
          <div className="results-toolbar__controls">
            {creatorMarketplaceSortOptions.map((option) => (
              <button
                key={option.key}
                className={option.key === sort ? "sort-control-button sort-control-button--active" : "sort-control-button"}
                type="button"
                onClick={() => setSort(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-row">
          <button
            className={activeFilters.length === 0 ? "filter-chip filter-chip--active" : "filter-chip"}
            type="button"
            onClick={resetFilters}
          >
            All creators
          </button>
          {creatorMarketplaceFilterOptions.map((filter) => {
            const isActive = activeFilters.includes(filter.key);

            return (
              <button
                key={filter.key}
                className={isActive ? "filter-chip filter-chip--active" : "filter-chip"}
                type="button"
                onClick={() => toggleFilter(filter.key)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <div className="results-toolbar__footer">
          <span className="sort-badge">Sort: {currentSortLabel}</span>
          {activeFilters.length > 0 ? <span className="chip">{activeFilters.length} active filter(s)</span> : null}
          <span className="chip">Page size {PAGE_SIZE}</span>
        </div>
      </section>

      {loadState.status === "loading" ? (
        <section className="creator-grid creator-grid--loading" aria-label="Loading creator results">
          {Array.from({ length: 3 }).map((_, index) => (
            <GlassPanel key={index} className="creator-card creator-card--loading">
              <div className="creator-card__media" aria-hidden="true" />
              <div className="loading-bar loading-bar--wide" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </GlassPanel>
          ))}
        </section>
      ) : null}

      {loadState.status === "error" ? (
        <GlassPanel className="results-state">
          <h3 className="results-state__title">Unable to load creators</h3>
          <p className="results-state__copy">
            The marketplace contract is wired, but the listing request failed. {loadState.message}
          </p>
          <div className="chip-row">
            <button className="chip chip--solid" type="button" onClick={() => setReloadKey((current) => current + 1)}>
              Retry request
            </button>
            <button className="chip" type="button" onClick={resetFilters}>
              Reset state
            </button>
          </div>
        </GlassPanel>
      ) : null}

      {loadState.status === "success" && loadState.data.items.length === 0 ? (
        <GlassPanel className="results-state">
          <h3 className="results-state__title">No creators match the current filters</h3>
          <p className="results-state__copy">
            This empty state is intentional. Clear filters or choose a different sort to broaden the result set.
          </p>
          <div className="chip-row">
            <button className="chip chip--solid" type="button" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        </GlassPanel>
      ) : null}

      {loadState.status === "success" && loadState.data.items.length > 0 ? (
        <section className="results-listing" aria-label="Creator results">
          <section className="creator-grid">
            {loadState.data.items.map((creator) => (
              <GlassPanel key={creator.id} className="creator-card">
                <InteractiveImageFrame
                  alt={creator.imageAlt}
                  containerClassName="creator-card__media"
                  imageClassName="creator-card__image"
                  sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  src={creator.imageUrl}
                >
                  <div className="creator-card__media-overlay" aria-hidden="true" />
                  <div className="creator-card__media-top">
                    <span className="media-badge media-badge--primary">Top creator</span>
                    <span className="media-badge">{creator.badges[0] ?? "Ranked"}</span>
                  </div>
                  <div className="creator-card__media-bottom">
                    <span className="media-badge media-badge--ghost">{creator.niche[0]}</span>
                    <span className="media-badge media-badge--ghost">{creator.rating} star</span>
                  </div>
                </InteractiveImageFrame>
                <div className="creator-card__name-row">
                  <h3 className="creator-card__name">{creator.name}</h3>
                  <span className="creator-card__price">{creator.price}</span>
                </div>
                <p className="creator-card__summary">{creator.summary}</p>
                <p className="creator-card__location">{creator.location}</p>
                <div className="creator-card__metrics">
                  <span className="chip">Ranking {creator.rankingScore}</span>
                  <span className="chip">Authenticity {creator.authenticity}</span>
                  <span className="chip">Performance {creator.performance}</span>
                </div>
                <p className="creator-card__package-note">{creator.packageNote}</p>
                <div className="creator-card__actions">
                  <Link className="chip chip--solid" href={`/creators/${creator.username}`}>
                    View profile
                  </Link>
                  <span className="chip">Instant hire next</span>
                </div>
              </GlassPanel>
            ))}
          </section>

          <div className="results-pagination">
            <span className="results-pagination__status">
              Showing {loadState.data.items.length} of {loadState.data.total} creators
            </span>
            {loadState.data.hasMore ? (
              <button className="chip chip--solid" type="button" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading more..." : "Load more creators"}
              </button>
            ) : (
              <span className="chip">All available creators loaded</span>
            )}
          </div>

          {loadMoreError ? (
            <GlassPanel className="results-state results-state--inline">
              <h3 className="results-state__title">Unable to load the next page</h3>
              <p className="results-state__copy">{loadMoreError}</p>
              <div className="chip-row">
                <button className="chip chip--solid" type="button" onClick={loadMore}>
                  Retry load more
                </button>
              </div>
            </GlassPanel>
          ) : null}
        </section>
      ) : null}
    </>
  );
}