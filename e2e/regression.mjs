import fs from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const CHROME = process.env.E2E_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const DAY = process.env.E2E_DAY ?? 'Day 6'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results')
const SHOTS = path.join(OUT, 'screenshots')
fs.mkdirSync(SHOTS, { recursive: true })

const RUN = String(Date.now()).slice(-5)
const mobile = (n) => `98${RUN}${String(n).padStart(3, '0')}`
const results = []
const created = { students: [], users: [], staff: [], subjects: [], holidays: [], admissions: [] }

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: process.env.E2E_HEADED !== '1',
})

async function signedInContext(mobileNumber, stateFile, viewport = { width: 1440, height: 900 }) {
  const file = path.join(ROOT, stateFile)
  const context = await browser.newContext({
    viewport,
    ...(fs.existsSync(file) ? { storageState: file } : {}),
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`)
  await page.waitForTimeout(1500)
  if (page.url().includes('/login')) {
    await page.getByLabel(/mobile/i).fill(mobileNumber)
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.getByRole('button', { name: /continue with otp/i }).click()
      const ok = await page
        .getByText('Enter the code')
        .waitFor({ timeout: 6000 })
        .then(() => true)
        .catch(() => false)
      if (ok) break
      await page.waitForTimeout(32000)
    }
    await page.keyboard.type('123456')
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20000 })
    await context.storageState({ path: file })
  }
  return { context, page }
}

const admin = await signedInContext('9876543210', '.auth-admin.json')
let page = admin.page

async function test(meta, fn) {
  const started = Date.now()
  const row = { day: DAY, ...meta, status: 'Pass', actual: meta.expected, screenshot: '', ms: 0 }
  try {
    await fn()
  } catch (error) {
    row.status = 'Fail'
    row.actual = String(error?.message ?? error)
      .split('\n')[0]
      .slice(0, 300)
    row.screenshot = `${meta.id}.png`
    await page
      .screenshot({ path: path.join(SHOTS, row.screenshot), fullPage: true })
      .catch(() => null)
  }
  row.ms = Date.now() - started
  results.push(row)
  console.log(
    `${row.status === 'Pass' ? 'PASS' : 'FAIL'}  ${meta.id.padEnd(8)} ${meta.title}${row.status === 'Fail' ? `\n        ${row.actual}` : ''}`
  )
  for (
    let i = 0;
    i < 3 && (row.status === 'Fail' || !meta.keepOpen) && (await page.getByRole('dialog').count());
    i += 1
  ) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
}

const dialog = () => page.getByRole('dialog').last()
const go = async (url) => {
  await page.goto(`${BASE}${url}`)
  await page.waitForLoadState('networkidle').catch(() => null)
}
const see = async (text, scope = page, timeout = 8000) => {
  await scope.getByText(text).locator('visible=true').first().waitFor({ state: 'visible', timeout })
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pickDate = async (trigger, iso) => {
  if (!iso) {
    const clear = trigger.getByRole('button', { name: 'Clear date' })
    if (await clear.count()) await clear.click()
    return
  }
  const [year, month, day] = iso.split('-').map(Number)
  await trigger.click()
  const calendar = page.locator('[data-radix-popper-content-wrapper]').last()
  await calendar.waitFor({ state: 'visible', timeout: 5000 })
  const shownMonth = (await calendar.getByRole('button', { name: new RegExp(`^(${MONTH_NAMES.join('|')})$`) }).first().innerText()).trim()
  const shownYear = Number((await calendar.getByRole('button', { name: /^\d{4}$/ }).first().innerText()).trim())
  let steps = (year - shownYear) * 12 + (month - 1 - MONTH_NAMES.indexOf(shownMonth))
  while (steps >= 12) { await calendar.getByTitle('Next year').click(); steps -= 12 }
  while (steps <= -12) { await calendar.getByTitle('Previous year').click(); steps += 12 }
  while (steps > 0) { await calendar.getByTitle('Next month').click(); steps -= 1 }
  while (steps < 0) { await calendar.getByTitle('Previous month').click(); steps += 1 }
  const days = calendar.getByRole('button', { name: String(day), exact: true })
  await (day >= 15 ? days.last() : days.first()).click()
  await calendar.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => page.keyboard.press('Escape'))
}
const fill = async (scope, label, value) => {
  const field = scope.getByLabel(label).first()
  if ((await field.getAttribute('data-slot')) === 'date-picker') return pickDate(field, value)
  await field.fill(value)
}
const pick = async (scope, name, option) => {
  await scope.getByRole('combobox', { name }).first().click()
  await page.getByRole('option', { name: option }).first().click()
}
const click = async (scope, name) => {
  await scope.getByRole('button', { name }).first().click()
}
const api = async (method, url, body) => {
  const session = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tz-session') ?? 'null')
  )
  const response = await fetch(`${BASE}/api/v1${url}`, {
    method,
    headers: { authorization: `Bearer ${session.accessToken}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return response.json()
}

const samplePdf = path.join(OUT, 'sample.pdf')
fs.writeFileSync(
  samplePdf,
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF'
)

{
  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const previous = page
  page = await guest.newPage()
  await test(
    {
      id: 'LG-01',
      module: 'Login',
      type: 'Validation',
      title: 'Continue button stays off until a 10-digit mobile is entered',
      steps: 'Open /login. Type 12345 in the mobile box.',
      expected: 'Continue with OTP is disabled',
    },
    async () => {
      await go('/login')
      await page.getByLabel(/mobile/i).fill('12345')
      if (!(await page.getByRole('button', { name: /continue with otp/i }).isDisabled()))
        throw new Error('Button is enabled')
    }
  )
  await test(
    {
      id: 'LG-02',
      module: 'Login',
      type: 'Validation',
      title: 'Unregistered mobile shows a clear error',
      steps: 'Enter 9123400000 and press Continue with OTP.',
      expected: 'Red box "Number not registered"',
    },
    async () => {
      await page.getByLabel(/mobile/i).fill('9123400000')
      await click(page, /continue with otp/i)
      await see('Number not registered')
    }
  )
  await test(
    {
      id: 'LG-03',
      module: 'Login',
      type: 'Validation',
      title: 'Wrong OTP shows "Wrong code"',
      steps: 'Enter 9000000002, continue, type 000000.',
      expected: 'Red box "Wrong code" and the boxes clear',
    },
    async () => {
      await go('/login')
      await page.getByLabel(/mobile/i).fill('9000000002')
      await click(page, /continue with otp/i)
      await see('Enter the code')
      await page.keyboard.type('000000')
      await see(/Wrong code|Too many attempts/)
    }
  )
  await test(
    {
      id: 'LG-04',
      module: 'Login',
      type: 'View',
      title: 'Sign-in page fits a phone screen without sideways scroll',
      steps: 'Open /login at 390 x 844.',
      expected: 'Page width equals screen width',
    },
    async () => {
      await page.setViewportSize({ width: 390, height: 844 })
      await go('/login')
      const width = await page.evaluate(() => document.documentElement.scrollWidth)
      if (width > 391) throw new Error(`Page is ${width}px wide`)
    }
  )
  await guest.close()
  page = previous
}

await test(
  {
    id: 'LG-05',
    module: 'Login',
    type: 'Add',
    title: 'Admin signs in with OTP and reaches the dashboard',
    steps: 'Sign in as 9876543210 with 123456.',
    expected: 'Dashboard opens with the sidebar',
  },
  async () => {
    await go('/')
    if (page.url().includes('/login')) throw new Error('Still on login')
    await page.getByRole('navigation').first().waitFor()
  }
)

await test(
  {
    id: 'US-01',
    module: 'Users',
    type: 'Validation',
    title: 'Add user with nothing filled shows required messages',
    steps: 'Users → Add user → Add user.',
    expected:
      'Enter the full name · Enter a valid 10-digit mobile number · Choose at least one role',
  },
  async () => {
    await go('/users')
    await click(page, /^add user/i)
    await click(dialog(), /^add user$/i)
    await see('Enter the full name', dialog())
    await see('Enter a valid 10-digit mobile number', dialog())
    await see('Choose at least one role', dialog())
  }
)
await test(
  {
    id: 'US-02',
    module: 'Users',
    type: 'Validation',
    title: 'Wrong mobile and email formats are caught',
    steps: 'Mobile 12345, email abc.',
    expected: 'Mobile and email messages show',
  },
  async () => {
    await click(page, /^add user/i)
    await fill(dialog(), /^Mobile number/, '12345')
    await fill(dialog(), /^Email/, 'abc')
    await click(dialog(), /^add user$/i)
    await see('Enter a valid 10-digit mobile number', dialog())
    await see('Enter a valid email address', dialog())
  }
)
await test(
  {
    id: 'US-03',
    module: 'Users',
    type: 'Add',
    title: 'Add a teacher user',
    steps: `Name RT User ${RUN}, mobile ${mobile(1)}, role Teacher, save.`,
    expected: 'User appears in the list',
  },
  async () => {
    await click(page, /^add user/i)
    await fill(dialog(), /^Full name/, `RT User ${RUN}`)
    await fill(dialog(), /^Mobile number/, mobile(1))
    await dialog().getByText('Teacher', { exact: true }).click()
    await click(dialog(), /^add user$/i)
    await dialog().waitFor({ state: 'detached', timeout: 8000 })
    await page.getByRole('searchbox').first().fill(`RT User ${RUN}`)
    await see(`RT User ${RUN}`)
    const list = await api('GET', `/admin/users?search=${mobile(1)}`)
    created.users.push(...list.data.items.map((item) => item.id))
  }
)
await test(
  {
    id: 'US-04',
    module: 'Users',
    type: 'Validation',
    title: 'Same mobile twice is refused',
    steps: `Add another user with ${mobile(1)}.`,
    expected: 'Message that the mobile already exists',
  },
  async () => {
    await click(page, /^add user/i)
    await fill(dialog(), /^Full name/, 'RT Duplicate')
    await fill(dialog(), /^Mobile number/, mobile(1))
    await dialog().getByText('Teacher', { exact: true }).click()
    await click(dialog(), /^add user$/i)
    await see(/already exists/i, page)
  }
)

await test(
  {
    id: 'SU-01',
    module: 'School setup',
    type: 'Validation',
    title: 'Add subject with nothing filled',
    steps: 'School setup → Subjects → Add subject → Add subject.',
    expected: 'Enter the subject name · code rule message',
  },
  async () => {
    await go('/setup?tab=subjects')
    await click(page, /^add subject/i)
    await click(dialog(), /^add subject$/i)
    await see('Enter the subject name', dialog())
    await see(/2 to 20 letters/, dialog())
  }
)
await test(
  {
    id: 'SU-02',
    module: 'School setup',
    type: 'Add',
    title: 'Add a subject',
    steps: `Name RT Subject ${RUN}, code RT${RUN}.`,
    expected: 'Subject shows in the list',
  },
  async () => {
    await click(page, /^add subject/i)
    await fill(dialog(), /^Name/, `RT Subject ${RUN}`)
    await fill(dialog(), /^Code/, `RT${RUN}`)
    await click(dialog(), /^add subject$/i)
    await dialog().waitFor({ state: 'detached', timeout: 8000 })
    await see(`RT Subject ${RUN}`)
    const list = await api('GET', `/admin/subjects?search=RT${RUN}`)
    created.subjects.push(...list.data.items.map((item) => item.id))
  }
)
await test(
  {
    id: 'SU-03',
    module: 'School setup',
    type: 'Validation',
    title: 'Duplicate subject code is refused',
    steps: `Add another subject with code RT${RUN}.`,
    expected: 'Message that the code is already used',
  },
  async () => {
    await click(page, /^add subject/i)
    await fill(dialog(), /^Name/, 'RT Duplicate')
    await fill(dialog(), /^Code/, `RT${RUN}`)
    await click(dialog(), /^add subject$/i)
    await see(/already|used|exists/i, dialog())
  }
)
await test(
  {
    id: 'SU-04',
    keepOpen: true,
    module: 'School setup',
    type: 'Validation',
    title: 'Add holiday with nothing filled, then last day before first day',
    steps: 'Holidays → Add holiday → Add. Then date 2026-12-10 and open Last day.',
    expected: 'Enter a name · Choose the date · days before 10 Dec cannot be picked as the last day',
  },
  async () => {
    await go('/setup?tab=holidays')
    await click(page, /^add holiday/i)
    await click(dialog(), /^add$/i)
    await see('Enter a name', dialog())
    await see('Choose the date', dialog())
    await fill(dialog(), /^Name/, `RT Holiday ${RUN}`)
    await fill(dialog(), /^Date/, '2026-12-10')
    await dialog().getByLabel(/^Last day/).first().click()
    const calendar = page.locator('[data-radix-popper-content-wrapper]').last()
    await calendar.waitFor({ state: 'visible', timeout: 5000 })
    if (!(await calendar.getByRole('button', { name: '5', exact: true }).first().isDisabled()))
      throw new Error('5 Dec can still be picked as the last day')
    await page.keyboard.press('Escape')
    await calendar.waitFor({ state: 'hidden', timeout: 5000 })
  }
)
await test(
  {
    id: 'SU-05',
    module: 'School setup',
    type: 'Add',
    title: 'Add a holiday',
    steps: `RT Holiday ${RUN} on 2026-12-10.`,
    expected: 'Holiday shows in the list',
  },
  async () => {
    await fill(dialog(), /^Last day/, '')
    await click(dialog(), /^add$/i)
    await dialog().waitFor({ state: 'detached', timeout: 8000 })
    await see(`RT Holiday ${RUN}`)
    const list = await api('GET', '/admin/holidays')
    created.holidays.push(
      ...list.data.filter((item) => item.name === `RT Holiday ${RUN}`).map((item) => item.id)
    )
  }
)

let studentUrl = ''
await test(
  {
    id: 'ST-01',
    module: 'Students',
    type: 'Validation',
    title: 'Add student with nothing filled shows every required message',
    steps: 'Students → Add student → Add student.',
    expected:
      'Enter the first name · Enter the date of birth · Choose a gender · Choose a class · Enter the full name · Enter a valid 10-digit mobile',
  },
  async () => {
    await go('/students')
    await click(page, /^add student/i)
    await click(dialog(), /^add student$/i)
    for (const text of [
      'Enter the first name',
      'Enter the date of birth',
      'Choose a gender',
      'Choose a class',
      'Enter the full name',
      'Enter a valid 10-digit mobile',
    ]) {
      await see(text, dialog())
    }
  }
)
await test(
  {
    id: 'ST-02',
    module: 'Students',
    type: 'Add',
    title: 'Add a student with a father',
    steps: `RT Kid ${RUN}, born 2016-05-10, boy, class 5, father RT Father ${RUN} ${mobile(2)}.`,
    expected: 'Student profile opens',
  },
  async () => {
    await go('/students')
    await click(page, /^add student/i)
    const form = dialog()
    await fill(form, /^First name/, 'RTKid')
    await fill(form, /^Last name/, RUN)
    await fill(form, /^Date of birth/, '2016-05-10')
    await pick(form, 'Gender', 'Boy')
    await pick(form, 'Class', 'Class 5')
    await form
      .getByRole('group')
      .getByLabel(/^Full name/)
      .fill(`RT Father ${RUN}`)
    await form
      .getByRole('group')
      .getByLabel(/^Mobile/)
      .fill(mobile(2))
    await form.getByRole('switch').last().click()
    await click(form, /^add student$/i)
    await page.waitForURL(/\/students\/\d+/, { timeout: 10000 })
    await see(`RTKid ${RUN}`)
    studentUrl = new URL(page.url()).pathname
    created.students.push(Number(studentUrl.split('/').pop()))
  }
)
await test(
  {
    id: 'ST-03',
    module: 'Students',
    type: 'View',
    title: 'Every profile tab opens',
    steps: 'Open Profile, Parents, Documents, Health, Behaviour, Transport tabs.',
    expected: 'Each tab shows its content',
  },
  async () => {
    if (!studentUrl) throw new Error('No student from ST-02')
    const checks = [
      ['Profile', 'Class history'],
      ['Parents', 'Parents and guardians'],
      ['Documents', /No documents yet|documents?/],
      ['Health', 'Vaccinations'],
      ['Behaviour', /No notes yet|Add note/],
      ['Transport', 'No bus stop yet'],
    ]
    for (const [tab, text] of checks) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click()
      await see(text)
    }
  }
)
await test(
  {
    id: 'ST-04',
    keepOpen: true,
    module: 'Students',
    type: 'Validation',
    title: 'Edit student: empty first name and short pincode',
    steps: 'Edit → clear first name, pincode 12 → Save.',
    expected: 'Enter the first name · Pincode has 6 digits',
  },
  async () => {
    await go(studentUrl)
    await click(page, /^edit$/i)
    await fill(dialog(), /^First name/, '')
    await fill(dialog(), /^Pincode/, '12')
    await click(dialog(), /^save$/i)
    await see('Enter the first name', dialog())
    await see('Pincode has 6 digits', dialog())
  }
)
await test(
  {
    id: 'ST-05',
    module: 'Students',
    type: 'Add',
    title: 'Edit student details',
    steps: 'First name RTKid, pincode 600040, city Chennai → Save.',
    expected: '"Details saved" and the address updates',
  },
  async () => {
    await fill(dialog(), /^First name/, 'RTKid')
    await fill(dialog(), /^Pincode/, '600040')
    await fill(dialog(), /^City/, 'Chennai')
    await click(dialog(), /^save$/i)
    await see('Details saved')
    await see(/Chennai, 600040/)
  }
)
await test(
  {
    id: 'ST-06',
    keepOpen: true,
    module: 'Student health',
    type: 'Validation',
    title: 'Health record rejects impossible height and bad doctor mobile',
    steps: 'Health → Add → height 999, doctor mobile 123 → Save.',
    expected: 'Height in cm, 30 to 250 · Enter a valid 10-digit mobile',
  },
  async () => {
    await go(`${studentUrl}?tab=health`)
    await page
      .locator('section', { hasText: 'Health record' })
      .getByRole('button', { name: /^(add|edit)$/i })
      .click()
    await fill(dialog(), /^Height/, '999')
    await fill(dialog(), /^Doctor mobile/, '123')
    await click(dialog(), /^save$/i)
    await see('Height in cm, 30 to 250', dialog())
    await see('Enter a valid 10-digit mobile', dialog())
  }
)
await test(
  {
    id: 'ST-07',
    module: 'Student health',
    type: 'Add',
    title: 'Save health record with allergy',
    steps: 'Height 135, weight 30, allergies Peanuts → Save.',
    expected: '"Health record saved", BMI shows, allergy in red box',
  },
  async () => {
    await fill(dialog(), /^Height/, '135')
    await fill(dialog(), /^Weight/, '30')
    await fill(dialog(), /^Doctor mobile/, '')
    await fill(dialog(), /^Allergies/, 'Peanuts')
    await click(dialog(), /^save$/i)
    await see('Health record saved')
    await see('16.5')
    await see('Peanuts')
  }
)
await test(
  {
    id: 'ST-08',
    keepOpen: true,
    module: 'Student health',
    type: 'Validation',
    title: 'Vaccination needs a name',
    steps: 'Vaccinations → Add → Save with no name.',
    expected: 'Enter the vaccine name',
  },
  async () => {
    await page.getByRole('button', { name: /^add$/i }).last().click()
    await click(dialog(), /^save$/i)
    await see('Enter the vaccine name', dialog())
  }
)
await test(
  {
    id: 'ST-09',
    module: 'Student health',
    type: 'Add',
    title: 'Add a due vaccination and mark it given',
    steps: 'Vaccine Tdap, due 2026-10-01 → Save → Mark given.',
    expected: 'Shows Overdue, then "marked as given today"',
  },
  async () => {
    await fill(dialog(), /^Vaccine/, 'Tdap')
    await fill(dialog(), /^Next dose due/, '2026-10-01')
    await click(dialog(), /^save$/i)
    await see('Overdue')
    await click(page, /^mark given$/i)
    await see(/marked as given today/)
  }
)
await test(
  {
    id: 'ST-10',
    keepOpen: true,
    module: 'Student behaviour',
    type: 'Validation',
    title: 'Behaviour note needs a title',
    steps: 'Behaviour → Add note → Save with no title.',
    expected: 'Write a short title, at least 3 letters',
  },
  async () => {
    await go(`${studentUrl}?tab=behaviour`)
    await click(page, /^add note$/i)
    await click(dialog(), /^save$/i)
    await see('Write a short title, at least 3 letters', dialog())
  }
)
await test(
  {
    id: 'ST-11',
    module: 'Student behaviour',
    type: 'Add',
    title: 'Add a staff-only concern',
    steps: 'Type Concern, title "RT late three days", switch off parents → Save.',
    expected: 'Note shows with Concern and Staff only badges',
  },
  async () => {
    await dialog().getByRole('radio', { name: 'Concern' }).click()
    await fill(dialog(), /^What happened/, 'RT late three days')
    await dialog().getByRole('switch').click()
    await click(dialog(), /^save$/i)
    await see('RT late three days')
    await see('Staff only')
  }
)
await test(
  {
    id: 'ST-12',
    keepOpen: true,
    module: 'Student documents',
    type: 'Validation',
    title: 'Document upload needs a file',
    steps: 'Documents → Add document → Upload with no file.',
    expected: 'Choose a file to upload',
  },
  async () => {
    await go(`${studentUrl}?tab=documents`)
    await click(page, /^add document/i)
    await click(dialog(), /^upload$/i)
    await see('Choose a file to upload', dialog())
  }
)
await test(
  {
    id: 'ST-13',
    module: 'Student documents',
    type: 'Add',
    title: 'Upload a birth certificate, reject without reason, then verify',
    steps: 'Choose PDF → Upload. Reject with empty reason. Verify.',
    expected: '"Document added" · "Give a reason" · status Verified',
  },
  async () => {
    await dialog().locator('input[type=file]').setInputFiles(samplePdf)
    await click(dialog(), /^upload$/i)
    await see('Document added')
    await see('To check')
    await click(page, /^reject$/i)
    await click(dialog(), /^reject$/i)
    await see('Give a reason', dialog())
    await page.keyboard.press('Escape')
    await click(page, /^verify$/i)
    await see(/verified$/i)
  }
)
await test(
  {
    id: 'ST-14',
    module: 'ID card',
    type: 'View',
    title: 'ID card opens as a PDF',
    steps: 'Student profile → ID card.',
    expected: 'A new tab opens with the PDF',
  },
  async () => {
    await go(studentUrl)
    const popup = page.context().waitForEvent('page', { timeout: 15000 })
    await click(page, /^id card$/i)
    const tab = await popup
    await tab.waitForURL(/^blob:/, { timeout: 15000 })
    await tab.close()
  }
)
await test(
  {
    id: 'ST-15',
    keepOpen: true,
    module: 'Leaving / TC',
    type: 'Validation',
    title: 'Leaving the school needs a reason',
    steps: 'More → Leaving the school → Issue TC with no reason.',
    expected: 'Write the reason for leaving',
  },
  async () => {
    await click(page, /^more/i)
    await page.getByRole('menuitem', { name: /leaving the school/i }).click()
    await click(dialog(), /^issue tc$/i)
    await see('Write the reason for leaving', dialog())
  }
)
await test(
  {
    id: 'ST-16',
    module: 'Leaving / TC',
    type: 'Add',
    title: 'Transfer the student and issue a TC',
    steps: 'Reason "RT family moved" → Issue TC.',
    expected: 'TC number toast, status Transferred, TC banner',
  },
  async () => {
    const popup = page
      .context()
      .waitForEvent('page', { timeout: 15000 })
      .catch(() => null)
    await fill(dialog(), /^Reason/, 'RT family moved')
    await click(dialog(), /^issue tc$/i)
    await see(/TC .*-TC-\d{4}-\d{4} issued/)
    const tab = await popup
    await tab?.close()
    await see('Transferred')
    await see(/TC .*RT family moved/)
  }
)
await test(
  {
    id: 'ST-17',
    module: 'Students',
    type: 'View',
    title: 'Search and class filter on the student list',
    steps: 'Search "Kavin", then choose Class 6.',
    expected: 'Kavin Narayanan is listed',
  },
  async () => {
    await go('/students')
    await page.getByRole('searchbox').first().fill('Kavin')
    await see('Kavin Narayanan')
    await pick(page, 'Filter by class', 'Class 6')
    await see('Kavin Narayanan')
  }
)
await test(
  {
    id: 'ST-18',
    module: 'Students',
    type: 'View',
    title: 'Print ID cards for a class opens a PDF',
    steps: 'Filter Class 6 → Print ID cards.',
    expected: 'A new tab opens with the A4 sheet',
  },
  async () => {
    const popup = page.context().waitForEvent('page', { timeout: 20000 })
    await click(page, /print id cards/i)
    const tab = await popup
    await tab.waitForURL(/^blob:/, { timeout: 20000 })
    await tab.close()
  }
)
await test(
  {
    id: 'ST-19',
    module: 'Excel import',
    type: 'Validation',
    title: 'Import checks rows and reports problems without saving',
    steps: 'Bulk actions → Import → upload a file with one good and one bad row → Check file.',
    expected: 'Report shows 1 ready and 1 to fix with the column message',
  },
  async () => {
    const book = new ExcelJS.Workbook()
    const sheet = book.addWorksheet('Students')
    sheet.addRow([
      'First name *',
      'Date of birth *',
      'Gender *',
      'Class *',
      'Father name',
      'Father mobile',
    ])
    sheet.addRow(['RTGood', '2015-03-14', 'female', '6', 'RT Parent', mobile(3)])
    sheet.addRow(['RTBad', '2015-02-30', 'boy', '13', 'X', '123'])
    const file = path.join(OUT, 'import.xlsx')
    await book.xlsx.writeFile(file)
    await go('/students')
    await click(page, /bulk actions/i)
    await page.getByRole('menuitem', { name: /import from excel/i }).click()
    if (
      !(await dialog()
        .getByRole('button', { name: /check file/i })
        .isDisabled())
    )
      throw new Error('Check enabled without a file')
    await dialog().locator('input[type=file]').setInputFiles(file)
    await click(dialog(), /check file/i)
    await see(/Import 1 student/, dialog(), 20000)
    await see(/Class "13" is not in School setup/, dialog())
    await see(/Father mobile must be a valid 10-digit/, dialog())
  }
)
await test(
  {
    id: 'ST-20',
    module: 'Promotion',
    type: 'View',
    title: 'Promotion preview lists the class and the next year',
    steps: 'Bulk actions → Promote to next year → Class 6.',
    expected: 'Students listed, next class 7 suggested, Promote button enabled',
  },
  async () => {
    await go('/students')
    await click(page, /bulk actions/i)
    await page.getByRole('menuitem', { name: /promote to next year/i }).click()
    await pick(dialog(), 'Class this year', 'Class 6')
    await see('Kavin Narayanan', dialog())
    await see(/2026-27 → 2027-28/, dialog())
    if (
      await dialog()
        .getByRole('button', { name: /^promote \d+/i })
        .isDisabled()
    )
      throw new Error('Promote disabled')
  }
)

await test(
  {
    id: 'AD-01',
    keepOpen: true,
    module: 'Admissions',
    type: 'Validation',
    title: 'New application with nothing filled',
    steps: 'Admissions → New application → save.',
    expected:
      'Choose the class applied for · Enter the first name · Enter the date of birth · Choose a gender · Enter the parent name',
  },
  async () => {
    await go('/admissions')
    await click(page, /^new application/i)
    await dialog().locator('button[type=submit]').click()
    for (const text of [
      'Choose the class applied for',
      'Enter the first name',
      'Enter the date of birth',
      'Choose a gender',
      'Enter the parent name',
    ]) {
      await see(text, dialog())
    }
  }
)
await test(
  {
    id: 'AD-02',
    module: 'Admissions',
    type: 'Add',
    title: 'Take an application, approve it and enrol',
    steps: `RTApp ${RUN}, class 2, parent ${mobile(4)} → save → Approve → Enrol.`,
    expected: 'Status moves Waiting → Approved → Enrolled',
  },
  async () => {
    const form = dialog()
    await pick(form, /class/i, 'Class 2')
    await fill(form, /^First name/, 'RTApp')
    await fill(form, /^Last name/, RUN)
    await fill(form, /^Date of birth/, '2019-02-02')
    await pick(form, 'Gender', 'Girl')
    await fill(form, /^Parent name|^Full name/, `RT Mother ${RUN}`)
    await fill(form, /^Mobile|^Parent mobile/, mobile(4))
    await form.locator('button[type=submit]').click()
    await form.waitFor({ state: 'detached', timeout: 8000 })
    await page.getByRole('searchbox').first().fill(`RTApp ${RUN}`)
    const row = page.getByRole('row', { name: new RegExp(`RTApp ${RUN}`) })
    await see('Waiting', row)
    await row.getByRole('button', { name: 'Approve', exact: true }).click()
    if (await page.getByRole('dialog').count())
      await dialog()
        .getByRole('button', { name: /approve/i })
        .last()
        .click()
    await see('Approved', row)
    await row.getByRole('button', { name: 'Enrol', exact: true }).click()
    await dialog().getByRole('button', { name: /enrol/i }).last().click()
    await see('Enrolled', row)
    const list = await api('GET', `/admin/students?search=RTApp`)
    created.students.push(...list.data.items.map((item) => item.id))
  }
)

await test(
  {
    id: 'PG-01',
    module: 'Parents',
    type: 'Validation',
    title: 'Edit parent rejects a bad mobile',
    steps: `Parents → search ${mobile(2)} → open → Edit → mobile 123 → Save.`,
    expected: 'Enter a valid 10-digit mobile',
  },
  async () => {
    await go('/guardians')
    await page.getByRole('searchbox').first().fill(mobile(2))
    await see(`RT Father ${RUN}`)
    await page.getByText(`RT Father ${RUN}`).first().click()
    await click(page, /^edit/i)
    await fill(dialog(), /^Mobile/, '123')
    await dialog().locator('button[type=submit]').click()
    await see('Enter a valid 10-digit mobile', dialog())
  }
)

let staffUrl = ''
await test(
  {
    id: 'SF-01',
    keepOpen: true,
    module: 'Staff',
    type: 'Validation',
    title: 'Add staff with nothing filled',
    steps: 'Staff → Add staff → save.',
    expected:
      'Enter the full name · mobile · Choose at least one role · Choose teaching or non-teaching · Enter the designation',
  },
  async () => {
    await go('/staff')
    await click(page, /^add staff/i)
    await dialog().locator('button[type=submit]').click()
    for (const text of [
      'Enter the full name',
      'Enter a valid 10-digit mobile number',
      'Choose at least one role',
      'Choose teaching or non-teaching',
      'Enter the designation',
    ]) {
      await see(text, dialog())
    }
  }
)
await test(
  {
    id: 'SF-02',
    module: 'Staff',
    type: 'Add',
    title: 'Add a teacher',
    steps: `RT Teacher ${RUN}, ${mobile(5)}, role Teacher, teaching, BT Assistant, no invite.`,
    expected: 'Staff profile opens with the employee number',
  },
  async () => {
    const form = dialog()
    await fill(form, /^Full name/, `RT Teacher ${RUN}`)
    await fill(form, /^Mobile/, mobile(5))
    await form.getByRole('button', { name: 'Teacher', exact: true }).click()
    await pick(form, 'Staff type', /^Teaching/)
    await fill(form, /^Designation/, 'BT Assistant')
    const invite = form.getByRole('switch').last()
    if ((await invite.getAttribute('aria-checked')) === 'true') await invite.click()
    await form.locator('button[type=submit]').click()
    await page.waitForURL(/\/staff\/\d+/, { timeout: 10000 })
    await see(`RT Teacher ${RUN}`)
    await see(/-EMP-\d{4}/)
    staffUrl = new URL(page.url()).pathname
    created.staff.push(Number(staffUrl.split('/').pop()))
  }
)
await test(
  {
    id: 'SF-03',
    keepOpen: true,
    module: 'Staff',
    type: 'Validation',
    title: 'Bank details: wrong IFSC and account number',
    steps: 'Bank tab → Edit → IFSC ABC, account 12 → Save.',
    expected: 'IFSC and account number messages show',
  },
  async () => {
    if (!staffUrl) throw new Error('No staff from SF-02')
    await go(`${staffUrl}?tab=bank`)
    await page
      .getByRole('button', { name: /bank (details|accounts?)/i })
      .first()
      .click()
    await fill(dialog(), /holder/i, 'RT Teacher')
    await fill(dialog(), /^Bank\*?$/, 'Indian Bank')
    await fill(dialog(), /IFSC/i, 'ABC')
    await fill(dialog(), /^Account number/i, '12')
    await dialog().locator('button[type=submit]').click()
    await see(/IFSC/i, dialog())
    await see(/9 to 18 digits/i, dialog())
  }
)
await test(
  {
    id: 'SF-04',
    module: 'Staff',
    type: 'Add',
    title: 'Save bank details; only last 4 digits show',
    steps: 'IFSC IDIB000A045, account 6012349876 → Save.',
    expected: 'Bank tab shows XXXX9876',
  },
  async () => {
    await fill(dialog(), /IFSC/i, 'IDIB000A045')
    await fill(dialog(), /^Account number/i, '6012349876')
    await dialog().locator('button[type=submit]').click()
    await dialog().waitFor({ state: 'detached', timeout: 8000 })
    await see('XXXX9876')
  }
)
await test(
  {
    id: 'SF-05',
    module: 'Staff',
    type: 'Add',
    title: 'Upload a staff document and verify it',
    steps: 'Documents tab → Add document → PDF → Upload → Verify.',
    expected: 'Document shows Verified',
  },
  async () => {
    await go(`${staffUrl}?tab=documents`)
    await click(page, /^add document/i)
    await dialog().locator('input[type=file]').setInputFiles(samplePdf)
    await click(dialog(), /^upload$/i)
    await see('Document added')
    await click(page, /^verify$/i)
    await see(/verified$/i)
  }
)
await test(
  {
    id: 'SF-06',
    module: 'Staff',
    type: 'View',
    title: 'Need attention card filters the list',
    steps: 'Staff → click Need attention card.',
    expected: 'URL has needs_attention=true and the list shows attention badges',
  },
  async () => {
    await go('/staff')
    await page
      .getByRole('button', { name: /need attention/i })
      .first()
      .click()
    await page.waitForURL(/needs_attention=true/, { timeout: 8000 })
    await see(
      /Bank details missing|Documents to check|No documents|Overloaded|Document rejected|No classes/
    )
  }
)
await test(
  {
    id: 'SF-07',
    module: 'Teacher assignments',
    type: 'View',
    title: 'Assignment matrix shows sections, subjects and teacher loads',
    steps: 'People → Teacher assignments.',
    expected: 'Section 6 - A with Mathematics and teacher list with loads',
  },
  async () => {
    await go('/staff/assignments')
    await see('Mathematics')
    await see('Priya Venkatesh')
  }
)

await test(
  {
    id: 'FL-01',
    module: 'Bus tracking',
    type: 'View',
    title: 'Bus tracking page shows live state cards and the bus list',
    steps: 'Fleet → Bus tracking.',
    expected: 'Buses, Moving now, Stopped and Offline cards, and the bus list',
  },
  async () => {
    await go('/fleet')
    await see('Moving now')
    await see('Offline')
    await see(/Truck 01|No buses yet/)
  }
)
await test(
  {
    id: 'FL-02',
    module: 'Bus tracking',
    type: 'View',
    title: 'MQTT console and system status are gone from the admin web',
    steps: 'Open the sidebar and /console.',
    expected: 'No MQTT console or Devices menu, no API/Database/MQTT status panel',
  },
  async () => {
    await go('/')
    const nav = page.getByRole('navigation').first()
    for (const text of ['MQTT console', 'Devices']) {
      if (await nav.getByText(text, { exact: true }).count())
        throw new Error(`${text} still in the menu`)
    }
    if (await page.getByText('All systems up').count()) throw new Error('Status chip still shown')
    await go('/console')
    await see(/not found|could not find|404/i)
  }
)

const superAdmin = await signedInContext('9999999999', '.auth-super.json')
{
  const previous = page
  page = superAdmin.page
  await test(
    {
      id: 'SC-01',
      keepOpen: true,
      module: 'Schools',
      type: 'Validation',
      title: 'Add school with nothing filled',
      steps: 'Super admin → Schools → Add school → Create school.',
      expected: 'Enter the school name · 2 to 20 letters or digits',
    },
    async () => {
      await go('/schools')
      await click(page, /^add school/i)
      await click(dialog(), /^create school$/i)
      await see('Enter the school name', dialog())
      await see('2 to 20 letters or digits', dialog())
    }
  )
  await test(
    {
      id: 'SC-02',
      module: 'Schools',
      type: 'Validation',
      title: 'School admin needs both name and a valid mobile',
      steps: 'Admin name filled, mobile 123 → Create school.',
      expected: 'Enter a valid 10-digit mobile',
    },
    async () => {
      await fill(dialog(), /^School name/, 'RT School')
      await fill(dialog(), /^Code/, `RT${RUN}`)
      await fill(dialog(), /^First admin name/, 'RT Admin')
      await fill(dialog(), /^First admin mobile/, '123')
      await click(dialog(), /^create school$/i)
      await see('Enter a valid 10-digit mobile', dialog())
    }
  )
  page = previous
}

const D4 = (meta, fn) => test({ ...meta, day: 'Day 4' }, fn)
const istToday = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
const lastSchoolDay =
  new Date(`${istToday}T00:00:00Z`).getUTCDay() === 0
    ? new Date(Date.parse(`${istToday}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
    : istToday

await D4(
  {
    id: 'AT-01',
    module: 'Attendance',
    type: 'View',
    title: 'Attendance board lists sections with totals',
    steps: `Open Attendance for ${lastSchoolDay}.`,
    expected: 'Insight cards and the section list with Class 6 - A',
  },
  async () => {
    await go(`/attendance?tab=students&date=${lastSchoolDay}`)
    await see('Sections not marked')
    await see('Class 6 - A')
  }
)
await D4(
  {
    id: 'AT-02',
    module: 'Attendance',
    type: 'Add',
    title: 'Mark a section all present and save',
    steps: 'Click Class 6 - A, click All present, click Save attendance.',
    expected: 'Toast "Attendance saved"',
    keepOpen: true,
  },
  async () => {
    await page.getByText('Class 6 - A').locator('visible=true').first().click()
    await see('Mark attendance', dialog())
    await click(dialog(), 'All present')
    await click(dialog(), 'Save attendance')
    await see(/Attendance saved/)
  }
)
await D4(
  {
    id: 'AT-03',
    module: 'Attendance',
    type: 'View',
    title: 'Monthly report of a section',
    steps: 'In the section sheet, switch to Monthly report.',
    expected: 'School days marked and a % per student',
  },
  async () => {
    await dialog().getByRole('radio', { name: 'Monthly report' }).click()
    await see(/school days marked/, dialog())
  }
)
await D4(
  {
    id: 'AT-04',
    module: 'Staff attendance',
    type: 'Validation',
    title: 'Correct staff attendance needs a reason',
    steps: 'Staff tab, click Correct on the first row, Save correction with no reason.',
    expected: '"Give a reason of at least 3 characters"',
  },
  async () => {
    await go(`/attendance?tab=staff&date=${lastSchoolDay}`)
    await see('Staff check-ins')
    await page.getByRole('button', { name: /^Correct attendance for/ }).first().click()
    await click(dialog(), 'Save correction')
    await see('Give a reason of at least 3 characters', dialog())
  }
)
await D4(
  {
    id: 'AT-05',
    module: 'Leave requests',
    type: 'View',
    title: 'Admin leave requests show staff leave only',
    steps: 'Attendance, Leave requests.',
    expected: 'Staff leave list with the note that class teachers approve student leave; no Student leave switch',
  },
  async () => {
    await go('/attendance?tab=leave')
    await see('Student leave from parents is approved by the class teacher')
    if (await page.getByText('Student leave', { exact: true }).count()) {
      throw new Error('Student leave switch is still shown')
    }
  }
)
await D4(
  {
    id: 'AT-06',
    module: 'Staff leave',
    type: 'View',
    title: 'Staff leave shows the approval stage',
    steps: 'Leave requests, Staff leave.',
    expected: 'The waiting request shows "Waiting for principal"',
  },
  async () => {
    await go('/attendance?tab=leave&leave=staff&status=pending_principal')
    await see('Waiting for principal')
  }
)
await D4(
  {
    id: 'TT-01',
    module: 'Timetable',
    type: 'View',
    title: 'Timetable builder shows the week',
    steps: 'Open Timetable, choose Class 6, then Section A.',
    expected: 'Grid "Timetable of 6 - A"',
  },
  async () => {
    await go('/timetable?tab=builder')
    await pick(page, 'Class', /^Class 6$/)
    await pick(page, 'Section', /^Section A$/)
    await page.getByLabel('Timetable of 6 - A').waitFor({ timeout: 8000 })
  }
)
await D4(
  {
    id: 'TT-02',
    module: 'Timetable',
    type: 'Validation',
    title: 'Saving a period needs a subject',
    steps: 'Click an empty period, Save period with no subject.',
    expected: '"Choose a subject"',
  },
  async () => {
    await page.getByRole('button', { name: /, empty$/ }).first().click()
    await click(dialog(), 'Save period')
    await see('Choose a subject', dialog())
  }
)
await D4(
  {
    id: 'TT-03',
    module: 'Timetable',
    type: 'Validation',
    title: 'Teacher clash is blocked',
    steps: 'Section 6 - B, Monday Period 1, any subject, teacher Priya Venkatesh (teaches 6 - A then), Save period.',
    expected: 'Toast "Priya Venkatesh already teaches 6 - A in period 1 on Monday"; nothing saved',
  },
  async () => {
    await go('/timetable?tab=builder')
    await pick(page, 'Class', /^Class 6$/)
    await pick(page, 'Section', /^Section B$/)
    await page.getByRole('button', { name: /^Monday Period 1/ }).first().click()
    await dialog().getByRole('combobox', { name: 'Subject' }).click()
    await page.getByRole('option').first().click()
    await pick(dialog(), 'Teacher', /^Priya Venkatesh$/)
    await click(dialog(), 'Save period')
    await see(/already teaches 6 - A/)
  }
)
await D4(
  {
    id: 'TT-06',
    module: 'Timetable',
    type: 'View',
    title: 'Subject picker lists school subjects even when the class has none chosen',
    steps: 'Builder, Class 12 - A (no class subjects), click Monday Period 1, open Subject.',
    expected: 'School subjects listed with "Not in class plan", not "No match"',
  },
  async () => {
    await go('/timetable?tab=builder')
    await pick(page, 'Class', /^Class 12$/)
    await pick(page, 'Section', /^Section A$/)
    await page.getByRole('button', { name: /^Monday Period 1/ }).first().click()
    await dialog().getByRole('combobox', { name: 'Subject' }).click()
    await page.getByRole('option', { name: /Mathematics/ }).first().waitFor({ timeout: 8000 })
  }
)
await D4(
  {
    id: 'TT-04',
    module: 'Timetable',
    type: 'View',
    title: 'Workload report',
    steps: 'Timetable, Workload tab.',
    expected: 'Teacher workload table with Mon to Sat counts',
  },
  async () => {
    await go('/timetable?tab=workload')
    await see('Teacher workload')
    await see('Priya Venkatesh')
  }
)
await D4(
  {
    id: 'TT-05',
    module: 'Timetable',
    type: 'View',
    title: 'Bell schedule can be saved',
    steps: 'Bell schedule, Save bell schedule.',
    expected: 'Schedule saved',
  },
  async () => {
    await go('/timetable?tab=bells')
    const save = page.getByRole('button', { name: 'Save bell schedule' })
    await save.waitFor({ timeout: 10000 })
    if (await save.isEnabled()) throw new Error('Save is on before any change')
    const name = page.getByRole('textbox', { name: 'Name' }).first()
    const original = (await name.inputValue()).replace(/ x$/, '')
    await name.fill(`${original} x`)
    await save.click()
    await see(/saved/)
    await page.reload()
    await save.waitFor({ timeout: 10000 })
    await page.waitForTimeout(800)
    await name.fill(original)
    await save.click()
    await see(/saved/)
  }
)

await D4(
  {
    id: 'ST-21',
    module: 'Students',
    type: 'View',
    title: 'Add student form has Identification marks',
    steps: 'Students, Add student.',
    expected: 'Identification marks field with the TC hint',
  },
  async () => {
    await go('/students')
    await click(page, /^Add student/)
    await dialog().getByLabel('Identification marks').waitFor({ timeout: 8000 })
    await see('Printed on the TC', dialog())
  }
)
await D4(
  {
    id: 'PR-01',
    module: 'Promotion',
    type: 'Add',
    title: 'Promote offers to add next year sections when there are none',
    steps: 'Students, Bulk actions, Promote to next year, Class UKG → Class 1.',
    expected: 'Section hint is a button "Add … for <next year>" instead of a dead end',
  },
  async () => {
    await go('/students')
    await click(page, /Bulk actions/)
    await page.getByRole('menuitem', { name: /Promote/ }).first().click()
    await pick(dialog(), 'Class this year', /^Class UKG/)
    await dialog().getByRole('button', { name: /^Add .+ for \d{4}-\d{2}$/ }).waitFor({ timeout: 8000 })
  }
)

const D5 = (meta, fn) => test({ ...meta, day: 'Day 5' }, fn)
const sessionToken = async (file) => {
  const stateFile = path.join(ROOT, file)
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  const entry = state.origins.flatMap((origin) => origin.localStorage).find((item) => item.name === 'tz-session')
  const refreshed = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: JSON.parse(entry.value).refreshToken }),
  }).then((response) => response.json())
  if (!refreshed.data) throw new Error(`Session in ${file} has ended`)
  entry.value = JSON.stringify({ accessToken: refreshed.data.access_token, refreshToken: refreshed.data.refresh_token })
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
  return refreshed.data.access_token
}
const asUser = (token) => async (method, url, body) =>
  fetch(`${BASE}/api/v1${url}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then((response) => response.json())
const nextSchoolDay5 = (() => {
  for (let offset = 1; ; offset += 1) {
    const date = new Date(Date.now() + 5.5 * 3600 * 1000 + offset * 86400000).toISOString().slice(0, 10)
    if (new Date(`${date}T00:00:00Z`).getUTCDay() !== 0) return date
  }
})()

await D5(
  {
    id: 'SB-01',
    module: 'Substitutes',
    type: 'View',
    title: 'Substitutes board shows the teacher on leave and their periods',
    steps: `Open Substitutes for ${nextSchoolDay5}.`,
    expected: 'Insight cards and a card for the teacher on leave with the leave type',
  },
  async () => {
    const board = await api('GET', `/admin/substitutes?date=${nextSchoolDay5}`)
    if (!board.data?.absent_teachers) {
      const teacher = asUser(await sessionToken('.auth-teacher.json'))
      const balances = (await teacher('GET', '/mobile/teacher/leave-balances')).data ?? []
      const type = balances.find((item) => item.remaining > 0 && item.leave_type?.is_paid)
      const applied = await teacher('POST', '/mobile/teacher/leaves', {
        leave_type_id: type.leave_type.id,
        from_date: nextSchoolDay5,
        to_date: nextSchoolDay5,
        half_day: false,
        reason: 'Regression proxy check',
      })
      if (!applied.data) throw new Error(`Could not apply a test leave: ${applied.message}`)
      const decided = await api('POST', `/admin/staff-leaves/${applied.data.id}/decision`, { status: 'approved' })
      if (decided.data?.status !== 'approved') throw new Error(`Test leave not approved: ${decided.message}`)
    }
    await go(`/substitutes?date=${nextSchoolDay5}`)
    await see('Teachers away')
    await see(/Casual leave|Sick leave|Earned leave/)
  }
)
const aoSubContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: path.join(ROOT, '.auth-ao.json'),
})
const adminPage = page
page = await aoSubContext.newPage()
await go(`/substitutes?date=${nextSchoolDay5}`)
await see('Teachers away')
await D5(
  {
    id: 'SB-02',
    module: 'Substitutes',
    type: 'Validation',
    title: 'Assigning needs a teacher',
    steps: 'As the AO, click Assign on a period, then Assign substitute without choosing.',
    expected: '"Choose a teacher to take this period"',
  },
  async () => {
    await page.getByRole('button', { name: /^Assign a proxy or combine the class for period/ }).first().click()
    await click(dialog(), 'Assign proxy')
    await see('Choose a teacher to take this period', dialog())
  }
)
await D5(
  {
    id: 'SB-03',
    module: 'Substitutes',
    type: 'Add',
    title: 'Assign the best free teacher, then remove',
    steps: 'As the AO, Assign, pick the first free teacher, Assign substitute; then Remove.',
    expected: 'Toast "… will take period …", then "… removed from period …"',
  },
  async () => {
    await page.getByRole('button', { name: /^Assign a proxy or combine the class for period/ }).first().click()
    await dialog().getByRole('radiogroup', { name: 'Free teachers' }).getByRole('radio').first().click()
    await click(dialog(), 'Assign proxy')
    await see(/will take period/)
    await page.getByRole('button', { name: /^Remove .+ from period/ }).first().click()
    const confirm = page.getByRole('alertdialog')
    if (await confirm.count()) await confirm.getByRole('button', { name: /Remove/ }).last().click()
    await see(/removed from period/)
  }
)
await aoSubContext.storageState({ path: path.join(ROOT, '.auth-ao.json') }).catch(() => null)

await aoSubContext.close()
page = adminPage
await D5(
  {
    id: 'PY-01',
    module: 'Payroll',
    type: 'Validation',
    title: 'Salary needs a basic pay',
    steps: 'Payroll, Salaries, No salary filter, Set salary, Save salary with basic empty.',
    expected: '"Enter the basic pay"',
  },
  async () => {
    await go('/payroll?tab=salaries&salary=missing')
    await see('Not set')
    await page.getByRole('button', { name: /^Set salary for/ }).first().click()
    await click(dialog(), 'Save salary')
    await see('Enter the basic pay', dialog())
  }
)
await D5(
  {
    id: 'PY-02',
    module: 'Payroll',
    type: 'Add',
    title: 'Run payroll for October 2026 as a draft, then delete it',
    steps: 'Payroll runs, Month October 2026, Run payroll; then Delete draft.',
    expected: 'Draft run opens with payslips; deleting shows "Draft payroll deleted"',
  },
  async () => {
    await go('/payroll?tab=runs')
    const runs = await api('GET', '/admin/payroll/runs?limit=50')
    const finals = new Set((runs.data?.items ?? runs.data ?? []).filter((run) => run.status === 'final').map((run) => run.month))
    await page.getByRole('combobox', { name: 'Month' }).first().click()
    const options = await page.getByRole('option').allInnerTexts()
    const label = options.map((text) => text.trim()).find((text) => {
      const [name, year] = text.split(' ')
      const month = `${year}-${String(new Date(`${name} 1, ${year}`).getMonth() + 1).padStart(2, '0')}`
      return !finals.has(month)
    })
    if (!label) throw new Error('Every month in the list is already final')
    await page.getByRole('option', { name: label }).first().click()
    await click(page, 'Run payroll')
    await see(`${label} payroll`)
    await see('Payslips')
    await click(page, 'Delete draft')
    const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog'))
    await confirm.getByRole('button', { name: 'Delete draft' }).last().click()
    await see('Draft payroll deleted')
  }
)
await D5(
  {
    id: 'PY-03',
    module: 'Payroll',
    type: 'View',
    title: 'Final September run shows payslips with a PDF button',
    steps: 'Payroll runs, open September 2026.',
    expected: 'Final badge, payslip table and PDF buttons',
  },
  async () => {
    await go('/payroll?tab=runs')
    await page.getByRole('row', { name: /September 2026/ }).first().click()
    await see('September 2026 payroll')
    await page.getByRole('button', { name: /^Payslip PDF for/ }).first().waitFor({ timeout: 8000 })
  }
)

await D5(
  {
    id: 'TR-01',
    module: 'Transport',
    type: 'View',
    title: 'Buses list shows documents worst first',
    steps: 'Open Buses and routes.',
    expected: 'Both demo buses with expiry badges such as "Fitness Expired"',
  },
  async () => {
    await go('/transport?tab=buses')
    await see('TN 09 AB 1234')
    await see('Expired')
  }
)
await D5(
  {
    id: 'TR-02',
    module: 'Transport',
    type: 'Validation',
    title: 'Add bus with nothing filled',
    steps: 'Add bus, Add bus with empty fields.',
    expected: 'Registration, name and seats messages',
  },
  async () => {
    await click(page, 'Add bus')
    await dialog().getByLabel('Seats').fill('')
    await dialog().getByRole('button', { name: 'Add bus' }).click()
    await see('Enter the registration like TN 09 AB 1234', dialog())
    await see('Enter a short name, like Bus 1', dialog())
  }
)
await D5(
  {
    id: 'TR-03',
    module: 'Transport',
    type: 'Validation',
    title: 'Same registration twice is refused',
    steps: 'Add bus TN 09 AB 1234 again.',
    expected: '"TN 09 AB 1234 is already added" under the registration',
  },
  async () => {
    await click(page, 'Add bus')
    await fill(dialog(), 'Registration number', 'TN 09 AB 1234')
    await fill(dialog(), 'Bus name', 'Copy')
    await dialog().getByRole('button', { name: 'Add bus' }).click()
    await see('TN 09 AB 1234 is already added', dialog())
  }
)
await D5(
  {
    id: 'TR-04',
    module: 'Transport',
    type: 'View',
    title: 'Route builder draws the route on the map',
    steps: 'Routes, Open builder on R1.',
    expected: 'Map with numbered stop pins, school pin and the stop list',
  },
  async () => {
    await go('/transport?tab=routes')
    await page.getByRole('row', { name: /R1/ }).getByRole('link', { name: 'Open builder' }).or(page.getByRole('row', { name: /R1/ }).getByRole('button', { name: 'Open builder' })).first().click()
    await page.getByLabel('Route map').waitFor({ timeout: 8000 })
    await page.getByLabel(/^Stop 1: /).first().waitFor({ timeout: 8000 })
    await page.getByLabel('Stops in travel order').waitFor()
    await see('All changes saved')
  }
)
await D5(
  {
    id: 'TR-05',
    module: 'Transport',
    type: 'Validation',
    title: 'A new stop needs a name',
    steps: 'Click the map, then Add stop with no name.',
    expected: '"Enter the stop name"; nothing saved',
    keepOpen: true,
  },
  async () => {
    const map = page.getByLabel('Route map')
    const box = await map.boundingBox()
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.7)
    await dialog().getByRole('button', { name: 'Add stop' }).click()
    await see('Enter the stop name', dialog())
    await page.keyboard.press('Escape')
  }
)
await D5(
  {
    id: 'TR-06',
    module: 'Transport',
    type: 'View',
    title: 'Students on the bus list loads with filters',
    steps: 'Students tab, filter by route R1.',
    expected: 'Rows with route, stop and fee',
  },
  async () => {
    await go('/transport?tab=students')
    await see('Fee a month')
    await pick(page, 'Filter by route', /R1/)
    await see('Mogappair')
  }
)

const D6 = (meta, fn) => test({ ...meta, day: 'Day 6' }, fn)
await D6(
  {
    id: 'LT-01',
    module: 'Live trips',
    type: 'View',
    title: 'Bus tracking is live and lists today’s trips',
    steps: 'Open Bus tracking.',
    expected: 'Live badge and the Trips today panel',
  },
  async () => {
    await go('/fleet')
    await see('Trips today')
    await page.getByRole('status', { name: 'Live updates on' }).waitFor({ timeout: 10000 })
  }
)
await D6(
  {
    id: 'LT-02',
    module: 'Live trips',
    type: 'Validation',
    title: 'Starting a trip needs a route',
    steps: 'Bus tracking, Start trip, submit with no route.',
    expected: '"Choose a route"',
  },
  async () => {
    await go('/fleet')
    await click(page, 'Start trip')
    await dialog().getByRole('button', { name: 'Start trip' }).click()
    await see('Choose a route', dialog())
  }
)
await D6(
  {
    id: 'LT-03',
    module: 'Live trips',
    type: 'View',
    title: 'Trip page shows the stop timeline and events',
    steps: 'Open the latest trip.',
    expected: 'Stops in travel order, Events and Not boarded sections',
  },
  async () => {
    const latest = (await api('GET', '/admin/transport/trips?limit=1')).data?.items?.[0]
    if (!latest) return
    await go(`/fleet/trips/${latest.id}`)
    await page.getByLabel('Stops in travel order').waitFor({ timeout: 8000 })
    await page.getByLabel('Trip events').waitFor()
    await see('Not boarded')
  }
)

const TA = (meta, fn) => test({ ...meta, day: 'Teacher app' }, fn)
await TA(
  {
    id: 'EX-01',
    module: 'Exams',
    type: 'View',
    title: 'Exams page lists exams with tabs for marks and results',
    steps: 'Open Exams.',
    expected: 'Exams, Marks entry and Results tabs',
  },
  async () => {
    await go('/exams')
    await page.getByRole('tab', { name: 'Marks entry' }).waitFor({ timeout: 8000 })
    await page.getByRole('tab', { name: 'Results' }).waitFor()
  }
)
await TA(
  {
    id: 'EX-02',
    module: 'Exams',
    type: 'Validation',
    title: 'New exam needs a name and dates',
    steps: 'Exams, New exam, submit empty.',
    expected: '"Enter the exam name"',
  },
  async () => {
    await go('/exams')
    await click(page, 'New exam')
    await dialog().getByRole('button', { name: 'Create exam' }).click()
    await see('Enter the exam name', dialog())
  }
)
await TA(
  {
    id: 'EX-03',
    module: 'Exams',
    type: 'View',
    title: 'Dashboard shows the top rank holders',
    steps: 'Open the dashboard.',
    expected: '"Top rank holders" card',
  },
  async () => {
    await go('/')
    await see('Top rank holders')
  }
)
await TA(
  {
    id: 'EX-04',
    module: 'Exams',
    type: 'Filter',
    title: 'Result cards filter the ranking table',
    steps: 'Exams, Results, click Passed, then click it again.',
    expected: 'Only Pass rows while active; all rows after the second click',
  },
  async () => {
    await go('/exams?tab=results')
    const passed = page.getByRole('button', { name: /^Passed/ })
    await passed.waitFor({ timeout: 8000 })
    const rows = page.locator('table tbody tr')
    await rows.first().waitFor({ timeout: 8000 })
    const all = await rows.count()
    await passed.click()
    await page.waitForTimeout(400)
    if ((await passed.getAttribute('aria-pressed')) !== 'true') throw new Error('Card did not turn on')
    const results = await page.locator('table tbody tr td:nth-last-child(2)').allInnerTexts()
    if (results.some((text) => text.trim() !== 'Pass')) throw new Error(`Non-pass rows shown: ${results.join(',')}`)
    await passed.click()
    await page.waitForTimeout(400)
    if ((await rows.count()) !== all) throw new Error('All rows did not come back')
  }
)
await TA(
  {
    id: 'IN-01',
    module: 'Insight cards',
    type: 'View',
    title: 'Clicking an insight card brings its list into view',
    steps: 'Students, click the first insight card.',
    expected: 'Page scrolls down to the list instead of jumping to the top',
  },
  async () => {
    await go('/students')
    const card = page.locator('div.grid.grid-cols-2 > button[aria-pressed]').first()
    await card.waitFor({ timeout: 8000 })
    await card.click()
    await page.waitForTimeout(900)
    const top = await card.evaluate((el) => {
      const list = el.parentElement.nextElementSibling
      return Math.round(list.getBoundingClientRect().top)
    })
    const room = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY)
    if (Math.abs(top - 80) > 30 && room > 2) throw new Error(`List is ${top}px from the top`)
    await card.click()
  }
)
await TA(
  {
    id: 'FE-01',
    module: 'Fees',
    type: 'View',
    title: 'Fees page with dues, plans and payments',
    steps: 'Open Fees.',
    expected: 'Dues, Fee plans and Payments tabs',
  },
  async () => {
    await go('/fees')
    await page.getByRole('tab', { name: 'Fee plans' }).waitFor({ timeout: 8000 })
    await page.getByRole('tab', { name: 'Payments' }).waitFor()
  }
)
await TA(
  {
    id: 'FE-02',
    module: 'Fees',
    type: 'Validation',
    title: 'Fee head needs a name',
    steps: 'Fees, Fee plans, Add head, submit empty.',
    expected: '"Enter a name of at least 2 letters"',
  },
  async () => {
    await go('/fees?tab=plans')
    await click(page, 'Add head')
    await dialog().getByRole('button', { name: 'Add head' }).last().click()
    await see('Enter a name of at least 2 letters', dialog())
  }
)
await TA(
  {
    id: 'AC-01',
    module: 'Achievements',
    type: 'Validation',
    title: 'Achievement needs a title',
    steps: 'Student, Achievements tab, Add achievement, submit empty.',
    expected: '"Enter the achievement, at least 3 letters"',
  },
  async () => {
    const target = (await api('GET', '/admin/students?limit=1')).data.items[0]
    await go(`/students/${target.id}?tab=achievements`)
    await click(page, 'Add achievement')
    await dialog().getByRole('button', { name: 'Save' }).click()
    await see('Enter the achievement, at least 3 letters', dialog())
  }
)
await TA(
  {
    id: 'AC-02',
    module: 'Achievements',
    type: 'Add',
    title: 'Add an achievement from the student page',
    steps: 'Achievements tab, fill title, level State, position, save; then delete it.',
    expected: 'Card with the title and "State level"',
  },
  async () => {
    const target = (await api('GET', '/admin/students?limit=1')).data.items[0]
    await go(`/students/${target.id}?tab=achievements`)
    await click(page, 'Add achievement')
    const title = `RT state chess ${Date.now() % 100000}`
    await fill(dialog(), 'Achievement', title)
    await pick(dialog(), 'Level', 'State')
    await fill(dialog(), 'Position', '1st place')
    await dialog().getByRole('button', { name: 'Save' }).click()
    await see(title)
    await see('State level')
    const saved = (await api('GET', `/admin/students/${target.id}/achievements`)).data.find(
      (item) => item.title === title
    )
    if (saved) await api('DELETE', `/admin/students/${target.id}/achievements/${saved.id}`)
  }
)
await TA(
  {
    id: 'AC-03',
    module: 'Student records',
    type: 'View',
    title: 'Student page has Results and Fees tabs',
    steps: 'Open a student.',
    expected: 'Results and Fees tabs visible',
  },
  async () => {
    const target = (await api('GET', '/admin/students?limit=1')).data.items[0]
    await go(`/students/${target.id}`)
    await page.getByRole('tab', { name: /Results/ }).waitFor({ timeout: 8000 })
    await page.getByRole('tab', { name: /Fees/ }).waitFor()
    await page.getByRole('tab', { name: /Achievements/ }).waitFor()
  }
)

await TA(
  {
    id: 'SL-01',
    module: 'School logo',
    type: 'View',
    title: 'School profile has a logo upload',
    steps: 'School setup, School profile.',
    expected: '"School logo" with Upload or Change logo',
  },
  async () => {
    await go('/setup?tab=profile')
    await see('School logo')
    await page.getByText(/Upload logo|Change logo/).first().waitFor({ timeout: 8000 })
  }
)
await TA(
  {
    id: 'SB-04',
    module: 'Substitutes',
    type: 'View',
    title: 'School admin sees that only the AO assigns substitutes',
    steps: 'Open Substitutes as the school admin.',
    expected: 'Notice "Only the Administrative officer (AO) or the super admin assigns proxies"',
  },
  async () => {
    await go('/substitutes')
    const sunday = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCDay() === 0
    if (sunday) return
    await see('Only the Administrative officer (AO) or the super admin assigns proxies')
  }
)
{
  const aoContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: path.join(ROOT, '.auth-ao.json'),
  })
  const previous = page
  page = await aoContext.newPage()
  await TA(
    {
      id: 'AO-01',
      module: 'AO access',
      type: 'View',
      title: 'AO menu hides payroll and users',
      steps: 'Sign in as the AO and open the dashboard.',
      expected: 'Students, Substitutes and Fees in the menu; no Payroll or Users & access',
    },
    async () => {
      await go('/')
      const nav = page.getByRole('navigation').first()
      await nav.getByRole('link', { name: 'Proxy' }).waitFor({ timeout: 10000 })
      await nav.getByRole('link', { name: 'Fees' }).waitFor()
      if (await nav.getByRole('link', { name: 'Payroll' }).count()) throw new Error('Payroll is shown')
      if (await nav.getByRole('link', { name: /Users/ }).count()) throw new Error('Users & access is shown')
    }
  )
  await TA(
    {
      id: 'AO-02',
      module: 'Substitutes',
      type: 'View',
      title: 'AO can assign substitutes',
      steps: 'Open Substitutes as the AO.',
      expected: 'No "only the AO" notice',
    },
    async () => {
      await go('/substitutes')
      await see('Teachers away')
      await page.waitForTimeout(800)
      if (await page.getByText('Only the Administrative officer (AO) or the super admin assigns proxies').count())
        throw new Error('AO is told it cannot assign')
    }
  )
  const combineCase = await (async () => {
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(Date.now() + 5.5 * 3600 * 1000 + offset * 86400000).toISOString().slice(0, 10)
      const board = (await api('GET', `/admin/substitutes?date=${day}`)).data
      for (const period of (board?.teachers ?? []).flatMap((item) => item.periods)) {
        if (period.substitution_id) continue
        const options = (await api('GET', `/admin/substitutes/combine-options?date=${day}&slot_id=${period.slot_id}`)).data
        if (options?.targets.length >= 1) return { day, period, options }
      }
    }
    return null
  })()
  await TA(
    {
      id: 'CB-01',
      module: 'Combine class',
      type: 'Validation',
      title: 'Combining needs a section',
      steps: 'As the AO, Proxy, Assign on a period, Combine class, Combine class without choosing.',
      expected: '"Choose the section the class joins"',
    },
    async () => {
      if (!combineCase) return
      await go(`/substitutes?date=${combineCase.day}`)
      await page.getByRole('button', { name: `Assign a proxy or combine the class for period ${combineCase.period.period_no}` }).first().click()
      await dialog().getByRole('radio', { name: 'Combine class' }).click()
      await see(`${combineCase.options.students.boys} boys`, dialog())
      await dialog().getByRole('button', { name: 'Combine class' }).last().click()
      await see('Choose the section the class joins', dialog())
    }
  )
  await TA(
    {
      id: 'CB-02',
      module: 'Combine class',
      type: 'Add',
      title: 'Combine the whole class with another section, then remove',
      steps: 'Combine class, Whole class to one section, choose the first section, Combine class; then Remove.',
      expected: '"Combined class" with "Whole class … →", then removed',
    },
    async () => {
      if (!combineCase) return
      const target = combineCase.options.targets[0].section.name
      await go(`/substitutes?date=${combineCase.day}`)
      await page.getByRole('button', { name: `Assign a proxy or combine the class for period ${combineCase.period.period_no}` }).first().click()
      await dialog().getByRole('radio', { name: 'Combine class' }).click()
      await pick(dialog(), 'Sit with section', target)
      await dialog().getByRole('button', { name: 'Combine class' }).last().click()
      await see(/combined$/)
      await see(`→ ${target}`)
      await page.getByRole('button', { name: `Remove the combined class from period ${combineCase.period.period_no}` }).first().click()
      const confirm = page.getByRole('alertdialog')
      if (await confirm.count()) await confirm.getByRole('button', { name: /Remove/ }).last().click()
      await see('Combined class removed')
    }
  )
  await aoContext.storageState({ path: path.join(ROOT, '.auth-ao.json') }).catch(() => null)

  await aoContext.close()
  page = previous
}
{
  const state = await superAdmin.context.storageState()
  for (const origin of state.origins)
    origin.localStorage = origin.localStorage.filter((item) => item.name !== 'tz-school-id')
  const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: state })
  const previous = page
  page = await fresh.newPage()
  await TA(
    {
      id: 'SG-01',
      module: 'Super admin',
      type: 'View',
      title: 'Super admin sign-in opens a school without "Choose a school first" errors',
      steps: 'Open the dashboard as the super admin with no school picked yet.',
      expected: 'First school picked automatically, no SCHOOL_REQUIRED calls or toasts',
    },
    async () => {
      const failed = []
      page.on('response', (response) => {
        if (response.status() === 400 && response.url().includes('/api/v1/')) failed.push(response.url())
      })
      await go('/')
      await page.waitForTimeout(1500)
      if (await page.getByText('Choose a school first').count()) throw new Error('Toast shown')
      if (failed.length) throw new Error(`400 from ${failed.join(', ')}`)
      const school = await page.evaluate(() => localStorage.getItem('tz-school-id'))
      if (!school) throw new Error('No school picked')
    }
  )
  await fresh.close()
  page = previous
}
await TA(
  {
    id: 'SP-01',
    module: 'Sports and activities',
    type: 'View',
    title: 'Sports leaderboard shows the top 3 and ranks',
    steps: 'Open Sports & activities, choose Sports.',
    expected: 'Top 3 · Sports and the ranked table',
  },
  async () => {
    await go('/activities?category=sports')
    await page.getByRole('tab', { name: 'Leaderboard' }).waitFor({ timeout: 8000 })
    await see('Points')
  }
)
await TA(
  {
    id: 'SP-02',
    module: 'Sports and activities',
    type: 'Filter',
    title: 'Wins card filters the achievements list',
    steps: 'Click the Wins card.',
    expected: 'All achievements tab with only Winner results',
  },
  async () => {
    await go('/activities')
    await page.locator('div.grid.grid-cols-2 > button[aria-pressed]', { hasText: 'Wins' }).click()
    await page.getByRole('tab', { name: /All achievements/ }).waitFor()
    await page.waitForTimeout(800)
    const results = await page.locator('table tbody tr td:nth-child(4)').allInnerTexts()
    if (results.some((text) => text.trim() && text.trim() !== 'Winner')) throw new Error(results.join(','))
  }
)
await TA(
  {
    id: 'SP-03',
    module: 'Sports and activities',
    type: 'Validation',
    title: 'A sports achievement needs indoor or outdoor',
    steps: 'Student, Achievements, Add, category Sports, Save without indoor/outdoor.',
    expected: '"Choose indoor or outdoor for a sports achievement"',
  },
  async () => {
    const target = (await api('GET', '/admin/students?limit=1')).data.items[0]
    await go(`/students/${target.id}?tab=achievements`)
    await click(page, 'Add achievement')
    await fill(dialog(), 'Achievement', 'Sports day sprint')
    await pick(dialog(), 'Category', 'Sports')
    await dialog().getByRole('button', { name: 'Save' }).click()
    await see('Choose indoor or outdoor for a sports achievement', dialog())
  }
)
await TA(
  {
    id: 'SP-04',
    module: 'Sports and activities',
    type: 'View',
    title: 'Dashboard shows sports stars',
    steps: 'Open the dashboard.',
    expected: '"Sports stars" card',
  },
  async () => {
    await go('/')
    await see('Sports stars')
  }
)
const D7W = (meta, fn) => test({ ...meta, day: 'Day 7' }, fn)
await D7W(
  {
    id: 'D7-01',
    module: 'Alerts',
    type: 'View',
    title: 'Alerts centre is live with insight cards',
    steps: 'Open Fleet, Alerts.',
    expected: 'Live badge and the SOS active card; menu shows Alerts as current',
  },
  async () => {
    await go('/fleet/alerts')
    await see('SOS active')
    const current = page.locator('nav a[data-current="true"]')
    if ((await current.count()) !== 1 || !(await current.innerText()).includes('Alerts'))
      throw new Error('Menu highlight is not only Alerts')
  }
)
await D7W(
  {
    id: 'D7-02',
    module: 'Maintenance',
    type: 'Validation',
    title: 'A maintenance ticket needs a bus and a title',
    steps: 'Maintenance, Add ticket, save empty.',
    expected: 'Field errors shown in the modal',
  },
  async () => {
    await go('/fleet/maintenance')
    await page.getByRole('button', { name: /^Add ticket/ }).first().click()
    await dialog().getByRole('button', { name: /Save|Add ticket|Create/ }).last().click()
    await dialog().locator('[aria-invalid="true"], .text-destructive').first().waitFor({ timeout: 8000 })
  }
)
await D7W(
  {
    id: 'D7-03',
    module: 'Fuel log',
    type: 'View',
    title: 'Fuel log tab opens',
    steps: 'Maintenance, Fuel log.',
    expected: 'Fuel log tab selected',
  },
  async () => {
    await go('/fleet/maintenance?tab=fuel')
    await page.getByRole('tab', { name: 'Fuel log', selected: true }).waitFor({ timeout: 8000 })
  }
)
await D7W(
  {
    id: 'D7-04',
    module: 'Playback',
    type: 'View',
    title: 'Trip history opens the replay',
    steps: 'Trip history, open the latest trip replay.',
    expected: 'Replay page with the map and timeline',
  },
  async () => {
    const ended = (await api('GET', '/admin/transport/trips?limit=1&status=ended')).data?.items?.[0]
    await go('/fleet/history')
    await see('Trip history')
    if (!ended) return
    await go(`/fleet/trips/${ended.id}/playback`)
    await see('Timeline')
  }
)
const D9W = (meta, fn) => test({ ...meta, day: 'Day 9' }, fn)
await D9W(
  {
    id: 'D9-01',
    module: 'Dashboard',
    type: 'Filter',
    title: 'Attendance card opens the attendance board',
    steps: 'Dashboard, click Students present.',
    expected: 'Attendance page, students tab',
  },
  async () => {
    await go('/')
    await page.locator('div.grid.grid-cols-2 > button[aria-pressed]', { hasText: /present/i }).first().click()
    await page.waitForURL(/\/attendance/, { timeout: 8000 })
  }
)
await D9W(
  {
    id: 'D9-02',
    module: 'Parent preview',
    type: 'View',
    title: 'Parent app preview shows a child in the phone',
    steps: 'Open Parent app preview, choose the first student.',
    expected: 'Phone frame with the child’s home screen',
  },
  async () => {
    const target = (await api('GET', '/admin/students?limit=1&status=active')).data.items[0]
    await go(`/parent-preview?student=${target.id}`)
    await see(target.first_name ?? target.full_name.split(' ')[0])
  }
)
await D9W(
  {
    id: 'D9-03',
    module: 'Meetings',
    type: 'View',
    title: 'Meetings page lists meetings with insight cards',
    steps: 'Open Meetings.',
    expected: 'Meetings page loads',
  },
  async () => {
    await go('/meetings')
    await page.getByRole('heading', { name: /Meetings/ }).first().waitFor({ timeout: 8000 })
  }
)
await TA(
  {
    id: 'AB-01',
    module: 'App banners',
    type: 'Validation',
    title: 'A banner needs a title (image optional)',
    steps: 'App banners, Add banner, Save empty.',
    expected: 'Title message only; no image error',
  },
  async () => {
    await go('/app-banners')
    await page.getByRole('button', { name: /^Add banner/ }).first().click()
    await dialog().getByRole('button', { name: 'Save' }).click()
    await see('Enter a title of 3 to 80 letters', dialog())
    if (await dialog().getByText('Upload a banner image').count()) throw new Error('Image should be optional')
  }
)
await test(
  {
    id: 'BLK-01',
    module: 'Attendance',
    type: 'View',
    title: 'Staff check-ins are paged with select boxes and bulk marking',
    steps: 'Attendance, Staff tab.',
    expected: 'Page 1 of the staff, Next page, select boxes and Mark selected',
  },
  async () => {
    await go('/attendance?tab=staff')
    await page.getByRole('heading', { name: 'Staff check-ins', exact: true }).waitFor({ timeout: 8000 })
    await page.getByRole('button', { name: 'Next page' }).waitFor({ timeout: 8000 })
    await page.getByRole('checkbox', { name: /^Select (?!everyone)/ }).first().check()
    await see('Mark selected')
    await page.getByRole('button', { name: 'Mark selected' }).click()
    await see('Optional', dialog())
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'BLK-02',
    module: 'Attendance',
    type: 'View',
    title: 'Sections can be ticked and marked together',
    steps: 'Attendance, Students tab, tick a section.',
    expected: 'Mark selected opens the bulk dialog with an optional reason',
  },
  async () => {
    await go('/attendance?tab=students')
    await page.getByRole('heading', { name: 'Sections', exact: true }).waitFor({ timeout: 8000 })
    const boxes = page.getByRole('checkbox', { name: /^Select class/ })
    if (!(await boxes.count())) return
    await boxes.first().check()
    await page.getByRole('button', { name: 'Mark selected' }).click()
    await see('Status for every student', dialog())
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'SES-01',
    module: 'Attendance',
    type: 'View',
    title: 'Morning and afternoon sessions and the class report',
    steps: 'Attendance, Students tab, switch to Afternoon, open Class report.',
    expected: 'Board switches to the afternoon session; class-wise report opens with an Excel button',
  },
  async () => {
    await go('/attendance?tab=students')
    await page.getByRole('heading', { name: 'Sections', exact: true }).waitFor({ timeout: 8000 })
    await page.getByText('Afternoon · 5th period').first().click()
    await page.waitForURL(/session=afternoon/, { timeout: 8000 })
    await page.getByRole('button', { name: 'Class report' }).click()
    await see('Class-wise report')
    await page.getByRole('button', { name: 'Excel' }).waitFor({ timeout: 8000 })
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'MIS-01',
    module: 'Attendance',
    type: 'View',
    title: 'Missed filter on the board and the missed attendance report',
    steps: 'Attendance, Students tab, choose Missed, open Missed report.',
    expected: 'Only missed sections (or "Nothing missed") are shown; the report opens with the month and the class teachers',
  },
  async () => {
    await go('/attendance?tab=students')
    await page.getByRole('heading', { name: 'Sections', exact: true }).waitFor({ timeout: 8000 })
    await page.getByText('Missed', { exact: true }).first().click()
    const missedBadges = await page.getByText('Missed', { exact: true }).count()
    if (!missedBadges) await see('Nothing missed')
    await page.getByRole('button', { name: 'Missed report' }).click()
    await see('Missed attendance')
    await see('Sessions missed')
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'MIS-02',
    module: 'School setup',
    type: 'Validation',
    title: 'Attendance grace over 30 minutes is refused',
    steps: 'School setup, Profile, set Attendance grace to 45, Save profile.',
    expected: 'Field error on Attendance grace; the saved value stays the same',
  },
  async () => {
    await go('/setup?tab=profile')
    const grace = page.getByLabel('Attendance grace (minutes)')
    await grace.waitFor({ timeout: 8000 })
    const before = await grace.inputValue()
    await grace.fill('45')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await see('must not be greater than 30')
    await grace.fill(before)
  }
)
await test(
  {
    id: 'GEO-01',
    module: 'School setup',
    type: 'Add',
    title: 'School campus is set on the map, not typed',
    steps: 'School setup, Profile, click the map, move the radius slider. Do not save.',
    expected: 'Map with the school pin and circle; clicking sets the gate, the slider changes the radius, the page stays on the profile',
  },
  async () => {
    await go('/setup?tab=profile')
    const radius = page.locator('#geofence-radius')
    await radius.waitFor({ timeout: 8000 })
    await page.getByLabel('School campus map').scrollIntoViewIfNeeded()
    const read = () => radius.evaluate((input) => input.closest('div.grid')?.textContent ?? '')
    const before = await read()
    const box = await page.getByLabel('School campus map').boundingBox()
    await page.mouse.click(box.x + box.width / 2 + 50, box.y + box.height / 2 + 25)
    await page.waitForTimeout(500)
    if ((await read()) === before) throw new Error('Clicking the map did not move the gate')
    await radius.fill('400')
    await see('Campus radius: 400 m')
    await page.getByLabel('Search school or area').press('Enter')
    await page.waitForTimeout(500)
    if (!page.url().includes('tab=profile')) throw new Error('Search left the profile page')
    await go('/setup?tab=profile')
  }
)
await test(
  {
    id: 'CHY-01',
    module: 'Chat audit',
    type: 'View',
    title: 'Office can read an earlier academic year of chat',
    steps: 'Chat audit, Academic year filter.',
    expected: 'The filter offers earlier years as archived; choosing one shows the archived note',
  },
  async () => {
    await go('/chat')
    await page.getByRole('heading', { name: 'Chat audit' }).waitFor({ timeout: 8000 })
    await see('This year (')
    await go('/chat?year=1')
    await see('Archived year: these conversations are hidden from the Staff and Parent apps')
    await go('/chat')
  }
)
await test(
  {
    id: 'HW-01',
    module: 'Homework',
    type: 'View',
    title: 'Diary is now called Homework and has no review step',
    steps: 'Sidebar, Homework; School setup, Chat.',
    expected: 'Homework page without a waiting-for-review card; School setup has no Diary review options',
  },
  async () => {
    await go('/diary')
    await page.getByRole('heading', { name: 'Homework' }).waitFor({ timeout: 10000 })
    if (await page.getByText('Waiting for review').count()) throw new Error('Review card still shown')
    await go('/setup?tab=communication')
    await page.getByText('Chat office hours').waitFor({ timeout: 10000 })
    if (await page.getByText('Diary review').count()) throw new Error('Diary review options still shown')
  }
)
await test(
  {
    id: 'CP-01',
    module: 'Class performance',
    type: 'View',
    title: 'Class-wise report shows average, pass, fail and attendance',
    steps: 'Academics, Class performance.',
    expected: 'Insight cards and a row per class with Average, Pass %, Fail % and Attendance',
  },
  async () => {
    await go('/class-performance')
    await page.getByRole('heading', { name: 'Class performance' }).waitFor({ timeout: 10000 })
    for (const text of ['Average result', 'Pass rate', 'Fail rate', 'Pass %', 'Fail %'])
      await page.getByText(text, { exact: true }).first().waitFor({ timeout: 8000 })
    await page.screenshot({ path: path.join(SHOTS, 'CP-01.png'), fullPage: true })
  }
)
await test(
  {
    id: 'CP-02',
    module: 'Class performance',
    type: 'Flow',
    title: 'Below-average students can be picked for a special class',
    steps: 'Class report, click a class with students below average, tick students, Schedule extra class.',
    expected: 'Below average list with weak subjects; the special class form opens with the students ticked',
  },
  async () => {
    await go('/class-performance')
    const below = page.getByRole('button', { name: /students$/ }).first()
    await below.waitFor({ timeout: 10000 })
    await below.click()
    await page.getByText('Class average', { exact: false }).first().waitFor({ timeout: 8000 })
    await page.getByRole('checkbox', { name: 'Choose every student' }).check()
    await page.getByRole('button', { name: /Schedule extra class/ }).click()
    await page.getByRole('dialog').getByText(/chosen\)/).waitFor({ timeout: 8000 })
    await page.screenshot({ path: path.join(SHOTS, 'CP-02.png') })
    await page.getByRole('dialog').getByRole('button', { name: 'Create extra class' }).click()
    await page.getByText('Choose the teacher').waitFor({ timeout: 8000 })
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'SPX-01',
    module: 'Class performance',
    type: 'View',
    title: 'Whole-class special class form offers extra time with days, dates and hours',
    steps: 'Class performance, Special classes, choose a class, New special class.',
    expected: 'Form with Whole class chosen, Extra time, Repeats on, First and Last day, Full day / Half day / Custom hours',
  },
  async () => {
    await go('/class-performance?tab=special')
    await page.locator('#special-section').click()
    await page.getByRole('option').nth(1).click()
    await page.getByRole('button', { name: 'New special class' }).click()
    const dialog = page.getByRole('dialog')
    for (const text of ['Whole class (special class)', 'Also create for', 'Extra time', 'Repeats on', 'Hours', 'Full day'])
      await dialog.getByText(text, { exact: true }).first().waitFor({ timeout: 8000 })
    await dialog.getByRole('radio', { name: 'Full day' }).click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(SHOTS, 'SPX-01.png') })
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'TT-SP1',
    module: 'Timetable',
    type: 'View',
    title: 'Special classes can be added from the timetable and the bell schedule',
    steps: 'Timetable, Bell schedule; Builder.',
    expected: 'Special class break without a special class shows an error; Special class asks morning or evening and which sections; break chips have no special class button',
  },
  async () => {
    await go('/timetable?tab=bells')
    const breakButton = page.getByRole('button', { name: 'Special class break', exact: true })
    await breakButton.waitFor({ timeout: 10000 })
    await breakButton.click()
    await see('Add a special class first')
    await page.getByRole('button', { name: 'Special class', exact: true }).click()
    const dialog = page.getByRole('dialog')
    for (const text of ['Add a special class slot', 'All sections', 'Only these sections'])
      await dialog.getByText(text, { exact: true }).first().waitFor({ timeout: 8000 })
    await dialog.getByRole('radio', { name: /^Morning, before/ }).waitFor({ timeout: 8000 })
    await page.keyboard.press('Escape')
    await go('/timetable?tab=builder')
    await page.getByText('Breaks & Lunch:').waitFor({ timeout: 10000 })
    if (await page.getByRole('button', { name: /^Special class in / }).count())
      throw new Error('Break chips still offer special classes')
  }
)
await test(
  {
    id: 'CH-01',
    module: 'School setup',
    type: 'View',
    title: 'Holiday can be for some classes only',
    steps: 'School setup, Holidays, Add holiday, Applies to: Only some classes.',
    expected: 'Class chips appear to choose the classes',
  },
  async () => {
    await go('/setup?tab=holidays')
    await page.getByRole('button', { name: /Add holiday/ }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio', { name: 'Only some classes' }).click()
    await dialog.getByRole('checkbox').first().waitFor({ timeout: 8000 })
    await page.keyboard.press('Escape')
  }
)
await test(
  {
    id: 'AM-01',
    module: 'School setup',
    type: 'View',
    title: 'Attendance mode is set in the school profile',
    steps: 'School setup, Profile.',
    expected: 'Attendance is taken: Session-wise or Period-wise',
  },
  async () => {
    await go('/setup?tab=profile')
    await page.getByText('Attendance is taken', { exact: true }).first().waitFor({ timeout: 10000 })
    await see(/Session-wise \(morning and afternoon\)|Period-wise \(every period\)/)
  }
)
await test(
  {
    id: 'YP-01',
    module: 'Dashboard',
    type: 'View',
    title: 'Dashboard compares academic years',
    steps: 'Dashboard, Year by year card.',
    expected: 'Studies (pass, fail and absent rates), attendance, sports and activities, fees and students for each year, current year marked',
  },
  async () => {
    await go('/')
    const card = page.getByRole('region', { name: 'Performance by academic year' })
    await card.waitFor({ timeout: 10000 })
    for (const text of ['Pass rate', 'Fail rate', 'Absent in exams', 'Sports and activities', 'Collection rate', 'Current'])
      await card.getByText(text, { exact: true }).first().waitFor({ timeout: 8000 })
    await card.getByRole('region', { name: 'Fees by head' }).waitFor({ timeout: 8000 })
    await card.screenshot({ path: path.join(SHOTS, 'YP-01.png') })
  }
)
await test(
  {
    id: 'AYS-01',
    module: 'Academic year',
    type: 'View',
    title: 'Office switches to an earlier academic year and back',
    steps: 'Sidebar, Academic year, choose an earlier year, then Back to current year.',
    expected: 'A read-only banner names the year; Back to current year removes it',
  },
  async () => {
    await go('/students')
    await page.locator('#year-switcher').click()
    const past = page.getByRole('option').filter({ hasText: 'Read only' }).first()
    if (!(await past.count())) {
      await page.keyboard.press('Escape')
      return
    }
    await past.click()
    await see('Earlier years are read only.')
    await page.getByRole('button', { name: 'Back to current year' }).click()
    await page.getByText('Earlier years are read only.').waitFor({ state: 'detached', timeout: 8000 })
  }
)
await test(
  {
    id: 'RCD-01',
    module: 'Report card',
    type: 'View',
    title: 'Student report card shows the marksheet with print and download',
    steps: 'Students, open a student with published results, Report card tab.',
    expected: 'Annual report card with subjects, overall percentage and Print / Download PDF',
  },
  async () => {
    await go('/students/30?tab=report-card')
    await see(/ANNUAL REPORT CARD|REPORT CARD/i)
    await see(/Overall Percentage/i)
    await page.getByRole('button', { name: 'Print' }).waitFor({ timeout: 8000 })
    await page.getByRole('button', { name: 'Download PDF' }).waitFor({ timeout: 8000 })
  }
)
await test(
  {
    id: 'RCD-02',
    module: 'Report card',
    type: 'View',
    title: 'Exam results offer section report cards',
    steps: 'Exams, Results tab of a published exam, Report cards.',
    expected: 'Menu with this exam only and whole year',
  },
  async () => {
    await go('/exams?tab=results')
    await page.getByRole('button', { name: /Report cards/ }).click({ timeout: 8000 })
    await see('Whole year, every term')
    await page.keyboard.press('Escape')
  }
)
{
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: path.join(ROOT, '.auth-admin.json'),
  })
  const previous = page
  page = await phone.newPage()
  for (const [id, url, text] of [
    ['RS-01', '/students', 'Aadhavan Senthil'],
    ['RS-02', '/staff', 'Priya Venkatesh'],
    ['RS-03', `${studentUrl || '/students'}`, /Profile|Students/],
    ['RS-04', '/attendance', 'Sections not marked'],
    ['RS-05', '/timetable', 'Timetable'],
    ['RS-06', '/substitutes', 'Teachers away'],
    ['RS-07', '/payroll', 'Payroll runs'],
    ['RS-08', '/transport', 'Buses and routes'],
    ['RS-09', '/fleet', 'Trips today'],
    ['RS-10', '/exams', 'Marks entry'],
    ['RS-11', '/fees', 'Fee plans'],
    ['RS-12', '/activities', 'Leaderboard'],
    ['RS-13', '/fleet/alerts', 'SOS active'],
    ['RS-14', '/fleet/maintenance', 'Tickets'],
    ['RS-15', '/parent-preview', /Parent app/],
    ['RS-16', '/meetings', /Meetings/],
    ['RS-17', '/app-banners', 'Live now'],
    ['RS-18', '/students/30?tab=report-card', /annual report card/i],
  ]) {
    await test(
      {
        id,
        module: 'Responsive',
        type: 'View',
        title: `${url} fits a phone without sideways scroll`,
        steps: `Open ${url} at 390 x 844.`,
        expected: 'Content visible and page width equals screen width',
      },
      async () => {
        await go(url)
        await see(text)
        const width = await page.evaluate(() => document.documentElement.scrollWidth)
        if (width > 391) throw new Error(`Page is ${width}px wide`)
      }
    )
  }
  await phone.close()
  page = previous
}

const cleanup = []
for (const id of created.students) cleanup.push(api('DELETE', `/admin/students/${id}`))
for (const id of created.staff)
  cleanup.push(
    api('PATCH', `/admin/staff/${id}`, { status: 'resigned' }).then(() =>
      api('DELETE', `/admin/staff/${id}`)
    )
  )
for (const id of created.users) cleanup.push(api('DELETE', `/admin/users/${id}`))
for (const id of created.subjects) cleanup.push(api('DELETE', `/admin/subjects/${id}`))
for (const id of created.holidays) cleanup.push(api('DELETE', `/admin/holidays/${id}`))
const leftovers = await api('GET', '/admin/admissions?search=RTApp&limit=100')
for (const item of leftovers.data?.items ?? []) {
  if (item.status !== 'enrolled') cleanup.push(api('DELETE', `/admin/admissions/${item.id}`))
}
await Promise.allSettled(cleanup)

for (const [context, file] of [
  [admin.context, '.auth-admin.json'],
  [superAdmin.context, '.auth-super.json'],
]) {
  await context.storageState({ path: path.join(ROOT, file) }).catch(() => null)
}

await browser.close()
const passed = results.filter((row) => row.status === 'Pass').length
fs.writeFileSync(
  path.join(OUT, 'frontend.json'),
  JSON.stringify({ run_at: new Date().toISOString(), base_url: BASE, day: DAY, results }, null, 2)
)
console.log(`\n${passed}/${results.length} passed. Results: e2e/results/frontend.json`)
process.exit(passed === results.length ? 0 : 1)
