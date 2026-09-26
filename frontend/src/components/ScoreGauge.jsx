import { useMemo } from 'react'
import { trustLevel } from '../utils/trustLevel'

/**
 * SVG arc-based gauge that renders a 0–100 trust score.
 * size: pixel diameter (default 200)
 */
export default function ScoreGauge({ score = 0, size = 200 }) {
  const tl = trustLevel(score)

  // P5: memoize all SVG geometry — only recompute when score or size changes
  const { cx, cy, trackPath, fillPath, stroke } = useMemo(() => {
    const _cx      = size / 2
    const _cy      = size / 2
    const R        = (size / 2) - 16
    const _stroke  = size * 0.09
    const startDeg = -210
    const sweep    = 240

    const toRad = (d) => (d * Math.PI) / 180
    const pt    = (deg) => ({
      x: _cx + R * Math.cos(toRad(deg)),
      y: _cy + R * Math.sin(toRad(deg)),
    })
    const arcPath = (from, to) => {
      const p1    = pt(from)
      const p2    = pt(to)
      const large = Math.abs(to - from) > 180 ? 1 : 0
      return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`
    }

    const endDeg  = startDeg + sweep
    const fillDeg = startDeg + (sweep * score) / 100

    return {
      cx: _cx,
      cy: _cy,
      stroke: _stroke,
      trackPath: arcPath(startDeg, endDeg),
      fillPath: score > 0 ? arcPath(startDeg, Math.min(fillDeg, endDeg - 0.01)) : null,
    }
  }, [score, size])

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={tl.hex}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${tl.hex}88)` }}
          />
        )}
        {/* Score text */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={tl.hex}
        >
          {score}
        </text>
        {/* /100 label */}
        <text
          x={cx} y={cy + size * 0.14}
          textAnchor="middle"
          fontSize={size * 0.09}
          fill="#64748b"
        >
          / 100
        </text>
      </svg>
      <span className={`text-sm font-semibold tracking-widest uppercase ${tl.color}`}>
        {tl.label}
      </span>
    </div>
  )
}
