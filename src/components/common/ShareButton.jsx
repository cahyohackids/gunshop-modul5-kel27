import { useState } from 'react'
import { Share2, Check, Link2 } from 'lucide-react'
import { shareGun, getGunShareUrl } from '../../utils/share'

/**
 * Share a product's unique link.
 *
 * @param {Object}  props
 * @param {Object}  props.gun
 * @param {'icon'|'button'} [props.variant='button'] — round icon (card) or full button (detail)
 * @param {boolean} [props.showLink] — also print the link under the button
 */
export default function ShareButton({ gun, variant = 'button', showLink = false }) {
  const [status, setStatus] = useState('')

  if (!gun?.id || String(gun.id).startsWith('local-')) return null

  const handleClick = async (e) => {
    e.stopPropagation()
    const result = await shareGun(gun)
    if (result === 'copied') setStatus('Link disalin')
    else if (result === 'shared') setStatus('Dibagikan')
    else if (result === 'failed') setStatus('Gagal menyalin')
    else return
    setTimeout(() => setStatus(''), 2200)
  }

  if (variant === 'icon') {
    return (
      <span className="share-wrap">
        <button
          type="button"
          className="card-act-btn"
          onClick={handleClick}
          aria-label={`Share ${gun.name}`}
          title="Bagikan link"
        >
          {status ? <Check size={15} /> : <Share2 size={15} />}
        </button>
        {status && <span className="share-tip" role="status">{status}</span>}
      </span>
    )
  }

  return (
    <div className="share-block">
      <button type="button" className="btn btn--outline" onClick={handleClick}>
        {status ? <Check size={16} /> : <Share2 size={16} />} {status || 'Bagikan'}
      </button>
      {showLink && (
        <span className="share-link" title="Link unik produk ini">
          <Link2 size={13} /> {getGunShareUrl(gun).replace(/^https?:\/\//, '')}
        </span>
      )}
    </div>
  )
}
