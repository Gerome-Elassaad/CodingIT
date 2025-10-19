import * as React from "react"

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches
    }
    return false
  })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setValue(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => setValue(event.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return value
}

// Common breakpoints for convenience
export const useIsMobile = () => useMediaQuery("(max-width: 768px)")
export const useIsTablet = () => useMediaQuery("(max-width: 1024px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)")