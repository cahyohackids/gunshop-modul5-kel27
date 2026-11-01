import { useQuery, keepPreviousData } from '@tanstack/react-query'
import gunService from '../services/gunService'
import { queryKeys } from '../config/queryClient'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
//
// Returns { guns, loading, fetching, error, pagination, refetch }.
// Results are cached per params (see config/queryClient.js), so flipping
// back to a page you already saw is instant. While a new page loads, the
// previous page stays on screen (keepPreviousData).
// ---------------------------------------------------------------------------

export const fetchGunsQuery = async (params) => {
  const response = await gunService.getGuns(params)
  if (!response.success) throw new Error(response.message || 'Failed to fetch products.')
  return response
}

export function useGuns(params = {}) {
  const query = useQuery({
    queryKey: queryKeys.guns(params),
    queryFn: () => fetchGunsQuery(params),
    placeholderData: keepPreviousData,
  })

  return {
    guns: query.data?.data || [],
    pagination: query.data?.pagination || null,
    // `loading` = nothing to show yet, or showing the previous page while the new one loads
    loading: query.isLoading || query.isPlaceholderData,
    fetching: query.isFetching,
    // Query caching info (shown by <CacheStatus />)
    dataUpdatedAt: query.dataUpdatedAt,
    fromCache: Boolean(query.data) && !query.isFetchedAfterMount && !query.isPlaceholderData,
    error: query.error ? query.error.message || 'An error occurred while fetching products.' : null,
    refetch: query.refetch,
  }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its id (cached per id).
//
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const enabled = Boolean(id) && !String(id).startsWith('local-')
  const query = useQuery({
    queryKey: queryKeys.gun(id),
    enabled,
    queryFn: async () => {
      const response = await gunService.getGunById(id)
      if (!response.success) throw new Error(response.message || 'Product not found.')
      return response.data
    },
  })

  return {
    gun: query.data || null,
    loading: enabled && query.isLoading,
    error: query.error ? query.error.message || 'Failed to load product details.' : null,
    refetch: query.refetch,
  }
}
