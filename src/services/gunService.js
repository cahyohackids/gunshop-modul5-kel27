import { apiClient, IS_SUPABASE } from '../config/api'
import { invalidateGuns } from '../config/queryClient'

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  if (Array.isArray(item.specs)) {
    specsList = item.specs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  const cover = item.image_url || item.image || '/guns/pistol.svg'

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: item.image_url || item.image || '/guns/pistol.svg',
    image: item.image_url || item.image || '/guns/pistol.svg',
    ingredients: specsList,
    steps: stepsList,
    // Day 2 columns
    images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [cover], // #9
    seller_wa: item.seller_wa || '', // #8
    is_archived: Boolean(item.deleted_at), // #6 soft delete
    archived_at: item.deleted_at || null,
  }
}

/** Unique, non-empty image list; falls back to the single cover image. */
const cleanImages = (images, cover) => {
  const list = Array.isArray(images) ? images : []
  const all = [...list, ...(list.length === 0 && cover ? [cover] : [])]
  return [...new Set(all.filter((u) => typeof u === 'string' && u.trim()))].slice(0, 8)
}

/** Turn the form's spec rows into "Name: value" strings. */
const toSpecStrings = (data) =>
  Array.isArray(data.ingredients)
    ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
    : Array.isArray(data.specs)
    ? data.specs
    : undefined

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   */
  async getGuns(params = {}) {
    if (IS_SUPABASE) {
      // Pagination: page is 1-based; pageSize (or legacy `limit`) rows per page
      const pageSize = Number(params.pageSize || params.limit) || 8
      const page = Math.max(1, Number(params.page) || 1)
      const offset = (page - 1) * pageSize

      const queryParts = ['select=*']

      if (params.search) {
        queryParts.push(`name=ilike.*${encodeURIComponent(params.search)}*`)
      }

      if (params.category && params.category !== 'All') {
        queryParts.push(`type=eq.${encodeURIComponent(params.category)}`)
      }

      // Soft delete: archived rows have deleted_at set
      queryParts.push(params.archived ? 'deleted_at=not.is.null' : 'deleted_at=is.null')

      if (params.archived) {
        queryParts.push('order=deleted_at.desc,id.desc')
      } else if (params.sort_by) {
        const order = params.order === 'desc' ? 'desc' : 'asc'
        // id as tie-breaker keeps page boundaries stable
        queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order},id.${order}`)
      } else {
        queryParts.push('order=created_at.desc,id.desc')
      }

      queryParts.push(`limit=${pageSize}`, `offset=${offset}`)

      const queryString = queryParts.join('&')
      const { data, headers } = await apiClient.get(`/rest/v1/products?${queryString}`, {
        withMeta: true,
        // Ask PostgREST for the total row count (returned in Content-Range: 0-7/42)
        headers: { Prefer: 'count=exact' },
      })
      const list = Array.isArray(data) ? data.map(normalizeProduct) : []

      const range = headers?.['content-range'] || ''
      const totalFromHeader = Number(range.split('/')[1])
      const total = Number.isFinite(totalFromHeader) ? totalFromHeader : offset + list.length

      return {
        success: true,
        data: list,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      }
    }

    // Fallback: university REST API
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    )
    return apiClient.get('/api/v1/recipes', { params: clean })
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id) {
    if (IS_SUPABASE) {
      const data = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data: normalizeProduct(data[0]) }
      }
      throw new Error('Hardware item not found.')
    }
    return apiClient.get(`/api/v1/recipes/${id}`)
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: toSpecStrings(data) || [],
        // #9 multiple photos — images[0] is the cover (also kept in image_url)
        images: cleanImages(data.images, data.image_url),
        image_url: cleanImages(data.images, data.image_url)[0] || null,
        // #8 seller WhatsApp
        seller_wa: data.seller_wa || null,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      invalidateGuns()
      return { success: true, data: normalizeProduct(created) }
    }
    return apiClient.post('/api/v1/recipes', data)
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      const specsArray = toSpecStrings(data)

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.images !== undefined) {
        payload.images = cleanImages(data.images, data.image_url)
        payload.image_url = payload.images[0] || null
      } else if (data.image_url !== undefined) {
        payload.image_url = data.image_url
      }
      if (data.seller_wa !== undefined) payload.seller_wa = data.seller_wa || null

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      invalidateGuns(id)
      return { success: true, data: normalizeProduct(updated) }
    }
    return apiClient.put(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    return apiClient.patch(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Soft delete — hide the product from the catalog but keep the record.
   */
  async archiveGun(id) {
    await apiClient.patch(`/rest/v1/products?id=eq.${id}`, {
      deleted_at: new Date().toISOString(),
    })
    invalidateGuns(id)
    return { success: true }
  }

  /**
   * Restore an archived product back to the catalog.
   */
  async restoreGun(id) {
    await apiClient.patch(`/rest/v1/products?id=eq.${id}`, { deleted_at: null })
    invalidateGuns(id)
    return { success: true }
  }

  /**
   * List archived products.
   */
  async getArchivedGuns(params = {}) {
    return this.getGuns({ pageSize: 50, ...params, archived: true })
  }

  /**
   * Delete product PERMANENTLY.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      invalidateGuns(id)
      return { success: true }
    }
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }
}

export default new GunService()
