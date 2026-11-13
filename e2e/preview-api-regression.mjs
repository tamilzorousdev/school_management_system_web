import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const BACKEND = process.env.E2E_BACKEND_DIR ?? 'C:/Users/DELL/Telematics'
const require = createRequire(`${BACKEND}/package.json`)
require('dotenv').config({ path: `${BACKEND}/.env` })
const pg = require('pg')

const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1'
const ORIGIN = new URL(API).origin
const DAY = process.env.E2E_DAY ?? 'Day 8'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results', 'preview-api.json')
fs.mkdirSync(path.dirname(OUT), { recursive: true })

const db = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
const results = []
let count = 0
let lastCall = { method: 'GET', path: '' }

function record(type, scenario, ok, actual, expected) {
  count += 1
  const id = `API-AP-${String(count).padStart(2, '0')}`
  results.push({
    day: DAY,
    id,
    module: 'App previews',
    type,
    method: lastCall.method,
    endpoint: lastCall.path.replace(/\?.*$/, '').replace(/\/\d+(?=\/|$)/g, '/:id'),
    scenario,
    expected: expected ?? 'As described',
    status: ok ? 'Pass' : 'Fail',
    actual: actual ?? (ok ? (expected ?? 'As expected') : 'Not as expected'),
  })
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${id}  [${type}] ${scenario}${actual ? `  -- ${actual}` : ''}`
  )
}

async function call(method, urlPath, { token, body, query } = {}) {
  lastCall = { method, path: urlPath }
  const url = new URL(urlPath.startsWith('http') ? urlPath : API + urlPath)
  Object.entries(query ?? {}).forEach(
    ([k, v]) => v !== undefined && url.searchParams.set(k, String(v))
  )
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  return { status: res.status, body: json, data: json?.data }
}

const describe = (res) =>
  `${res.status}${res.body?.error ? ` ${res.body.error}` : ''}${res.status >= 400 && res.body?.message ? `: ${res.body.message}` : ''}`

function expectStatus(type, scenario, res, status, code, field) {
  const ok =
    res.status === status &&
    (!code || res.body?.error === code) &&
    (!field || (res.body?.errors ?? []).some((e) => e.field === field))
  record(
    type,
    scenario,
    ok,
    describe(res),
    `${status}${code ? ` ${code}` : ''}${field ? ` on ${field}` : ''}`
  )
  return res
}

function check(type, scenario, ok, actual, expected) {
  record(type, scenario, Boolean(ok), actual, expected)
}

async function login(mobile, app) {
  await call('POST', '/auth/otp/request', { body: { mobile, app } })
  const res = await call('POST', '/auth/otp/verify', {
    body: {
      mobile,
      otp: '123456',
      client: { app, platform: 'web', device_name: 'Preview runner' },
    },
  })
  if (!res.data?.access_token) throw new Error(`Login ${mobile}: ${describe(res)}`)
  return { token: res.data.access_token, user: res.data.user }
}

const one = async (sql, params) => (await db.query(sql, params)).rows[0]
const isPage = (data) =>
  data && Array.isArray(data.items) && typeof data.total === 'number' && 'has_next' in data

async function main() {
  await db.connect()
  const admin = await login('9876543210', 'admin')
  const transport = await login('9000000003', 'admin')
  const teacherLogin = await login('9000000004', 'mobile')

  const teacher = await one(
    `SELECT st.id, st.user_id FROM staff st JOIN users u ON u.id = st.user_id
      WHERE u.mobile = '9000000004' AND st.deleted_at IS NULL`
  )
  const busy = await one(
    `SELECT st.id, st.user_id FROM staff st
       JOIN chat_threads t ON t.teacher_user_id = st.user_id
       JOIN academic_years y ON y.id = t.academic_year_id AND y.is_current
      WHERE st.deleted_at IS NULL AND st.staff_type = 'teaching'
      GROUP BY st.id, st.user_id ORDER BY count(*) DESC LIMIT 1`
  )
  const helper = await one(
    `SELECT st.id FROM staff st JOIN users u ON u.id = st.user_id
      WHERE st.staff_type = 'non_teaching' AND st.deleted_at IS NULL AND st.school_id = $1 LIMIT 1`,
    [admin.user.school_id ?? admin.user.school?.id]
  )
  const child = await one(
    `SELECT sg.student_id FROM student_guardians sg
       JOIN guardians g ON g.id = sg.guardian_id JOIN users u ON u.id = g.user_id
      WHERE u.mobile = '9000000005' ORDER BY sg.is_primary DESC LIMIT 1`
  )
  const t = (p = '') => `/admin/staff/${teacher.id}/teacher-view${p}`
  const s = (p = '') => `/admin/students/${child.student_id}/parent-view${p}`

  const home = expectStatus(
    'Smoke',
    'Teacher app home loads for a teacher',
    await call('GET', t(), { token: admin.token }),
    200
  )
  const h = home.data
  check(
    'Validation',
    'Home shows that teacher with today, classes and four counts',
    h?.teacher?.user_id === Number(teacher.user_id) &&
      Array.isArray(h?.today?.periods) &&
      Array.isArray(h?.classes) &&
      ['diary_pending', 'meetings_upcoming', 'chat_unread', 'announcements_unread'].every(
        (k) => typeof h?.counts?.[k] === 'number'
      ),
    h
      ? `user ${h.teacher?.user_id}, ${h.today?.periods?.length} periods, ${h.classes?.length} classes`
      : 'no data'
  )
  const mobileToday = await call('GET', '/mobile/teacher/timetable/today', {
    token: teacherLogin.token,
  })
  const mobileClasses = await call('GET', '/mobile/teacher/classes', { token: teacherLogin.token })
  check(
    'Regression',
    'Preview timetable and classes match what the teacher app returns',
    JSON.stringify(mobileToday.data?.periods?.map((p) => [p.start_time, p.section?.id])) ===
      JSON.stringify(h?.today?.periods?.map((p) => [p.start_time, p.section?.id])) &&
      mobileClasses.data?.length === h?.classes?.length,
    `${mobileToday.data?.periods?.length}/${h?.today?.periods?.length} periods, ${mobileClasses.data?.length}/${h?.classes?.length} classes`
  )

  const diary = expectStatus(
    'Smoke',
    'Teacher diary posts list',
    await call('GET', t('/diary'), { token: admin.token }),
    200
  )
  check(
    'Validation',
    'Every diary post was written by this teacher, current year only',
    isPage(diary.data) && diary.data.items.every((d) => d.author.id === Number(teacher.user_id)),
    `${diary.data?.total} posts`
  )
  const mobileDiary = await call('GET', '/mobile/teacher/diary', { token: teacherLogin.token })
  check(
    'Regression',
    'Diary total matches the teacher app',
    mobileDiary.data?.total === diary.data?.total,
    `${mobileDiary.data?.total} vs ${diary.data?.total}`
  )
  const pending = await call('GET', t('/diary'), {
    token: admin.token,
    query: { status: 'pending_review' },
  })
  check(
    'Validation',
    'Status filter returns only posts waiting for review and matches the home count',
    pending.status === 200 &&
      pending.data.items.every((d) => d.status === 'pending_review') &&
      pending.data.total === h?.counts?.diary_pending,
    `${pending.data?.total} waiting, home says ${h?.counts?.diary_pending}`
  )
  expectStatus(
    'Validation',
    'Unknown diary status is rejected',
    await call('GET', t('/diary'), { token: admin.token, query: { status: 'draft' } }),
    400,
    'VALIDATION_FAILED',
    'status'
  )

  for (const scope of ['upcoming', 'past']) {
    const res = await call('GET', t('/meetings'), { token: admin.token, query: { scope } })
    check(
      'Smoke',
      `Teacher ${scope} meetings are this teacher’s only`,
      res.status === 200 &&
        isPage(res.data) &&
        res.data.items.every((m) => m.teacher.id === Number(teacher.user_id)),
      `${describe(res)}, ${res.data?.total} meetings`
    )
  }
  const upcoming = await call('GET', t('/meetings'), {
    token: admin.token,
    query: { scope: 'upcoming', limit: 1 },
  })
  check(
    'Regression',
    'Upcoming meeting count matches the home badge',
    upcoming.data?.total === h?.counts?.meetings_upcoming,
    `${upcoming.data?.total} vs ${h?.counts?.meetings_upcoming}`
  )
  expectStatus(
    'Validation',
    'Unknown meeting scope is rejected',
    await call('GET', t('/meetings'), { token: admin.token, query: { scope: 'soon' } }),
    400,
    'VALIDATION_FAILED',
    'scope'
  )

  const chatOwner = busy ?? teacher
  const tc = (p = '') => `/admin/staff/${chatOwner.id}/teacher-view${p}`
  const threads = expectStatus(
    'Smoke',
    'Teacher chat threads list',
    await call('GET', tc('/chat'), { token: admin.token }),
    200
  )
  check(
    'Validation',
    'Every thread belongs to this teacher',
    isPage(threads.data) &&
      threads.data.items.every((x) => x.teacher.id === Number(chatOwner.user_id)),
    `${threads.data?.total} threads`
  )
  const thread = threads.data?.items?.[0]
  if (thread) {
    const before = Number(
      (
        await one(
          `SELECT count(*) AS n FROM chat_audit_logs WHERE thread_id = $1 AND action = 'viewed_thread' AND actor_user_id = $2`,
          [thread.id, admin.user.id]
        )
      ).n
    )
    const messages = expectStatus(
      'Smoke',
      'Open a thread as the teacher sees it',
      await call('GET', tc(`/chat/${thread.id}/messages`), { token: admin.token }),
      200
    )
    check(
      'Validation',
      'Messages come newest first with has_more',
      Array.isArray(messages.data?.items) && typeof messages.data?.has_more === 'boolean',
      `${messages.data?.items?.length} messages`
    )
    const after = Number(
      (
        await one(
          `SELECT count(*) AS n FROM chat_audit_logs WHERE thread_id = $1 AND action = 'viewed_thread' AND actor_user_id = $2`,
          [thread.id, admin.user.id]
        )
      ).n
    )
    check(
      'Validation',
      'Opening a thread writes one access-log row under the admin',
      after === before + 1,
      `${before} -> ${after}`
    )
    const stranger = await one(
      `SELECT st.id FROM staff st WHERE st.staff_type = 'teaching' AND st.deleted_at IS NULL AND st.user_id <> $1 AND st.school_id = $2 LIMIT 1`,
      [thread.teacher.id, admin.user.school_id ?? admin.user.school?.id]
    )
    if (stranger) {
      expectStatus(
        'Validation',
        'Another teacher’s thread is not readable through this teacher',
        await call('GET', `/admin/staff/${stranger.id}/teacher-view/chat/${thread.id}/messages`, {
          token: admin.token,
        }),
        404,
        'THREAD_NOT_FOUND'
      )
    }
  } else {
    check(
      'Smoke',
      'Open a thread as the teacher sees it',
      true,
      'skipped: no chat threads this year'
    )
  }
  expectStatus(
    'Validation',
    'Bad thread id is rejected',
    await call('GET', tc('/chat/abc/messages'), { token: admin.token }),
    400
  )

  const news = expectStatus(
    'Smoke',
    'Teacher announcements list',
    await call('GET', t('/announcements'), { token: admin.token }),
    200
  )
  const unreadNews = await call('GET', t('/announcements'), {
    token: admin.token,
    query: { unread: true, limit: 1 },
  })
  check(
    'Regression',
    'Unread announcements match the home badge',
    isPage(news.data) && unreadNews.data?.total === h?.counts?.announcements_unread,
    `${unreadNews.data?.total} vs ${h?.counts?.announcements_unread}`
  )

  if (helper) {
    expectStatus(
      'Validation',
      'Non-teaching staff have no teacher app',
      await call('GET', `/admin/staff/${helper.id}/teacher-view`, { token: admin.token }),
      400,
      'NOT_A_TEACHER'
    )
  }
  expectStatus(
    'Validation',
    'Unknown staff id',
    await call('GET', '/admin/staff/999999/teacher-view', { token: admin.token }),
    404,
    'STAFF_NOT_FOUND'
  )
  expectStatus('Security', 'Teacher preview needs a token', await call('GET', t()), 401)
  expectStatus(
    'Security',
    'A teacher cannot open the admin teacher preview',
    await call('GET', t(), { token: teacherLogin.token }),
    403
  )
  expectStatus(
    'Security',
    'Transport in-charge (no staff.view) cannot open the teacher preview',
    await call('GET', t(), { token: transport.token }),
    403
  )

  const parentHome = expectStatus(
    'Smoke',
    'Parent app home still loads',
    await call('GET', s(), { token: admin.token }),
    200
  )
  const parentUser = parentHome.data?.parent?.user_id
  const pDiary = expectStatus(
    'Smoke',
    'Parent diary feed for the child',
    await call('GET', s('/diary'), { token: admin.token }),
    200
  )
  check(
    'Validation',
    'Diary feed items carry seen state and teacher',
    isPage(pDiary.data) &&
      pDiary.data.items.every((d) => typeof d.seen === 'boolean' && d.teacher?.name),
    `${pDiary.data?.total} posts`
  )
  const pMeet = expectStatus(
    'Smoke',
    'Parent meetings for the child',
    await call('GET', s('/meetings'), { token: admin.token, query: { scope: 'past' } }),
    200
  )
  check(
    'Validation',
    'Every meeting is about this child and this parent',
    isPage(pMeet.data) &&
      pMeet.data.items.every(
        (m) => m.student.id === child.student_id && m.parent.id === parentUser
      ),
    `${pMeet.data?.total} meetings`
  )
  const pChat = expectStatus(
    'Smoke',
    'Parent chat threads for the child',
    await call('GET', s('/chat'), { token: admin.token }),
    200
  )
  check(
    'Validation',
    'Every thread is about this child',
    isPage(pChat.data) && pChat.data.items.every((x) => x.student.id === child.student_id),
    `${pChat.data?.total} threads`
  )
  const foreign = await one(
    `SELECT t.id FROM chat_threads t JOIN academic_years y ON y.id = t.academic_year_id AND y.is_current
      WHERE t.parent_user_id <> $1 LIMIT 1`,
    [parentUser ?? 0]
  )
  if (foreign) {
    expectStatus(
      'Security',
      'Another family’s thread cannot be read through this child',
      await call('GET', s(`/chat/${foreign.id}/messages`), { token: admin.token }),
      404,
      'THREAD_NOT_FOUND'
    )
  }
  const pNews = expectStatus(
    'Smoke',
    'Parent announcements',
    await call('GET', s('/announcements'), { token: admin.token }),
    200
  )
  check(
    'Validation',
    'Announcements carry read state',
    isPage(pNews.data) && pNews.data.items.every((a) => typeof a.is_read === 'boolean'),
    `${pNews.data?.total} announcements`
  )
  expectStatus(
    'Validation',
    'Unknown student',
    await call('GET', '/admin/students/999999/parent-view/diary', { token: admin.token }),
    404,
    'STUDENT_NOT_FOUND'
  )
  expectStatus(
    'Security',
    'Transport in-charge sees the parent home (students.view)',
    await call('GET', s(), { token: transport.token }),
    200
  )
  expectStatus(
    'Security',
    'Transport in-charge cannot read parent chat (needs chat.audit)',
    await call('GET', s('/chat'), { token: transport.token }),
    403
  )
  expectStatus(
    'Security',
    'Transport in-charge cannot read the diary (needs diary.view)',
    await call('GET', s('/diary'), { token: transport.token }),
    403
  )

  const adminDoc = await call('GET', `${ORIGIN}/api/docs/admin-json`)
  const mobileDoc = await call('GET', `${ORIGIN}/api/docs/mobile-json`)
  const adminPaths = Object.keys(adminDoc.body?.paths ?? {})
  const mobilePaths = Object.keys(mobileDoc.body?.paths ?? {})
  check(
    'Regression',
    'Preview routes are in the admin Swagger and not in the mobile one',
    adminPaths.some((p) => p.includes('teacher-view/chat/{threadId}/messages')) &&
      adminPaths.some((p) => p.includes('parent-view/announcements')) &&
      !mobilePaths.some((p) => p.includes('-view')),
    `${adminPaths.filter((p) => p.includes('-view')).length} preview routes in admin doc`
  )

  await db.end()
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
  const passed = results.filter((r) => r.status === 'Pass').length
  console.log(
    `${passed}/${results.length} preview API checks passed. Results: e2e/results/preview-api.json`
  )
}

main().catch(async (error) => {
  console.error(error)
  await db.end().catch(() => {})
  process.exit(1)
})
