import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import reviewService from '../services/reviewService'
import { queryClient, queryKeys } from '../config/queryClient'

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product (cached per product).
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const enabled = Boolean(gunId) && !String(gunId).startsWith('local-')
  const query = useQuery({
    queryKey: queryKeys.reviews(gunId),
    enabled,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const response = await reviewService.getReviews(gunId)
      if (!response.success) throw new Error(response.message || 'Failed to fetch reviews.')
      return response.data || []
    },
  })

  return {
    reviews: query.data || [],
    loading: enabled && query.isLoading,
    error: query.error ? query.error.message || 'An error occurred while fetching reviews.' : null,
    refetch: query.refetch,
  }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit a new review for a product.
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      const response = await reviewService.createReview(gunId, reviewData)
      if (response.success) {
        setSuccess(true)
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews(gunId) })
        return response.data
      } else {
        setError(response.message || 'Failed to submit review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}
