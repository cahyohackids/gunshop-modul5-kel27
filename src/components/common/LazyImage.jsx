import { useEffect, useRef, useState } from 'react'

const FALLBACK = '/guns/pistol.svg'

/**
 * LazyImage — loads the image only when it is about to enter the viewport
 * (IntersectionObserver, with native loading="lazy" as a backup) and fades
 * it in once decoded. Shows a shimmer placeholder until then.
 */
export default function LazyImage({ src, alt, className = '', width, height, rootMargin = '200px' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible, rootMargin])

  return (
    <span ref={ref} className={`lazy-img ${loaded ? 'lazy-img--loaded' : ''} ${className}`}>
      {visible && (
        <img
          src={failed ? FALLBACK : src || FALLBACK}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!failed) setFailed(true)
            else setLoaded(true)
          }}
        />
      )}
    </span>
  )
}
