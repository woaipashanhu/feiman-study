import { useEffect } from 'react'

export function ContentProtection() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    const handleDragStart = (e: DragEvent) => e.preventDefault()
    const handleSelectStart = (e: Event) => e.preventDefault()
    const handleCopy = (e: ClipboardEvent) => e.preventDefault()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && ['s', 'p', 'u', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null
}
