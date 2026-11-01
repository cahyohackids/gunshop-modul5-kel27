// ---------------------------------------------------------------------------
// image.js — client-side image helpers.
// ---------------------------------------------------------------------------

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/**
 * Resize + re-encode an image file to a compact JPEG data URL.
 * Keeps photos small enough to store (localStorage / database fallback).
 *
 * @param {File} file
 * @param {{ maxSize?: number, quality?: number }} [opts]
 * @returns {Promise<string>} data URL
 */
export const compressImage = async (file, { maxSize = 900, quality = 0.72 } = {}) => {
  const src = await readAsDataURL(file)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return src

  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = src
  })

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const out = canvas.toDataURL('image/jpeg', quality)
  // Keep the original if re-encoding somehow made it bigger
  return out.length < src.length ? out : src
}
