import BookNavigation from './BookNavigation'
import QuoteRotator from './QuoteRotator'

/**
 * Левая часть постера: обложка, стрелки по бокам, под обложкой — название,
 * подпись, сменяющиеся цитаты персонажей и счётчик книг.
 *
 * data-connector="anchor" — обложка, к которой подходят провода линии (usePowerGrid).
 */
export default function BookPanel({ book, index, total, linkedQuote, onPrev, onNext }) {
  return (
    <article className="book" key={book.id}>
      <div className="book__frame">
        <BookNavigation onPrev={onPrev} onNext={onNext} />

        <div className="book__coverWrap" data-connector="anchor">
          <img className="book__cover" src={book.cover} alt={`Обложка книги «${book.title}»`} />
          <span className="book__sheen" aria-hidden="true" />
        </div>
      </div>

      <div className="book__text">
        <p className="book__kicker">
          Литературно-музыкальный постер
          <span className="book__counter">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </p>

        <h1 className="book__title">{book.title}</h1>
        <p className="book__meta">{book.meta}</p>

        <QuoteRotator quotes={book.quotes} trackQuotes={book.tracks.map((item) => item.quote).filter(Boolean)} link={linkedQuote} />
      </div>
    </article>
  )
}
