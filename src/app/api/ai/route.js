// Proxy AI requests to backend API so frontend does not access DB directly

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'https://uacc-dims-backend.onrender.com/api'

async function forward(request) {
  const url = new URL(request.url)
  const forwardPath = url.pathname.replace('/api/ai', '') || '/'
  const target = `${BACKEND_API}/ai${forwardPath}`

  const headers = new Headers()
  for (const [k, v] of request.headers) {
    if (k.toLowerCase() === 'host') continue
    headers.set(k, v)
  }

  const body = await request.arrayBuffer()

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: body.byteLength ? body : undefined,
    redirect: 'follow',
    credentials: 'include',
  })

  const responseHeaders = new Headers(res.headers)
  responseHeaders.delete('connection')
  responseHeaders.delete('keep-alive')
  responseHeaders.delete('transfer-encoding')

  const buf = await res.arrayBuffer()
  return new Response(buf, { status: res.status, headers: responseHeaders })
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const DELETE = forward
export const PATCH = forward
