import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryClient, queryKeys } from '../config/queryClient'
import favoriteService from '../services/favoriteService'
import { getUserIdentifier } from '../services/userService'

// ---------------------------------------------------------------------------
// localStorage fallback — used when the backend is unavailable so that
// favourites are still fully functional offline.
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'bore_barrel_favorites'

const readLocalFavs = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeLocalFavs = (ids) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids))
  } catch {
    /* quota exceeded — silently fail */
  }
}

// ---------------------------------------------------------------------------
// useFavorites — list all favourited products.
//
// First attempts the server; on failure uses localStorage.
// Cached with TanStack Query: the header badge, every FavoriteButton and the
// Favorites page all share ONE request instead of one request per component.
// ---------------------------------------------------------------------------

export function useFavorites() {
  const userIdentifier = getUserIdentifier()
  const query = useQuery({
    queryKey: queryKeys.favorites(userIdentifier),
    queryFn: async () => {
      try {
        const response = await favoriteService.getFavorites(userIdentifier)
        if (!response.success) throw new Error(response.message)
        return { list: response.data || [], isLocal: false }
      } catch {
        // Fallback to localStorage
        return { list: readLocalFavs(), isLocal: true }
      }
    },
  })

  return {
    favorites: query.data?.list || [],
    loading: query.isLoading,
    error: null,
    isLocal: Boolean(query.data?.isLocal),
    refetch: query.refetch,
  }
}

// ---------------------------------------------------------------------------
// useToggleFavorite — toggle a product in/out of favourites.
// ---------------------------------------------------------------------------

export function useToggleFavorite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const userIdentifier = getUserIdentifier()

  const toggleFavorite = async (gunId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await favoriteService.toggleFavorite({
        recipe_id: gunId,
        user_identifier: userIdentifier,
      })

      if (response.success) {
        return response.data
      }
      throw new Error(response.message)
    } catch {
      // Fallback: toggle in localStorage
      const current = readLocalFavs()
      const idx = current.findIndex((id) => String(id) === String(gunId))
      let isFavorited

      if (idx === -1) {
        current.push(gunId)
        isFavorited = true
      } else {
        current.splice(idx, 1)
        isFavorited = false
      }
      writeLocalFavs(current)
      return { is_favorited: isFavorited }
    } finally {
      setLoading(false)
    }
  }

  return { toggleFavorite, loading, error }
}

// ---------------------------------------------------------------------------
// useIsFavorited — convenience wrapper for a single product.
// ---------------------------------------------------------------------------

export function useIsFavorited(gunId) {
  const { favorites, loading: fetchLoading } = useFavorites()
  const { toggleFavorite: toggle, loading: toggleLoading } = useToggleFavorite()

  // Check both server-format (objects with .id) and local-format (plain ids)
  const isFavorited = favorites.some((fav) => {
    const favId = typeof fav === 'object' && fav !== null ? (fav.id ?? fav.product_id ?? fav.recipe_id) : fav
    return String(favId) === String(gunId)
  })

  const toggleFavorite = async () => {
    const result = await toggle(gunId)
    if (result) await queryClient.invalidateQueries({ queryKey: ['favorites'] })
    return result
  }

  return {
    isFavorited,
    loading: fetchLoading || toggleLoading,
    toggleFavorite,
  }
}

export { getUserIdentifier }
