import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Trash2, Loader, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'
import gunService from '../services/gunService'
import { queryKeys } from '../config/queryClient'
import ConfirmModal from '../components/modals/ConfirmModal'
import LazyImage from '../components/common/LazyImage'
import { formatPrice } from '../utils/helpers'
import { formatDraftTime } from '../utils/draftStorage'

/**
 * ArchivePage — soft-deleted (archived) catalog items.
 * Each item can be restored to the catalog or deleted permanently.
 */
export default function ArchivePage({ onNavigateCatalog }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.archived,
    queryFn: () => gunService.getArchivedGuns(),
  })
  const items = data?.data || []

  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const flash = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRestore = async (gun) => {
    try {
      setBusyId(gun.id)
      await gunService.restoreGun(gun.id)
      flash('success', `"${gun.name}" dipulihkan ke katalog.`)
    } catch (err) {
      flash('error', err.message || 'Gagal memulihkan.')
    } finally {
      setBusyId(null)
    }
  }

  const handleDeletePermanent = async () => {
    if (!deleteTarget) return
    try {
      setBusyId(deleteTarget.id)
      await gunService.deleteGun(deleteTarget.id)
      flash('success', `"${deleteTarget.name}" dihapus permanen.`)
      setDeleteTarget(null)
    } catch (err) {
      flash('error', err.message || 'Gagal menghapus.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="archive-page">
      <section className="masthead">
        <h1 className="display">Arsip Katalog</h1>
        <p className="lede">
          Katalog yang diarsipkan (soft delete) tidak tampil di katalog, tapi datanya masih ada.
          Pulihkan kapan saja, atau hapus permanen.
        </p>
      </section>

      {toast && (
        <div className={`toast toast--${toast.type}`} role="status">
          {toast.text}
        </div>
      )}

      <section>
        <div className="list-head">
          <h2>Diarsipkan</h2>
          <div className="list-head-right">
            <span className="count">{items.length} item</span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Muat ulang"
            >
              <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat arsip…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error.message || 'Gagal memuat arsip.'}</p>
            <button type="button" className="btn btn--outline" onClick={() => refetch()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="state-box">
            <Archive size={32} stroke="var(--steel)" />
            <p>Arsip kosong. Katalog yang kamu arsipkan akan muncul di sini.</p>
            {onNavigateCatalog && (
              <button type="button" className="btn btn--primary" onClick={onNavigateCatalog}>
                Ke Katalog <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {items.length > 0 && (
          <ul className="archive-list">
            {items.map((gun) => (
              <li key={gun.id} className="archive-item">
                <LazyImage className="archive-item__img" src={gun.image_url} alt={gun.name} />
                <div className="archive-item__body">
                  <span className="archive-item__name">{gun.name}</span>
                  <span className="archive-item__meta">
                    {gun.type} · {gun.caliber} · {formatPrice(gun.price)}
                  </span>
                  {gun.archived_at && (
                    <span className="archive-item__time">
                      Diarsipkan {formatDraftTime(gun.archived_at)}
                    </span>
                  )}
                </div>
                <div className="archive-item__actions">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleRestore(gun)}
                    disabled={busyId === gun.id}
                  >
                    {busyId === gun.id ? <Loader size={14} className="spin" /> : <ArchiveRestore size={14} />}
                    Pulihkan
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => setDeleteTarget(gun)}
                    disabled={busyId === gun.id}
                  >
                    <Trash2 size={14} /> Hapus Permanen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Permanen?"
        message={`"${deleteTarget?.name}" akan dihapus dari database dan tidak bisa dipulihkan lagi.`}
        confirmLabel="Hapus Permanen"
        danger
        loading={busyId === deleteTarget?.id}
        onConfirm={handleDeletePermanent}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
