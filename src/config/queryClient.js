import { QueryClient } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Query caching (TanStack Query)
//
// - Results are cached per query key, so going back to a catalog page,
//   reopening a product, or switching tabs shows data instantly instead of
//   refetching.
// - Data is "fresh" for 60 s (no refetch at all), then refreshed quietly in
//   the background the next time it is used (stale-while-revalidate).
// - Identical requests made at the same time are deduplicated (e.g. every
//   FavoriteButton on the page shares ONE favorites request).
// - Writes (create / update / archive / review) invalidate the affected keys.
// ---------------------------------------------------------------------------
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Central list of cache keys
export const queryKeys = {
  guns: (params) => ['guns', params ?? {}],
  gunsAll: ['guns'],
  gun: (id) => ['gun', String(id)],
  reviews: (gunId) => ['reviews', String(gunId)],
  favorites: (userId) => ['favorites', userId],
  archived: ['archived'],
}

/** Drop cached product data after any write. */
export const invalidateGuns = (id) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.gunsAll })
  queryClient.invalidateQueries({ queryKey: queryKeys.archived })
  queryClient.invalidateQueries({ queryKey: ['favorites'] })
  if (id != null) queryClient.invalidateQueries({ queryKey: queryKeys.gun(id) })
}
