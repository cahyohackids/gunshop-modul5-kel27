import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LazyImage from '../common/LazyImage'

/**
 * GunGallery — main photo + thumbnail strip for products with several
 * photos (#9). Falls back to a single image when there is only one.
 */
export default function GunGallery({ images = [], alt }) {
  const list = images.filter(Boolean)
  const [index, setIndex] = useState(0)
  const current = Math.min(index, Math.max(0, list.length - 1))

  if (list.length <= 1) {
    return <LazyImage className="detail-img" src={list[0]} alt={alt} rootMargin="0px" />
  }

  const go = (delta) => setIndex((current + delta + list.length) % list.length)

  return (
    <div className="gallery">
      <div className="gallery__main">
        <LazyImage key={current} className="detail-img gallery__img" src={list[current]} alt={`${alt} — foto ${current + 1}`} rootMargin="0px" />
        <button type="button" className="gallery__nav gallery__nav--prev" onClick={() => go(-1)} aria-label="Foto sebelumnya">
          <ChevronLeft size={20} />
        </button>
        <button type="button" className="gallery__nav gallery__nav--next" onClick={() => go(1)} aria-label="Foto berikutnya">
          <ChevronRight size={20} />
        </button>
        <span className="gallery__counter">
          {current + 1} / {list.length}
        </span>
      </div>

      <div className="gallery__thumbs" role="tablist" aria-label="Foto produk">
        {list.map((url, i) => (
          <button
            key={`${url.slice(0, 40)}-${i}`}
            type="button"
            role="tab"
            aria-selected={i === current}
            className={`gallery__thumb${i === current ? ' gallery__thumb--active' : ''}`}
            onClick={() => setIndex(i)}
          >
            <LazyImage src={url} alt={`Thumbnail ${i + 1}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
