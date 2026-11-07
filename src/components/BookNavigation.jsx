/**
 * Стрелки переключения книг.
 * Компонент рассчитан на абсолютное позиционирование внутри рамки обложки
 * (.book__frame): одна стрелка слева от обложки, вторая — справа.
 * Это настоящие <button>, поэтому работают и мышь, и Enter/Space.
 */
export default function BookNavigation({ onPrev, onNext, labels }) {
  return (
    <>
      <button
        type="button"
        className="booknav__arrow booknav__arrow--prev"
        onClick={onPrev}
        aria-label={labels?.prev ?? 'Предыдущая книга'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M15 4 7 12l8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        className="booknav__arrow booknav__arrow--next"
        onClick={onNext}
        aria-label={labels?.next ?? 'Следующая книга'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M9 4l8 8-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  )
}
