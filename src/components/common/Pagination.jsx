import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Build the list of page buttons to show, e.g. [1, '…', 4, 5, 6, '…', 12].
 */
const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`)
    out.push(p)
  })
  return out
}

/**
 * Pagination — Prev / page numbers / Next.
 *
 * @param {Object}   props
 * @param {number}   props.page        — current page (1-based)
 * @param {number}   props.totalPages
 * @param {number}   [props.total]     — total items (for the summary line)
 * @param {number}   [props.pageSize]
 * @param {Function} props.onChange    — (page) => void
 * @param {boolean}  [props.disabled]
 */
export default function Pagination({ page, totalPages, total, pageSize, onChange, disabled }) {
  if (!totalPages || totalPages <= 1) return null

  const go = (p) => {
    if (disabled || p < 1 || p > totalPages || p === page) return
    onChange(p)
  }

  const from = total ? (page - 1) * pageSize + 1 : null
  const to = total ? Math.min(page * pageSize, total) : null

  return (
    <nav className="pagination" aria-label="Catalog pages">
      {total ? (
        <span className="pagination__summary">
          {from}–{to} of {total}
        </span>
      ) : null}

      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          onClick={() => go(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {buildPages(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="pagination__gap">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
              onClick={() => go(p)}
              disabled={disabled}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className="pagination__btn"
          onClick={() => go(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}
