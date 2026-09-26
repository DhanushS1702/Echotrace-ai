import { useMemo } from 'react'
import { trustLevel } from '../utils/trustLevel'

/**
 * Premium SVG arc-based gauge that renders a 0–100 trust score.
 * size: pixel diameter (default 200)
 */
export default function ScoreGauge({ score = 0, size = 200 }) {
  const tl = trustLevel(score)

  const { cx, cy, trackPath, fillPath, stroke, filterId } = useMemo(() => {
    const _cx      = size / 2
    const _cy      = size / 2
    const R        = (size / 2) - 18
    const _stroke  = size * 0.085
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
    const fillDeg = startDeg + (sweep * Math.min(Math.max(score, 0), 100)) / 100

    return {
      cx: _cx,
      cy: _cy,
      stroke: _stroke,
      trackPath: arcPath(startDeg, endDeg),
      fillPath: score > 0 ? arcPath(startDeg, Math.min(fillDeg, endDeg - 0.01)) : null,
      filterId: `glow-${Math.random().toString(36).substr(2, 9)}`,
    }
  }, [score, size])

  return (
    <div className="flex flex-col items-center gap-2 select-none group">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`grad-${filterId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tl.hex} stopOpacity="1" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.8" />
            </linearGradient>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Active Arc Fill */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={`url(#grad-${filterId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              filter={`url(#${filterId})`}
              className="transition-all duration-1000 ease-out"
            />
          )}

          {/* Center Score Text */}
          <text
            x={cx} y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.26}
            fontWeight="900"
            fill="#FFFFFF"
            className="tracking-tighter font-display"
          >
            {score}
          </text>

          {/* / 100 Subtitle */}
          <text
            x={cx} y={cy + size * 0.16}
            textAnchor="middle"
            fontSize={size * 0.08}
            fontWeight="600"
            fill="#64748B"
            className="uppercase tracking-wider"
          >
            / 100 TRUST
          </text>
        </svg>
      </div>

      <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
        score >= 75
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : score >= 50
          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          : score >= 25
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}>
        {tl.label} LEVEL
      </span>
    </div>
  )
}
