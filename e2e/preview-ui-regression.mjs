import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const CHROME = process.env.E2E_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const DAY = process.env.E2E_DAY ?? 'Day 8'
const API = process.env.E2E_API_URL ?? `${BASE}/api/v1`
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results')
const SHOTS = path.join(OUT, 'screenshots', 'previews')
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: process.env.E2E_HEADED !== '1',
})

async function signIn(mobile, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport })
  const tab = await context.newPage()
  await tab.goto(`${BASE}/login`)
  await tab.getByLabel(/mobile/i).fill(mobile)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await tab.getByRole('button', { name: /continue with otp/i }).click()
    const ok = await tab
      .getByText('Enter the code')
      .waitFor({ timeout: 8000 })
      .then(
        () => true,
        () => false
      )
    if (ok) break
    await tab.waitForTimeout(32000)
  }
  await tab.keyboard.type('123456')
  await tab.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
  return { context, page: tab }
}

let page
async function test(id, type, title, steps, expected, fn) {
  const started = Date.now()
  const row = {
    day: DAY,
    id,
    module: 'App previews',
    type,
    title,
    steps,
    expected,
    status: 'Pass',
    actual: expected,
    screenshot: '',
    ms: 0,
  }
  try {
    await fn()
  } catch (error) {
    row.status = 'Fail'
    row.actual = String(error?.message ?? error)
      .split('\n')[0]
      .slice(0, 300)
  }
  row.screenshot = `${id}.png`
  await page.screenshot({ path: path.join(SHOTS, row.screenshot) }).catch(() => null)
  row.ms = Date.now() - started
  results.push(row)
  console.log(
    `${row.status === 'Pass' ? 'PASS' : 'FAIL'}  ${id.padEnd(6)} ${title}${row.status === 'Fail' ? `\n        ${row.actual}` : ''}`
  )
}
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const phone = () => page.locator('nav[aria-label$="app tabs"]').locator('..')
const phoneTab = (name) =>
  page.locator('nav[aria-label$="app tabs"]').getByRole('button', { name, exact: true })
const phoneTitle = () => page.locator('header span.font-extrabold').first()
const go = async (url) => {
  await page.goto(`${BASE}${url}`)
  await page.waitForLoadState('networkidle').catch(() => null)
}
const token = async () =>
  page.evaluate(() => {
    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i += 1) {
        const value = store.getItem(store.key(i)) ?? ''
        const match = value.match(/"access_?[tT]oken"\s*:\s*"([^"]+)"/)
        if (match) return match[1]
      }
    }
    return null
  })
async function api(url) {
  const auth = await token()
  const res = await fetch(`${API}${url}`, {
    headers: auth ? { authorization: `Bearer ${auth}` } : {},
  })
  return (await res.json()).data
}

const admin = await signIn('9876543210')
page = admin.page

const teachers = await api('/admin/staff?limit=50&staff_type=teaching&status=active')
const teacher =
  teachers?.items?.find((item) => item.mobile === '9000000004') ?? teachers?.items?.[0]
const children = await api('/admin/students?limit=1&status=active')
let studentId = children?.items?.[0]?.id
const parentChild = await api('/admin/guardians?limit=1&search=9000000005')
studentId = parentChild?.items?.[0]?.children?.[0]?.id ?? studentId

await test(
  'AP-01',
  'View',
  'Sidebar has an App previews group with Parent app and Teacher app',
  'Open the dashboard and look at the sidebar.',
  'Group "App previews" with both links',
  async () => {
    await go('/')
    const side = page.locator('aside, [data-sidebar]').first()
    await side.getByText('App previews', { exact: true }).waitFor({ timeout: 8000 })
    await side
      .getByRole('link', { name: /^Parent app/ })
      .first()
      .waitFor({ timeout: 5000 })
    await side
      .getByRole('link', { name: /^Teacher app/ })
      .first()
      .waitFor({ timeout: 5000 })
  }
)

await test(
  'AP-02',
  'Navigation',
  'Shortcuts g 3, g 1, g 2 and g q open teacher preview, parent preview, app banners and announcements',
  'Press g then 3, g then 1, g then 2, g then q.',
  'Each shortcut opens its page',
  async () => {
    await go('/')
    for (const [keys, url] of [
      [['g', '3'], /\/teacher-preview/],
      [['g', '1'], /\/parent-preview/],
      [['g', '2'], /\/app-banners/],
      [['g', 'q'], /\/announcements/],
    ]) {
      await page
        .locator('body')
        .click({ position: { x: 5, y: 5 } })
        .catch(() => null)
      for (const key of keys) await page.keyboard.press(key)
      await page.waitForURL(url, { timeout: 5000 })
    }
  }
)

await test(
  'AP-03',
  'View',
  'Teacher preview asks to pick a teacher first',
  'Open Teacher app preview with nobody chosen.',
  'Empty state "Pick a teacher"',
  async () => {
    await go('/teacher-preview')
    await page.getByText('Pick a teacher', { exact: true }).first().waitFor({ timeout: 8000 })
  }
)

await test(
  'AP-04',
  'Flow',
  'Choosing a teacher shows their app: today, classes and school connect',
  'Pick the demo teacher in the Teacher box.',
  'Phone with Today tab, teacher name and School connect tiles',
  async () => {
    assert(teacher, 'no teaching staff to pick')
    await go('/teacher-preview')
    await page.getByRole('combobox', { name: 'Teacher' }).click()
    await page.getByLabel('Search teacher').fill(teacher.name.split(' ')[0])
    await page.getByRole('option', { name: new RegExp(teacher.employee_no) }).click()
    await page.waitForURL(/staff=\d+/, { timeout: 8000 })
    await phone().getByText(teacher.name).first().waitFor({ timeout: 8000 })
    await phone().getByText('School connect').waitFor({ timeout: 8000 })
    await phone().getByText('My classes').waitFor({ timeout: 8000 })
    assert(
      (await page.locator('nav[aria-label="Teacher app tabs"] button').count()) === 5,
      'teacher app should have 5 tabs'
    )
  }
)

await test(
  'AP-05',
  'View',
  'Teacher Diary tab lists their posts with status filters',
  'Tap Diary, then the Published chip.',
  'Diary posts or an empty state; filter applies',
  async () => {
    await phoneTab('Diary').click()
    await page.waitForURL(/tab=diary/, { timeout: 5000 })
    assert(
      (await phoneTitle().textContent())?.includes('My diary posts'),
      'title should be My diary posts'
    )
    await phone().getByRole('button', { name: 'Published' }).click()
    await phone()
      .getByText(/Seen by \d+ of \d+|No diary posts/)
      .first()
      .waitFor({ timeout: 8000 })
  }
)

await test(
  'AP-06',
  'View',
  'Teacher Meetings tab shows upcoming and past parent meetings',
  'Tap Meetings, then Past.',
  'Meeting cards with status, or an empty state',
  async () => {
    await phoneTab('Meetings').click()
    await phone()
      .getByText(/Join|No upcoming meetings/)
      .first()
      .waitFor({ timeout: 8000 })
    await phone().getByRole('button', { name: 'Past' }).click()
    await phone()
      .getByText(/Completed|Missed|Cancelled|No past meetings/)
      .first()
      .waitFor({ timeout: 8000 })
  }
)

await test(
  'AP-07',
  'Flow',
  'Teacher Chat opens a conversation read-only',
  'Tap Chat, open the first conversation.',
  'Messages with an access-log note and a disabled composer',
  async () => {
    await phoneTab('Chat').click()
    const empty = phone().getByText('No conversations')
    const first = phone().locator('button:has(svg.lucide-chevron-right)').first()
    await Promise.race([empty.waitFor({ timeout: 8000 }), first.waitFor({ timeout: 8000 })])
    if (await empty.count()) return
    await first.click()
    await phone().getByText('Read-only preview').waitFor({ timeout: 8000 })
    await phone()
      .getByText(/recorded in the chat access log/)
      .waitFor({ timeout: 5000 })
    await phone()
      .getByRole('button', { name: /All chats/ })
      .click()
  }
)

await test(
  'AP-08',
  'View',
  'Teacher News tab shows announcements with read state',
  'Tap News, then Unread.',
  'Announcement cards or "All caught up"',
  async () => {
    await phoneTab('News').click()
    await phone()
      .getByText(/Read|New|No announcements/)
      .first()
      .waitFor({ timeout: 8000 })
    await phone().getByRole('button', { name: 'Unread', exact: true }).click()
    await phone()
      .getByText(/New|All caught up/)
      .first()
      .waitFor({ timeout: 8000 })
  }
)

await test(
  'AP-09',
  'Navigation',
  'Teacher preview keeps the chosen teacher and tab after reload',
  'Reload the page on the News tab.',
  'Same teacher and tab',
  async () => {
    await page.reload()
    await page.waitForURL(/tab=news/, { timeout: 5000 })
    assert(
      (await phoneTitle().textContent())?.includes('Announcements'),
      'title should stay Announcements'
    )
  }
)

await test(
  'AP-10',
  'Flow',
  'Parent home has School connect tiles; Diary opens with a back arrow',
  'Open Parent app preview for a child, tap the Diary tile, then Back.',
  'Diary screen, then home again',
  async () => {
    assert(studentId, 'no student to preview')
    await go(`/parent-preview?student=${studentId}`)
    await phone().getByText('School connect').waitFor({ timeout: 10000 })
    await phone()
      .getByRole('button', { name: /^Diary/ })
      .click()
    await page.waitForURL(/tab=diary/, { timeout: 5000 })
    await phone()
      .getByText(/Seen|New|Nothing in the diary/)
      .first()
      .waitFor({ timeout: 8000 })
    await phone().getByRole('button', { name: 'Back', exact: true }).click()
    await page.waitForURL(/tab=home/, { timeout: 5000 })
  }
)

await test(
  'AP-11',
  'View',
  'Parent Meetings, Chat and News screens open from the home tiles',
  'Tap Meetings, Chat and News tiles in turn.',
  'Each screen loads with its title',
  async () => {
    for (const [tile, title, text] of [
      ['Meetings', 'Meetings', /Join|No upcoming meetings/],
      ['Chat', 'Chat with teachers', /No conversations|Chat hours|Outside chat hours/],
      ['News', 'Announcements', /Read|New|No announcements/],
    ]) {
      await phone()
        .getByRole('button', { name: new RegExp(`^${tile}`) })
        .click()
      await phone().getByText(text).first().waitFor({ timeout: 8000 })
      assert((await phoneTitle().textContent())?.includes(title), `title should be ${title}`)
      await phone().getByRole('button', { name: 'Back', exact: true }).click()
      await phone().getByText('School connect').waitFor({ timeout: 8000 })
    }
  }
)

await test(
  'AP-12',
  'Regression',
  'Parent bottom tabs still work (Attendance, Fees, Alerts)',
  'Tap Attend., Fees and Alerts.',
  'Each tab opens',
  async () => {
    for (const [label, url] of [
      ['Attend.', /tab=attendance/],
      ['Fees', /tab=fees/],
      ['Alerts', /tab=notifications/],
    ]) {
      await phoneTab(label).click()
      await page.waitForURL(url, { timeout: 5000 })
    }
  }
)

{
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: await admin.context.storageState(),
  })
  const previous = page
  page = await mobile.newPage()
  await test(
    'AP-13',
    'Responsive',
    'Teacher preview fits a phone without sideways scroll',
    'Open Teacher app preview at 390 px wide.',
    'No horizontal scroll',
    async () => {
      await go(`/teacher-preview?staff=${teacher?.id}&tab=home`)
      await page.getByText('School connect').waitFor({ timeout: 10000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
      assert(overflow <= 0, `page scrolls sideways by ${overflow}px`)
    }
  )
  await mobile.close()
  page = previous
}

{
  const transport = await signIn('9000000003')
  const previous = page
  page = transport.page
  await test(
    'AP-14',
    'Security',
    'Without staff.view the Teacher app link is hidden and the API refuses',
    'Sign in as transport in-charge, open the sidebar and /teacher-preview.',
    'No Teacher app link; error in the phone',
    async () => {
      await go('/')
      const links = await page.getByRole('link', { name: /^Teacher app/ }).count()
      assert(links === 0, 'Teacher app link should be hidden')
      await go(`/teacher-preview?staff=${teacher?.id}`)
      await page
        .getByText(/permission|Could not load/i)
        .first()
        .waitFor({ timeout: 10000 })
    }
  )
  await transport.context.close()
  page = previous
}

await browser.close()
fs.writeFileSync(path.join(OUT, 'preview-ui.json'), JSON.stringify(results, null, 2))
const passed = results.filter((r) => r.status === 'Pass').length
console.log(`${passed} passed, ${results.length - passed} failed`)
