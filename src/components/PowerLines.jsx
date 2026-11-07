import { currentPath, wirePath } from '../lib/powerGrid'

/**
 * Рисунок линии электропередачи: опоры, провода и ток от активного трека к обложке.
 * Лежит под треками и не ловит курсор. Провода и ток двигает useWireMotion.
 */
export default function PowerLines({ grid, activeIndex, wireEls, currentEls }) {
  const hang = activeIndex === null ? null : grid.hangs[activeIndex]
  const live = hang ? currentPath(grid.wires[hang.wire], hang.t) : null

  return (
    <svg className={`power${live ? ' is-live' : ''}`} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="pylonFog" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={grid.base}>
          <stop className="power__stop" offset="0" />
          <stop className="power__stop" offset="0.62" />
          <stop className="power__stop power__stop--fog" offset="1" />
        </linearGradient>
      </defs>

      {grid.pylons.map((pylon) => (
        <g key={pylon.side} className={`power__pylon power__pylon--${pylon.side}`}>
          <path className="power__frame" d={pylon.frame} stroke="url(#pylonFog)" />
          <path className="power__strings" d={pylon.strings} />
        </g>
      ))}

      <path className="power__earth" d={grid.earthPath} />

      {grid.wires.map((wire, w) => (
        <g key={w} className={`power__line${hang?.wire === w ? ' is-live' : ''}`}>
          <path className="power__feeder" d={wire.feederPath} />
          <path className="power__tail" d={wire.tailPath} />
          <path
            className="power__wire"
            pathLength="1"
            d={wirePath(wire)}
            ref={(el) => {
              wireEls.current[w] = el
            }}
          />
          <circle className="power__terminal" cx={wire.terminal.x} cy={wire.terminal.y} r="2.4" />
        </g>
      ))}

      {live && (
        <g key={activeIndex}>
          {['glow', 'core', 'spark'].map((part, i) => (
            <path
              key={part}
              className={`power__current power__current--${part}`}
              pathLength="1"
              d={live}
              ref={(el) => {
                currentEls.current[i] = el
              }}
            />
          ))}
        </g>
      )}
    </svg>
  )
}
