import { apiClient, IS_SUPABASE } from '../config/api'
import { getUserIdentifier, getUserProfile } from './userService'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    if (IS_SUPABASE) {
      // Embed the votes of each review (#7 thumbs up / down)
      const data = await apiClient.get(
        `/rest/v1/reviews?product_id=eq.${gunId}&select=*,review_votes(vote,user_id)&order=created_at.desc`,
      )
      const me = getUserIdentifier()
      const list = Array.isArray(data)
        ? data.map((r) => {
            const votes = Array.isArray(r.review_votes) ? r.review_votes : []
            const mine = votes.find((v) => v.user_id === me)
            return {
              id: r.id,
              product_id: r.product_id,
              user_id: r.user_id,
              user_identifier:
                r.user_name || (r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous'),
              rating: r.rating,
              comment: r.comment || '',
              created_at: r.created_at,
              updated_at: r.updated_at,
              is_mine: r.user_id === me,
              up: votes.filter((v) => v.vote === 1).length,
              down: votes.filter((v) => v.vote === -1).length,
              my_vote: mine ? mine.vote : 0,
            }
          })
        : []

      return { success: true, data: list }
    }

    return apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier || getUserIdentifier(),
        user_name: reviewData.user_name || getUserProfile().username || null,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: created }
    }

    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
          updated_at: new Date().toISOString(),
        },
        { headers: { Prefer: 'return=representation' } },
      )
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    return apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      return { success: true }
    }

    return apiClient.delete(`/api/v1/reviews/${reviewId}`)
  }

  /**
   * Thumbs up (1) / thumbs down (-1). Clicking the same vote again removes it.
   * @param {number} reviewId
   * @param {1|-1} vote
   * @param {0|1|-1} currentVote — the user's existing vote
   */
  async voteReview(reviewId, vote, currentVote = 0) {
    const userId = getUserIdentifier()
    if (currentVote === vote) {
      await apiClient.delete(`/rest/v1/review_votes?review_id=eq.${reviewId}&user_id=eq.${userId}`)
      return { success: true, data: { vote: 0 } }
    }
    // Upsert: one row per (review, user)
    await apiClient.post(
      '/rest/v1/review_votes?on_conflict=review_id,user_id',
      { review_id: Number(reviewId), user_id: userId, vote },
      { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } },
    )
    return { success: true, data: { vote } }
  }
}

export default new ReviewService()
