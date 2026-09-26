import { trustLevel } from '../utils/trustLevel'

/** Pill badge showing trust level with matching colour and glowing indicator dot. */
export default function TrustBadge({ score }) {
  const tl = trustLevel(score ?? 0)
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${tl.color} ${tl.bg} ${tl.border}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: tl.hex }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: tl.hex }} />
      </span>
      {tl.label}
    </span>
  )
}
