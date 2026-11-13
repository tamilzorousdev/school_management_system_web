import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const CHROME = process.env.E2E_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const DAY = process.env.E2E_DAY ?? 'Day 8'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results')
const SHOTS = path.join(OUT, 'screenshots', 'diary-settings')
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
    module: 'Diary settings',
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
  await page
    .screenshot({ path: path.join(SHOTS, row.screenshot), fullPage: true })
    .catch(() => null)
  row.ms = Date.now() - started
  results.push(row)
  console.log(
    `${row.status === 'Pass' ? 'PASS' : 'FAIL'}  ${id.padEnd(6)} ${title}${row.status === 'Fail' ? `\n        ${row.actual}` : ''}`
  )
}
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const go = async (url) => {
  await page.goto(`${BASE}${url}`)
  await page.waitForLoadState('networkidle').catch(() => null)
}
const optionA = () => page.getByRole('radio', { name: /Review every diary post/ })
const optionB = () => page.getByRole('radio', { name: /Review only remarks and feedback/ })
const optionC = () => page.getByRole('radio', { name: /No review/ })

const admin = await signIn('9876543210')
page = admin.page
let original = 'remarks'

await test(
  'DS-01',
  'Navigation',
  'Diary page has a Review settings link showing the current mode',
  'Open Diary, look at the header.',
  'Review settings link with the mode name',
  async () => {
    await go('/diary')
    const link = page.getByRole('link', { name: /Review settings/ })
    await link.waitFor({ timeout: 8000 })
    const text = await link.textContent()
    assert(
      /Every post is reviewed|Remarks and feedback are reviewed|Direct posting/.test(text ?? ''),
      `link text: ${text}`
    )
    original = text.includes('Every post')
      ? 'all'
      : text.includes('Direct posting')
        ? 'none'
        : 'remarks'
  }
)

await test(
  'DS-02',
  'Navigation',
  'Review settings opens School setup → Diary and chat',
  'Click Review settings.',
  'Setup page on the Diary and chat tab with options A, B and C',
  async () => {
    await page.getByRole('link', { name: /Review settings/ }).click()
    await page.waitForURL(/\/setup\?tab=communication/, { timeout: 8000 })
    await page.getByText('Option A', { exact: true }).waitFor({ timeout: 8000 })
    await page.getByText('Option B', { exact: true }).waitFor({ timeout: 5000 })
    await page.getByText('Option C', { exact: true }).waitFor({ timeout: 5000 })
    assert(
      await (
        original === 'all' ? optionA() : original === 'none' ? optionC() : optionB()
      ).isChecked(),
      'saved mode should be selected'
    )
  }
)

await test(
  'DS-03',
  'Flow',
  'Choose option A (review every post) and save',
  'Click Option A, then Save settings.',
  'Saved message; diary shows "Every post is reviewed"',
  async () => {
    await page.getByText('Review every diary post').click()
    assert(await optionA().isChecked(), 'option A should be selected')
    await page.getByRole('button', { name: 'Save settings' }).click()
    await page.getByText('Diary and chat settings saved').first().waitFor({ timeout: 8000 })
    await go('/diary')
    await page.getByRole('link', { name: /Every post is reviewed/ }).waitFor({ timeout: 8000 })
  }
)

await test(
  'DS-04',
  'Flow',
  'Choose option B (remarks and feedback only) and save',
  'Open the tab again, click Option B, Save.',
  'Saved; diary shows "Remarks and feedback are reviewed"; reload keeps it',
  async () => {
    await go('/setup?tab=communication')
    await page.getByText('Review only remarks and feedback').click()
    await page.getByRole('button', { name: 'Save settings' }).click()
    await page.getByText('Diary and chat settings saved').first().waitFor({ timeout: 8000 })
    await page.reload()
    await page.getByText('Option B', { exact: true }).waitFor({ timeout: 8000 })
    assert(await optionB().isChecked(), 'option B should stay selected after reload')
    await go('/diary')
    await page
      .getByRole('link', { name: /Remarks and feedback are reviewed/ })
      .waitFor({ timeout: 8000 })
  }
)

await test(
  'DS-05',
  'Validation',
  'Chat hours must end after they start',
  'Set end 08:00 with start 09:00, Save.',
  'Error under Ends at, nothing saved',
  async () => {
    await go('/setup?tab=communication')
    await page.getByLabel('Starts at').fill('09:00')
    await page.getByLabel('Ends at').fill('08:00')
    await page.getByRole('button', { name: 'Save settings' }).click()
    await page.getByText('Office hours must end after they start').waitFor({ timeout: 5000 })
    await page.reload()
  }
)

await test(
  'DS-06',
  'Regression',
  'School profile tab no longer mixes in the diary setting',
  'Open School setup → School profile.',
  'No Diary review card on the profile tab',
  async () => {
    await go('/setup?tab=profile')
    await page.getByRole('heading', { name: 'School setup' }).waitFor({ timeout: 8000 })
    await page.waitForTimeout(800)
    assert(
      (await page.getByText('Option A', { exact: true }).count()) === 0,
      'diary options should not be on the profile tab'
    )
    await page
      .getByRole('tab', { name: /Diary and chat/ })
      .or(page.getByRole('button', { name: /Diary and chat/ }))
      .first()
      .waitFor({ timeout: 5000 })
  }
)

{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: await admin.context.storageState(),
  })
  const previous = page
  page = await phone.newPage()
  await test(
    'DS-07',
    'Responsive',
    'Diary and chat tab fits a phone',
    'Open the tab at 390 px wide.',
    'Options stack, no sideways scroll',
    async () => {
      await go('/setup?tab=communication')
      await page.getByText('Option B', { exact: true }).waitFor({ timeout: 8000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
      assert(overflow <= 0, `page scrolls sideways by ${overflow}px`)
    }
  )
  await phone.close()
  page = previous
}

if (original === 'all') {
  await go('/setup?tab=communication')
  await page.getByText('Review every diary post').click()
  await page.getByRole('button', { name: 'Save settings' }).click()
  await page
    .getByText('Diary and chat settings saved')
    .first()
    .waitFor({ timeout: 8000 })
    .catch(() => null)
}

{
  const principal = await signIn('9000000001')
  const previous = page
  page = principal.page
  await test(
    'DS-08',
    'Security',
    'Principal can see the setting but not change it',
    'Sign in as principal, open the tab.',
    'Options disabled, no Save button',
    async () => {
      await go('/setup?tab=communication')
      await page.getByText('Option A', { exact: true }).waitFor({ timeout: 8000 })
      assert(await optionA().isDisabled(), 'options should be disabled')
      assert(
        (await page.getByRole('button', { name: 'Save settings' }).count()) === 0,
        'no save button'
      )
    }
  )
  await principal.context.close()
  page = previous
}

await browser.close()
fs.writeFileSync(path.join(OUT, 'diary-settings-ui.json'), JSON.stringify(results, null, 2))
const passed = results.filter((r) => r.status === 'Pass').length
console.log(`${passed} passed, ${results.length - passed} failed`)
