import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import TrackPlayer from './TrackPlayer'
import { prefersYandex, setPrefersYandex } from '../lib/playerChoice'

/** Длина отрывка. Без подписки сервисы и сами отдают только 30 секунд. */
const EXCERPT_MS = 30000
const GAP = 12
const EDGE = 12
const WIRE_CLEARANCE = 18

const SERVICE = {
  yandex: {
    label: 'Яндекс Музыке',
    link: ({ albumId, trackId }) => `https://music.yandex.ru/album/${albumId}/track/${trackId}`,
  },
  spotify: {
    label: 'Spotify',
    link: ({ trackId }) => `https://open.spotify.com/track/${trackId}`,
  },
}

/** Окно по возможности справа от трека: слева по проводу бежит ток к обложке книги. */
function placeBeside(anchor, width, height) {
  const fitsRight = anchor.right + GAP + width <= window.innerWidth - EDGE
  const side = fitsRight ? 'right' : 'left'

  const x = side === 'left' ? anchor.left - GAP - width : anchor.right + GAP
  // Верх окна идёт вровень с обложкой: так провод с бегущим по нему током остаётся виден.
  const y = Math.min(Math.max(anchor.top + WIRE_CLEARANCE, EDGE), window.innerHeight - height - EDGE)

  return { x: Math.max(x, EDGE), y, side }
}

/**
 * Развёрнутое окошко трека: обложка, полные данные и плеер с отрывком.
 * Управляется снаружи (MusicField); наружу отдаёт корневой DOM-узел.
 */
const TrackPreview = forwardRef(function TrackPreview(
  { track, index, anchor, pinned, soundAllowed, onClose, onPointerEnter, onPointerLeave },
  ref
) {
  const rootRef = useRef(null)
  const timer = useRef(0)
  const [place, setPlace] = useState(null)
  const [ended, setEnded] = useState(false)
  const [run, setRun] = useState(0)
  // Запасной плеер Яндекса: выбор запоминается, чтобы там, где Spotify не играет,
  // не переключать каждый трек заново.
  const [useYandex, setUseYandex] = useState(prefersYandex)

  const fallback = track.source.yandex ? { provider: 'yandex', ...track.source.yandex } : null
  const source = useYandex && fallback ? fallback : track.source

  useImperativeHandle(ref, () => rootRef.current)

  useLayoutEffect(() => {
    const { offsetWidth, offsetHeight } = rootRef.current
    setPlace(placeBeside(anchor, offsetWidth, offsetHeight))
  }, [anchor, source.provider])

  useEffect(() => () => clearTimeout(timer.current), [])

  // Отсчёт отрывка идёт только при автозапуске: если человек сам нажимает Play
  // в плеере, момент старта неизвестен, и обрезать звук было бы неправильно.
  const startCountdown = () => {
    clearTimeout(timer.current)
    if (soundAllowed) timer.current = setTimeout(() => setEnded(true), EXCERPT_MS)
  }

  const replay = () => {
    setEnded(false)
    setRun((value) => value + 1)
  }

  const switchPlayer = () => {
    const next = !useYandex
    setUseYandex(next)
    setPrefersYandex(next)
    setEnded(false)
    clearTimeout(timer.current)
  }

  const { provider } = source
  const service = SERVICE[provider]
  const albumLine = [track.album, track.year].filter(Boolean).join(' · ')

  return (
    <aside
      ref={rootRef}
      className={`preview preview--${place?.side ?? 'right'}${place ? ' is-placed' : ''}`}
      style={place ? { '--x': `${place.x}px`, '--y': `${place.y}px` } : undefined}
      aria-label={`Отрывок: ${track.artist} — ${track.title}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="preview__hero">
        <img className="preview__glow" src={track.cover} alt="" aria-hidden="true" />
        <img className="preview__cover" src={track.cover} alt={`Обложка: ${track.album}`} />
        <div className="preview__info">
          <span className="preview__index">{String(index + 1).padStart(2, '0')}</span>
          <h3 className="preview__title">{track.title}</h3>
          <p className="preview__artist">{track.artist}</p>
          <p className="preview__album">{albumLine}</p>
        </div>
        {pinned && (
          <button type="button" className="preview__close" onClick={onClose} aria-label="Закрыть окно трека">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {track.quote && (
        <blockquote className="preview__quote">
          <p>«{track.quote}»</p>
        </blockquote>
      )}

      <div className={`player player--${provider}`}>
        {ended ? (
          <button type="button" className="player__replay" onClick={replay}>
            Отрывок закончился · слушать ещё раз
          </button>
        ) : (
          <TrackPlayer
            key={`${provider}:${soundAllowed}:${run}`}
            track={track}
            source={source}
            autoplay={soundAllowed}
            onReady={startCountdown}
            onEnded={() => setEnded(true)}
          />
        )}
      </div>

      {fallback && (
        <button type="button" className="preview__switch" onClick={switchPlayer}>
          {useYandex ? 'Вернуть плеер Spotify' : 'Не играет? Включить через Яндекс Музыку'}
        </button>
      )}

      <footer className="preview__foot">
        <span>{soundAllowed ? 'Отрывок · до 30 секунд' : 'Кликните, чтобы включить звук'}</span>
        <a href={service.link(source)} target="_blank" rel="noreferrer">
          Целиком в {service.label} ↗
        </a>
      </footer>
    </aside>
  )
})

export default TrackPreview
