import { backgroundImage } from '../data/posterData'
import { useParallax } from '../hooks/useParallax'

/**
 * Фоновый слой: изображение на весь экран + параллакс от курсора + затемнение.
 * Слой фиксированный и лежит под всей композицией, верстку не двигает.
 */
export default function Background() {
  const { x, y } = useParallax()

  return (
    <div className="bg" aria-hidden="true">
      <img
        className="bg__image"
        src={backgroundImage}
        alt=""
        style={{ transform: `translate3d(${(-x * 16).toFixed(2)}px, ${(-y * 12).toFixed(2)}px, 0) scale(1.08)` }}
      />
      <div className="bg__veil" />
      <div className="bg__glow" style={{ '--gx': `${(x * 6).toFixed(2)}%`, '--gy': `${(y * 6).toFixed(2)}%` }} />
    </div>
  )
}
