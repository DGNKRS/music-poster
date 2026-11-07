/**
 * Геометрия линии электропередачи: две опоры, провода между ними и точки подвеса треков.
 * Только расчёты, без DOM: на вход размеры поля и обложки, на выход координаты в системе поля.
 */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/** Дальняя опора меньше ближней: так линия уходит вглубь, как на фоновой картине. */
const FAR = 0.82
/** На сколько сходятся провода у дальней опоры и насколько она ниже ближней. */
const CONVERGE = 0.9
const DROP = 0.22
const MIN_STEP = 112
const SAMPLES = 48
const PLATE_HEIGHT = 58

/** Точка провода по параметру t (0 у ближней опоры, 1 у дальней). Провисание — парабола. */
export function wirePoint(wire, t, offset = 0) {
  return {
    x: wire.a.x + (wire.b.x - wire.a.x) * t,
    y: wire.a.y + (wire.b.y - wire.a.y) * t + 4 * wire.sag * t * (1 - t) + offset,
  }
}

const round = (value) => value.toFixed(1)

function polyline(points) {
  return points.map((p, i) => `${i ? 'L' : 'M'}${round(p.x)} ${round(p.y)}`).join('')
}

/** Путь провода. displace(t) — смещение от ветра и щипка (см. useWireMotion). */
export function wirePath(wire, displace = () => 0) {
  const points = []
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES
    points.push(wirePoint(wire, t, displace(t)))
  }
  return polyline(points)
}

/** Путь тока: от подвеса трека назад по проводу, через траверсу опоры к обложке книги. */
export function currentPath(wire, t, displace = () => 0) {
  const points = []
  const steps = Math.max(2, Math.ceil(SAMPLES * t))
  for (let i = steps; i >= 0; i -= 1) {
    const at = (t * i) / steps
    points.push(wirePoint(wire, at, displace(at)))
  }
  return polyline([...points, ...wire.feeder])
}

/** Кривая Безье второго порядка, разбитая на точки: путь тока собирается из отрезков. */
function sampleQuad(from, control, to, count = 16) {
  const points = []
  for (let i = 1; i <= count; i += 1) {
    const t = i / count
    const u = 1 - t
    points.push({
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    })
  }
  return points
}

/** Решётчатая опора: два пояса, раскосы, траверсы и гирлянды изоляторов. */
function buildPylon({ x, arms, unit, base, side }) {
  const peak = arms[0].y - 30 * unit
  const span = base - peak
  const halfWidth = (y) => 2.5 * unit + (31 * unit * (y - peak)) / span
  const frame = []
  const line = (x0, y0, x1, y1) => frame.push(`M${round(x0)} ${round(y0)}L${round(x1)} ${round(y1)}`)

  line(x, peak, x - halfWidth(base), base)
  line(x, peak, x + halfWidth(base), base)

  // Раскосы редеют книзу: ячейки растут вместе с шириной опоры.
  let y = peak + 14 * unit
  let step = 12 * unit
  while (y < base) {
    const next = y + step
    const [l0, r0] = [x - halfWidth(y), x + halfWidth(y)]
    const [l1, r1] = [x - halfWidth(next), x + halfWidth(next)]
    line(l0, y, r0, y)
    line(l0, y, r1, next)
    line(r0, y, l1, next)
    y = next
    step *= 1.09
  }

  const strings = []
  arms.forEach(({ y: armY, length, string }) => {
    const rise = 11 * unit
    ;[-1, 1].forEach((dir) => {
      const tip = x + dir * length
      const body = x + dir * halfWidth(armY)
      const bodyTop = x + dir * halfWidth(armY - rise)
      line(body, armY, tip, armY)
      line(bodyTop, armY - rise, tip, armY)
      const panels = 3
      for (let i = 0; i < panels; i += 1) {
        const f = (i + 0.5) / panels
        const lowX = body + ((tip - body) * i) / panels
        const nextX = body + ((tip - body) * (i + 1)) / panels
        const topX = bodyTop + (tip - bodyTop) * f
        const topY = armY - rise * (1 - f)
        line(lowX, armY, topX, topY)
        line(topX, topY, nextX, armY)
      }
      strings.push(`M${round(tip)} ${round(armY)}V${round(armY + string)}`)
    })
  })

  return { frame: frame.join(''), strings: strings.join(''), peak: { x, y: peak }, side }
}

/**
 * Минимальная высота поля. Ниже неё страница начнёт прокручиваться,
 * иначе обложки станут меньше 52 пикселей.
 */
function minFieldHeight(rows) {
  return (rows - 1) * 155 + 205
}

export function buildGrid({ width, height, count, anchor }) {
  const unit = clamp(height / 760, 0.78, 1.3)
  const stringNear = 13 * unit
  const nearX = 38 * unit
  const farX = width - 24

  const usable = farX - nearX - 66 * unit
  const rows = Math.max(3, Math.ceil(count / Math.max(2, Math.floor(usable / MIN_STEP))))

  const armLength = (i) => (26 + 14 * Math.sin((Math.PI * (i + 0.5)) / rows)) * unit
  const sag = clamp(usable * 0.055, 18, 54)
  const hanger = 22 * unit
  const top = 40 * unit

  // Шаг рядов подобран так, чтобы нижний ряд с бирками уместился в поле.
  const pitch = (height - top - stringNear - sag - 2) / ((rows - 1) * 1.01 + CONVERGE)

  const wires = Array.from({ length: rows }, (_, i) => {
    const length = armLength(i)
    const nearY = top + i * pitch
    const farY = top + DROP * pitch + i * pitch * CONVERGE
    return {
      a: { x: nearX + length, y: nearY + stringNear },
      b: { x: farX - length * FAR, y: farY + stringNear * FAR },
      sag,
      near: { y: nearY, length, string: stringNear },
      far: { y: farY, length: length * FAR, string: stringNear * FAR },
    }
  })

  wires.forEach((wire, i) => {
    // По другую сторону ближней опоры провода сходятся к обложке книги.
    const tip = { x: nearX - wire.near.length, y: wire.a.y }
    const terminal = { x: anchor.x, y: anchor.y + anchor.height * (0.08 + (0.28 * i) / Math.max(rows - 1, 1)) }
    const control = { x: (tip.x + terminal.x) / 2, y: Math.max(tip.y, terminal.y) + 22 * unit }
    wire.terminal = terminal
    wire.feeder = [tip, ...sampleQuad(tip, control, terminal)]
    wire.feederPath = polyline(wire.feeder)

    // За дальней опорой линия уходит за край экрана.
    const tailX = wire.b.x + 2 * wire.far.length
    wire.tailPath = `M${round(tailX)} ${round(wire.b.y)}Q${round(tailX + 160)} ${round(wire.b.y + 34)} ${round(
      tailX + 320
    )} ${round(wire.b.y + 16)}`
  })

  const perWire = Math.ceil(count / rows)
  const span = wires[0].b.x - wires[0].a.x
  const step = span / (perWire + 0.5)

  const tagLimit = pitch * CONVERGE - 8
  const cover = clamp(Math.min(step - 12, tagLimit - hanger - PLATE_HEIGHT, 190 * unit), 44, 200)
  const tagWidth = Math.max(cover, Math.min(step - 10, 104))

  const hangs = []
  wires.forEach((wire, w) => {
    const inRow = Math.floor(count / rows) + (w < count % rows ? 1 : 0)
    // Ряды сдвинуты друг относительно друга на четверть шага, чтобы не складываться в таблицу.
    const stagger = (w % 2 ? 1 : -1) * (step / 4)
    const start = (span - (inRow - 1) * step) / 2 + stagger
    for (let j = 0; j < inRow; j += 1) {
      const t = (start + j * step) / span
      const point = wirePoint(wire, t)
      hangs.push({ wire: w, t, x: point.x, y: point.y })
    }
  })

  const base = height + 60
  const near = buildPylon({ x: nearX, unit, base, side: 'near', arms: wires.map((wire) => wire.near) })
  const far = buildPylon({ x: farX, unit: unit * FAR, base, side: 'far', arms: wires.map((wire) => wire.far) })

  const earthPath = `M${round(near.peak.x)} ${round(near.peak.y)}Q${round((near.peak.x + far.peak.x) / 2)} ${round(
    (near.peak.y + far.peak.y) / 2 + 1.6 * sag
  )} ${round(far.peak.x)} ${round(far.peak.y)}`

  return {
    wires,
    hangs,
    pylons: [near, far],
    earthPath,
    base,
    tag: { width: tagWidth, cover, hanger },
    minHeight: minFieldHeight(rows),
  }
}
