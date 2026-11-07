import { useCallback, useEffect, useRef, useState } from 'react'
import Background from './components/Background'
import BookPanel from './components/BookPanel'
import Dosimeter from './components/Dosimeter'
import MusicField from './components/MusicField'
import { books } from './data/posterData'
import { useBookHash } from './hooks/useBookHash'
import { useSwipe } from './hooks/useSwipe'

/**
 * Каркас постера: активная книга, открытый трек и раскладка слоёв.
 * Вся логика переключения — здесь.
 */
export default function App() {
  const [activeIndex, setActiveIndex] = useBookHash(books)
  const [activeTrack, setActiveTrack] = useState(null)
  const bookRef = useRef(null)
  const book = books[activeIndex]

  const goTo = useCallback(
    (index) => {
      setActiveTrack(null)
      setActiveIndex((index + books.length) % books.length)
    },
    [setActiveIndex]
  )

  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex])
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex])

  useSwipe(bookRef, next, prev)

  // Переключение книг стрелками клавиатуры.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prev()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  return (
    <div className="poster" style={{ '--accent': book.accent }}>
      <Background />

      <main className="stage">
        <section className="stage__book" ref={bookRef}>
          <BookPanel
            book={book}
            index={activeIndex}
            total={books.length}
            linkedQuote={activeTrack?.quote ? { text: activeTrack.quote, track: activeTrack.title } : null}
            onPrev={prev}
            onNext={next}
          />
        </section>

        <MusicField key={book.id} book={book} onActiveChange={setActiveTrack} />
      </main>

      <footer className="hint">
        <span className="hint__mouse">
          <span className="hint__keys">← →</span> переключение книг
          <span className="hint__sep" aria-hidden="true">
            ·
          </span>
          наведите на трек, чтобы услышать отрывок
        </span>
        <span className="hint__touch">листайте обложку · нажмите на трек, чтобы услышать отрывок</span>
      </footer>

      <Dosimeter muted={activeTrack !== null} />
    </div>
  )
}
