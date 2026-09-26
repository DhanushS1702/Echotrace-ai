/**
 * RiskCard — displays one analysis metric with score bar and explanation.
 *
 * Props:
 *   title        string
 *   score        number  0–1 (rendered as 0–100 %)
 *   explanation  string
 *   invert       bool    if true, high score = bad (red); default false
 *   icon         string  emoji / character
 */
export default function RiskCard({ title, score = 0, explanation = '', invert = false, icon = '📊' }) {
  const pct    = Math.round((score ?? 0) * 100)
  // For risk metrics (invert=true): high % = red. For confidence: high % = green.
  const level  = invert
    ? (pct >= 65 ? 'high' : pct >= 35 ? 'medium' : 'low')
    : (pct >= 65 ? 'low'  : pct >= 35 ? 'medium' : 'high')

  const barColor = level === 'high'   ? 'bg-emerald-400'
                 : level === 'medium' ? 'bg-yellow-400'
                 :                      'bg-red-500'

  const textColor = level === 'high'   ? 'text-emerald-400'
                  : level === 'medium' ? 'text-yellow-400'
                  :                      'text-red-400'

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 flex flex-col gap-3 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>{pct}%</span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {explanation && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{explanation}</p>
      )}
    </div>
  )
}
