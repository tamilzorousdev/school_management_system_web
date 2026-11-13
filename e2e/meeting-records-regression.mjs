import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { io } from 'socket.io-client'

const BACKEND = process.env.E2E_BACKEND_DIR ?? 'C:/Users/DELL/Telematics'
const require = createRequire(`${BACKEND}/package.json`)
require('dotenv').config({ path: `${BACKEND}/.env` })
const pg = require('pg')

const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1'
const ORIGIN = new URL(API).origin
const DAY = process.env.E2E_DAY ?? 'Day 8'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results', 'meeting-records-api.json')
fs.mkdirSync(path.dirname(OUT), { recursive: true })

const db = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
const results = []
const sockets = []
let count = 0
let lastCall = { method: 'GET', path: '' }

function record(type, scenario, ok, actual, expected) {
  count += 1
  const id = `API-MR-${String(count).padStart(2, '0')}`
  results.push({
    day: DAY,
    id,
    module: 'Meeting notes, chat and recap',
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
const check = (type, scenario, ok, actual, expected) =>
  record(type, scenario, Boolean(ok), actual, expected)

async function login(mobile, app) {
  await call('POST', '/auth/otp/request', { body: { mobile, app } })
  const res = await call('POST', '/auth/otp/verify', {
    body: {
      mobile,
      otp: '123456',
      client: { app, platform: 'android', device_name: 'Meeting records runner' },
    },
  })
  if (!res.data?.access_token) throw new Error(`Login ${mobile}: ${describe(res)}`)
  return { token: res.data.access_token, user: res.data.user }
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(`${ORIGIN}/comm`, { auth: { token }, transports: ['websocket'] })
    const events = []
    socket.onAny((name, payload) => events.push({ name, payload }))
    socket.on('connect', () => {
      sockets.push(socket)
      resolve({ socket, events })
    })
    socket.on('connect_error', reject)
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitFor(fn, seconds = 8) {
  for (let i = 0; i < seconds * 4; i += 1) {
    const value = await fn()
    if (value) return value
    await sleep(250)
  }
  return null
}
const seen = (listener, name, test = () => true) =>
  waitFor(() => listener.events.find((event) => event.name === name && test(event.payload)))
const ist = (minutes) => {
  const d = new Date(Date.now() + minutes * 60_000 + 330 * 60_000)
  return `${d.toISOString().slice(0, 19)}+05:30`
}
const one = async (sql, params = []) => (await db.query(sql, params)).rows[0]

async function cleanup() {
  const ids = `SELECT id FROM meetings WHERE title LIKE 'MR:%'`
  await db.query(`DELETE FROM meeting_notes WHERE meeting_id IN (${ids})`)
  await db.query(`DELETE FROM meeting_messages WHERE meeting_id IN (${ids})`)
  await db.query(`DELETE FROM meeting_call_logs WHERE meeting_id IN (${ids})`)
  await db
    .query(
      `DELETE FROM notifications WHERE template_code = 'MEETING_NOTES_SHARED' AND data->>'title' LIKE 'MR:%'`
    )
    .catch(() => null)
  await db.query(`DELETE FROM meetings WHERE title LIKE 'MR:%'`)
}

async function main() {
  await db.connect()
  await cleanup()
  const teacher = await login('9000000004', 'mobile')
  const parent = await login('9000000005', 'mobile')
  const other = await login('9000000006', 'mobile')
  const child = (await call('GET', '/mobile/parent/children', { token: parent.token })).data[0]
  const teacherLive = await connect(teacher.token)
  const parentLive = await connect(parent.token)
  const since = new Date(Date.now() - 1000)

  const booked = await call('POST', '/mobile/teacher/meetings', {
    token: teacher.token,
    body: {
      student_id: child.id,
      parent_user_id: parent.user.id,
      title: 'MR: Maths progress',
      scheduled_at: ist(2 * 24 * 60 + 17),
      duration_minutes: 15,
    },
  })
  if (booked.status !== 201) throw new Error(`Could not book a meeting: ${describe(booked)}`)
  const id = booked.data.id
  const T = (p) => `/mobile/teacher/meetings/${id}${p}`
  const P = (p) => `/mobile/parent/meetings/${id}${p}`

  const priv = expectStatus(
    'Smoke',
    'Teacher adds a private note before the meeting',
    await call('POST', T('/notes'), {
      token: teacher.token,
      body: { body: '  Check fractions homework  ' },
    }),
    201
  )
  check(
    'Validation',
    'Note is trimmed, private and mine',
    priv.data?.body === 'Check fractions homework' &&
      priv.data?.shared === false &&
      priv.data?.mine === true &&
      priv.data?.author_party === 'teacher',
    JSON.stringify({ body: priv.data?.body, shared: priv.data?.shared })
  )
  const parentView1 = await call('GET', P('/notes'), { token: parent.token })
  check(
    'Security',
    'Parent does not see the teacher’s private note',
    parentView1.status === 200 && !parentView1.data.some((n) => n.id === priv.data?.id),
    `${parentView1.data?.length} notes visible`
  )

  const shared = expectStatus(
    'Smoke',
    'Teacher adds a note shared with the parent',
    await call('POST', T('/notes'), {
      token: teacher.token,
      body: { body: 'Practise two pages a day', shared: true },
    }),
    201
  )
  check(
    'Validation',
    'Shared note has shared_at',
    shared.data?.shared === true && Boolean(shared.data?.shared_at)
  )
  const parentView2 = await call('GET', P('/notes'), { token: parent.token })
  check(
    'Smoke',
    'Parent sees the shared note, marked not mine',
    parentView2.data?.some((n) => n.id === shared.data?.id && n.mine === false),
    `${parentView2.data?.length} notes visible`
  )
  check(
    'Regression',
    'Parent gets the meeting.note socket event',
    await seen(parentLive, 'meeting.note', (p) => p.note_id === shared.data?.id)
  )
  const pushed = await waitFor(async () =>
    Number(
      (
        await one(
          `SELECT COUNT(DISTINCT batch_id) AS n FROM notifications WHERE template_code = 'MEETING_NOTES_SHARED' AND user_id = $1 AND created_at >= $2`,
          [parent.user.id, since]
        )
      ).n
    )
  )
  check(
    'Regression',
    'Parent gets exactly one MEETING_NOTES_SHARED notification',
    pushed === 1,
    `${pushed ?? 0} notifications`
  )

  const shareLater = expectStatus(
    'Smoke',
    'Teacher shares the private note later',
    await call('PATCH', T(`/notes/${priv.data.id}`), {
      token: teacher.token,
      body: { shared: true },
    }),
    200
  )
  check('Validation', 'Note is now shared', shareLater.data?.shared === true)
  const unshare = await call('PATCH', T(`/notes/${priv.data.id}`), {
    token: teacher.token,
    body: { shared: false },
  })
  check(
    'Validation',
    'Teacher can make it private again',
    unshare.status === 200 && unshare.data.shared === false && unshare.data.shared_at === null,
    describe(unshare)
  )
  const parentView3 = await call('GET', P('/notes'), { token: parent.token })
  check(
    'Security',
    'Unshared note disappears for the parent',
    !parentView3.data?.some((n) => n.id === priv.data.id)
  )

  const own = expectStatus(
    'Smoke',
    'Parent adds a private note',
    await call('POST', P('/notes'), {
      token: parent.token,
      body: { body: 'Ask about the half-yearly exam' },
    }),
    201
  )
  const teacherView = await call('GET', T('/notes'), { token: teacher.token })
  check(
    'Security',
    'Teacher does not see the parent’s private note',
    !teacherView.data?.some((n) => n.id === own.data?.id),
    `${teacherView.data?.length} notes visible`
  )
  expectStatus(
    'Validation',
    'Parent cannot send shared (not a parent field)',
    await call('POST', P('/notes'), { token: parent.token, body: { body: 'x', shared: true } }),
    400,
    'VALIDATION_FAILED',
    'shared'
  )
  expectStatus(
    'Security',
    'Parent cannot edit the teacher’s note',
    await call('PATCH', P(`/notes/${shared.data.id}`), {
      token: parent.token,
      body: { body: 'changed' },
    }),
    404,
    'NOTE_NOT_FOUND'
  )
  expectStatus(
    'Security',
    'Teacher cannot delete the parent’s note',
    await call('DELETE', T(`/notes/${own.data.id}`), { token: teacher.token }),
    404,
    'NOTE_NOT_FOUND'
  )
  expectStatus(
    'Validation',
    'Empty note is rejected',
    await call('POST', T('/notes'), { token: teacher.token, body: { body: '   ' } }),
    400,
    'VALIDATION_FAILED',
    'body'
  )
  expectStatus(
    'Validation',
    'Note over 5000 characters is rejected',
    await call('POST', T('/notes'), { token: teacher.token, body: { body: 'a'.repeat(5001) } }),
    400,
    'VALIDATION_FAILED',
    'body'
  )
  expectStatus(
    'Validation',
    'Edit with nothing to change is rejected',
    await call('PATCH', T(`/notes/${shared.data.id}`), { token: teacher.token, body: {} }),
    400,
    'VALIDATION_FAILED',
    'body'
  )
  expectStatus(
    'Security',
    'Another parent cannot read the notes',
    await call('GET', `/mobile/parent/meetings/${id}/notes`, { token: other.token }),
    404,
    'MEETING_NOT_FOUND'
  )
  expectStatus(
    'Security',
    'A parent token cannot use the teacher route',
    await call('GET', T('/notes'), { token: parent.token }),
    403
  )
  expectStatus('Security', 'Notes need a token', await call('GET', T('/notes')), 401)
  expectStatus(
    'Smoke',
    'Parent deletes their note',
    await call('DELETE', P(`/notes/${own.data.id}`), { token: parent.token }),
    200
  )
  const afterDelete = await call('GET', P('/notes'), { token: parent.token })
  check('Validation', 'Deleted note is gone', !afterDelete.data?.some((n) => n.id === own.data.id))
  await call('POST', P('/notes'), { token: parent.token, body: { body: 'Bring the report card' } })

  expectStatus(
    'Validation',
    'Chat is closed before the join window',
    await call('POST', T('/messages'), { token: teacher.token, body: { body: 'Hello' } }),
    409,
    'MEETING_NOT_OPEN'
  )
  expectStatus(
    'Validation',
    'No recap before the meeting',
    await call('GET', T('/recap'), { token: teacher.token }),
    409,
    'MEETING_NOT_OVER'
  )

  await db.query(
    `UPDATE meetings SET scheduled_at = now() - interval '1 minute', scheduled_end_at = now() + interval '14 minutes' WHERE id = $1`,
    [id]
  )
  const hello = expectStatus(
    'Smoke',
    'Teacher sends a chat message in the join window',
    await call('POST', T('/messages'), {
      token: teacher.token,
      body: { body: 'Can you hear me?' },
    }),
    201
  )
  check(
    'Validation',
    'Message comes back as mine',
    hello.data?.mine === true &&
      hello.data?.sender_party === 'teacher' &&
      hello.data?.body === 'Can you hear me?'
  )
  check(
    'Regression',
    'Parent gets meeting.message live',
    await seen(parentLive, 'meeting.message', (p) => p.id === hello.data?.id && p.mine === false)
  )
  const reply = expectStatus(
    'Smoke',
    'Parent replies in the meeting chat',
    await call('POST', P('/messages'), {
      token: parent.token,
      body: { body: 'Yes, loud and clear' },
    }),
    201
  )
  check(
    'Regression',
    'Teacher gets the reply live',
    await seen(teacherLive, 'meeting.message', (p) => p.id === reply.data?.id)
  )
  expectStatus(
    'Validation',
    'Empty message is rejected',
    await call('POST', P('/messages'), { token: parent.token, body: { body: '  ' } }),
    400,
    'VALIDATION_FAILED',
    'body'
  )
  expectStatus(
    'Validation',
    'Unknown file is rejected',
    await call('POST', P('/messages'), { token: parent.token, body: { file_id: 99999999 } }),
    400,
    'VALIDATION_FAILED',
    'file_id'
  )
  expectStatus(
    'Validation',
    'Message over 2000 characters is rejected',
    await call('POST', P('/messages'), { token: parent.token, body: { body: 'b'.repeat(2001) } }),
    400,
    'VALIDATION_FAILED',
    'body'
  )
  expectStatus(
    'Security',
    'Another parent cannot post in this chat',
    await call('POST', `/mobile/parent/meetings/${id}/messages`, {
      token: other.token,
      body: { body: 'hi' },
    }),
    404,
    'MEETING_NOT_FOUND'
  )
  const page1 = await call('GET', T('/messages'), { token: teacher.token, query: { limit: 1 } })
  const page2 = await call('GET', T('/messages'), {
    token: teacher.token,
    query: { limit: 1, before_id: page1.data?.items?.[0]?.id },
  })
  check(
    'Smoke',
    'History is newest first and pages with before_id',
    page1.data?.items?.[0]?.id === reply.data?.id &&
      page1.data?.has_more === true &&
      page2.data?.items?.[0]?.id === hello.data?.id,
    `${page1.data?.items?.[0]?.id}, then ${page2.data?.items?.[0]?.id}`
  )
  expectStatus(
    'Validation',
    'limit over 100 is rejected',
    await call('GET', T('/messages'), { token: teacher.token, query: { limit: 500 } }),
    400,
    'VALIDATION_FAILED',
    'limit'
  )

  await db.query(
    `UPDATE meetings SET status = 'completed', started_at = now() - interval '20 minutes', ended_at = now() - interval '1 minute', end_reason = 'host_ended' WHERE id = $1`,
    [id]
  )
  await db.query(
    `INSERT INTO meeting_call_logs (school_id, meeting_id, user_id, party, platform, source, joined_at, left_at)
     SELECT m.school_id, m.id, v.user_id, v.party, v.platform, v.source, now() - v.joined, now() - v.left_at
       FROM meetings m,
       (VALUES ($2::int, 'teacher', 'android', 'app', interval '20 minutes', interval '1 minute'),
               ($2::int, 'teacher', 'android', 'agora', interval '19 minutes', interval '2 minutes'),
               ($3::int, 'parent', 'ios', 'app', interval '15 minutes', interval '10 minutes'),
               ($3::int, 'parent', 'ios', 'app', interval '8 minutes', interval '1 minute'))
         AS v(user_id, party, platform, source, joined, left_at)
      WHERE m.id = $1`,
    [id, teacher.user.id, parent.user.id]
  )
  expectStatus(
    'Validation',
    'Chat is read-only after the meeting',
    await call('POST', T('/messages'), { token: teacher.token, body: { body: 'late' } }),
    409,
    'MEETING_CHAT_CLOSED'
  )
  const oldChat = await call('GET', P('/messages'), { token: parent.token })
  check(
    'Regression',
    'Chat history stays readable after the meeting',
    oldChat.status === 200 && oldChat.data.items.length === 2,
    describe(oldChat)
  )

  const tRecap = expectStatus(
    'Smoke',
    'Teacher opens the recap',
    await call('GET', T('/recap'), { token: teacher.token }),
    200
  )
  const r = tRecap.data
  const tAtt = r?.attendance?.[0]
  const pAtt = r?.attendance?.[1]
  check(
    'Validation',
    'Recap lists the teacher then the parent',
    tAtt?.party === 'teacher' && pAtt?.party === 'parent' && tAtt?.user?.id === teacher.user.id
  )
  check(
    'Validation',
    'Overlapping app and Agora rows are counted once (19 min, 1 session)',
    tAtt?.minutes === 19 && tAtt?.sessions === 1,
    `${tAtt?.minutes} min, ${tAtt?.sessions} sessions`
  )
  check(
    'Validation',
    'A reconnect counts as a second session (12 min, 2 sessions)',
    pAtt?.minutes === 12 && pAtt?.sessions === 2 && pAtt?.platforms?.[0] === 'ios',
    `${pAtt?.minutes} min, ${pAtt?.sessions} sessions`
  )
  check(
    'Validation',
    'Recap has the whole chat oldest first',
    r?.message_count === 2 && r?.messages?.[0]?.id === hello.data?.id,
    `${r?.message_count} messages`
  )
  check(
    'Security',
    'Teacher recap has teacher notes only (private and shared), not the parent’s',
    r?.notes?.length === 2 && r.notes.every((n) => n.author_party === 'teacher'),
    `${r?.notes?.length} notes`
  )
  check(
    'Validation',
    'Recap meeting has no raw call_log',
    r?.meeting && !('call_log' in r.meeting) && r.meeting.status === 'completed'
  )
  const pRecap = await call('GET', P('/recap'), { token: parent.token })
  check(
    'Security',
    'Parent recap has the shared note and their own note only',
    pRecap.status === 200 &&
      pRecap.data.notes.length === 2 &&
      pRecap.data.notes.some((n) => n.author_party === 'parent') &&
      pRecap.data.notes.every((n) => n.author_party === 'parent' || n.shared),
    `${pRecap.data?.notes?.length} notes`
  )
  expectStatus(
    'Smoke',
    'Notes can still be added after the meeting',
    await call('POST', T('/notes'), {
      token: teacher.token,
      body: { body: 'Follow up in two weeks', shared: true },
    }),
    201
  )

  const cancelled = await call('POST', '/mobile/teacher/meetings', {
    token: teacher.token,
    body: {
      student_id: child.id,
      parent_user_id: parent.user.id,
      title: 'MR: Cancelled',
      scheduled_at: ist(3 * 24 * 60 + 17),
      duration_minutes: 15,
    },
  })
  await call('POST', `/mobile/teacher/meetings/${cancelled.data.id}/cancel`, {
    token: teacher.token,
    body: { reason: 'Clash' },
  })
  expectStatus(
    'Validation',
    'No notes on a cancelled meeting',
    await call('POST', `/mobile/teacher/meetings/${cancelled.data.id}/notes`, {
      token: teacher.token,
      body: { body: 'x' },
    }),
    409,
    'MEETING_CANCELLED'
  )
  expectStatus(
    'Validation',
    'No recap for a cancelled meeting',
    await call('GET', `/mobile/parent/meetings/${cancelled.data.id}/recap`, {
      token: parent.token,
    }),
    409,
    'MEETING_CANCELLED'
  )
  expectStatus(
    'Validation',
    'Chat refuses a cancelled meeting',
    await call('POST', `/mobile/parent/meetings/${cancelled.data.id}/messages`, {
      token: parent.token,
      body: { body: 'hi' },
    }),
    409,
    'MEETING_CANCELLED'
  )

  const mobileDoc = await call('GET', `${ORIGIN}/api/docs/mobile-json`)
  const adminDoc = await call('GET', `${ORIGIN}/api/docs/admin-json`)
  const mobilePaths = Object.keys(mobileDoc.body?.paths ?? {})
  check(
    'Regression',
    'New routes are in the mobile Swagger only',
    [
      '/api/v1/mobile/teacher/meetings/{meetingId}/recap',
      '/api/v1/mobile/parent/meetings/{meetingId}/notes/{noteId}',
      '/api/v1/mobile/teacher/meetings/{meetingId}/messages',
    ].every((p) => mobilePaths.includes(p)) &&
      !Object.keys(adminDoc.body?.paths ?? {}).some((p) => p.includes('/recap')),
    `${mobilePaths.filter((p) => /notes|messages|recap/.test(p) && p.includes('meetings')).length} routes in mobile doc`
  )

  await cleanup()
  sockets.forEach((socket) => socket.close())
  await db.end()
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2))
  const passed = results.filter((row) => row.status === 'Pass').length
  console.log(
    `${passed}/${results.length} meeting records checks passed. Results: e2e/results/meeting-records-api.json`
  )
}

main().catch(async (error) => {
  console.error(error)
  sockets.forEach((socket) => socket.close())
  await cleanup().catch(() => null)
  await db.end().catch(() => {})
  process.exit(1)
})
