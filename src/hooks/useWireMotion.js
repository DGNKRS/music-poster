import { useCallback, useEffect, useRef } from 'react'
import { currentPath, wirePath } from '../lib/powerGrid'

const LIFE = 3.2
const GUARD = 1.2

/** Форма щипка: провод тянется вниз в точке peak и спадает к опорам. */
function pluckShape(t, peak) {
  return t < peak ? Math.sin((Math.PI / 2) * (t / peak)) : Math.sin((Math.PI / 2) * ((1 - t) / (1 - peak)))
}

/**
 * Работает вне React: на каждом кадре двигает провода и бирки напрямую в DOM.
 * Провода колышет ветер, а наведение на трек щипает провод, как струну,
 * и колебание затухает за пару секунд. При prefers-reduced-motion всё стоит на месте.
 */
export function useWireMotion(grid, activeIndex) {
  const wireEls = useRef([])
  const swingEls = useRef([])
  const currentEls = useRef([])
  const plucks = useRef([])
  const lastPluck = useRef(new Map())
  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex

  useEffect(() => {
    if (!grid) return undefined
    plucks.current = grid.wires.map(() => [])
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    const tick = (ms) => {
      const now = ms / 1000

      const displacers = grid.wires.map((_, w) => {
        const list = plucks.current[w].filter((pluck) => now - pluck.at < LIFE)
        plucks.current[w] = list
        const phase = w * 1.7
        return (t) => {
          let offset = 2.4 * Math.sin(Math.PI * t) * Math.sin(now * 0.75 + phase + t * 1.6)
          for (const pluck of list) {
            const age = now - pluck.at
            if (age > 0) {
              offset +=
                pluck.amp * pluckShape(t, pluck.peak) * Math.exp(-age * 1.9) * Math.sin(age * 2 * Math.PI * 2.1)
            }
          }
          return offset
        }
      })

      grid.wires.forEach((wire, w) => {
        wireEls.current[w]?.setAttribute('d', wirePath(wire, displacers[w]))
      })

      grid.hangs.forEach((hang, i) => {
        const el = swingEls.current[i]
        if (!el) return
        let angle = 0.7 * Math.sin(now * 0.95 + i * 2.3)
        for (const pluck of plucks.current[hang.wire]) {
          const age = now - pluck.at
          if (age > 0) {
            const weight = pluck.index === i ? 1 : 0.32 * (1 - Math.abs(hang.t - pluck.peak))
            angle += pluck.kick * weight * Math.exp(-age * 1.5) * Math.sin(age * 2 * Math.PI * 0.95)
          }
        }
        el.style.transform = `translate3d(0,${displacers[hang.wire](hang.t).toFixed(2)}px,0) rotate(${angle.toFixed(3)}deg)`
      })

      const hang = activeRef.current === null ? null : grid.hangs[activeRef.current]
      if (hang) {
        const d = currentPath(grid.wires[hang.wire], hang.t, displacers[hang.wire])
        currentEls.current.forEach((el) => el?.setAttribute('d', d))
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [grid])

  /** Щипок провода. Повтор на том же треке не считается: курсор мог лишь дрогнуть. */
  const pluck = useCallback(
    (index) => {
      const hang = grid?.hangs[index]
      const list = hang && plucks.current[hang.wire]
      if (!list) return
      const now = performance.now() / 1000
      if (now - (lastPluck.current.get(index) ?? -Infinity) < GUARD) return
      lastPluck.current.set(index, now)
      list.push({ at: now, peak: hang.t, amp: 7, kick: 3.4, index })
    },
    [grid]
  )

  return { wireEls, swingEls, currentEls, pluck }
}
