/** Format an ISO date string → "Jan 12, 2025 · 14:03" */
export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Truncate a string to maxLen characters */
export function truncate(str, maxLen = 120) {
  if (!str) return ''
  return str.length <= maxLen ? str : str.slice(0, maxLen).trimEnd() + '…'
}

/** Build a filename-safe slug from an id and date */
export function reportFilename(id, date) {
  const d      = date ? new Date(date).toISOString().slice(0, 10) : 'report'
  const suffix = (id ?? '').slice(0, 8) || 'unknown'
  return `echotrace-report-${d}-${suffix}.json`
}

/** Trigger a JSON file download in the browser */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
