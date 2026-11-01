import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import Pagination from '../components/common/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import ConfirmModal from '../components/modals/ConfirmModal'
import gunService from '../services/gunService'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
} from '../utils/helpers'

const PAGE_SIZE = 8
const CATEGORIES = ['All', 'Pistol', 'Rifle', 'Shotgun', 'Submachine Gun']

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, CRUD actions, detail modal.
 */
export default function Catalog({ onNavigate }) {
  // ---- filters / sort / page ----
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim())
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)

  // Any filter change jumps back to page 1
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeCategory, sortKey, sortOrder])

  // ---- API data (server-side filter, sort & pagination) ----
  const { guns: apiGuns, loading, error, pagination, refetch } = useGuns({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    category: activeCategory,
    sort_by: sortKey,
    order: sortOrder,
  })
  const [useLocal, setUseLocal] = useState(false)
  const showLocal = useLocal || (error && apiGuns.length === 0 && !loading)

  // Local fallback is filtered/sorted/paginated on the client
  const localResult = useMemo(() => {
    if (!showLocal) return null
    const all = sortItems(
      GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` })).filter(
        (g) => matchesSearch(g, debouncedSearch) && matchesCategory(g, activeCategory),
      ),
      sortKey,
      sortOrder,
    )
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
    return {
      items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      pagination: { page, pageSize: PAGE_SIZE, total: all.length, totalPages },
    }
  }, [showLocal, debouncedSearch, activeCategory, sortKey, sortOrder, page])

  const filteredGuns = localResult ? localResult.items : apiGuns
  const pageInfo = localResult ? localResult.pagination : pagination
  const totalCount = pageInfo?.total ?? filteredGuns.length

  const changePage = (p) => {
    setPage(p)
    document.querySelector('.list-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- delete ----
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      setDeleteError('')
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => { setSelectedGun(null); setDeleteTarget(g) }}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {totalCount} piece{totalCount !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order) }}
        />

        {/* States */}
        {loading && filteredGuns.length === 0 && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !showLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && (!error || showLocal) && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {filteredGuns.length > 0 && (
          <ul className={`stock${loading ? ' stock--loading' : ''}`}>
            {filteredGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}

        <Pagination
          page={pageInfo?.page || page}
          totalPages={pageInfo?.totalPages || 1}
          total={pageInfo?.total}
          pageSize={PAGE_SIZE}
          onChange={changePage}
          disabled={loading}
        />

        {showLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError('') }}
      />
      {deleteError && (
        <div className="toast toast--error">{deleteError}</div>
      )}
    </>
  )
}
