/**
 * Premium RiskCard — displays one analysis metric with score bar and explanation.
 */
export default function RiskCard({ title, score = 0, explanation = '', invert = false, icon = '📊' }) {
  const pct = Math.round((score ?? 0) * 100)
  
  // For risk metrics (invert=true): high % = bad (red). For confidence: high % = good (cyan/emerald).
  const level = invert
    ? (pct >= 65 ? 'critical' : pct >= 35 ? 'moderate' : 'low')
    : (pct >= 65 ? 'high'     : pct >= 35 ? 'moderate' : 'critical')

  const barGradient = level === 'high' || level === 'low'
    ? 'from-cyan-400 to-emerald-400'
    : level === 'moderate'
    ? 'from-amber-400 to-yellow-500'
    : 'from-rose-500 to-red-600'

  const textColor = level === 'high' || level === 'low'
    ? 'text-cyan-400'
    : level === 'moderate'
    ? 'text-amber-400'
    : 'text-rose-400'

  const badgeBg = level === 'high' || level === 'low'
    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
    : level === 'moderate'
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between gap-4 border border-white/10 group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 border border-white/10 text-lg shadow-inner group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <span className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">{title}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold tabular-nums ${badgeBg}`}>
            {pct}%
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div className="relative h-2 w-full rounded-full bg-slate-800/90 overflow-hidden p-[1px] border border-white/5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-out shadow-sm`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {explanation && (
        <p className="text-xs text-slate-400 leading-relaxed font-normal pt-1 border-t border-white/5">
          {explanation}
        </p>
      )}
    </div>
  )
}
