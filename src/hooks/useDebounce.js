import { useEffect, useState } from 'react'

/**
 * Return `value` only after it has stopped changing for `delay` ms.
 * Used so the catalog doesn't hit the API on every keystroke.
 */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
