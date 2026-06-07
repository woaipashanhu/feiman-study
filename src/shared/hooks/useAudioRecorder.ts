/**
 * ============================================================
 *  useAudioRecorder — V4 啊哈时刻录音 hook
 *
 *  浏览器端 MediaRecorder API + IndexedDB 本地存储 + 后端 upload
 *
 *  流程:
 *    1. start()  → 麦克风权限 → start recording
 *    2. stop()   → 拿到 Blob + duration
 *    3. 用户选 cloud / local:
 *       - cloud: POST /api/aha/upload-audio → 拿 url
 *       - local: 存到 IndexedDB(下次同步可选)
 *    4. POST /api/aha/moments type=audio storage=...
 *
 *  浏览器兼容: Chrome/Edge/Safari 14.1+/Firefox
 *  iOS Safari 限制: 60s 上限 + 用户交互后开始
 * ============================================================
 */
import { useState, useRef, useEffect, useCallback } from 'react'

export type AudioStorage = 'cloud' | 'local'

export interface AhaAudioResult {
  blob: Blob
  durationMs: number
  mimeType: string
  /** 选 cloud 时返回 */
  url?: string
  /** 选 local 时存到 IndexedDB 后返回的 key */
  localKey?: string
}

interface RecorderState {
  status: 'idle' | 'permission' | 'recording' | 'stopped' | 'error'
  durationMs: number
  errorMessage?: string
  level: number  // 0-1, 用于可视化音量
}

const MAX_DURATION_MS = 60_000  // 60 秒

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>({
    status: 'idle',
    durationMs: 0,
    level: 0,
  })
  const [result, setResult] = useState<AhaAudioResult | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const stoppedResolveRef = useRef<((v: AhaAudioResult) => void) | null>(null)

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const updateLevel = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteTimeDomainData(data)
    let sum = 0
    for (const v of data) {
      const n = (v - 128) / 128
      sum += n * n
    }
    const rms = Math.sqrt(sum / data.length)
    setState((s) => ({ ...s, level: Math.min(1, rms * 4) }))
    rafRef.current = requestAnimationFrame(updateLevel)
  }, [])

  const start = useCallback(async () => {
    setState({ status: 'permission', durationMs: 0, level: 0 })
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 音量分析
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        audioContextRef.current = audioCtx
        analyserRef.current = analyser
        rafRef.current = requestAnimationFrame(updateLevel)
      } catch {
        // 音量分析失败不影响录音
      }

      // 选 mime
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setState((s) => ({ ...s, status: 'stopped', durationMs }))
        setResult({ blob, durationMs, mimeType })
        if (stoppedResolveRef.current) {
          stoppedResolveRef.current({ blob, durationMs, mimeType })
          stoppedResolveRef.current = null
        }
        streamRef.current?.getTracks().forEach((t) => t.stop())
        if (audioContextRef.current) audioContextRef.current.close()
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
      recorder.start()
      startTimeRef.current = Date.now()
      setState({ status: 'recording', durationMs: 0, level: 0 })

      // 计时器
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        if (elapsed >= MAX_DURATION_MS) {
          stop()
        } else {
          setState((s) => ({ ...s, durationMs: elapsed }))
        }
      }, 100)
    } catch (err: any) {
      setState({ status: 'error', durationMs: 0, level: 0, errorMessage: err.message || '无法访问麦克风' })
    }
  }, [updateLevel])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setState({ status: 'idle', durationMs: 0, level: 0 })
  }, [])

  return {
    state,
    result,
    start,
    stop,
    reset,
    maxDurationMs: MAX_DURATION_MS,
  }
}

/**
 * IndexedDB 存音频 (local storage mode)
 */
export async function saveAudioToLocalDB(key: string, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('aha-moments', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('audios')) {
        db.createObjectStore('audios')
      }
    }
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('audios', 'readwrite')
      tx.objectStore('audios').put(blob, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getAudioFromLocalDB(key: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('aha-moments', 1)
    req.onsuccess = () => {
      const db = req.result
      const tx = db.transaction('audios', 'readonly')
      const getReq = tx.objectStore('audios').get(key)
      getReq.onsuccess = () => resolve(getReq.result || null)
      getReq.onerror = () => reject(getReq.error)
    }
    req.onerror = () => reject(req.error)
  })
}
