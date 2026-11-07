import { useCallback, useEffect, useRef, useState } from 'react'
import PowerLines from './PowerLines'
import TrackCard from './TrackCard'
import TrackPreview from './TrackPreview'
import { usePowerGrid } from '../hooks/usePowerGrid'
import { useUserActivation } from '../hooks/useUserActivation'
import { useWireMotion } from '../hooks/useWireMotion'

/** Пауза перед открытием, чтобы звук не срабатывал при проведении курсором мимо. */
const OPEN_DELAY = 220
/** Пауза перед закрытием, чтобы успеть перевести курсор с карточки на окошко. */
const CLOSE_DELAY = 200

/**
 * Линия электропередачи с треками и единственное на всю линию окошко с отрывком,
 * поэтому одновременно играет не больше одного трека.
 * App монтирует компонент заново на каждую книгу: смена книги закрывает окошко.
 */
export default function MusicField({ book, onActiveChange }) {
  const [preview, setPreview] = useState(null)
  const soundAllowed = useUserActivation()
  const fieldRef = useRef(null)
  const grid = usePowerGrid(fieldRef, book.tracks.length)
  const activeIndex = preview?.index ?? null
  const { wireEls, swingEls, currentEls, pluck } = useWireMotion(grid, activeIndex)
  const previewRef = useRef(null)
  const pinnedRef = useRef(false)
  const openTimer = useRef(0)
  const closeTimer = useRef(0)

  pinnedRef.current = Boolean(preview?.pinned)

  const clearTimers = useCallback(() => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
  }, [])

  const close = useCallback(() => {
    clearTimers()
    setPreview(null)
  }, [clearTimers])

  const show = (index, element, pinned) => {
    setPreview({ index, pinned, anchor: element.getBoundingClientRect() })
  }

  const hoverStart = (index, element) => {
    pluck(index)
    if (pinnedRef.current) return
    clearTimers()
    openTimer.current = setTimeout(() => show(index, element, false), OPEN_DELAY)
  }

  const hoverEnd = () => {
    clearTimeout(openTimer.current)
    if (pinnedRef.current) return
    closeTimer.current = setTimeout(() => setPreview(null), CLOSE_DELAY)
  }

  const pick = (index, element) => {
    pluck(index)
    clearTimers()
    if (preview?.index === index && preview.pinned) setPreview(null)
    else show(index, element, true)
  }

  useEffect(() => clearTimers, [clearTimers])

  const isOpen = preview !== null

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }
    const onOutside = (event) => {
      if (previewRef.current?.contains(event.target) || event.target.closest?.('.track')) return
      close()
    }
    // Окошко привязано к экранным координатам карточки: при скролле оно бы отстало.
    const onMove = () => {
      if (!pinnedRef.current) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onOutside)
    window.addEventListener('scroll', onMove, { passive: true })
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onOutside)
      window.removeEventListener('scroll', onMove)
      window.removeEventListener('resize', onMove)
    }
  }, [isOpen, close])

  const activeTrack = preview ? book.tracks[preview.index] : null

  // Открытый трек нужен и за пределами поля: цитатам под названием книги и дозиметру.
  useEffect(() => {
    onActiveChange(activeTrack)
  }, [activeTrack, onActiveChange])
  useEffect(() => () => onActiveChange(null), [onActiveChange])

  return (
    <section className="music" aria-label="Музыка, сопровождавшая чтение">
      <header className="music__head">
        <span className="music__label">Саундтрек чтения</span>
        <span className="music__count">{book.tracks.length} композиций</span>
      </header>

      <div
        className="music__field"
        ref={fieldRef}
        style={
          grid
            ? {
                minHeight: grid.minHeight,
                '--tag-width': `${grid.tag.width.toFixed(1)}px`,
                '--cover': `${grid.tag.cover.toFixed(1)}px`,
                '--hanger': `${grid.tag.hanger.toFixed(1)}px`,
              }
            : undefined
        }
      >
        {grid && <PowerLines grid={grid} activeIndex={activeIndex} wireEls={wireEls} currentEls={currentEls} />}

        <ul className="music__grid">
          {book.tracks.map((track, i) => (
            <TrackCard
              key={track.id}
              track={track}
              index={i}
              hang={grid?.hangs[i]}
              swingRef={(el) => {
                swingEls.current[i] = el
              }}
              active={activeIndex === i}
              onHoverStart={(element) => hoverStart(i, element)}
              onHoverEnd={hoverEnd}
              onPick={(element) => pick(i, element)}
            />
          ))}
        </ul>
      </div>

      {activeTrack && (
        <TrackPreview
          key={activeTrack.id}
          ref={previewRef}
          track={activeTrack}
          index={preview.index}
          anchor={preview.anchor}
          pinned={preview.pinned}
          soundAllowed={soundAllowed}
          onClose={close}
          onPointerEnter={clearTimers}
          onPointerLeave={hoverEnd}
        />
      )}
    </section>
  )
}
