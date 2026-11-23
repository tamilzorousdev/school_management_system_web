import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1'
const CHROME = process.env.E2E_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const MEDIA = process.env.E2E_MEDIA_DIR ?? 'C:/Users/TZ/AppData/Local/Temp/gallery-e2e'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results')
const SHOTS = path.join(OUT, 'screenshots', 'gallery')
const DOWNLOADS = path.join(OUT, 'downloads', 'gallery')
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(DOWNLOADS, { recursive: true })

const file = (name) => path.join(MEDIA, name)
const hasVideo = fs.existsSync(file('webflow-clip.mp4'))
const stamp = Date.now().toString(36).slice(-4)
const ALBUM1 = `WebFlow Class Album ${stamp}`
const ALBUM2 = `WebFlow Section Album ${stamp}`
const CATEGORY = `WebFlow Cat ${stamp}`
const POLICY = `WebFlow Policy ${stamp}`

const results = []
const consoleErrors = []
const failedRequests = []
let currentStep = 'setup'
let allowed = []

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: process.env.E2E_HEADED !== '1',
})

function watch(tab) {
  tab.on('console', (msg) => {
    if (msg.type() === 'error')
      consoleErrors.push({ step: currentStep, text: msg.text().slice(0, 400) })
  })
  tab.on('pageerror', (error) =>
    consoleErrors.push({ step: currentStep, text: `pageerror: ${String(error).slice(0, 400)}` })
  )
  tab.on('response', async (response) => {
    if (response.status() < 400) return
    const url = response.url()
    const method = response.request().method()
    const expected = allowed.some((pattern) => pattern.test(`${method} ${url}`))
    let body = ''
    try {
      body = (await response.text()).slice(0, 300)
    } catch {
      body = ''
    }
    const confirmation = response.status() === 409 && body.includes('CONFIRMATION_REQUIRED')
    failedRequests.push({ step: currentStep, method, url, status: response.status(), expected: expected || confirmation, body })
  })
  tab.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? ''
    if (/ERR_ABORTED/.test(failure)) return
    failedRequests.push({
      step: currentStep,
      method: request.method(),
      url: request.url(),
      status: 0,
      expected: false,
      body: failure,
    })
  })
}

async function signIn(mobile, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true })
  const tab = await context.newPage()
  watch(tab)
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
const notes = {}
async function test(id, title, fn, { allow = [] } = {}) {
  currentStep = id
  allowed = allow
  const started = Date.now()
  const row = { id, title, status: 'Pass', note: '', screenshot: `${id}.png`, ms: 0 }
  notes[id] = []
  try {
    await fn((text) => notes[id].push(text))
  } catch (error) {
    row.status = 'Fail'
    row.error = String(error?.message ?? error)
      .split('\n')
      .slice(0, 3)
      .join(' | ')
      .slice(0, 500)
  }
  row.note = notes[id].join('; ')
  await page
    .screenshot({ path: path.join(SHOTS, row.screenshot), fullPage: true })
    .catch(() => null)
  row.ms = Date.now() - started
  results.push(row)
  console.log(
    `${row.status === 'Pass' ? 'PASS' : 'FAIL'}  ${id.padEnd(6)} ${title}${row.note ? `\n        note: ${row.note}` : ''}${row.error ? `\n        ${row.error}` : ''}`
  )
  allowed = []
}
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const go = async (url) => {
  await page.goto(`${BASE}${url}`)
  await page.waitForLoadState('networkidle').catch(() => null)
}
const shot = (name) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }).catch(() => null)
const toast = (text, timeout = 10000) =>
  page
    .getByText(text instanceof RegExp ? text : text, { exact: !(text instanceof RegExp) })
    .first()
    .waitFor({ timeout })
const modal = () => page.getByRole('dialog').last()
const alertDialog = () => page.getByRole('alertdialog').last()
const confirmBox = () => page.locator('[role=alertdialog],[role=dialog]').last()

async function api(method, url, body) {
  return page.evaluate(
    async ({ method, url, body, API }) => {
      const session = JSON.parse(localStorage.getItem('tz-session') || '{}')
      const response = await fetch(`${API}${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      let json = null
      try {
        json = await response.json()
      } catch {
        json = null
      }
      return { status: response.status, json }
    },
    { method, url, body, API }
  )
}

async function pickCombo(scope, label, option) {
  await scope.getByRole('combobox', { name: label, exact: true }).click()
  const list = page.getByRole('listbox', { name: label, exact: true })
  await list.waitFor({ timeout: 5000 })
  if (option === undefined) {
    const first = list.getByRole('option').first()
    const text = (await first.textContent())?.trim()
    await first.click()
    return text
  }
  const target = list.getByRole('option', { name: option }).first()
  const text = (await target.textContent())?.trim()
  await target.click()
  return text
}

async function pickNonEmptyCombo(scope, label) {
  await scope.getByRole('combobox', { name: label, exact: true }).click()
  const list = page.getByRole('listbox', { name: label, exact: true })
  await list.waitFor({ timeout: 5000 })
  const options = list.getByRole('option')
  const count = await options.count()
  for (let index = 0; index < count; index += 1) {
    const text = (await options.nth(index).textContent())?.trim() ?? ''
    if (!/^(No category|All|Current year|Any)/i.test(text)) {
      await options.nth(index).click()
      return text
    }
  }
  throw new Error(`no selectable option in ${label}`)
}

async function searchCombo(scope, label, query, option) {
  await scope.getByRole('combobox', { name: label, exact: true }).click()
  const input = page.getByRole('textbox', { name: `Search ${label.toLowerCase()}` }).last()
  await input.fill(query)
  const target = page
    .getByRole('listbox', { name: label, exact: true })
    .getByRole('option', { name: option })
    .first()
  await target.waitFor({ timeout: 8000 })
  await target.click()
}

async function download(trigger) {
  const [item] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), trigger()])
  const target = path.join(DOWNLOADS, item.suggestedFilename())
  await item.saveAs(target)
  return { name: item.suggestedFilename(), size: fs.statSync(target).size, target }
}

async function tileMenu(name) {
  const tile = page.getByRole('button', { name: `Actions for ${name}` }).first()
  const open = page.getByRole('button', { name: `Open ${name}` }).first()
  await open.hover().catch(() => null)
  await tile.click().catch(() => null)
  const opened = await page.getByRole('menu').waitFor({ timeout: 3000 }).then(() => true, () => false)
  if (opened) return 'click'
  const pointer = await page.evaluate(() => getComputedStyle(document.body).pointerEvents)
  await tile.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('menu').waitFor({ timeout: 3000 })
  return `keyboard (mouse click did not open; body pointer-events ${pointer})`
}

const admin = await signIn('9876543210')
page = admin.page

let album1Id = null
let album2Id = null
let album1Category = null
let mediaByName = {}
let categoryId = null

const loadMedia = async () => {
  const res = await api('GET', `/admin/gallery/albums/${album1Id}/media?page=1&limit=100`)
  mediaByName = Object.fromEntries((res.json?.data?.items ?? []).map((m) => [m.original_name, m]))
  return res.json?.data?.items ?? []
}

await test('G-01', 'Gallery page loads: insight cards, album grid, filters', async (note) => {
  await go('/gallery')
  await page.getByRole('heading', { name: 'Gallery', exact: true }).waitFor({ timeout: 10000 })
  for (const label of ['Albums', 'Photos', 'Videos', 'Storage used', 'In Trash', 'On hold'])
    await page.getByText(label, { exact: true }).first().waitFor({ timeout: 8000 })
  await page.getByText(/^\d+ albums?$/).first().waitFor({ timeout: 10000 })
  const summary = await page.getByText(/^\d+ albums?$/).first().textContent()
  note(`list summary "${summary}"`)
  await page.getByRole('tab', { name: 'Class-wise' }).click()
  await page.getByRole('group', { name: 'Classes' }).waitFor({ timeout: 5000 })
  assert(page.url().includes('scope=class'), 'scope=class not in URL')
  await page.getByRole('tab', { name: 'Section-wise' }).click()
  assert(page.url().includes('scope=section'), 'scope=section not in URL')
  await page.getByRole('tab', { name: 'All albums' }).click()
  const cat = await pickNonEmptyCombo(page, 'Filter by category')
  await page.waitForTimeout(600)
  assert(page.url().includes('category_id='), 'category filter not in URL')
  note(`category filter "${cat}" ok`)
  await pickCombo(page, 'Filter by status', 'Published')
  await page.waitForTimeout(600)
  assert(page.url().includes('status=published'), 'status filter not in URL')
  await page.getByRole('button', { name: /^Clear/ }).first().click()
  await page.getByRole('searchbox', { name: 'Search albums' }).or(page.getByLabel('Search albums')).first().fill('zzzz-no-such-album')
  await page.getByText('No albums match these filters').waitFor({ timeout: 8000 })
  await shot('G-01-filters-empty')
  await page.getByRole('button', { name: /^Clear/ }).first().click()
  await page.waitForTimeout(500)
})

await test(
  'G-02',
  'Create album (class scope) + validation; second album (section scope)',
  async (note) => {
    await go('/gallery')
    await page.getByRole('button', { name: /Create album/ }).first().click()
    const dialog = modal()
    await dialog.getByRole('heading', { name: 'Create album' }).waitFor({ timeout: 5000 })
    await dialog.getByRole('radio', { name: 'Class-wise' }).click()
    await dialog.getByRole('button', { name: 'Create album' }).click()
    await dialog.getByText('Enter a title of 2 to 150 letters').waitFor({ timeout: 5000 })
    await dialog.getByText('Choose the class').waitFor({ timeout: 5000 })
    note('empty submit shows "Enter a title of 2 to 150 letters" and "Choose the class"')
    await shot('G-02-validation')
    const cls = await pickCombo(dialog, 'Class')
    album1Category = await pickNonEmptyCombo(dialog, 'Category')
    await dialog.locator('#album-title').fill(ALBUM1)
    await dialog.locator('#album-description').fill('Created by the gallery UI flow test')
    await dialog.locator('#album-tags').fill('webflow, e2e')
    await pickCombo(dialog, 'Who can see it', 'Teachers only')
    await pickCombo(dialog, 'Who can see it', /Parents and teachers/)
    const created = page.waitForResponse(
      (r) => r.url().endsWith('/admin/gallery/albums') && r.request().method() === 'POST'
    )
    await dialog.getByRole('button', { name: 'Create album' }).click()
    const response = await created
    assert(response.status() === 201 || response.status() === 200, `create status ${response.status()}`)
    album1Id = (await response.json()).data.id
    await page.waitForURL(/\/gallery\/albums\/\d+/, { timeout: 10000 })
    await toast('Album created as a draft')
    const detail = await api('GET', `/admin/gallery/albums/${album1Id}`)
    const d = detail.json.data
    assert(d.scope === 'class' && d.class_id, `scope ${d.scope} class ${d.class_id}`)
    assert(d.status === 'draft', `status ${d.status}`)
    assert(d.category, 'category not stored')
    note(`album #${album1Id} class "${cls}" category "${d.category}" visibility ${d.visibility}`)

    await go('/gallery')
    await page.getByRole('button', { name: /Create album/ }).first().click()
    const dialog2 = modal()
    await dialog2.getByRole('radio', { name: 'Section-wise' }).click()
    await dialog2.locator('#album-title').fill(ALBUM2)
    await dialog2.getByRole('button', { name: 'Create album' }).click()
    await dialog2.getByText('Choose the section').waitFor({ timeout: 5000 })
    await pickCombo(dialog2, 'Class')
    const section = await pickCombo(dialog2, 'Section')
    const created2 = page.waitForResponse(
      (r) => r.url().endsWith('/admin/gallery/albums') && r.request().method() === 'POST'
    )
    await dialog2.getByRole('button', { name: 'Create album' }).click()
    const response2 = await created2
    album2Id = (await response2.json()).data?.id
    assert(album2Id, `section album create status ${response2.status()}`)
    await page.waitForURL(/\/gallery\/albums\/\d+/, { timeout: 10000 })
    note(`section album #${album2Id} "${section}"; "Choose the section" shown when missing`)
  },
  { allow: [] }
)

await test('G-03', 'Upload images + video with progress; duplicate and bad type rejected', async (note) => {
  assert(album1Id, 'no album')
  await go(`/gallery/albums/${album1Id}?page=1`)
  await page.getByText(/Drop photos and videos here/).waitFor({ timeout: 10000 })
  await page.getByText(/Up to \d+ files at a time/).waitFor({ timeout: 10000 })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 50,
    downloadThroughput: -1,
    uploadThroughput: 40 * 1024,
  })
  const files = ['webflow-a.png', 'webflow-b.jpg', 'webflow-c.png']
  if (hasVideo) files.push('webflow-clip.mp4')
  await page.locator('#gallery-upload-input').setInputFiles(files.map(file))
  let sawProgress = false
  let sawWaiting = false
  for (let i = 0; i < 40 && !sawProgress; i += 1) {
    if (await page.getByRole('progressbar', { name: /^Uploading / }).count()) sawProgress = true
    if (await page.getByText('Waiting', { exact: true }).count()) sawWaiting = true
    await page.waitForTimeout(150)
  }
  if (sawProgress) await shot('G-03-progress')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  })
  await page
    .getByText(`${files.length} of ${files.length} done`)
    .waitFor({ timeout: 90000 })
  const added = await page.getByText('Added', { exact: true }).count()
  assert(added === files.length, `only ${added}/${files.length} show Added`)
  note(`progress bar seen: ${sawProgress}, Waiting seen: ${sawWaiting}, ${added} Added`)
  await page.getByRole('button', { name: 'Clear finished' }).click()

  await page.locator('#gallery-upload-input').setInputFiles([file('webflow-a-copy.png'), file('webflow-notes.txt')])
  await page.getByText('2 of 2 done').waitFor({ timeout: 30000 })
  await page.getByText('Duplicate', { exact: true }).first().waitFor({ timeout: 5000 })
  const dupRow = page.locator('li', { hasText: 'webflow-a-copy.png' })
  const dupMsg = (await dupRow.locator('p').textContent().catch(() => '')) ?? ''
  const badRow = page.locator('li', { hasText: 'webflow-notes.txt' })
  const badMsg = (await badRow.locator('p').textContent().catch(() => '')) ?? ''
  assert(/skipped/i.test((await badRow.textContent()) ?? ''), 'txt not shown as Skipped')
  await toast(/file was skipped/)
  note(`duplicate message "${dupMsg}"; bad type message "${badMsg}"`)
  await shot('G-03-dup-bad')
  const items = await loadMedia()
  assert(items.length === files.length, `API has ${items.length} media, expected ${files.length}`)
  note(`API media count ${items.length}; types ${items.map((m) => m.media_type).join(',')}`)
})

await test('G-04', 'Publish, share, feature, unpublish, edit, archive', async (note) => {
  await go(`/gallery/albums/${album1Id}?page=1`)
  await page.getByRole('button', { name: 'Publish', exact: true }).first().click()
  const publishDialog = modal()
  await publishDialog.getByRole('heading', { name: 'Publish album' }).waitFor({ timeout: 5000 })
  await publishDialog.getByRole('button', { name: 'Publish', exact: true }).click()
  await toast('Album published')
  await page.getByText('Published', { exact: true }).first().waitFor({ timeout: 8000 })
  note('published')

  const shareButton = page.getByRole('button', { name: 'Share', exact: true })
  if (await shareButton.waitFor({ timeout: 6000 }).then(() => true, () => false)) {
    await shareButton.click()
    await toast(/Sent to \d+ people|Album shared/)
    const sent = await page.getByText(/Sent to \d+ people/).first().textContent().catch(() => '')
    note(`share: "${sent || 'Album shared'}"`)
  } else {
    note('Share button hidden (sharing disabled in settings)')
  }

  await page.getByRole('button', { name: 'More album actions' }).click()
  await page.getByRole('menuitem', { name: 'Feature album' }).click()
  await toast('Album featured')
  await page.getByText('Featured', { exact: true }).first().waitFor({ timeout: 5000 })
  note('featured')

  await page.getByRole('button', { name: 'More album actions' }).click()
  await page.getByRole('menuitem', { name: 'Unpublish' }).click()
  await confirmBox().getByRole('button', { name: 'Unpublish' }).click()
  await toast('Album moved back to draft')
  let state = (await api('GET', `/admin/gallery/albums/${album1Id}`)).json.data
  assert(state.status === 'draft', `after unpublish status ${state.status}`)
  note('unpublished')

  await page.getByRole('button', { name: 'Publish', exact: true }).first().click()
  await modal().getByRole('button', { name: 'Publish', exact: true }).click()
  await toast('Album published')

  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  const edit = modal()
  await edit.getByRole('heading', { name: 'Edit album' }).waitFor({ timeout: 5000 })
  await edit.locator('#album-title').fill(`${ALBUM1} edited`)
  await edit.locator('#album-tags').fill('webflow, e2e, edited')
  await edit.getByRole('button', { name: 'Save changes' }).click()
  await toast('Album saved')
  await page.getByText(`${ALBUM1} edited`).first().waitFor({ timeout: 5000 })
  state = (await api('GET', `/admin/gallery/albums/${album1Id}`)).json.data
  assert(state.title === `${ALBUM1} edited`, `title ${state.title}`)
  assert(state.tags.includes('edited'), `tags ${state.tags}`)
  assert(state.status === 'published' && state.is_featured, `status ${state.status} featured ${state.is_featured}`)
  note('edited title + tags')

  await go(`/gallery/albums/${album2Id}?page=1`)
  await page.getByRole('button', { name: 'More album actions' }).click()
  await page.getByRole('menuitem', { name: 'Archive' }).click()
  await confirmBox().getByRole('button', { name: 'Archive' }).click()
  await toast('Album archived')
  await page.getByText('Archived', { exact: true }).first().waitFor({ timeout: 5000 })
  assert((await page.getByRole('button', { name: 'Edit', exact: true }).count()) === 0, 'Edit still visible on archived album')
  assert((await page.getByText(/Drop photos and videos here/).count()) === 0, 'upload panel still visible on archived album')
  note('section album archived, read-only')
})

await test('G-05', 'Media viewer: nav, keys, download, caption, video still, delete', async (note) => {
  await go(`/gallery/albums/${album1Id}?page=1`)
  const tiles = page.getByRole('button', { name: /^Open / })
  await tiles.first().waitFor({ timeout: 10000 })
  const count = await tiles.count()
  await tiles.first().click()
  const viewer = page.getByRole('dialog')
  await viewer.getByText(new RegExp(`^1 of ${count} · `)).waitFor({ timeout: 5000 })
  await shot('G-05-viewer-light')
  await viewer.getByRole('button', { name: 'Next' }).click()
  await viewer.getByText(new RegExp(`^2 of ${count} · `)).waitFor({ timeout: 3000 })
  await viewer.getByRole('button', { name: 'Previous' }).click()
  await viewer.getByText(new RegExp(`^1 of ${count} · `)).waitFor({ timeout: 3000 })
  await page.keyboard.press('ArrowRight')
  await viewer.getByText(new RegExp(`^2 of ${count} · `)).waitFor({ timeout: 3000 })
  await page.keyboard.press('ArrowLeft')
  await viewer.getByText(new RegExp(`^1 of ${count} · `)).waitFor({ timeout: 3000 })
  await page.keyboard.press('ArrowLeft')
  await viewer.getByText(new RegExp(`^${count} of ${count} · `)).waitFor({ timeout: 3000 })
  note(`nav ok over ${count} items incl. wrap-around`)
  await page.keyboard.press('ArrowRight')
  const imgOk = await viewer.locator('img').first().evaluate((img) => img.complete && img.naturalWidth > 0).catch(() => false)
  note(`image rendered: ${imgOk}`)
  const link = viewer.getByRole('link', { name: 'Download' })
  const href = await link.getAttribute('href')
  assert(href, 'no download link')
  const absolute = new URL(href, BASE).toString()
  const fetched = await page.request.get(absolute)
  assert(fetched.status() === 200, `download HTTP ${fetched.status()}`)
  note(`download HTTP ${fetched.status()} ${fetched.headers()['content-type']} ${fetched.headers()['content-disposition'] ?? ''}`.trim())
  await page.keyboard.press('Escape')
  await viewer.waitFor({ state: 'detached', timeout: 5000 }).catch(() => null)
  assert((await page.getByRole('dialog').count()) === 0, 'viewer still open after Escape')

  await loadMedia()
  note(`tile menu opened by ${await tileMenu('webflow-b.jpg')}`)
  await page.getByRole('menuitem', { name: 'Edit caption' }).click()
  const cap = modal()
  await cap.locator('#caption-title').fill('WebFlow caption title')
  await cap.locator('#caption-description').fill('WebFlow caption text')
  await cap.getByRole('button', { name: 'Save caption' }).click()
  await toast('Caption saved')
  const m = (await api('GET', `/admin/gallery/media/${mediaByName['webflow-b.jpg'].id}`)).json.data
  assert(m.title === 'WebFlow caption title' && m.description === 'WebFlow caption text', `caption not stored: ${m.title}/${m.description}`)
  await page.getByRole('button', { name: 'Open WebFlow caption title' }).click()
  await page.getByRole('dialog').getByText('WebFlow caption text').waitFor({ timeout: 5000 })
  await page.keyboard.press('Escape')
  note('caption saved and shown in viewer')

  if (hasVideo) {
    await tileMenu('webflow-clip.mp4')
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      page.getByRole('menuitem', { name: 'Set video still' }).click(),
    ])
    await chooser.setFiles(file('webflow-poster.jpg'))
    await toast('Video still saved', 20000)
    const v = (await api('GET', `/admin/gallery/media/${mediaByName['webflow-clip.mp4'].id}`)).json.data
    note(`video still saved; thumbnail_url ${v.thumbnail_url ? 'set' : 'missing'}`)
    const videoTile = page.getByRole('button', { name: 'Open webflow-clip.mp4' })
    await videoTile.click()
    await page.getByRole('dialog').locator('video').waitFor({ timeout: 5000 })
    await page.waitForTimeout(1500)
    const vState = await page.getByRole('dialog').locator('video').evaluate((el) => ({ rs: el.readyState, err: el.error?.code ?? null }))
    note(`video player readyState ${vState.rs} error ${vState.err}`)
    await page.keyboard.press('Escape')
  }

  await tileMenu('webflow-c.png')
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await confirmBox().getByRole('button', { name: 'Move to Trash' }).click()
  await toast('Moved to Trash')
  await page.getByRole('button', { name: 'Open webflow-c.png' }).waitFor({ state: 'detached', timeout: 8000 })
  note('photo moved to Trash')
})

await test('G-06', 'Trash: restore, delete again, purge selected, empty asks to confirm', async (note) => {
  await go('/gallery/trash?page=1&kind=media')
  await page.getByRole('heading', { name: 'Trash', exact: true }).waitFor({ timeout: 8000 })
  await page.getByLabel('Search Trash').fill('webflow-c')
  const row = page.getByRole('row', { name: /webflow-c\.png/ })
  await row.first().waitFor({ timeout: 10000 })
  note(`trash row: ${(await row.first().textContent())?.replace(/\s+/g, ' ').slice(0, 120)}`)
  await row.first().getByRole('button', { name: 'Restore' }).click()
  await toast('1 item restored')
  await loadMedia()
  assert(mediaByName['webflow-c.png'], 'restored media not back in album')
  note('restored to album')
  const del = await api('DELETE', `/admin/gallery/media/${mediaByName['webflow-c.png'].id}`)
  assert(del.status < 300, `re-delete status ${del.status}`)
  note(`URL before reload: ${new URL(page.url()).search}`)
  await page.reload()
  await page.waitForLoadState('networkidle').catch(() => null)
  note(`search box after reload: "${await page.getByLabel('Search Trash').inputValue()}"`)
  await page.getByRole('checkbox', { name: 'Select webflow-c.png' }).first().check({ timeout: 10000 })
  await page.getByText('1 selected').waitFor({ timeout: 3000 })
  await page.getByRole('button', { name: 'Delete for good' }).first().click()
  const dlg = confirmBox()
  await dlg.getByText('Delete 1 item for good?').waitFor({ timeout: 5000 })
  await dlg.getByRole('button', { name: 'Delete for good' }).click()
  await toast(/Deleted 1 item for good/)
  await page.getByRole('row', { name: /webflow-c\.png/ }).first().waitFor({ state: 'detached', timeout: 8000 })
  const leftC = (await api('GET', '/admin/gallery/trash?kind=media&page=1&limit=50&search=webflow-c')).json.data.items
  assert(leftC.length === 0, `webflow-c still in trash via API (${leftC.length})`)
  note('purged selected')
  await page.getByLabel('Search Trash').fill('')
  await page.waitForTimeout(600)
  const emptyBtn = page.getByRole('button', { name: 'Empty Trash' })
  if (await emptyBtn.isDisabled()) {
    note('Empty Trash disabled (Trash empty) - confirmation not checked')
  } else {
    await emptyBtn.click()
    const c = confirmBox()
    await c.getByText('Empty Trash?').waitFor({ timeout: 5000 })
    await shot('G-06-empty-confirm')
    await c.getByRole('button', { name: 'Cancel' }).click()
    note('Empty Trash shows "Empty Trash?" confirmation (cancelled)')
  }
})

await test('G-07', 'Settings save/reset confirm; categories add/edit/delete; in-use refuses', async (note) => {
  await go('/gallery/settings?tab=settings&holds=active&page=1')
  const input = page.locator('#gs-max_files_per_upload')
  await input.waitFor({ timeout: 10000 })
  const original = await input.inputValue()
  const next = String(Number(original) > 1 ? Number(original) - 1 : Number(original) + 1)
  await input.fill(next)
  await page.getByText('1 unsaved change').waitFor({ timeout: 3000 })
  await page.getByRole('button', { name: 'Save changes' }).click()
  const confirmChange = page.getByRole('button', { name: 'Save anyway' })
  await Promise.race([toast('Gallery settings saved'), confirmChange.waitFor({ timeout: 10000 })])
  if (await confirmChange.count()) await confirmChange.click()
  await toast('Gallery settings saved')
  const saved = (await api('GET', '/admin/gallery/settings')).json.data
  assert(String(saved.max_files_per_upload) === next, `API max_files_per_upload ${saved.max_files_per_upload}`)
  await page.reload()
  await page.locator('#gs-max_files_per_upload').waitFor({ timeout: 10000 })
  assert((await page.locator('#gs-max_files_per_upload').inputValue()) === next, 'value not kept after reload')
  await page.locator('#gs-max_files_per_upload').fill(original)
  await page.getByRole('button', { name: 'Save changes' }).click()
  await toast('Gallery settings saved')
  note(`files per upload ${original} -> ${next} -> ${original}, saved and reloaded`)
  await page.getByRole('button', { name: 'Reset to defaults' }).click()
  const reset = confirmBox()
  await reset.getByText('Reset gallery settings?').waitFor({ timeout: 5000 })
  await shot('G-07-reset-confirm')
  await reset.getByRole('button', { name: 'Cancel' }).click()
  note('reset shows confirmation (cancelled)')

  await page.getByRole('tab', { name: 'Categories' }).click()
  await page.getByRole('button', { name: 'Add category' }).first().click()
  let dialog = modal()
  await dialog.getByRole('button', { name: 'Add category' }).click()
  await dialog.getByText('Enter a name of 2 to 60 letters').waitFor({ timeout: 3000 })
  await dialog.locator('#category-name').fill(CATEGORY)
  await dialog.locator('#category-order').fill('99')
  await dialog.getByRole('button', { name: 'Add category' }).click()
  await toast('Category added')
  await page.getByRole('button', { name: `Edit ${CATEGORY}` }).click()
  dialog = modal()
  await dialog.locator('#category-name').fill(`${CATEGORY} B`)
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await toast('Category saved')
  await page.getByText(`${CATEGORY} B`, { exact: true }).first().waitFor({ timeout: 5000 })
  const cats = (await api('GET', '/admin/gallery/categories?all=true')).json.data
  categoryId = (Array.isArray(cats) ? cats : cats.items).find((c) => c.name === `${CATEGORY} B`)?.id
  assert(categoryId, 'category not found via API')
  note(`category #${categoryId} added and renamed`)

  const albumBefore = (await api('GET', `/admin/gallery/albums/${album1Id}`)).json.data
  const patched = await api('PATCH', `/admin/gallery/albums/${album1Id}`, { category_id: categoryId })
  assert(patched.status < 300, `assign category status ${patched.status}`)
  await page.reload()
  await page.getByRole('button', { name: `Delete ${CATEGORY} B` }).click()
  await confirmBox().getByRole('button', { name: 'Delete category' }).click()
  const errText = await page
    .locator('[data-sonner-toast]')
    .filter({ hasNotText: /Category (added|saved)/ })
    .last()
    .textContent({ timeout: 8000 })
    .catch(() => '')
  const still = await page.getByText(`${CATEGORY} B`, { exact: true }).count()
  assert(still > 0, 'in-use category was deleted')
  note(`in-use delete refused: "${errText?.trim()}"`)
  await page.keyboard.press('Escape')
  await api('PATCH', `/admin/gallery/albums/${album1Id}`, { category_id: albumBefore.category_id ?? null })
  await page.reload()
  await page.getByRole('button', { name: `Delete ${CATEGORY} B` }).click()
  await confirmBox().getByRole('button', { name: 'Delete category' }).click()
  await toast('Category removed')
  categoryId = null
  note('unused category deleted')
}, { allow: [/DELETE .*\/admin\/gallery\/categories\/\d+/] })

let policyName = POLICY
await test('G-08a', 'Retention policies: add, edit, delete', async (note) => {
  await go('/gallery/settings?tab=retention&holds=active&page=1')
  await page.getByRole('button', { name: 'Add policy' }).first().click()
  const dialog = modal()
  await dialog.getByRole('heading', { name: 'Add retention policy' }).waitFor({ timeout: 5000 })
  await dialog.getByRole('button', { name: 'Add policy' }).click()
  await dialog.getByText('Enter a name of 2 to 80 letters').waitFor({ timeout: 3000 })
  await dialog.locator('#policy-name').fill(POLICY)
  await pickCombo(dialog, 'Applies to', 'One album')
  await searchCombo(dialog, 'Album', 'WebFlow Class', new RegExp(`WebFlow Class Album ${stamp}`))
  const forever = dialog.locator('#policy-forever')
  if ((await forever.getAttribute('aria-checked')) !== 'true') await forever.click()
  await dialog.getByRole('button', { name: 'Add policy' }).click()
  const anyway = page.getByRole('button', { name: 'Save anyway' })
  await Promise.race([toast('Retention policy added'), anyway.waitFor({ timeout: 10000 })])
  if (await anyway.count()) await anyway.click()
  await toast('Retention policy added')
  await page.getByText(POLICY, { exact: true }).first().waitFor({ timeout: 5000 })
  note('policy added (one album, keep forever)')
  await page.getByRole('button', { name: `Edit ${POLICY}` }).click()
  const edit = modal()
  policyName = `${POLICY} B`
  await edit.locator('#policy-name').fill(policyName)
  await edit.getByRole('button', { name: 'Save policy' }).click()
  await toast('Retention policy saved')
  await page.getByText(policyName, { exact: true }).first().waitFor({ timeout: 5000 })
  note('policy renamed')
  await page.getByRole('button', { name: `Delete ${policyName}` }).click()
  await confirmBox().getByRole('button', { name: 'Delete policy' }).click()
  const again = page.getByText('Delete the policy anyway?')
  await Promise.race([toast('Retention policy removed'), again.waitFor({ timeout: 10000 })])
  if (await again.count()) await confirmBox().getByRole('button', { name: 'Delete policy' }).click()
  await toast('Retention policy removed')
  policyName = null
  note('policy deleted')
})

const nextMonth = new Date()
nextMonth.setDate(1)
nextMonth.setMonth(nextMonth.getMonth() + 1)
nextMonth.setDate(15)
const inThirty = nextMonth.toLocaleDateString('en-CA')
await test('G-08b', 'Holds: add on album and on one photo with reason + end date; release', async (note) => {
  await go('/gallery/settings?tab=holds&holds=active&page=1')
  for (const kind of ['album', 'media']) {
    await page.getByRole('button', { name: 'Add hold' }).click()
    const dialog = modal()
    await dialog.getByRole('heading', { name: 'Add retention hold' }).waitFor({ timeout: 5000 })
    if (kind === 'media') await dialog.getByRole('radio', { name: 'Photo or video' }).click()
    await searchCombo(dialog, 'Album', 'WebFlow Class', new RegExp(`WebFlow Class Album ${stamp}`))
    if (kind === 'media') await dialog.getByRole('radio', { name: 'webflow-a.png' }).click()
    await dialog.locator('#hold-reason').fill(`WebFlow ${kind} hold reason`)
    await dialog.locator('#hold-forever').click()
    await dialog.getByRole('button', { name: 'Apply hold' }).click()
    await dialog.getByText('Choose the last day').waitFor({ timeout: 3000 })
    await dialog.locator('button[data-slot=date-picker]').click()
    await page.getByRole('button', { name: 'Next month' }).click()
    await page.locator('[data-radix-popper-content-wrapper] button').filter({ hasText: /^15$/ }).first().dblclick()
    await page.locator('[data-radix-popper-content-wrapper]').waitFor({ state: 'detached', timeout: 3000 }).catch(() => null)
    await dialog.getByRole('button', { name: 'Apply hold' }).click()
    await toast('Retention hold applied')
    await page.waitForTimeout(800)
  }
  const holds = (await api('GET', '/admin/gallery/retention/holds?page=1&limit=50&active=true')).json.data.items
  const mine = holds.filter((h) => /WebFlow (album|media) hold reason/.test(h.reason))
  assert(mine.length === 2, `API shows ${mine.length} WebFlow holds`)
  assert(mine.every((h) => h.keep_until?.startsWith(inThirty)), `keep_until ${mine.map((h) => h.keep_until)}`)
  note(`2 holds active until ${inThirty}`)
  await shot('G-08b-holds')
  for (let i = 0; i < 2; i += 1) {
    const row = page.getByRole('row', { name: /WebFlow (album|media) hold reason/ }).first()
    await row.getByRole('button', { name: 'Release' }).click()
    const dialog = modal()
    await dialog.getByRole('heading', { name: 'Release retention hold' }).waitFor({ timeout: 5000 })
    await dialog.locator('#release-reason').fill('WebFlow test done')
    await dialog.getByRole('button', { name: 'Release hold' }).click()
    const anyway = page.getByRole('button', { name: 'Release and schedule' })
    await Promise.race([toast('Retention hold released'), anyway.waitFor({ timeout: 10000 })])
    if (await anyway.count()) await anyway.click()
    await toast('Retention hold released')
    await page.waitForTimeout(800)
  }
  const left = (await api('GET', '/admin/gallery/retention/holds?page=1&limit=50&active=true')).json.data.items.filter((h) => /WebFlow/.test(h.reason))
  assert(left.length === 0, `${left.length} WebFlow holds still active`)
  note('both released')
})

await test('G-09', 'Cleanup: status, preview, run now, jobs, job sheet, items, CSV export', async (note) => {
  await go('/gallery/cleanup?page=1&item_page=1')
  await page.getByRole('heading', { name: 'Cleanup', exact: true }).waitFor({ timeout: 8000 })
  for (const label of ['Status', 'Next run', 'Last run', 'Failed deletions'])
    await page.getByText(label, { exact: true }).first().waitFor({ timeout: 8000 })
  const status = (await api('GET', '/admin/gallery/cleanup/status')).json.data
  note(`status running=${status.running} paused=${status.paused} enabled=${status.cleanup_enabled}`)
  await page.getByRole('button', { name: 'Run cleanup now' }).click()
  const dialog = modal()
  await dialog.getByRole('heading', { name: 'Run the cleanup now?' }).waitFor({ timeout: 5000 })
  await dialog.getByText('Checked', { exact: true }).waitFor({ timeout: 15000 })
  const values = await dialog.locator('dd').allTextContents()
  note(`preview [checked, notice, trash, purge, albumsTrash, albumsPurge, held, freed] = ${values.join(', ')}`)
  await shot('G-09-preview')
  await dialog.getByRole('button', { name: 'Run cleanup' }).click()
  await toast('Cleanup finished', 60000)
  const sheet = page.getByRole('dialog').filter({ hasText: /Cleanup run #\d+/ })
  await sheet.waitFor({ timeout: 10000 })
  const title = await sheet.getByText(/Cleanup run #\d+/).first().textContent()
  await sheet.getByText('Items', { exact: true }).waitFor({ timeout: 8000 })
  note(`${title} opened with Items section`)
  await shot('G-09-job-sheet')
  const csv = await download(() => sheet.getByRole('button', { name: 'CSV', exact: true }).click())
  assert(csv.size > 0, 'empty CSV')
  const xlsx = await download(() => sheet.getByRole('button', { name: 'Excel', exact: true }).click())
  assert(xlsx.size > 0, 'empty xlsx')
  note(`job CSV ${csv.name} ${csv.size} B, Excel ${xlsx.name} ${xlsx.size} B`)
  await page.keyboard.press('Escape')
  await page.getByText(/^\d+ runs?$/).first().waitFor({ timeout: 5000 })
  note(`job list: ${await page.getByText(/^\d+ runs?$/).first().textContent()}`)
})

await test('G-10', 'Reports: every type renders; CSV + Excel export', async (note) => {
  const reports = [
    'class_usage', 'section_usage', 'album_counts', 'category_usage', 'upload_activity',
    'user_uploads', 'storage', 'expiring', 'deleted', 'restored', 'purged',
    'cleanup_activity', 'cleanup_failures',
  ]
  const bad = []
  for (const report of reports) {
    const resp = page.waitForResponse((r) => r.url().includes(`/admin/gallery/reports/${report}`) && !r.url().includes('/export'), { timeout: 15000 }).catch(() => null)
    await go(`/gallery/reports?report=${report}`)
    const r = await resp
    const errorShown = await page.getByText(/Something went wrong|Try again/).count()
    const rows = await page.getByText(/^\d+ rows?$/).first().textContent({ timeout: 8000 }).catch(() => '?')
    if (!r || r.status() !== 200 || errorShown) bad.push(`${report}:${r?.status() ?? 'no response'}`)
    note(`${report} ${r?.status()} ${rows}`)
  }
  await shot('G-10-report-last')
  await go('/gallery/reports?report=album_counts')
  await page.getByText(/^\d+ rows?$/).first().waitFor({ timeout: 8000 })
  const csv = await download(() => page.getByRole('button', { name: 'CSV', exact: true }).click())
  const xlsx = await download(() => page.getByRole('button', { name: 'Excel', exact: true }).click())
  const csvText = fs.readFileSync(csv.target, 'utf8')
  note(`album_counts CSV ${csv.size} B (has WebFlow: ${csvText.includes('WebFlow')}), Excel ${xlsx.size} B (PK zip: ${fs.readFileSync(xlsx.target).subarray(0, 2).toString() === 'PK'})`)
  assert(!bad.length, `reports failing: ${bad.join(', ')}`)
  assert(csv.size > 0 && xlsx.size > 0, 'empty export')
})

await test('G-11', 'Audit log: entries, filters, export', async (note) => {
  await go('/gallery/audit?page=1')
  await page.getByRole('heading', { name: 'Audit log' }).waitFor({ timeout: 8000 })
  await page.getByLabel('Search audit log').fill('album')
  await page.waitForTimeout(1200)
  await page.waitForLoadState('networkidle').catch(() => null)
  const body = (await page.locator('main').textContent()) ?? ''
  const expected = ['Album created', 'Album published', 'Album unpublished', 'Album featured', 'Album archived', 'Album updated']
  const seen = expected.filter((label) => body.includes(label))
  note(`search "album" shows: ${seen.join(', ')}`)
  assert(seen.length >= 4, `search shows only ${seen.join(', ')}`)
  const audit = (await api('GET', '/admin/gallery/audit-logs?page=1&limit=100')).json.data.items
  const actions = [...new Set(audit.map((a) => a.action))]
  const want = ['album.created', 'album.published', 'album.unpublished', 'album.featured', 'album.updated', 'album.archived', 'media.uploaded', 'media.updated', 'media.poster_set', 'media.deleted', 'media.restored', 'media.purged', 'category.created', 'category.updated', 'category.removed', 'retention.policy_created', 'retention.policy_updated', 'retention.policy_removed', 'retention.hold_applied', 'retention.hold_released', 'settings.updated']
  const missing = want.filter((a) => !actions.includes(a))
  note(`API last 100 actions missing: ${missing.join(', ') || 'none'}`)
  await page.getByLabel('Search audit log').fill('')
  await pickCombo(page, 'Filter by action', 'Album published')
  await page.waitForTimeout(1000)
  assert(page.url().includes('action=album.published'), `action filter not in URL: ${page.url()}`)
  const filteredRows = await page.getByRole('row').filter({ hasText: /Album/ }).allTextContents()
  const offFilter = filteredRows.filter((t) => !t.includes('Album published'))
  assert(offFilter.length === 0, `rows not matching filter: ${offFilter.length}`)
  note(`action filter rows: ${filteredRows.length}`)
  await pickCombo(page, 'Filter by result', undefined).catch(() => null)
  const x = await download(() => page.getByRole('button', { name: 'Export' }).click())
  assert(x.size > 0, 'empty audit export')
  note(`export ${x.name} ${x.size} B`)
  assert(missing.length === 0, `audit actions missing: ${missing.join(', ')}`)
})

await test('G-12', 'Light/dark theme screenshots (gallery + viewer), 390px layout', async (note) => {
  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => localStorage.setItem('tz-theme', t), theme)
    await go('/gallery')
    await page.getByText(/^\d+ albums?$/).first().waitFor({ timeout: 10000 })
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    assert(isDark === (theme === 'dark'), `theme ${theme} not applied`)
    await shot(`G-12-gallery-${theme}`)
    await go(`/gallery/albums/${album1Id}?page=1`)
    await page.getByRole('button', { name: /^Open / }).first().click()
    await page.getByRole('dialog').getByText(/^1 of \d+ · /).waitFor({ timeout: 5000 })
    await page.waitForTimeout(500)
    await shot(`G-12-viewer-${theme}`)
    await page.keyboard.press('Escape')
  }
  note('dark and light applied on gallery page and viewer')
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    storageState: await page.context().storageState(),
  })
  const previous = page
  page = await phone.newPage()
  watch(page)
  try {
    for (const url of ['/gallery', `/gallery/albums/${album1Id}?page=1`, '/gallery/trash?page=1&kind=media', '/gallery/settings?tab=settings&holds=active&page=1', '/gallery/cleanup?page=1&item_page=1', '/gallery/reports?report=class_usage', '/gallery/audit?page=1']) {
      await go(url)
      await page.waitForTimeout(800)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      const name = url.split('?')[0].replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'gallery'
      await shot(`G-12-390-${name}`)
      note(`${url.split('?')[0]} overflow ${overflow}px`)
      if (url === '/gallery') assert(overflow <= 0, `gallery page scrolls sideways by ${overflow}px`)
    }
  } finally {
    await page.screenshot({ path: path.join(SHOTS, 'G-12.png'), fullPage: true }).catch(() => null)
    await phone.close()
    page = previous
  }
})

currentStep = 'cleanup'
const cleanupLog = []
try {
  const list = (await api('GET', '/admin/gallery/albums?page=1&limit=100&search=WebFlow')).json?.data?.items ?? []
  const ids = list.filter((a) => a.title.startsWith('WebFlow ')).map((a) => a.id)
  for (const id of [album1Id, album2Id]) if (id && !ids.includes(id)) ids.push(id)
  for (const id of ids) {
    const r = await api('DELETE', `/admin/gallery/albums/${id}`)
    cleanupLog.push(`delete album ${id}: ${r.status}`)
  }
  if (ids.length) {
    const p = await api('POST', '/admin/gallery/trash/purge', { album_ids: ids, confirm: true })
    cleanupLog.push(`purge albums ${ids.join(',')}: ${p.status} ${JSON.stringify(p.json?.data ?? p.json).slice(0, 200)}`)
  }
  const trashMedia = (await api('GET', '/admin/gallery/trash?kind=media&page=1&limit=100&search=webflow')).json?.data?.items ?? []
  if (trashMedia.length) {
    const p = await api('POST', '/admin/gallery/trash/purge', { media_ids: trashMedia.map((m) => m.id), confirm: true })
    cleanupLog.push(`purge leftover media ${trashMedia.length}: ${p.status}`)
  }
  const cats = (await api('GET', '/admin/gallery/categories?all=true')).json?.data
  for (const c of (Array.isArray(cats) ? cats : cats?.items ?? []).filter((c) => c.name.startsWith('WebFlow '))) {
    const r = await api('DELETE', `/admin/gallery/categories/${c.id}`)
    cleanupLog.push(`delete category ${c.id}: ${r.status}`)
  }
  const ret = (await api('GET', '/admin/gallery/retention')).json?.data
  for (const p of (ret?.policies ?? []).filter((p) => p.name.startsWith('WebFlow '))) {
    const r = await api('DELETE', `/admin/gallery/retention/policies/${p.id}?confirm=true`)
    cleanupLog.push(`delete policy ${p.id}: ${r.status}`)
  }
  const trashAlbums = (await api('GET', '/admin/gallery/trash?kind=album&page=1&limit=100&search=WebFlow')).json?.data?.items ?? []
  if (trashAlbums.length) {
    const p = await api('POST', '/admin/gallery/trash/purge', { album_ids: trashAlbums.map((a) => a.id), confirm: true })
    cleanupLog.push(`purge leftover trash albums ${trashAlbums.map((a) => a.id).join(',')}: ${p.status}`)
  }
  const albumsLeft = (await api('GET', '/admin/gallery/albums?page=1&limit=100&search=WebFlow')).json?.data?.items ?? []
  const trashLeft = (await api('GET', '/admin/gallery/trash?kind=album&page=1&limit=100&search=WebFlow')).json?.data?.items ?? []
  cleanupLog.push(`left: ${albumsLeft.length} albums, ${trashLeft.length} albums in trash`)
} catch (error) {
  cleanupLog.push(`cleanup error: ${error.message}`)
}
console.log('CLEANUP', cleanupLog.join(' | '))

await browser.close()
const report = { results, consoleErrors, failedRequests, cleanup: cleanupLog, hasVideo }
fs.writeFileSync(path.join(OUT, 'gallery-ui-flow.json'), JSON.stringify(report, null, 2))
const passed = results.filter((r) => r.status === 'Pass').length
console.log(`${passed} passed, ${results.length - passed} failed`)
console.log(`console errors: ${consoleErrors.length}, failed requests: ${failedRequests.length} (unexpected ${failedRequests.filter((f) => !f.expected).length})`)
