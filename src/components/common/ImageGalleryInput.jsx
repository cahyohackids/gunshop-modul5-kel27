import { useState } from 'react'
import { ImagePlus, X, Star, Loader } from 'lucide-react'
import uploadService from '../../services/uploadService'

export const MAX_IMAGES = 8
const PRESETS = ['/guns/pistol.svg', '/guns/rifle.svg', '/guns/shotgun.svg']

/**
 * ImageGalleryInput — manage several photos for one catalog item (#9).
 * The first photo is the cover. Supports choosing many files at once,
 * removing, and promoting any photo to cover.
 *
 * @param {string[]} props.images   — current list of image URLs
 * @param {Function} props.onChange — (nextImages: string[]) => void
 */
export default function ImageGalleryInput({ images = [], onChange }) {
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')

  const list = images.filter(Boolean)
  const room = MAX_IMAGES - list.length

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    setError('')

    const accepted = files.slice(0, Math.max(0, room))
    if (files.length > accepted.length) {
      setError(`Maksimal ${MAX_IMAGES} foto per katalog.`)
    }

    setUploading(accepted.length)
    const urls = []
    for (const file of accepted) {
      try {
        const res = await uploadService.uploadImage(file)
        if (res?.data?.url) urls.push(res.data.url)
      } catch (err) {
        setError(err.message || 'Sebagian foto gagal diupload.')
      } finally {
        setUploading((n) => Math.max(0, n - 1))
      }
    }
    if (urls.length) onChange([...list, ...urls])
  }

  const remove = (idx) => onChange(list.filter((_, i) => i !== idx))
  const makeCover = (idx) => onChange([list[idx], ...list.filter((_, i) => i !== idx)])
  const addPreset = (url) => {
    if (list.length < MAX_IMAGES) onChange([...list, url])
  }

  return (
    <div className="gallery-input">
      <div className="fieldset-header">
        <label className="form-label">
          Foto Produk <span className="gallery-input__count">{list.length}/{MAX_IMAGES}</span>
        </label>
      </div>

      <ul className="gallery-input__grid">
        {list.map((url, i) => (
          <li key={`${url.slice(0, 40)}-${i}`} className={`gallery-input__item${i === 0 ? ' gallery-input__item--cover' : ''}`}>
            <img src={url} alt={`Foto ${i + 1}`} loading="lazy" />
            {i === 0 ? (
              <span className="gallery-input__badge">Cover</span>
            ) : (
              <button
                type="button"
                className="gallery-input__cover-btn"
                onClick={() => makeCover(i)}
                title="Jadikan cover"
              >
                <Star size={12} /> Cover
              </button>
            )}
            <button
              type="button"
              className="gallery-input__remove"
              onClick={() => remove(i)}
              title="Hapus foto"
              aria-label={`Hapus foto ${i + 1}`}
            >
              <X size={14} />
            </button>
          </li>
        ))}

        {Array.from({ length: uploading }, (_, i) => (
          <li key={`up-${i}`} className="gallery-input__item gallery-input__item--loading">
            <Loader size={20} className="spin" />
          </li>
        ))}

        {room > 0 && (
          <li className="gallery-input__add">
            <label>
              <ImagePlus size={22} />
              <span>Tambah foto</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFiles}
                className="hidden-file-input"
                disabled={uploading > 0}
              />
            </label>
          </li>
        )}
      </ul>

      <div className="gallery-input__presets">
        <span className="preset-title">Atau tambah gambar stok:</span>
        {PRESETS.map((url) => (
          <button
            key={url}
            type="button"
            className="pill"
            onClick={() => addPreset(url)}
            disabled={room <= 0}
          >
            {url.split('/').pop().replace('.svg', '')}
          </button>
        ))}
      </div>

      <p className="form-hint">Bisa pilih beberapa foto sekaligus. Foto pertama jadi cover di katalog.</p>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
