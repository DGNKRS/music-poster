import { useLayoutEffect, useState } from 'react'
import { buildGrid } from '../lib/powerGrid'

/** С этой ширины постер стоит в две колонки и линия электропередачи помещается. */
const WIDE = '(min-width: 861px)'

/**
 * Считает геометрию линии по реальным размерам поля и обложки книги.
 * На узком экране возвращает null: там треки идут обычным списком.
 */
export function usePowerGrid(fieldRef, count) {
  const [grid, setGrid] = useState(null)

  useLayoutEffect(() => {
    const field = fieldRef.current
    const stage = field.closest('.stage')
    const anchorEl = stage.querySelector('[data-connector="anchor"]')
    const media = window.matchMedia(WIDE)
    let lastKey = ''

    const measure = () => {
      if (!media.matches) {
        lastKey = ''
        setGrid(null)
        return
      }
      const box = field.getBoundingClientRect()
      const cover = anchorEl.getBoundingClientRect()
      const anchor = { x: cover.right - box.left, y: cover.top - box.top, height: cover.height }
      const key = [box.width, box.height, anchor.x, anchor.y, anchor.height].map(Math.round).join()
      if (key === lastKey || box.width === 0) return
      lastKey = key
      setGrid(buildGrid({ width: box.width, height: box.height, count, anchor }))
    }

    // Книга въезжает анимацией, и точный замер обложки возможен только после неё.
    const onAnimationEnd = (event) => {
      if (event.animationName === 'bookIn') measure()
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(field)
    observer.observe(anchorEl)
    media.addEventListener('change', measure)
    stage.addEventListener('animationend', onAnimationEnd)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', measure)
      stage.removeEventListener('animationend', onAnimationEnd)
    }
  }, [fieldRef, count])

  return grid
}
