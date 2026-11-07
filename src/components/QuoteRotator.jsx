import { useEffect, useMemo, useState } from 'react'

/** Скорость печати: миллисекунд на символ. */
const TYPE_MS = 22
/** Сколько цитата держится на экране после печати: короткие меньше, длинные дольше. */
const readMs = (text) => Math.min(Math.max(4500 + text.length * 55, 6500), 14000)
/** Цитата трека появляется, когда ток по проводу доходит до обложки. */
const LINK_DELAY = 500

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Сменяющиеся цитаты персонажей. Каждая печатается, как сообщение на ПДА,
 * а линия слева заполняется, отсчитывая время до следующей.
 * Нажатие на имя оставляет только цитаты этого персонажа.
 * link — цитата открытого трека { text, track }: пока он звучит, она стоит вместо сменяющихся.
 *
 * Все цитаты книги и её треков лежат невидимыми в одной ячейке сетки, поэтому высота блока
 * равна самой длинной и не прыгает при смене: иначе обложка сдвигалась бы,
 * а провода к ней отставали.
 */
export default function QuoteRotator({ quotes, trackQuotes = [], link }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length))
  const [typed, setTyped] = useState(0)
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const [manual, setManual] = useState(false)
  const [who, setWho] = useState(null)
  const [linked, setLinked] = useState(null)
  const [still] = useState(reducedMotion)

  const quote = linked ?? quotes[index]
  const done = typed >= quote.text.length

  const list = useMemo(
    () => quotes.flatMap((item, i) => (!who || item.speaker === who ? [i] : [])),
    [quotes, who]
  )
  const position = Math.max(list.indexOf(index), 0)

  const linkText = link?.text ?? null
  const linkTrack = link?.track ?? null

  useEffect(() => {
    if (linkText === null) {
      setLinked(null)
      return undefined
    }
    const timer = setTimeout(() => setLinked({ text: linkText, track: linkTrack }), LINK_DELAY)
    return () => clearTimeout(timer)
  }, [linkText, linkTrack])

  useEffect(() => {
    if (still) {
      setTyped(quote.text.length)
      return undefined
    }
    const start = performance.now()
    setTyped(0)
    const timer = setInterval(() => {
      const count = Math.floor((performance.now() - start) / TYPE_MS)
      setTyped(Math.min(count, quote.text.length))
      if (count >= quote.text.length) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [quote.text, still])

  const step = (delta) => list[(position + delta + list.length) % list.length]

  const go = (delta) => {
    setManual(true)
    setLinked(null)
    setIndex(step(delta))
  }

  const toggleSpeaker = () => {
    setManual(true)
    setLinked(null)
    if (who) {
      setWho(null)
      return
    }
    setWho(quote.speaker)
  }

  const running = done && !paused && !held && !linked
  const counter = `${String(position + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`

  return (
    <figure
      className={`quote${done ? ' is-done' : ''}${linked ? ' is-linked' : ''}`}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
      }}
    >
      {!still && (
        <span
          key={`${index}:${who}`}
          className="quote__timer"
          style={{
            animationDuration: `${readMs(quote.text)}ms`,
            animationPlayState: running ? 'running' : 'paused',
          }}
          onAnimationEnd={() => setIndex(step(1))}
          aria-hidden="true"
        />
      )}

      <div className="quote__stack">
        {[...quotes.map((item) => item.text), ...trackQuotes].map((text, i) => (
          <blockquote key={i} className="quote__text quote__text--ghost" aria-hidden="true">
            «{text}»
          </blockquote>
        ))}

        {/* Читалке экрана отдаём цитату целиком, а не по буквам; объявляем только смену вручную. */}
        <blockquote className="quote__text" aria-live={manual ? 'polite' : 'off'}>
          <span className="visually-hidden">
            {linked ? `Цитата к треку «${linked.track}»` : quote.speaker}: {quote.text}
          </span>
          <span aria-hidden="true">
            «{quote.text.slice(0, typed)}
            {done ? '»' : <span className="quote__caret" />}
          </span>
        </blockquote>
      </div>

      <figcaption className="quote__by">
        <span className="quote__who">
          {linked ? (
            <span className="quote__track">♪ {linked.track}</span>
          ) : (
            <button
              key={index}
              type="button"
              className="quote__speaker"
              onClick={toggleSpeaker}
              aria-pressed={Boolean(who)}
              title={who ? 'Вернуть цитаты всех персонажей' : `Только цитаты: ${quote.speaker}`}
            >
              {quote.speaker}
            </button>
          )}
        </span>
        <span className="quote__controls">
          <button type="button" className="quote__btn" onClick={() => go(-1)} aria-label="Предыдущая цитата">
            ‹
          </button>
          <span className="quote__count">{counter}</span>
          <button type="button" className="quote__btn" onClick={() => go(1)} aria-label="Следующая цитата">
            ›
          </button>
          {!still && (
            <button
              type="button"
              className="quote__btn quote__btn--pause"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              aria-label={paused ? 'Продолжить смену цитат' : 'Остановить смену цитат'}
            >
              {paused ? '▶' : '❚❚'}
            </button>
          )}
        </span>
      </figcaption>
    </figure>
  )
}
