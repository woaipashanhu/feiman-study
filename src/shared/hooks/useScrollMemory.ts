import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const scrollPositions = new Map<string, number>()

export function useScrollMemory() {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = location.pathname + location.search
    const saved = scrollPositions.get(key)
    if (saved !== undefined && containerRef.current) {
      containerRef.current.scrollTop = saved
    }
  }, [location.pathname, location.search])

  const saveScroll = () => {
    const key = location.pathname + location.search
    if (containerRef.current) {
      scrollPositions.set(key, containerRef.current.scrollTop)
    }
  }

  return { containerRef, saveScroll }
}
