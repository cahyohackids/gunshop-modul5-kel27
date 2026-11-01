import { useState } from 'react'
import { FileText, Play, Trash2, PlusCircle, Pencil } from 'lucide-react'
import { listDrafts, deleteDraft, formatDraftTime } from '../../utils/draftStorage'
import { formatPrice } from '../../utils/helpers'
import LazyImage from '../common/LazyImage'

/**
 * Draft section on the Profile page — every catalog item that was saved as
 * a draft (new item or unfinished edit), with Continue / Delete.
 *
 * @param {Function} props.onOpenDraft — (draftId) => void
 */
export default function DraftList({ onOpenDraft }) {
  const [drafts, setDrafts] = useState(listDrafts)

  const handleDelete = (id) => {
    deleteDraft(id)
    setDrafts(listDrafts())
  }

  return (
    <section className="profile-section" id="drafts">
      <h3 className="section-title">
        <FileText size={18} /> Draft Katalog
        <span className="section-count">{drafts.length}</span>
      </h3>

      {drafts.length === 0 ? (
        <p className="profile-section__empty">
          Belum ada draft. Klik <strong>Save Draft</strong> saat menambah atau mengedit katalog,
          nanti muncul di sini.
        </p>
      ) : (
        <ul className="draft-list">
          {drafts.map((d) => (
            <li key={d.id} className="draft-item">
              <LazyImage className="draft-item__img" src={d.image} alt={d.name} />
              <div className="draft-item__body">
                <span className="draft-item__name">{d.name}</span>
                <span className="draft-item__meta">
                  {d.isNew ? (
                    <><PlusCircle size={12} /> Katalog baru</>
                  ) : (
                    <><Pencil size={12} /> Edit produk #{d.id}</>
                  )}
                  {d.type ? ` · ${d.type}` : ''}
                  {d.price !== undefined && d.price !== '' ? ` · ${formatPrice(d.price)}` : ''}
                </span>
                {d.savedAt && (
                  <span className="draft-item__time">Disimpan {formatDraftTime(d.savedAt)}</span>
                )}
              </div>
              <div className="draft-item__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => onOpenDraft && onOpenDraft(d.id)}
                >
                  <Play size={14} /> Lanjutkan
                </button>
                <button
                  type="button"
                  className="btn btn--danger-ghost btn--sm"
                  onClick={() => handleDelete(d.id)}
                  title="Hapus draft"
                  aria-label={`Hapus draft ${d.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
