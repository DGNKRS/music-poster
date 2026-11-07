import { useEffect, useRef } from 'react'

const SPOTIFY_API = 'https://open.spotify.com/embed/iframe-api/v1'
let spotifyApi = null

/** Загружает Spotify iFrame API один раз на всю страницу. */
function loadSpotifyApi() {
  if (!spotifyApi) {
    spotifyApi = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = resolve
      const script = document.createElement('script')
      script.src = SPOTIFY_API
      script.async = true
      document.head.appendChild(script)
    })
  }
  return spotifyApi
}

function YandexPlayer({ source, title, autoplay, onReady }) {
  const query = autoplay ? '?autoplay=1' : ''
  return (
    <iframe
      className="player__frame"
      title={`Яндекс Музыка: ${title}`}
      src={`https://music.yandex.ru/iframe/track/${source.trackId}/${source.albumId}${query}`}
      allow="autoplay; encrypted-media; clipboard-write"
      onLoad={onReady}
    />
  )
}

function SpotifyPlayer({ source, autoplay, onReady, onEnded }) {
  const hostRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const onEndedRef = useRef(onEnded)
  onReadyRef.current = onReady
  onEndedRef.current = onEnded

  useEffect(() => {
    const host = hostRef.current
    let cancelled = false
    let controller = null

    // API заменяет переданный элемент своим iframe, поэтому отдаём ему
    // отдельный узел, а не тот, которым управляет React.
    const target = document.createElement('div')
    host.appendChild(target)

    loadSpotifyApi().then((api) => {
      if (cancelled) return
      api.createController(
        target,
        { uri: `spotify:track:${source.trackId}`, width: '100%', height: 80 },
        (created) => {
          if (cancelled) {
            created.destroy()
            return
          }
          controller = created
          created.addListener('ready', () => {
            if (autoplay) created.play()
            onReadyRef.current?.()
          })
          // Превью Spotify бывает короче 30 секунд, а по его концу плеер показывает рекламу.
          created.addListener('playback_update', ({ data }) => {
            if (data.duration > 0 && data.position >= data.duration) onEndedRef.current?.()
          })
        }
      )
    })

    return () => {
      cancelled = true
      controller?.destroy()
      host.replaceChildren()
    }
  }, [source.trackId, autoplay])

  return <div className="player__frame" ref={hostRef} />
}

/**
 * Встроенный плеер сервиса. Звук останавливается вместе с размонтированием,
 * поэтому в один момент играет только открытый трек.
 */
export default function TrackPlayer({ track, autoplay, onReady, onEnded }) {
  const Player = track.source.provider === 'spotify' ? SpotifyPlayer : YandexPlayer
  return <Player source={track.source} title={track.title} autoplay={autoplay} onReady={onReady} onEnded={onEnded} />
}
