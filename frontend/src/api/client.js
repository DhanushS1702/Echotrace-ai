import axios from 'axios'

const _baseURL = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({
  baseURL: _baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error'
    return Promise.reject(new Error(msg))
  },
)

/** POST /analyze — run full trust analysis */
export const analyzeText = (prompt, response) =>
  api.post('/analyze', { prompt, response }).then((r) => r.data)

/** GET /history — paginated list of past analyses */
export const getHistory = (page = 1, limit = 20) =>
  api.get('/history', { params: { page, limit } }).then((r) => r.data)

/** GET /report/:id — full report for one analysis */
export const getReport = (id) =>
  api.get(`/report/${id}`).then((r) => r.data)

/** DELETE /history/:id — remove a record */
export const deleteAnalysis = (id) =>
  api.delete(`/history/${id}`)

/**
 * GET /report/:id/pdf — download a styled PDF report.
 * Fetches the binary PDF blob and triggers a browser file download.
 */
export async function downloadPDF(id, filename) {
  const response = await api.get(`/report/${id}/pdf`, {
    responseType: 'blob',
    timeout: 60000,
  })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a   = Object.assign(document.createElement('a'), {
    href:     url,
    download: filename ?? `echotrace-report-${id.slice(0, 8)}.pdf`,
  })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default api
