/**
 * Щелчки дозиметра из записи настоящего счётчика (public/sounds/dosimeter.mp3).
 * Запись — полминуты треска с ровной частотой, поэтому целиком она не годится:
 * дозиметр должен щёлкать то реже, то чаще. Из неё вырезаются отдельные щелчки,
 * и каждый сигнал дозиметра проигрывает случайный из них.
 */

import { publicUrl } from './publicUrl'

const SOUND_URL = publicUrl('/sounds/dosimeter.mp3')
/** Очень тихо: в записи щелчки на пределе громкости. */
const VOLUME = 0.05
const BEFORE_MS = 2
const LENGTH_MS = 42
const FADE_OUT_MS = 10
const THRESHOLD = 0.3
const MAX_CLICKS = 48

let loading = null

/** Находит в записи отдельные щелчки, после которых 45 мс нет следующего. */
function sliceClicks(ctx, audio) {
  const data = audio.getChannelData(0)
  const rate = audio.sampleRate
  const before = Math.round((rate * BEFORE_MS) / 1000)
  const length = Math.round((rate * LENGTH_MS) / 1000)
  const fadeOut = Math.round((rate * FADE_OUT_MS) / 1000)

  const onsets = []
  let quietUntil = 0
  for (let i = 0; i < data.length; i += 1) {
    if (i >= quietUntil && Math.abs(data[i]) > THRESHOLD) {
      onsets.push(i)
      quietUntil = i + Math.round(rate * 0.02)
    }
  }

  const clean = onsets.filter((at, k) => {
    const next = onsets[k + 1] ?? Infinity
    return at - before >= 0 && at + length < data.length && next - at > length
  })

  return clean.slice(0, MAX_CLICKS).map((at) => {
    const buffer = ctx.createBuffer(1, length, rate)
    const out = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) {
      const fadeIn = Math.min(i / before, 1)
      const tail = Math.min((length - i) / fadeOut, 1)
      out[i] = data[at - before + i] * fadeIn * tail
    }
    return buffer
  })
}

/** Загружает и нарезает запись один раз на страницу. Без звука файл не скачивается. */
export function loadClicks(ctx) {
  if (!loading) {
    loading = fetch(SOUND_URL)
      .then((response) => response.arrayBuffer())
      .then((bytes) => ctx.decodeAudioData(bytes))
      .then((audio) => sliceClicks(ctx, audio))
      .catch(() => {
        loading = null
        return []
      })
  }
  return loading
}

export function playClick(ctx, clicks) {
  if (!clicks.length) return
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = clicks[Math.floor(Math.random() * clicks.length)]
  // Щелчки чуть различаются по громкости и высоте, как у настоящего счётчика.
  source.playbackRate.value = 0.94 + Math.random() * 0.12
  gain.gain.value = VOLUME * (0.75 + Math.random() * 0.25)
  source.connect(gain).connect(ctx.destination)
  source.start()
}
