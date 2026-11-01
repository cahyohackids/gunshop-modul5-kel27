import { Loader, AlertCircle, ArrowLeft } from 'lucide-react'
import { useGunById } from '../../hooks/useGuns'
import GunDetail from './GunDetail'

/**
 * Opens a product detail from only its id — used when the app is opened
 * through a shared link (?gun=<id>).
 */
export default function GunDetailLoader({ gunId, onBack, ...rest }) {
  const { gun, loading, error, refetch } = useGunById(gunId)

  if (loading && !gun) {
    return (
      <div className="state-box">
        <Loader size={28} className="spin" />
        <p>Membuka produk dari link…</p>
      </div>
    )
  }

  if (error || !gun) {
    return (
      <div className="state-box state-box--error">
        <AlertCircle size={28} />
        <p>{error || 'Produk tidak ditemukan.'}</p>
        <div className="state-box__actions">
          <button type="button" className="btn btn--outline" onClick={refetch}>
            Coba lagi
          </button>
          <button type="button" className="btn btn--outline" onClick={onBack}>
            <ArrowLeft size={16} /> Ke Katalog
          </button>
        </div>
      </div>
    )
  }

  return <GunDetail gun={gun} onBack={onBack} {...rest} />
}
