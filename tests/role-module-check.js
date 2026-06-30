(async () => {
  const fetch = globalThis.fetch
  const base = process.argv[2] || 'http://localhost:3000'
  const email = process.argv[3]
  const password = process.argv[4] || 'dims2026'

  if (!email) {
    console.error('Usage: node role-module-check.js <base> <email> [password]')
    process.exit(2)
  }

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

  console.log('Requesting CSRF token')
  const csrfRes = await fetch(`${base}/api/auth/csrf`)
  const setCookieHeader = csrfRes.headers.get('set-cookie') || ''
  const cookies = setCookieHeader
    .split(',')
    .map(s => s.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')

  const csrfJson = await csrfRes.json().catch(() => null)
  const csrfToken = csrfJson?.csrfToken || csrfJson?.csrf_token || null
  if (!csrfToken) {
    console.error('Could not read csrfToken from response')
    process.exit(3)
  }

  console.log('Signing in as', email)
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
  const combinedCookies = [cookies, postSetCookie]
    .filter(Boolean)
    .map(s => s.split(',').map(p => p.split(';')[0].trim()).join('; '))
    .join('; ')

  console.log('Session cookies set; checking session...')
  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: combinedCookies }
  }).catch(e => null)
  const sessionJson = sessionRes ? await sessionRes.json().catch(() => null) : null
  console.log('Session:', sessionJson)
  if (!sessionJson || !sessionJson.user) {
    console.error('Sign-in failed for', email)
    process.exit(4)
  }

  const pages = [
    { path: '/dashboard', expect: 'Good morning' },
    { path: '/dashboard/user-management', expect: 'User Management' },
    { path: '/dashboard/documents', expect: 'Documents' },
    { path: '/dashboard/procurement', expect: 'Procurement' },
    { path: '/dashboard/activity-logs', expect: 'Activity Logs' },
    { path: '/dashboard/records', expect: 'Records' },
    { path: '/dashboard/reports', expect: 'Reports' },
    { path: '/dashboard/settings', expect: 'Settings' },
    { path: '/dashboard/audit-trail', expect: 'Audit Trail' },
    { path: '/dashboard/ai-agent', expect: 'Assistant' },
  ]

  for (const p of pages) {
    try {
      const r = await fetch(base + p.path, { headers: { Cookie: combinedCookies } })
      const text = await r.text().catch(() => '')
      const ok = r.ok
      const has = text.includes(p.expect)
      console.log(`${p.path}: status=${r.status} ok=${ok} containsExpect=${has}`)
    } catch (e) {
      console.error(`${p.path}: error`, e.message)
    }
  }

  process.exit(0)

})()
