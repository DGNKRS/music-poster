import { useEffect, useRef } from 'react'

const MIN_DISTANCE = 50
const MAX_DURATION = 700

/**
 * Горизонтальный свайп пальцем по элементу. Вертикальную прокрутку не трогает:
 * у элемента должно стоять touch-action: pan-y.
 */
export function useSwipe(ref, onSwipeLeft, onSwipeRight) {
  const handlers = useRef({ onSwipeLeft, onSwipeRight })
  handlers.current = { onSwipeLeft, onSwipeRight }

  useEffect(() => {
    const el = ref.current
    let start = null

    const onDown = (event) => {
      start = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY, t: event.timeStamp } : null
    }
    const onUp = (event) => {
      if (!start) return
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      const quick = event.timeStamp - start.t < MAX_DURATION
      start = null
      if (!quick || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
      if (dx < 0) handlers.current.onSwipeLeft()
      else handlers.current.onSwipeRight()
    }
    const onCancel = () => {
      start = null
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
    }
  }, [ref])
}
