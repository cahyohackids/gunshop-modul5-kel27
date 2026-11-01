import { useEffect, useState } from 'react'
import { Zap, RefreshCw, CloudDownload } from 'lucide-react'

const ago = (ts) => {
  if (!ts) return ''
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 5) return 'baru saja'
  if (s < 60) return `${s} dtk lalu`
  return `${Math.floor(s / 60)} mnt lalu`
}

/**
 * Small visible indicator for query caching (#4):
 *   ⚡ "Dari cache"      — shown instantly from the TanStack Query cache, no request
 *   ☁ "Dari server"     — fetched from Supabase
 *   ⟳ "Memperbarui…"    — background refetch in progress
 */
export default function CacheStatus({ fromCache, fetching, updatedAt, onRefresh }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000)
    return () => clearInterval(t)
  }, [])

  if (!updatedAt && !fetching) return null

  let icon = <CloudDownload size={13} />
  let label = 'Dari server'
  let mod = 'server'
  if (fetching) {
    icon = <RefreshCw size={13} className="spin" />
    label = 'Memperbarui…'
    mod = 'fetching'
  } else if (fromCache) {
    icon = <Zap size={13} />
    label = 'Dari cache'
    mod = 'cache'
  }

  return (
    <button
      type="button"
      className={`cache-status cache-status--${mod}`}
      onClick={onRefresh}
      title="Query caching (TanStack Query) — klik untuk refresh dari server"
    >
      {icon} {label}
      {updatedAt ? <span className="cache-status__time">· {ago(updatedAt)}</span> : null}
    </button>
  )
}
