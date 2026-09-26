/** Map a 0–100 trust score to label, Tailwind colour classes, and hex. */
export function trustLevel(score) {
  if (score >= 75) return { label: 'HIGH',     color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', hex: '#34d399', ring: '#34d399' }
  if (score >= 50) return { label: 'MODERATE', color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30',  hex: '#facc15', ring: '#facc15' }
  if (score >= 25) return { label: 'LOW',       color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  hex: '#fb923c', ring: '#fb923c' }
  return             { label: 'CRITICAL',   color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     hex: '#ef4444', ring: '#ef4444' }
}

/** Map hallucination_risk string → colour classes */
export function hallucinationColor(risk) {
  if (risk === 'LOW')    return 'text-emerald-400'
  if (risk === 'MEDIUM') return 'text-yellow-400'
  return 'text-red-500'
}

/** Convert 0–1 float score → 0–100 integer percentage string */
export function pct(score) {
  return `${Math.round((score ?? 0) * 100)}%`
}
