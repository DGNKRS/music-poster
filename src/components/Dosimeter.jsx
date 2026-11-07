import { useEffect, useRef, useState } from 'react'
import { loadClicks, playClick } from '../lib/geigerClicks'

const STORAGE_KEY = 'poster:dosimeter-sound'
/** Дальше этого расстояния от трека фон почти не растёт. */
const REACH = 380
const BASE_RATE = 0.7
const PEAK_RATE = 28
const FINE_POINTER = '(hover: hover) and (pointer: fine)'

function readSetting() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function saveSetting(on) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Хранилище может быть недоступно (приватный режим): просто не запоминаем.
  }
}

/**
 * Дозиметр в углу постера: чем ближе курсор к треку, тем чаще щелчки и выше показания.
 * Щелчки взяты из записи настоящего счётчика (lib/geigerClicks). Звук включается кнопкой и запоминается; пока играет отрывок, дозиметр молчит
 * и только мигает лампой. На сенсорных экранах курсора нет, поэтому дозиметр скрыт.
 */
export default function Dosimeter({ muted }) {
  const [fine] = useState(() => window.matchMedia(FINE_POINTER).matches)
  const [sound, setSound] = useState(readSetting)
  const lampRef = useRef(null)
  const valueRef = useRef(null)
  const ctxRef = useRef(null)
  const clicksRef = useRef([])
  const audible = useRef(false)
  audible.current = sound && !muted

  // Браузер даёт создать звук только после действия человека на странице.
  const ensureAudio = () => {
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      ctxRef.current = new AudioContextClass()
      loadClicks(ctxRef.current).then((clicks) => {
        clicksRef.current = clicks
      })
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
  }

  useEffect(() => {
    if (!sound) return undefined
    const onGesture = () => ensureAudio()
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [sound])

  useEffect(() => () => ctxRef.current?.close(), [])

  useEffect(() => {
    if (!fine) return undefined

    let pointer = null
    let centers = []
    let dose = 0.11
    let shownAt = 0
    let last = performance.now()
    let frame = 0

    const onMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY }
    }
    const onLeave = () => {
      pointer = null
    }
    const collect = () => {
      centers = Array.from(document.querySelectorAll('.track__art'), (el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width / 2 }
      })
    }

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      let intensity = 0
      if (pointer) {
        for (const c of centers) {
          const distance = Math.max(Math.hypot(pointer.x - c.x, pointer.y - c.y) - c.radius, 0)
          intensity = Math.max(intensity, 1 - distance / REACH)
        }
      }
      const level = intensity * intensity
      const rate = BASE_RATE + PEAK_RATE * level

      if (Math.random() < rate * dt) {
        lampRef.current?.animate([{ opacity: 1 }, { opacity: 0.18 }], { duration: 140, easing: 'ease-out' })
        if (audible.current && ctxRef.current?.state === 'running') playClick(ctxRef.current, clicksRef.current)
      }

      dose += (0.11 + 3.4 * level - dose) * Math.min(dt * 3, 1)
      if (now - shownAt > 160 && valueRef.current) {
        const jitter = 1 + (Math.random() - 0.5) * 0.08
        valueRef.current.textContent = (dose * jitter).toFixed(2)
        shownAt = now
      }

      frame = requestAnimationFrame(tick)
    }

    collect()
    const collector = setInterval(collect, 300)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    frame = requestAnimationFrame(tick)

    return () => {
      clearInterval(collector)
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [fine])

  if (!fine) return null

  const toggle = () => {
    const next = !sound
    if (next) ensureAudio()
    setSound(next)
    saveSetting(next)
  }

  return (
    <aside className={`dosimeter${sound ? ' is-on' : ''}`} aria-label="Дозиметр">
      <span className="dosimeter__lamp" ref={lampRef} aria-hidden="true" />
      <span className="dosimeter__label" aria-hidden="true">
        ДКС
      </span>
      <span className="dosimeter__reading" aria-hidden="true">
        <span className="dosimeter__value" ref={valueRef}>
          0.11
        </span>{' '}
        мкЗв/ч
      </span>
      <button type="button" className="dosimeter__sound" onClick={toggle} aria-pressed={sound}>
        {sound ? (muted ? 'звук · пауза' : 'звук вкл') : 'звук выкл'}
      </button>
    </aside>
  )
}
