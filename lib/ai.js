const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed')
  }
  return data
}

async function authFetch(path, accessToken, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  })
  return parseJsonResponse(res)
}

function normalizeAiText(data) {
  return data?.data?.response?.text || data?.data?.response?.message || data?.message || ''
}

export async function searchKnowledgeBase({ query, accessToken, context = {} }) {
  if (!accessToken) {
    throw new Error('Missing access token')
  }

  const briefingPrompt = [
    'You are preparing a concise executive morning briefing for the General Manager.',
    'Summarize today\'s pending items, schedule, and flagged documents in natural language.',
    'Keep the response short, clear, and actionable.',
    `User query: ${query}`,
    context ? `Context: ${JSON.stringify(context, null, 2)}` : '',
  ].filter(Boolean).join('\n\n')

  const data = await authFetch('/ai', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      messages: [
        { role: 'system', text: 'You are a concise executive briefing assistant.' },
        { role: 'user', text: briefingPrompt },
      ],
    }),
  })

  return normalizeAiText(data)
}

export async function askClaude(prompt) {
  return {
    reply: `Stub response for: ${prompt}`,
  }
}

export default askClaude// Simple Claude API helper stub
// Implement actual API calls and add credentials to .env.local

export async function askClaude(prompt) {
  // TODO: integrate Claude or desired LLM API
  return {
    reply: `Stub response for: ${prompt}`,
  };
}

export default askClaude;
