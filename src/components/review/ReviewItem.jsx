import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Pencil, Trash2, Check, X, Loader } from 'lucide-react'
import reviewService from '../../services/reviewService'
import { queryClient, queryKeys } from '../../config/queryClient'
import { formatDraftTime } from '../../utils/draftStorage'

/**
 * One review with:
 *   - thumbs up / thumbs down (anyone, one vote per user, click again to undo)
 *   - edit & delete (only on your own review) — the U & D of review CRUD
 */
export default function ReviewItem({ review, gunId }) {
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(review.rating)
  const [comment, setComment] = useState(review.comment)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const key = queryKeys.reviews(gunId)
  const refresh = () => queryClient.invalidateQueries({ queryKey: key })

  // Optimistic vote: update the cached list immediately, then sync
  const handleVote = async (vote) => {
    const current = review.my_vote || 0
    const next = current === vote ? 0 : vote
    const previous = queryClient.getQueryData(key)
    queryClient.setQueryData(key, (list = []) =>
      list.map((r) =>
        r.id !== review.id
          ? r
          : {
              ...r,
              my_vote: next,
              up: r.up - (current === 1 ? 1 : 0) + (next === 1 ? 1 : 0),
              down: r.down - (current === -1 ? 1 : 0) + (next === -1 ? 1 : 0),
            },
      ),
    )
    try {
      await reviewService.voteReview(review.id, vote, current)
    } catch (err) {
      queryClient.setQueryData(key, previous)
      setError(err.message || 'Gagal menyimpan vote.')
      setTimeout(() => setError(''), 3000)
    } finally {
      refresh()
    }
  }

  const handleSave = async () => {
    try {
      setBusy(true)
      setError('')
      await reviewService.updateReview(review.id, { rating, comment: comment.trim() })
      setEditing(false)
      refresh()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan review.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    try {
      setBusy(true)
      await reviewService.deleteReview(review.id)
      refresh()
    } catch (err) {
      setError(err.message || 'Gagal menghapus review.')
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  const edited = review.updated_at && review.created_at &&
    new Date(review.updated_at) - new Date(review.created_at) > 2000

  return (
    <li className={`review-item${review.is_mine ? ' review-item--mine' : ''}`}>
      <div className="review-head">
        <span className="review-user">
          {review.user_identifier || 'Anonymous'}
          {review.is_mine && <span className="review-badge">Kamu</span>}
        </span>
        {!editing && (
          <span className="review-stars-display">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < review.rating ? 'var(--brass)' : 'none'}
                stroke={i < review.rating ? 'var(--brass)' : 'var(--line)'}
              />
            ))}
          </span>
        )}
      </div>

      {editing ? (
        <div className="review-edit">
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={20}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>
          <textarea
            className="review-input"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <div className="review-edit__actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={handleSave} disabled={busy}>
              {busy ? <Loader size={14} className="spin" /> : <Check size={14} />} Simpan
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                setEditing(false)
                setRating(review.rating)
                setComment(review.comment)
              }}
              disabled={busy}
            >
              <X size={14} /> Batal
            </button>
          </div>
        </div>
      ) : (
        review.comment && <p className="review-comment">{review.comment}</p>
      )}

      <div className="review-foot">
        <div className="review-votes" role="group" aria-label="Apakah review ini membantu?">
          <button
            type="button"
            className={`vote-btn${review.my_vote === 1 ? ' vote-btn--up' : ''}`}
            onClick={() => handleVote(1)}
            aria-pressed={review.my_vote === 1}
            title="Thumbs up"
          >
            <ThumbsUp size={14} /> {review.up || 0}
          </button>
          <button
            type="button"
            className={`vote-btn${review.my_vote === -1 ? ' vote-btn--down' : ''}`}
            onClick={() => handleVote(-1)}
            aria-pressed={review.my_vote === -1}
            title="Thumbs down"
          >
            <ThumbsDown size={14} /> {review.down || 0}
          </button>
        </div>

        <span className="review-time">
          {review.created_at ? formatDraftTime(review.created_at) : ''}
          {edited ? ' · diedit' : ''}
        </span>

        {review.is_mine && !editing && (
          <div className="review-own-actions">
            {confirmDelete ? (
              <>
                <span className="review-confirm">Hapus review?</span>
                <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete} disabled={busy}>
                  {busy ? <Loader size={14} className="spin" /> : 'Ya'}
                </button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmDelete(false)} disabled={busy}>
                  Batal
                </button>
              </>
            ) : (
              <>
                <button type="button" className="icon-btn" onClick={() => setEditing(true)} title="Edit review">
                  <Pencil size={14} />
                </button>
                <button type="button" className="icon-btn icon-btn--danger" onClick={() => setConfirmDelete(true)} title="Hapus review">
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
    </li>
  )
}
