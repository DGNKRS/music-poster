/**
 * Трек на линии: гирлянда изоляторов, обложка и бирка с подписью.
 * Сам элемент неподвижен, качается только .track__swing, поэтому зона наведения не дрожит.
 * Наведение открывает окошко с отрывком, клик или тап закрепляет его.
 */
export default function TrackCard({ track, index, hang, swingRef, active, onHoverStart, onHoverEnd, onPick }) {
  const isMouse = (event) => event.pointerType === 'mouse'
  const place = hang ? { '--x': `${hang.x.toFixed(1)}px`, '--y': `${hang.y.toFixed(1)}px` } : null

  return (
    <li
      className={`track${active ? ' is-active' : ''}`}
      style={{ ...place, '--i': index }}
      onPointerEnter={(event) => isMouse(event) && onHoverStart(event.currentTarget)}
      onPointerLeave={(event) => isMouse(event) && onHoverEnd()}
    >
      <div className="track__swing" ref={swingRef}>
        <svg className="track__string" viewBox="0 0 12 24" aria-hidden="true">
          <path d="M6 0V24" />
          <ellipse cx="6" cy="6" rx="5" ry="1.7" />
          <ellipse cx="6" cy="11" rx="5" ry="1.7" />
          <ellipse cx="6" cy="16" rx="5" ry="1.7" />
        </svg>

        <div className="track__art">
          <img src={track.cover} alt="" loading="lazy" />
          <span className="track__index">{String(index + 1).padStart(2, '0')}</span>
          {track.quote && (
            <span className="track__mark" title="К треку привязана цитата">
              «»
            </span>
          )}
        </div>

        <div className="track__body">
          <h3 className="track__title">{track.title}</h3>
          <p className="track__artist">{track.artist}</p>
        </div>
      </div>

      <button
        type="button"
        className="track__hit"
        aria-label={`Отрывок: ${track.artist} — ${track.title}${track.quote ? ', с цитатой' : ''}`}
        aria-expanded={active}
        onClick={(event) => onPick(event.currentTarget.closest('.track'))}
      />
    </li>
  )
}
