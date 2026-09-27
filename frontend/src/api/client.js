import axios from 'axios'

const _baseURL = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({
  baseURL: _baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request Interceptor with detailed logging
api.interceptors.request.use((config) => {
  console.log(`[API Request Outgoing] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || config.params || {})
  return config
})

// Response Interceptor with detailed logging and error reporting
api.interceptors.response.use(
  (res) => {
    console.log(`[API Response Received] ${res.status} ${res.config.url}`, res.data)
    return res
  },
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown API Connection Error'
    console.error(`[API Failure Error] ${err.config?.url || ''}`, {
      status: err.response?.status,
      statusText: err.response?.statusText,
      detail: msg,
      rawError: err
    })
    return Promise.reject(new Error(msg))
  },
)

/** POST /live-analysis — New EchoTrace Real-Time Workflow Endpoint */
export const postLiveAnalysis = (content) =>
  api.post('/live-analysis', { content }).then((r) => r.data)

/**
 * POST /live-analysis/stream — Real-Time Streaming SSE Endpoint for Live Analysis.
 */
export async function streamLiveAnalysis({
  content,
  onToken,
  onStatus,
  onComplete,
  onError,
}) {
  const url = `${_baseURL}/live-analysis/stream`
  console.log(`[Live Analysis SSE Stream Outgoing] POST ${url}`, { content })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data: ')) {
          try {
            const dataStr = trimmed.replace('data: ', '')
            const parsed = JSON.parse(dataStr)

            if (parsed.type === 'status' && onStatus) {
              onStatus(parsed.message)
            } else if (parsed.type === 'token' && onToken) {
              onToken(parsed.token)
            } else if (parsed.type === 'complete' && onComplete) {
              console.log('[Live Analysis SSE Stream Complete]', parsed.result)
              onComplete(parsed.result)
            }
          } catch (jsonErr) {
            console.warn('[SSE Parse Notice]', jsonErr, trimmed)
          }
        }
      }
    }
  } catch (err) {
    console.error('[Live Analysis SSE Stream Error]', err)
    if (onError) onError(err.message || 'Stream connection failed')
  }
}

/** POST /analyze — run full trust analysis */
export const analyzeText = (prompt, response) =>
  api.post('/analyze', { prompt, response }).then((r) => r.data)

/** POST /llm/generate-and-analyze — run full end-to-end LLM -> EchoTrace Pipeline */
export const generateAndAnalyze = (question, model = 'groq-ai', apiKey = '') =>
  api.post('/llm/generate-and-analyze', { question, model, api_key: apiKey }).then((r) => r.data)


/**
 * POST /llm/stream — Real-time Server-Sent Events (SSE) Token Streaming Pipeline.
 * Streams LLM output tokens progressively into UI and completes with Trust Dashboard.
 */
export async function streamGenerateAndAnalyze({
  question,
  model = 'ibm-granite',
  apiKey = '',
  onToken,
  onStatus,
  onComplete,
  onError,
}) {
  const url = `${_baseURL}/llm/stream`
  console.log(`[SSE Stream Outgoing] POST ${url}`, { question, model })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, model, api_key: apiKey }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || '' // keep unfinished part in buffer

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data: ')) {
          try {
            const dataStr = trimmed.replace('data: ', '')
            const parsed = JSON.parse(dataStr)

            if (parsed.type === 'status' && onStatus) {
              onStatus(parsed.message)
            } else if (parsed.type === 'token' && onToken) {
              onToken(parsed.token)
            } else if (parsed.type === 'complete' && onComplete) {
              console.log('[SSE Stream Complete Payload]', parsed.result)
              onComplete(parsed.result)
            }
          } catch (jsonErr) {
            console.warn('[SSE Parse Notice]', jsonErr, trimmed)
          }
        }
      }
    }
  } catch (err) {
    console.error('[SSE Stream Error]', err)
    if (onError) onError(err.message || 'Stream connection failed')
  }
}

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
