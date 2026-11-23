import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const API = 'http://localhost:3000/api/v1'
const CHROME = process.env.E2E_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const SHOTS = path.join(ROOT, 'results', 'screenshots', 'live-grievances')
fs.mkdirSync(SHOTS, { recursive: true })

async function getLiveSession() {
  const reqRes = await fetch(`${API}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9876543210', app: 'admin' }),
  })
  if (!reqRes.ok && reqRes.status !== 429) {
    throw new Error(`OTP request failed: ${reqRes.status}`)
  }

  const verifyRes = await fetch(`${API}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile: '9876543210',
      otp: '123456',
      client: { app: 'admin', platform: 'web', device_name: 'PlaywrightLiveRunner' },
    }),
  })
  const verifyData = await verifyRes.json()
  if (!verifyData.data?.access_token) {
    throw new Error(`OTP verify failed: ${JSON.stringify(verifyData)}`)
  }
  return {
    accessToken: verifyData.data.access_token,
    refreshToken: verifyData.data.refresh_token,
    user: verifyData.data.user,
  }
}

async function runLiveTest() {
  console.log('Obtaining live authentication session...')
  const sessionData = await getLiveSession()
  console.log('Session acquired for user:', sessionData.user.name)

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  })

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })

    await context.addInitScript(
      ({ sessionData }) => {
        localStorage.setItem(
          'tz-session',
          JSON.stringify({
            accessToken: sessionData.accessToken,
            refreshToken: sessionData.refreshToken,
          }),
        )
        localStorage.setItem('tz-school-id', '1')
      },
      { sessionData },
    )

    const page = await context.newPage()

    console.log('Navigating to live grievances page...')
    await page.goto(`${BASE}/grievances`, { waitUntil: 'networkidle' })

    await page.waitForSelector('text=Grievances & Complaints')
    console.log('Page header loaded')

    await page.screenshot({ path: path.join(SHOTS, '01-live-page-loaded.png') })

    const ticketCell = page.getByRole('table').getByText('GRV-2026-0001').first()
    await ticketCell.waitFor({ state: 'visible', timeout: 10000 })
    console.log('Found live ticket GRV-2026-0001 in database table!')

    await page.screenshot({ path: path.join(SHOTS, '02-live-table-with-record.png') })

    console.log('Opening grievance dossier drawer...')
    await ticketCell.click()

    await page.waitForSelector('text=Bus 4 morning pickup delayed', { timeout: 10000 })
    console.log('Grievance dossier drawer opened!')

    await page.screenshot({ path: path.join(SHOTS, '03-live-sheet-opened.png') })

    await page.waitForSelector('text=Public Timeline', { timeout: 10000 })
    console.log('Verified database timeline log in slide-over drawer!')

    await page.screenshot({ path: path.join(SHOTS, '04-live-timeline-verified.png') })

    console.log('\nSUCCESS: Full end-to-end integration verified against live API and Postgres!')
  } finally {
    await browser.close()
  }
}

runLiveTest().catch((err) => {
  console.error('LIVE E2E TEST FAILED:', err)
  process.exit(1)
})
