import { useEffect, useRef, useState } from 'react'

/**
 * Возвращает нормализованную позицию курсора в диапазоне -1..1 по обеим осям.
 * Обновление — один раз на кадр (requestAnimationFrame), чтобы не дёргать React.
 * На тач-устройствах и при prefers-reduced-motion эффект отключается (0, 0).
 */
export function useParallax() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const frame = useRef(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(pointer: coarse)')
    if (reduced.matches || coarse.matches) return

    const onMove = (event) => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        setPos({
          x: (event.clientX / window.innerWidth) * 2 - 1,
          y: (event.clientY / window.innerHeight) * 2 - 1,
        })
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame.current)
    }
  }, [])

  return pos
}
