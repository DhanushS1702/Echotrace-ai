import { trustLevel } from '../utils/trustLevel'

/** Pill badge showing trust level with matching colour. */
export default function TrustBadge({ score }) {
  const tl = trustLevel(score ?? 0)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tl.color} ${tl.bg} ${tl.border}`}>
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: tl.hex }} />
      {tl.label}
    </span>
  )
}
