import { useState, useCallback } from 'react'

interface PlayerState {
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
}

interface UsePlayerStateResult extends PlayerState {
  setCurrentIndex: (index: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  next: (maxIndex: number) => void
  prev: () => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
}

export function usePlayerState(initialIndex = 0): UsePlayerStateResult {
  const [state, setState] = useState<PlayerState>({
    currentIndex: initialIndex,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  })

  const setCurrentIndex = useCallback((index: number) => {
    setState((s) => ({ ...s, currentIndex: index, currentTime: 0 }))
  }, [])

  const play = useCallback(() => setState((s) => ({ ...s, isPlaying: true })), [])
  const pause = useCallback(() => setState((s) => ({ ...s, isPlaying: false })), [])
  const toggle = useCallback(() => setState((s) => ({ ...s, isPlaying: !s.isPlaying })), [])

  const seek = useCallback((time: number) => {
    setState((s) => ({ ...s, currentTime: Math.max(0, Math.min(time, s.duration)) }))
  }, [])

  const next = useCallback((maxIndex: number) => {
    setState((s) => ({
      ...s,
      currentIndex: Math.min(s.currentIndex + 1, maxIndex),
      currentTime: 0,
    }))
  }, [])

  const prev = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: Math.max(s.currentIndex - 1, 0),
      currentTime: 0,
    }))
  }, [])

  const setDuration = useCallback((duration: number) => {
    setState((s) => ({ ...s, duration }))
  }, [])

  const setCurrentTime = useCallback((time: number) => {
    setState((s) => ({ ...s, currentTime: time }))
  }, [])

  return {
    ...state,
    setCurrentIndex,
    play,
    pause,
    toggle,
    seek,
    next,
    prev,
    setDuration,
    setCurrentTime,
  }
}
