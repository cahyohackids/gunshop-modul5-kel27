// ---------------------------------------------------------------------------
// share.js — unique, shareable links for each product.
//
// Every product gets a deep link:  https://<domain>/?gun=<id>
// Opening that link loads the app straight into that product's detail page.
// ---------------------------------------------------------------------------

export const GUN_PARAM = 'gun'

/** Build the unique link for a product. */
export const getGunShareUrl = (gun) => {
  const id = typeof gun === 'object' ? gun?.id : gun
  const url = new URL(window.location.origin + '/')
  url.searchParams.set(GUN_PARAM, id)
  return url.toString()
}

/** Read the product id from the current URL (or null). */
export const getGunIdFromUrl = () => {
  try {
    return new URLSearchParams(window.location.search).get(GUN_PARAM)
  } catch {
    return null
  }
}

/** Put a product id into the address bar (no reload). */
export const setGunIdInUrl = (id, { replace = false } = {}) => {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(GUN_PARAM, id)
  else url.searchParams.delete(GUN_PARAM)
  const next = url.pathname + url.search + url.hash
  if (next === window.location.pathname + window.location.search + window.location.hash) return
  if (replace) window.history.replaceState({ gunId: id || null }, '', next)
  else window.history.pushState({ gunId: id || null }, '', next)
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers / insecure context fallback
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

/**
 * Share a product. Uses the native share sheet when available (mobile/PWA),
 * otherwise copies the link to the clipboard.
 * @returns {Promise<'shared'|'copied'|'cancelled'|'failed'>}
 */
export const shareGun = async (gun) => {
  const url = getGunShareUrl(gun)
  const title = `${gun.name} — Bore & Barrel`
  const text = `Cek ${gun.name} di Bore & Barrel`

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // fall through to clipboard
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed'
}

export { copyText }
