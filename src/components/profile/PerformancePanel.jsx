import { useEffect, useState } from 'react'
import { Gauge, Database, Package, Trash2, RefreshCw } from 'lucide-react'
import { queryClient } from '../../config/queryClient'

// Screens split out with React.lazy (see App.jsx)
const LAZY_SCREEN = /^(\w+Page|GunDetail|GunDetailLoader)$/

const chunkName = (url) =>
  url
    .split('/')
    .pop()
    .split('?')[0]
    .replace(/\.js$/, '')
    .replace(/-[A-Za-z0-9_-]{8}$/, '')

const readChunks = () => {
  try {
    const seen = new Map()
    performance
      .getEntriesByType('resource')
      .filter((e) => /\/assets\/.+\.js$/.test(e.name))
      .forEach((e) => {
        const name = chunkName(e.name)
        if (!seen.has(name)) {
          seen.set(name, {
            name,
            lazy: LAZY_SCREEN.test(name),
            at: Math.round(e.startTime),
            kb: e.transferSize ? (e.transferSize / 1024).toFixed(1) : null,
          })
        }
      })
    return [...seen.values()].sort((a, b) => a.at - b.at)
  } catch {
    return []
  }
}

const readCache = () =>
  queryClient
    .getQueryCache()
    .getAll()
    .map((q) => ({
      hash: q.queryHash,
      key: q.queryKey,
      status: q.state.status,
      updatedAt: q.state.dataUpdatedAt,
      stale: q.isStale(),
      observers: q.getObserversCount(),
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)

const keyLabel = (key) => {
  const [name, arg] = key
  if (arg && typeof arg === 'object') {
    const parts = Object.entries(arg)
      .filter(([, v]) => v !== '' && v !== undefined && v !== 'All')
      .map(([k, v]) => `${k}=${v}`)
    return `${name}(${parts.join(', ')})`
  }
  return arg !== undefined ? `${name}(${String(arg).slice(0, 12)})` : name
}

/**
 * "Performa" section on the Profile page — makes Lazy Load (#3) and
 * Query Caching (#4) visible for the demo.
 */
export default function PerformancePanel() {
  const [chunks, setChunks] = useState(readChunks)
  const [cache, setCache] = useState(readCache)

  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe(() => setCache(readCache()))
    return unsub
  }, [])

  const refresh = () => {
    setChunks(readChunks())
    setCache(readCache())
  }

  const lazyChunks = chunks.filter((c) => c.lazy)

  return (
    <section className="profile-section" id="performa">
      <h3 className="section-title">
        <Gauge size={18} /> Performa
        <button type="button" className="icon-btn perf-refresh" onClick={refresh} title="Muat ulang info">
          <RefreshCw size={14} />
        </button>
      </h3>

      <div className="perf-block">
        <h4 className="perf-title">
          <Package size={15} /> Lazy Load — halaman yang sudah di-download
        </h4>
        <p className="perf-hint">
          Tiap halaman adalah file terpisah (<code>React.lazy</code>) dan baru di-download saat pertama
          kali dibuka. Gambar juga baru dimuat saat terlihat di layar.
        </p>
        {lazyChunks.length === 0 ? (
          <p className="perf-empty">Belum ada — buka halaman lain lalu kembali ke sini.</p>
        ) : (
          <ul className="perf-list">
            {lazyChunks.map((c) => (
              <li key={c.name}>
                <span className="perf-chip perf-chip--lazy">lazy</span>
                <code>{c.name}.js</code>
                <span className="perf-meta">
                  dimuat di {(c.at / 1000).toFixed(1)} dtk{c.kb ? ` · ${c.kb} KB` : ' · dari cache'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="perf-block">
        <h4 className="perf-title">
          <Database size={15} /> Query Cache — {cache.length} query tersimpan
        </h4>
        <p className="perf-hint">
          Hasil API disimpan per query (TanStack Query). Selama masih <em>fresh</em> (60 dtk), membuka
          ulang halaman yang sama tidak mengirim request lagi.
        </p>
        {cache.length === 0 ? (
          <p className="perf-empty">Cache kosong.</p>
        ) : (
          <ul className="perf-list">
            {cache.slice(0, 12).map((q) => (
              <li key={q.hash}>
                <span className={`perf-chip ${q.stale ? 'perf-chip--stale' : 'perf-chip--fresh'}`}>
                  {q.status !== 'success' ? q.status : q.stale ? 'stale' : 'fresh'}
                </span>
                <code>{keyLabel(q.key)}</code>
                <span className="perf-meta">
                  {q.updatedAt ? new Date(q.updatedAt).toLocaleTimeString() : '-'}
                  {q.observers ? ` · ${q.observers} dipakai` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => {
            queryClient.clear()
            setCache(readCache())
          }}
        >
          <Trash2 size={14} /> Kosongkan cache
        </button>
      </div>
    </section>
  )
}
