(async () => {
  const fetch = globalThis.fetch
  const base = process.argv[2] || 'http://localhost:3000'
  const email = process.argv[3] || 'it@uacc.go.ug'
  const password = process.argv[4] || 'dims2026'

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

  async function waitForServer(retries = 15) {
    for (let i = 0; i < retries; i++) {
      try {
        const r = await fetch(base)
        if (r.ok) return true
      } catch (e) {}
      await sleep(1000)
    }
    return false
  }

  const ready = await waitForServer(20)
  if (!ready) {
    console.error('Frontend not responding at', base)
    process.exit(2)
  }

  console.log('Frontend responsive — requesting CSRF token')
  const csrfRes = await fetch(`${base}/api/auth/csrf`)
  const setCookieHeader = csrfRes.headers.get('set-cookie') || ''
  const cookies = setCookieHeader
    .split(',')
    .map(s => s.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')

  const csrfJson = await csrfRes.json().catch(() => null)
  console.log('CSRF response body:', csrfJson)
  console.log('Set-Cookie header:', setCookieHeader)
  console.log('Cookie header to send:', cookies)

  const csrfToken = csrfJson?.csrfToken || csrfJson?.csrf_token || null
  if (!csrfToken) {
    console.error('Could not read csrfToken from response')
    process.exit(3)
  }

  console.log('Posting credentials to callback/credentials (json=true)')
  const body = new URLSearchParams({
    csrfToken,
    callbackUrl: base,
    json: 'true',
    email,
    password,
  })

  const postRes = await fetch(`${base}/api/auth/callback/credentials?json=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
    },
    body: body.toString(),
    redirect: 'manual',
  })

  const postSetCookie = postRes.headers.get('set-cookie') || ''
  const postBody = await postRes.text()
  console.log('Credentials POST status:', postRes.status)
  try { console.log('Credentials POST JSON:', JSON.parse(postBody)) } catch (e) { console.log('Credentials POST text:', postBody) }
  console.log('Credentials POST set-cookie:', postSetCookie)

  // Use combined cookies (csrf cookie + any new cookies)
  const combinedCookies = [cookies, postSetCookie]
    .filter(Boolean)
    .map(s => s.split(',').map(p => p.split(';')[0].trim()).join('; '))
    .join('; ')

  console.log('Combined cookies for session check:', combinedCookies)

  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: combinedCookies }
  }).catch(e => null)

  const sessionJson = sessionRes ? await sessionRes.json().catch(() => null) : null
  console.log('Session response status:', sessionRes ? sessionRes.status : 'no-response')
  console.log('Session JSON:', sessionJson)

  if (sessionJson && sessionJson.user) {
    console.log('Simulated sign-in succeeded: session user:', sessionJson.user)
    process.exit(0)
  } else {
    console.error('Simulated sign-in failed; session not established')
    process.exit(4)
  }
})()
