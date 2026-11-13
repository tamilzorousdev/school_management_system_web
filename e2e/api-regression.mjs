import fs from 'node:fs'
import path from 'node:path'

const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1'
const DAY = process.env.E2E_DAY ?? 'Day 6'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = path.join(ROOT, 'results')
fs.mkdirSync(OUT, { recursive: true })
const RUN = String(Date.now()).slice(-5)
const mobile = (n) => `97${RUN}${String(n).padStart(3, '0')}`
const results = []
const TODAY_IST = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)

function tokenFrom(stateFile) {
  const file = path.join(ROOT, stateFile)
  if (!fs.existsSync(file)) return null
  const state = JSON.parse(fs.readFileSync(file, 'utf8'))
  const entry = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((item) => item.name === 'tz-session')
  return entry ? JSON.parse(entry.value) : null
}

function saveSession(stateFile, tokens) {
  const file = path.join(ROOT, stateFile)
  const value = JSON.stringify({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  })
  const state = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : { cookies: [], origins: [] }
  const origin = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:5173').origin
  let entry = state.origins.find((item) => item.origin === origin)
  if (!entry) {
    entry = { origin, localStorage: [] }
    state.origins.push(entry)
  }
  entry.localStorage = entry.localStorage
    .filter((item) => item.name !== 'tz-session')
    .concat({ name: 'tz-session', value })
  fs.writeFileSync(file, JSON.stringify(state, null, 2))
}

async function sessionFor(stateFile, mobileNumber, app = 'admin') {
  const saved = tokenFrom(stateFile)
  if (saved) {
    const refreshed = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: saved.refreshToken }),
    }).then((response) => response.json())
    if (refreshed.data) {
      saveSession(stateFile, refreshed.data)
      return refreshed.data.access_token
    }
  }
  await fetch(`${API}/auth/otp/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mobile: mobileNumber }),
  })
  const verified = await fetch(`${API}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mobile: mobileNumber,
      otp: '123456',
      client: { app, platform: app === 'admin' ? 'web' : 'android' },
    }),
  }).then((response) => response.json())
  if (!verified.data) throw new Error(`Sign-in failed for ${mobileNumber}: ${verified.message}`)
  saveSession(stateFile, verified.data)
  return verified.data.access_token
}

const client =
  (token, extra = {}) =>
  async (method, url, body) => {
    const response = await fetch(`${API}${url}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...extra,
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const type = response.headers.get('content-type') ?? ''
    return {
      status: response.status,
      type,
      body: type.includes('json') ? await response.json() : null,
    }
  }

async function check(meta, fn) {
  const row = { day: DAY, ...meta, status: 'Pass', actual: '' }
  try {
    row.actual = (await fn()) ?? meta.expected
  } catch (error) {
    row.status = 'Fail'
    row.actual = String(error?.message ?? error).slice(0, 300)
  }
  results.push(row)
  console.log(
    `${row.status === 'Pass' ? 'PASS' : 'FAIL'}  ${meta.id.padEnd(8)} ${meta.method.padEnd(6)} ${meta.endpoint}${row.status === 'Fail' ? `\n        ${row.actual}` : ''}`
  )
}

const expectStatus = (result, status, code) => {
  if (result.status !== status)
    throw new Error(
      `Got ${result.status} ${result.body?.error ?? ''}: ${result.body?.message ?? ''}`
    )
  if (code && result.body?.error !== code)
    throw new Error(`Got ${result.body?.error}, wanted ${code}`)
  return `${result.status}${result.body?.error ? ` ${result.body.error}` : ''}${result.body?.message && status >= 400 ? `: ${result.body.message}` : ''}`
}

const fields = (result) => (result.body?.errors ?? []).map((item) => item.field)
const expectFields = (result, wanted) => {
  expectStatus(result, 400, 'VALIDATION_FAILED')
  const got = fields(result)
  const missing = wanted.filter(
    (field) => !got.some((item) => item === field || item.startsWith(`${field}.`))
  )
  if (missing.length) throw new Error(`No error for ${missing.join(', ')} (got ${got.join(', ')})`)
  return `400 VALIDATION_FAILED on ${wanted.join(', ')}`
}

const adminToken = await sessionFor('.auth-admin.json', '9876543210')
const admin = client(adminToken)
const guest = client(null)
const parentToken = await sessionFor('.auth-parent.json', '9000000005', 'mobile')
const parent = client(parentToken)
const teacherToken = await sessionFor('.auth-teacher.json', '9000000004', 'mobile')
const teacher = client(teacherToken)
const ao = client(await sessionFor('.auth-ao.json', '9000000002'))

const C = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected }, fn)

await C(
  'API-AU-01',
  'Auth',
  'POST',
  '/auth/otp/request',
  'Mobile missing',
  '400 on mobile',
  async () => expectFields(await guest('POST', '/auth/otp/request', {}), ['mobile'])
)
await C(
  'API-AU-02',
  'Auth',
  'POST',
  '/auth/otp/request',
  'Number not in school records',
  '404 MOBILE_NOT_REGISTERED',
  async () =>
    expectStatus(
      await guest('POST', '/auth/otp/request', { mobile: '9123400001' }),
      404,
      'MOBILE_NOT_REGISTERED'
    )
)
await C('API-AU-03', 'Auth', 'GET', '/admin/students', 'No token', '401', async () =>
  expectStatus(await guest('GET', '/admin/students'), 401)
)
await C(
  'API-AU-04',
  'Auth',
  'GET',
  '/admin/students',
  'Parent token on admin API',
  '403',
  async () => expectStatus(await parent('GET', '/admin/students'), 403)
)

await C(
  'API-US-01',
  'Users',
  'POST',
  '/admin/users',
  'Empty body',
  '400 on name, mobile, role_codes',
  async () =>
    expectFields(await admin('POST', '/admin/users', {}), ['name', 'mobile', 'role_codes'])
)
let userId = 0
await C('API-US-02', 'Users', 'POST', '/admin/users', 'Create a teacher user', '201', async () => {
  const result = await admin('POST', '/admin/users', {
    name: `API User ${RUN}`,
    mobile: mobile(1),
    role_codes: ['TEACHER'],
  })
  userId = result.body?.data?.id
  return expectStatus(result, 201)
})
await C(
  'API-US-03',
  'Users',
  'POST',
  '/admin/users',
  'Same mobile again',
  '409 MOBILE_TAKEN',
  async () =>
    expectStatus(
      await admin('POST', '/admin/users', {
        name: 'Dup',
        mobile: mobile(1),
        role_codes: ['TEACHER'],
      }),
      409,
      'MOBILE_TAKEN'
    )
)
await C(
  'API-US-04',
  'Users',
  'GET',
  '/admin/users?sort=bad',
  'Unknown sort',
  '400 INVALID_SORT',
  async () => expectStatus(await admin('GET', '/admin/users?sort=bad'), 400, 'INVALID_SORT')
)

await C(
  'API-SU-01',
  'School setup',
  'POST',
  '/admin/subjects',
  'Empty body',
  '400 on code, name',
  async () => expectFields(await admin('POST', '/admin/subjects', {}), ['code', 'name'])
)
await C(
  'API-SU-02',
  'School setup',
  'POST',
  '/admin/holidays',
  'Last day before first day',
  '400',
  async () => {
    const result = await admin('POST', '/admin/holidays', {
      name: 'Bad',
      date: '2026-12-10',
      end_date: '2026-12-01',
      type: 'holiday',
    })
    if (result.status !== 400) throw new Error(`Got ${result.status}`)
    return `400 ${result.body.error}`
  }
)
await C(
  'API-SU-03',
  'School setup',
  'GET',
  '/admin/setup/summary',
  'Setup summary',
  '200 with current year',
  async () => {
    const result = await admin('GET', '/admin/setup/summary')
    if (!result.body?.data?.current_year) throw new Error('No current year')
    return expectStatus(result, 200)
  }
)

await C(
  'API-ST-01',
  'Students',
  'POST',
  '/admin/students',
  'Empty body',
  '400 on first_name, dob, gender, class_id, guardians',
  async () =>
    expectFields(await admin('POST', '/admin/students', {}), [
      'first_name',
      'dob',
      'gender',
      'class_id',
      'guardians',
    ])
)
await C(
  'API-ST-02',
  'Students',
  'POST',
  '/admin/students',
  'Guardian with bad mobile',
  '400 on guardians.0.mobile',
  async () =>
    expectFields(
      await admin('POST', '/admin/students', {
        first_name: 'X',
        dob: '2015-01-01',
        gender: 'male',
        class_id: 1,
        guardians: [{ name: 'Parent', mobile: '123', relation: 'father' }],
      }),
      ['guardians']
    )
)
const classes = (await admin('GET', '/admin/classes')).body.data
const classFive = classes.find((item) => item.name === '5')
let studentId = 0
await C(
  'API-ST-03',
  'Students',
  'POST',
  '/admin/students',
  'Create a student with a new parent',
  '201 with admission number',
  async () => {
    const result = await admin('POST', '/admin/students', {
      first_name: 'APIKid',
      last_name: RUN,
      dob: '2016-05-10',
      gender: 'female',
      class_id: classFive.id,
      guardians: [
        {
          name: `API Parent ${RUN}`,
          mobile: mobile(2),
          relation: 'mother',
          receives_alerts: false,
        },
      ],
    })
    studentId = result.body?.data?.id
    if (!result.body?.data?.admission_no) throw new Error('No admission number')
    return expectStatus(result, 201)
  }
)
await C(
  'API-ST-04',
  'Students',
  'GET',
  '/admin/students?search=',
  'Search by parent mobile',
  'The new student is found',
  async () => {
    const result = await admin('GET', `/admin/students?search=${mobile(2)}`)
    if (!result.body.data.items.some((item) => item.id === studentId)) throw new Error('Not found')
    return expectStatus(result, 200)
  }
)
await C(
  'API-ST-05',
  'Students',
  'PUT',
  '/admin/students/:id/enrollment',
  'Roll number without a section',
  '400 ROLL_NEEDS_SECTION',
  async () =>
    expectStatus(
      await admin('PUT', `/admin/students/${studentId}/enrollment`, {
        class_id: classFive.id,
        section_id: null,
        roll_no: 3,
      }),
      400,
      'ROLL_NEEDS_SECTION'
    )
)

await C(
  'API-RC-01',
  'Student records',
  'PUT',
  '/admin/students/:id/health',
  'Height out of range',
  '400 on height_cm',
  async () =>
    expectFields(await admin('PUT', `/admin/students/${studentId}/health`, { height_cm: 999 }), [
      'height_cm',
    ])
)
await C(
  'API-RC-02',
  'Student records',
  'PUT',
  '/admin/students/:id/health',
  'Save height and weight',
  '200 with BMI',
  async () => {
    const result = await admin('PUT', `/admin/students/${studentId}/health`, {
      height_cm: 135,
      weight_kg: 30,
    })
    if (result.body?.data?.bmi !== 16.5) throw new Error(`BMI ${result.body?.data?.bmi}`)
    return expectStatus(result, 200)
  }
)
await C(
  'API-RC-03',
  'Student records',
  'POST',
  '/admin/students/:id/vaccinations',
  'Vaccine name missing',
  '400 on vaccine',
  async () =>
    expectFields(await admin('POST', `/admin/students/${studentId}/vaccinations`, {}), ['vaccine'])
)
await C(
  'API-RC-04',
  'Student records',
  'POST',
  '/admin/students/:id/behaviour',
  'Unknown category and short title',
  '400 on category, title',
  async () =>
    expectFields(
      await admin('POST', `/admin/students/${studentId}/behaviour`, {
        category: 'praise',
        title: 'ok',
      }),
      ['category', 'title']
    )
)
await C(
  'API-RC-05',
  'Student records',
  'POST',
  '/admin/students/:id/documents',
  'File id that does not exist',
  '400 on file_id',
  async () =>
    expectFields(
      await admin('POST', `/admin/students/${studentId}/documents`, {
        type: 'aadhaar',
        file_id: 99999999,
      }),
      ['file_id']
    )
)
await C(
  'API-RC-06',
  'Student records',
  'POST',
  '/admin/students/:id/documents/:doc/verify',
  'Reject without a reason',
  '400 on remarks',
  async () =>
    expectFields(
      await admin('POST', `/admin/students/${studentId}/documents/1/verify`, {
        status: 'rejected',
      }),
      ['remarks']
    )
)

await C(
  'API-LC-01',
  'ID card and TC',
  'GET',
  '/admin/students/:id/id-card',
  'ID card PDF',
  '200 application/pdf',
  async () => {
    const result = await admin('GET', `/admin/students/${studentId}/id-card`)
    if (!result.type.includes('pdf')) throw new Error(`Type ${result.type}`)
    return '200 application/pdf'
  }
)
await C(
  'API-LC-02',
  'ID card and TC',
  'GET',
  '/admin/id-cards',
  'No class or section',
  '400 on section_id',
  async () => expectFields(await admin('GET', '/admin/id-cards'), ['section_id'])
)
await C(
  'API-LC-03',
  'ID card and TC',
  'POST',
  '/admin/id-cards/verify',
  'Tampered QR',
  '400 QR_INVALID',
  async () =>
    expectStatus(
      await admin('POST', '/admin/id-cards/verify', { token: 'TZS1.1.1.AAAAAAAAAAAAAAAAAAAAAA' }),
      400,
      'QR_INVALID'
    )
)
await C(
  'API-LC-04',
  'ID card and TC',
  'POST',
  '/admin/id-cards/verify',
  'Real QR from the digital ID',
  '200 with the student',
  async () => {
    const digital = await admin('GET', `/admin/students/${studentId}/digital-id`)
    const result = await admin('POST', '/admin/id-cards/verify', {
      token: digital.body.data.qr_token,
    })
    if (result.body?.data?.student_id !== studentId) throw new Error('Wrong student')
    return expectStatus(result, 200)
  }
)
await C(
  'API-LC-05',
  'ID card and TC',
  'POST',
  '/admin/students/:id/exit',
  'Reason missing',
  '400 on reason',
  async () =>
    expectFields(
      await admin('POST', `/admin/students/${studentId}/exit`, {
        exit_type: 'transferred',
        leaving_date: TODAY_IST,
      }),
      ['reason']
    )
)
await C(
  'API-LC-06',
  'ID card and TC',
  'POST',
  '/admin/students/:id/exit',
  'Transfer with TC',
  '201 with TC number',
  async () => {
    const result = await admin('POST', `/admin/students/${studentId}/exit`, {
      exit_type: 'transferred',
      leaving_date: TODAY_IST,
      reason: 'API test',
    })
    if (!/-TC-\d{4}-\d{4}$/.test(result.body?.data?.tc_no ?? '')) throw new Error('No TC number')
    return expectStatus(result, 201)
  }
)
await C(
  'API-LC-07',
  'ID card and TC',
  'POST',
  '/admin/students/:id/exit',
  'Exit twice',
  '409 STUDENT_NOT_ACTIVE',
  async () =>
    expectStatus(
      await admin('POST', `/admin/students/${studentId}/exit`, {
        exit_type: 'withdrawn',
        leaving_date: TODAY_IST,
        reason: 'Again',
      }),
      409,
      'STUDENT_NOT_ACTIVE'
    )
)
await C(
  'API-LC-08',
  'ID card and TC',
  'GET',
  '/admin/promotions/preview',
  'Preview class 6',
  '200 with next year 2027-28',
  async () => {
    const six = classes.find((item) => item.name === '6')
    const result = await admin('GET', `/admin/promotions/preview?class_id=${six.id}`)
    if (result.body?.data?.to_year?.name !== '2027-28')
      throw new Error(`Next year ${result.body?.data?.to_year?.name}`)
    return expectStatus(result, 200)
  }
)

await C(
  'API-SF-01',
  'Staff',
  'POST',
  '/admin/staff',
  'Empty body',
  '400 on name, mobile, role_codes, staff_type, designation',
  async () =>
    expectFields(await admin('POST', '/admin/staff', {}), [
      'name',
      'mobile',
      'role_codes',
      'staff_type',
      'designation',
    ])
)
let staffId = 0
await C(
  'API-SF-02',
  'Staff',
  'POST',
  '/admin/staff',
  'Create a teacher',
  '201 with employee number',
  async () => {
    const result = await admin('POST', '/admin/staff', {
      name: `API Teacher ${RUN}`,
      mobile: mobile(3),
      role_codes: ['TEACHER'],
      staff_type: 'teaching',
      designation: 'BT Assistant',
      send_invite: false,
    })
    staffId = result.body?.data?.id
    if (!/-EMP-\d{4}$/.test(result.body?.data?.employee_no ?? ''))
      throw new Error('No employee number')
    return expectStatus(result, 201)
  }
)
await C(
  'API-SF-03',
  'Staff',
  'POST',
  '/admin/staff',
  'Same person twice',
  '409 STAFF_EXISTS',
  async () =>
    expectStatus(
      await admin('POST', '/admin/staff', {
        name: 'Dup',
        mobile: mobile(3),
        role_codes: ['TEACHER'],
        staff_type: 'teaching',
        designation: 'BT Assistant',
      }),
      409,
      'STAFF_EXISTS'
    )
)
await C(
  'API-SF-04',
  'Staff',
  'PUT',
  '/admin/staff/:id/bank',
  'Bad IFSC and account number',
  '400 on ifsc, account_no',
  async () =>
    expectFields(
      await admin('PUT', `/admin/staff/${staffId}/bank`, {
        account_holder: 'A',
        bank_name: 'B',
        ifsc: 'BAD',
        account_no: '12',
      }),
      ['ifsc', 'account_no']
    )
)
await C(
  'API-SF-05',
  'Staff',
  'PUT',
  '/admin/staff/:id/bank',
  'Save bank details',
  '200, only last 4 digits returned',
  async () => {
    const result = await admin('PUT', `/admin/staff/${staffId}/bank`, {
      account_holder: 'API Teacher',
      bank_name: 'Indian Bank',
      ifsc: 'IDIB000A045',
      account_no: '6012349876',
    })
    if (result.body?.data?.bank?.account_masked !== 'XXXX9876') throw new Error('Not masked')
    if (JSON.stringify(result.body).includes('6012349876')) throw new Error('Full number leaked')
    return expectStatus(result, 200)
  }
)
await C(
  'API-SF-06',
  'Staff',
  'GET',
  '/admin/staff/insights',
  'Teacher insight cards',
  '200 with four numbers',
  async () => {
    const result = await admin('GET', '/admin/staff/insights')
    for (const key of ['total_teachers', 'average_load', 'class_teachers', 'need_attention']) {
      if (typeof result.body?.data?.[key] !== 'number') throw new Error(`Missing ${key}`)
    }
    return expectStatus(result, 200)
  }
)
await C(
  'API-SF-07',
  'Staff',
  'PUT',
  '/admin/teacher-assignments',
  'Non-teacher as teacher',
  '400 NOT_A_TEACHER',
  async () => {
    const matrix = (await admin('GET', '/admin/teacher-assignments')).body.data
    const row = matrix.rows.find((item) => item.cells.length)
    return expectStatus(
      await admin('PUT', '/admin/teacher-assignments', {
        items: [
          { section_id: row.section_id, subject_id: row.cells[0].subject_id, teacher_user_id: 1 },
        ],
      }),
      400,
      'NOT_A_TEACHER'
    )
  }
)
await C(
  'API-SF-08',
  'Staff',
  'DELETE',
  '/admin/staff/:id',
  'Remove the test teacher',
  '200',
  async () => expectStatus(await admin('DELETE', `/admin/staff/${staffId}`), 200)
)

await C(
  'API-MP-01',
  'Mobile Parent',
  'GET',
  '/mobile/parent/children',
  'Parent sees own children',
  '200 with Kavin and Nila',
  async () => {
    const result = await parent('GET', '/mobile/parent/children')
    if (result.body?.data?.length < 2) throw new Error('Children missing')
    return expectStatus(result, 200)
  }
)
await C(
  'API-MP-02',
  'Mobile Parent',
  'GET',
  '/mobile/parent/children/:id',
  'Another family’s child',
  '404 CHILD_NOT_FOUND',
  async () =>
    expectStatus(
      await parent('GET', `/mobile/parent/children/${studentId}`),
      404,
      'CHILD_NOT_FOUND'
    )
)
await C(
  'API-MP-03',
  'Mobile Parent',
  'GET',
  '/mobile/parent/children/:id/behaviour',
  'Staff-only notes hidden',
  'Only visible notes',
  async () => {
    const kid = (await parent('GET', '/mobile/parent/children')).body.data[0]
    const result = await parent('GET', `/mobile/parent/children/${kid.id}/behaviour`)
    if (result.body.data.some((note) => note.visible_to_parent === false))
      throw new Error('Staff-only note leaked')
    return expectStatus(result, 200)
  }
)
await C(
  'API-MT-01',
  'Mobile Teacher',
  'GET',
  '/mobile/teacher/classes',
  'Teacher sees own sections',
  '200, 6-A first as class teacher',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/classes')
    if (!result.body?.data?.[0]?.is_class_teacher)
      throw new Error('Class teacher section not first')
    return expectStatus(result, 200)
  }
)
await C(
  'API-MT-02',
  'Mobile Teacher',
  'GET',
  '/mobile/teacher/students/:id',
  'Student outside own sections',
  '403 or 404',
  async () => {
    const result = await teacher('GET', `/mobile/teacher/students/${studentId}`)
    if (![403, 404].includes(result.status)) throw new Error(`Got ${result.status}`)
    return `${result.status} ${result.body.error}`
  }
)
await C(
  'API-MT-03',
  'Mobile Teacher',
  'GET',
  '/mobile/teacher/classes',
  'Parent calling teacher API',
  '403',
  async () => expectStatus(await parent('GET', '/mobile/teacher/classes'), 403)
)

await C(
  'API-FL-01',
  'Bus tracking',
  'GET',
  '/admin/fleet/live',
  'Live bus status through the School API',
  '200 with totals and vehicles',
  async () => {
    const result = await admin('GET', '/admin/fleet/live')
    if (!Array.isArray(result.body?.data?.vehicles)) throw new Error('No vehicles list')
    return expectStatus(result, 200)
  }
)
await C(
  'API-FL-02',
  'Bus tracking',
  'GET',
  '/admin/fleet/vehicles/:id',
  'Unknown vehicle',
  '404',
  async () => expectStatus(await admin('GET', '/admin/fleet/vehicles/999999'), 404)
)
await C('API-FL-03', 'Bus tracking', 'GET', '/admin/fleet/live', 'Parent token', '403', async () =>
  expectStatus(await parent('GET', '/admin/fleet/live'), 403)
)
const TELEMATICS = process.env.E2E_TELEMATICS_URL ?? 'http://localhost:3001/api'
await C(
  'API-TS-01',
  'Telematics service',
  'GET',
  ':3001/api/health',
  'Health without a key',
  '200 with db and mqtt',
  async () => {
    const response = await fetch(`${TELEMATICS}/health`)
    const body = await response.json()
    if (body?.data?.db !== 'up') throw new Error(`db ${body?.data?.db}`)
    return `${response.status} db ${body.data.db}, mqtt ${body.data.mqtt}`
  }
)
await C(
  'API-TS-02',
  'Telematics service',
  'GET',
  ':3001/api/v1/devices/live',
  'No API key',
  '401 API_KEY_MISSING',
  async () => {
    const response = await fetch(`${TELEMATICS}/v1/devices/live`)
    const body = await response.json()
    if (response.status !== 401 || body.error !== 'API_KEY_MISSING')
      throw new Error(`${response.status} ${body.error}`)
    return '401 API_KEY_MISSING'
  }
)
await C(
  'API-TS-03',
  'Telematics service',
  'GET',
  ':3001/api/v1/devices/live',
  'Wrong API key',
  '401 API_KEY_INVALID',
  async () => {
    const response = await fetch(`${TELEMATICS}/v1/devices/live`, {
      headers: { 'x-api-key': 'x'.repeat(40) },
    })
    const body = await response.json()
    if (response.status !== 401 || body.error !== 'API_KEY_INVALID')
      throw new Error(`${response.status} ${body.error}`)
    return '401 API_KEY_INVALID'
  }
)

await check(
  {
    id: 'API-ST-20',
    module: 'Students',
    method: 'PATCH',
    endpoint: '/admin/students/:id',
    scenario: 'Save identification marks',
    expected: '200 and the marks come back on the student',
    day: 'Day 4',
  },
  async () => {
    const marks = 'A mole on the left cheek'
    expectStatus(
      await admin('PATCH', `/admin/students/${studentId}`, { identification_marks: marks }),
      200
    )
    const detail = await admin('GET', `/admin/students/${studentId}`)
    if (detail.body.data.identification_marks !== marks)
      throw new Error(`Got ${detail.body.data.identification_marks}`)
    return '200, identification_marks saved'
  }
)
await check(
  {
    id: 'API-ST-21',
    module: 'Students',
    method: 'PATCH',
    endpoint: '/admin/students/:id',
    scenario: 'Identification marks longer than 255 characters',
    expected: '400 VALIDATION_FAILED on identification_marks',
    day: 'Day 4',
  },
  async () =>
    expectFields(
      await admin('PATCH', `/admin/students/${studentId}`, {
        identification_marks: 'x'.repeat(256),
      }),
      ['identification_marks']
    )
)
await check(
  {
    id: 'API-SU-20',
    module: 'School setup',
    method: 'POST',
    endpoint: '/admin/sections',
    scenario: 'Add a section for next academic year (used by Promote)',
    expected: '201 in the next year; listed only for that year',
    day: 'Day 4',
  },
  async () => {
    const years = (await admin('GET', '/admin/academic-years')).body.data
    const list = Array.isArray(years) ? years : (years.items ?? [])
    const current = list.find((year) => year.is_current)
    const next = list
      .filter((year) => year.start_date > (current?.start_date ?? ''))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0]
    if (!next) return 'Skipped: no next academic year'
    const classes = (await admin('GET', '/admin/classes')).body.data
    const target = (Array.isArray(classes) ? classes : classes.items)[0]
    const name = `Z${RUN.slice(-2)}`
    const created = await admin('POST', '/admin/sections', {
      class_id: target.id,
      academic_year_id: next.id,
      name,
    })
    expectStatus(created, 201)
    const inNext = (
      await admin('GET', `/admin/sections?class_id=${target.id}&academic_year_id=${next.id}`)
    ).body.data
    const inCurrent = (await admin('GET', `/admin/sections?class_id=${target.id}`)).body.data
    await admin('DELETE', `/admin/sections/${created.body.data.id}`)
    if (!inNext.some((item) => item.name === name)) throw new Error('Not listed for next year')
    if (inCurrent.some((item) => item.name === name))
      throw new Error('Leaked into the current year')
    return `201 in ${next.name}, not in ${current?.name}`
  }
)

const D4 = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'Day 4' }, fn)
const istDate = (offset = 0) =>
  new Date(Date.now() + 5.5 * 3600 * 1000 + offset * 86400 * 1000).toISOString().slice(0, 10)
const today = istDate()
const schoolDay = (offset) =>
  new Date(`${istDate(offset)}T00:00:00Z`).getUTCDay() === 0 ? istDate(offset + 1) : istDate(offset)
const month = today.slice(0, 7)
const children = (await parent('GET', '/mobile/parent/children')).body?.data ?? []
const child = children[0]
const teacherClasses = (await teacher('GET', '/mobile/teacher/classes')).body?.data ?? []
const teacherSection = teacherClasses[0]?.section_id
let board = null
let childSectionId = 0

await D4(
  'API-AT-01',
  'Attendance',
  'GET',
  '/admin/attendance/board',
  'Daily board for today',
  '200 with every section and totals',
  async () => {
    const result = await admin('GET', `/admin/attendance/board?date=${today}`)
    expectStatus(result, 200)
    board = result.body.data
    if (!board.sections.length) throw new Error('No sections on the board')
    const name = child ? `${child.class_name} - ${child.section_name}` : ''
    childSectionId = board.sections.find((item) => item.name === name)?.section_id ?? 0
    return `200, ${board.sections_total} sections, ${board.sections_not_marked} not marked`
  }
)
await D4(
  'API-AT-02',
  'Attendance',
  'PUT',
  '/admin/attendance/sections/:id',
  'Save with nothing filled',
  '400 VALIDATION_FAILED on date, items',
  async () =>
    expectFields(await admin('PUT', `/admin/attendance/sections/${childSectionId || 1}`, {}), [
      'date',
      'items',
    ])
)
await D4(
  'API-AT-03',
  'Attendance',
  'PUT',
  '/admin/attendance/sections/:id',
  'Attendance for a future date',
  '400 FUTURE_DATE',
  async () =>
    expectStatus(
      await admin('PUT', `/admin/attendance/sections/${childSectionId || 1}`, {
        date: istDate(3),
        items: [{ student_id: child?.id ?? 1, status: 'present' }],
      }),
      400,
      'FUTURE_DATE'
    )
)
await D4(
  'API-AT-04',
  'Attendance',
  'PUT',
  '/admin/attendance/sections/:id',
  'Mark today with the parent’s child absent',
  '200 saved, child absent, parent gets STUDENT_ABSENT in the app',
  async () => {
    if (!child || !childSectionId) throw new Error('Demo parent has no child on the board')
    if (!board.working_day) return `Skipped: ${today} is not a school day`
    const roster = (
      await admin('GET', `/admin/attendance/sections/${childSectionId}?date=${today}`)
    ).body.data
    const items = roster.students.map((student) => ({
      student_id: student.student_id,
      status: student.student_id === child.id ? 'absent' : student.on_leave ? 'leave' : 'present',
    }))
    const saved = await admin('PUT', `/admin/attendance/sections/${childSectionId}`, {
      date: today,
      items,
    })
    expectStatus(saved, 200)
    const mark = saved.body.data.students.find((student) => student.student_id === child.id)
    if (mark?.status !== 'absent') throw new Error(`Child saved as ${mark?.status}`)
    const inbox =
      (await parent('GET', '/me/notifications?limit=50&category=attendance')).body?.data?.items ??
      []
    const alert = inbox.find(
      (item) =>
        item.template_code === 'STUDENT_ABSENT' &&
        String(item.created_at ?? '').slice(0, 10) === today
    )
    if (!alert) throw new Error('No STUDENT_ABSENT notification for the parent today')
    return `200, absent alert reached the parent: "${alert.title}"`
  }
)
await D4(
  'API-AT-05',
  'Attendance',
  'GET',
  '/mobile/parent/children/:id/attendance',
  'Parent month calendar and today badge',
  '200 with days and %, today absent',
  async () => {
    if (!child) throw new Error('Demo parent has no child')
    const result = await parent(
      'GET',
      `/mobile/parent/children/${child.id}/attendance?month=${month}`
    )
    expectStatus(result, 200)
    const todayBadge = (await parent('GET', `/mobile/parent/children/${child.id}/attendance/today`))
      .body.data
    if (board?.working_day && todayBadge.status !== 'absent')
      throw new Error(`Today shows ${todayBadge.status}`)
    return `200, ${result.body.data.days?.length ?? 0} days, today ${todayBadge.status}`
  }
)
await D4(
  'API-AT-06',
  'Attendance',
  'GET',
  '/mobile/teacher/sections/:id/attendance',
  'Teacher opens the roster of a section they do not teach',
  '403 or 404, never the roster',
  async () => {
    const other = board?.sections.find(
      (item) => !teacherClasses.some((row) => row.section_id === item.section_id)
    )
    if (!other) return 'Skipped: teacher teaches every section'
    const result = await teacher(
      'GET',
      `/mobile/teacher/sections/${other.section_id}/attendance?date=${today}`
    )
    if (![403, 404].includes(result.status)) throw new Error(`Got ${result.status}`)
    return `${result.status} ${result.body?.error}`
  }
)
await D4(
  'API-AT-07',
  'Attendance',
  'GET',
  '/mobile/teacher/sections/:id/attendance',
  'Teacher opens their own section',
  '200 roster in roll order',
  async () => {
    if (!teacherSection) throw new Error('Demo teacher has no section')
    const result = await teacher(
      'GET',
      `/mobile/teacher/sections/${teacherSection}/attendance?date=${today}`
    )
    expectStatus(result, 200)
    return `200, ${result.body.data.students.length} students`
  }
)
await D4(
  'API-SA-01',
  'Staff attendance',
  'POST',
  '/mobile/teacher/check-in',
  'Check in with no location',
  '400 VALIDATION_FAILED on lat, lng',
  async () => expectFields(await teacher('POST', '/mobile/teacher/check-in', {}), ['lat', 'lng'])
)
await D4(
  'API-SA-02',
  'Staff attendance',
  'POST',
  '/mobile/teacher/check-in',
  'Check in far from school (Bengaluru)',
  '400 OUTSIDE_SCHOOL',
  async () => {
    const result = await teacher('POST', '/mobile/teacher/check-in', {
      lat: 12.9716,
      lng: 77.5946,
      accuracy_m: 10,
    })
    if (result.body?.error === 'ALREADY_CHECKED_IN')
      return '409 ALREADY_CHECKED_IN (checked in earlier today)'
    return expectStatus(result, 400, 'OUTSIDE_SCHOOL')
  }
)
await D4(
  'API-SA-03',
  'Staff attendance',
  'GET',
  '/admin/staff-attendance/board',
  'Staff board for today',
  '200 with present, late, on leave and not checked in',
  async () => {
    const result = await admin('GET', `/admin/staff-attendance/board?date=${today}`)
    expectStatus(result, 200)
    const data = result.body.data
    if (!data.staff.length) throw new Error('No staff on the board')
    return `200, ${data.total} staff: ${data.present} present, ${data.late} late, ${data.on_leave} on leave, ${data.not_checked_in} not in`
  }
)
await D4(
  'API-SA-04',
  'Staff attendance',
  'POST',
  '/integrations/biometric/punches',
  'Biometric punch without the device key',
  '401 DEVICE_KEY_INVALID, or 503 BIOMETRIC_OFF when no key is set',
  async () => {
    const result = await guest('POST', '/integrations/biometric/punches', {
      school_code: 'TZMS',
      punches: [{ employee_no: 'TZMS-EMP-0004', punched_at: `${today}T08:30:00+05:30` }],
    })
    if (![401, 503].includes(result.status)) throw new Error(`Got ${result.status}`)
    return `${result.status} ${result.body?.error}`
  }
)
let leaveTypeId = 0
await D4(
  'API-LV-01',
  'Staff leave',
  'GET',
  '/mobile/teacher/leave-balances',
  'Teacher leave balances',
  '200 with CL, SL, EL, LOP',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/leave-balances')
    expectStatus(result, 200)
    const casual = result.body.data.find((item) => (item.leave_type?.code ?? item.code) === 'CL')
    leaveTypeId = casual?.leave_type?.id ?? casual?.leave_type_id ?? casual?.id ?? 0
    return `200, ${result.body.data.length} leave types`
  }
)
await D4(
  'API-LV-02',
  'Staff leave',
  'POST',
  '/mobile/teacher/leaves',
  'Apply with nothing filled',
  '400 VALIDATION_FAILED on leave_type_id, from_date, to_date, reason',
  async () =>
    expectFields(await teacher('POST', '/mobile/teacher/leaves', {}), [
      'leave_type_id',
      'from_date',
      'to_date',
      'reason',
    ])
)
await D4(
  'API-LV-03',
  'Staff leave',
  'POST',
  '/mobile/teacher/leaves',
  'Apply for one day of casual leave, then cancel it',
  '201 waiting for approval, then 200 cancelled',
  async () => {
    const date = schoolDay(20)
    const applied = await teacher('POST', '/mobile/teacher/leaves', {
      leave_type_id: leaveTypeId,
      from_date: date,
      to_date: date,
      reason: 'Regression test leave',
    })
    expectStatus(applied, 201)
    const cancelled = await teacher('POST', `/mobile/teacher/leaves/${applied.body.data.id}/cancel`)
    expectStatus(cancelled, 200)
    return `201 ${applied.body.data.status}, then ${cancelled.body.data.status}`
  }
)
await D4(
  'API-LV-04',
  'Student leave',
  'POST',
  '/mobile/parent/children/:id/leaves',
  'Parent applies with the last day before the first',
  '400 VALIDATION_FAILED on to_date',
  async () =>
    expectFields(
      await parent('POST', `/mobile/parent/children/${child?.id ?? 1}/leaves`, {
        from_date: istDate(10),
        to_date: istDate(9),
        reason: 'Regression test',
      }),
      ['to_date']
    )
)
await D4(
  'API-LV-05',
  'Student leave',
  'POST',
  '/mobile/parent/children/:id/leaves',
  'Parent applies for leave, then cancels',
  '201 pending, then 200 cancelled',
  async () => {
    const applied = await parent('POST', `/mobile/parent/children/${child.id}/leaves`, {
      from_date: schoolDay(25),
      to_date: schoolDay(25),
      reason: 'Regression test leave',
    })
    expectStatus(applied, 201)
    const cancelled = await parent(
      'POST',
      `/mobile/parent/children/${child.id}/leaves/${applied.body.data.id}/cancel`
    )
    expectStatus(cancelled, 200)
    return `201 ${applied.body.data.status}, then ${cancelled.body.data.status}`
  }
)
let grid = null
await D4(
  'API-TT-01',
  'Timetable',
  'GET',
  '/admin/timetable/periods',
  'Bell schedule',
  '200 with 8 teaching periods and 2 breaks',
  async () => {
    const result = await admin('GET', '/admin/timetable/periods')
    expectStatus(result, 200)
    const teaching = result.body.data.filter((item) => !item.is_break).length
    return `200, ${teaching} periods, ${result.body.data.length - teaching} breaks`
  }
)
await D4(
  'API-TT-02',
  'Timetable',
  'PUT',
  '/admin/timetable/periods',
  'Bell schedule with overlapping periods',
  '400 BELL_INVALID',
  async () =>
    expectStatus(
      await admin('PUT', '/admin/timetable/periods', {
        items: [
          { name: 'Period 1', start_time: '09:00', end_time: '09:45' },
          { name: 'Period 2', start_time: '09:30', end_time: '10:15' },
        ],
      }),
      400,
      'BELL_INVALID'
    )
)
await D4(
  'API-TT-03',
  'Timetable',
  'GET',
  '/admin/timetable/sections/:id',
  'Section timetable of 6 - A',
  '200 with slots and subject plan',
  async () => {
    const six = board?.sections.find((item) => item.name === '6 - A')
    if (!six) throw new Error('6 - A not on the board')
    const result = await admin('GET', `/admin/timetable/sections/${six.section_id}`)
    expectStatus(result, 200)
    grid = result.body.data
    return `200, ${grid.slots.length} periods placed, ${grid.plan.length} subjects`
  }
)
await D4(
  'API-TT-04',
  'Timetable',
  'PUT',
  '/admin/timetable/sections/:id/slots',
  'Same teacher in another section in the same period',
  '409 TEACHER_CLASH',
  async () => {
    const busy = grid?.slots.find((slot) => slot.teacher)
    const other = board?.sections.find((item) => item.section_id !== grid?.section.id)
    if (!busy || !other) throw new Error('No seeded slot to clash with')
    return expectStatus(
      await admin('PUT', `/admin/timetable/sections/${other.section_id}/slots`, {
        day_of_week: busy.day_of_week,
        period_no: busy.period_no,
        subject_id: busy.subject.id,
        teacher_user_id: busy.teacher.id,
        room: null,
      }),
      409,
      'TEACHER_CLASH'
    )
  }
)
await D4(
  'API-TT-05',
  'Timetable',
  'PUT',
  '/admin/timetable/sections/:id/slots',
  'Put a subject with no day or period',
  '400 VALIDATION_FAILED on day_of_week, period_no, subject_id',
  async () =>
    expectFields(
      await admin('PUT', `/admin/timetable/sections/${grid?.section.id ?? 1}/slots`, {}),
      ['day_of_week', 'period_no', 'subject_id']
    )
)
await D4(
  'API-TT-06',
  'Timetable',
  'GET',
  '/admin/timetable/workload',
  'Teacher workload report',
  '200 with periods per teacher',
  async () => {
    const result = await admin('GET', '/admin/timetable/workload')
    expectStatus(result, 200)
    return `200, ${result.body.data.teachers.length} teachers, ${result.body.data.unscheduled} periods still to place`
  }
)
await D4(
  'API-TT-07',
  'Timetable',
  'GET',
  '/mobile/teacher/timetable',
  'Teacher’s own week in the Staff app',
  '200 with my periods',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/timetable')
    expectStatus(result, 200)
    return `200, ${result.body.data.periods_per_week} periods a week`
  }
)

const D5 = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'Day 5' }, fn)
const nextSchoolDay = (() => {
  let offset = 1
  while (new Date(`${istDate(offset)}T00:00:00Z`).getUTCDay() === 0) offset += 1
  return istDate(offset)
})()
const teacherMe = (await teacher('GET', '/me')).body?.data
let coverPeriod = null
let substitutionId = 0

await D5(
  'API-SB-01',
  'Substitutes',
  'GET',
  '/admin/substitutes',
  `Board for ${nextSchoolDay}, when a teacher is on approved leave`,
  '200 with the absent teacher and the periods to cover',
  async () => {
    const result = await admin('GET', `/admin/substitutes?date=${nextSchoolDay}`)
    expectStatus(result, 200)
    const board = result.body.data
    if (!board.absent_teachers) return `Skipped: nobody is away on ${nextSchoolDay}`
    for (const away of board.teachers) {
      for (const period of away.periods) {
        const free = (
          await admin(
            'GET',
            `/admin/substitutes/free?date=${nextSchoolDay}&slot_id=${period.slot_id}`
          )
        ).body.data
        if (free.teachers.some((row) => row.teacher.id === teacherMe?.id) && !period.substitute) {
          coverPeriod = period
          break
        }
      }
      if (coverPeriod) break
    }
    return `200, ${board.absent_teachers} away, ${board.periods} periods, ${board.uncovered} not covered`
  }
)
await D5(
  'API-SB-02',
  'Substitutes',
  'POST',
  '/admin/substitutes',
  'Assign with nothing filled',
  '400 VALIDATION_FAILED on date, slot_id, substitute_user_id',
  async () =>
    expectFields(await ao('POST', '/admin/substitutes', {}), [
      'date',
      'slot_id',
      'substitute_user_id',
    ])
)
await D5(
  'API-SB-03',
  'Substitutes',
  'POST',
  '/admin/substitutes',
  'Assign for a date in the past',
  '400 VALIDATION_FAILED on date',
  async () =>
    expectFields(
      await ao('POST', '/admin/substitutes', {
        date: istDate(-7),
        slot_id: 1,
        substitute_user_id: 1,
      }),
      ['date']
    )
)
await D5(
  'API-SB-04',
  'Substitutes',
  'POST',
  '/admin/substitutes',
  'Assign a free teacher and check they are told',
  '201, period covered, teacher gets SUBSTITUTE_ASSIGNED',
  async () => {
    if (!coverPeriod) return 'Skipped: no period where the demo teacher is free'
    const result = await ao('POST', '/admin/substitutes', {
      date: nextSchoolDay,
      slot_id: coverPeriod.slot_id,
      substitute_user_id: teacherMe.id,
      note: 'Regression test',
    })
    expectStatus(result, 201)
    const period = result.body.data.teachers
      .flatMap((row) => row.periods)
      .find((row) => row.slot_id === coverPeriod.slot_id)
    if (period?.substitute?.id !== teacherMe.id) throw new Error('Period not covered')
    substitutionId = period.substitution_id
    const inbox = (await teacher('GET', '/me/notifications?limit=20')).body?.data?.items ?? []
    const alert = inbox.find((item) => item.template_code === 'SUBSTITUTE_ASSIGNED')
    if (!alert) throw new Error('Teacher has no SUBSTITUTE_ASSIGNED notification')
    return `201, covered by ${teacherMe.name}; notified: "${alert.title}"`
  }
)
await D5(
  'API-SB-05',
  'Substitutes',
  'GET',
  '/mobile/teacher/substitutions',
  'Teacher sees the class they cover',
  '200 listing the substitution',
  async () => {
    if (!substitutionId) return 'Skipped: nothing assigned'
    const result = await teacher('GET', '/mobile/teacher/substitutions')
    expectStatus(result, 200)
    if (!result.body.data.some((row) => row.id === substitutionId)) throw new Error('Not listed')
    return `200, ${result.body.data.length} cover duties`
  }
)
await D5(
  'API-SB-06',
  'Substitutes',
  'DELETE',
  '/admin/substitutes/:id',
  'Remove the substitute again',
  '200 and the period is uncovered',
  async () => {
    if (!substitutionId) return 'Skipped: nothing assigned'
    const result = await ao('DELETE', `/admin/substitutes/${substitutionId}`)
    expectStatus(result, 200)
    const period = result.body.data.teachers
      .flatMap((row) => row.periods)
      .find((row) => row.slot_id === coverPeriod.slot_id)
    if (period?.substitute) throw new Error('Still covered')
    return '200, period uncovered'
  }
)

let draftRunId = 0
await D5(
  'API-PY-01',
  'Payroll',
  'PUT',
  '/admin/payroll/salaries/:userId',
  'Save a salary with no basic pay',
  '400 VALIDATION_FAILED on effective_from, basic',
  async () =>
    expectFields(await admin('PUT', `/admin/payroll/salaries/${teacherMe?.id ?? 1}`, {}), [
      'effective_from',
      'basic',
    ])
)
await D5(
  'API-PY-02',
  'Payroll',
  'POST',
  '/admin/payroll/runs',
  'Run payroll for a future month',
  '400 VALIDATION_FAILED on month',
  async () => {
    const future = new Date(Date.now() + 70 * 86400000).toISOString().slice(0, 7)
    return expectFields(await admin('POST', '/admin/payroll/runs', { month: future }), ['month'])
  }
)
await D5(
  'API-PY-03',
  'Payroll',
  'POST',
  '/admin/payroll/runs',
  'Run payroll for October 2026 as a draft',
  '200 with payslips, totals and the staff left out',
  async () => {
    const result = await admin('POST', '/admin/payroll/runs', { month: '2026-10' })
    if (result.body?.error === 'RUN_FINALIZED') return '409 RUN_FINALIZED (October already final)'
    expectStatus(result, 200)
    const run = result.body.data
    draftRunId = run.id
    if (!run.payslips.length) throw new Error('No payslips')
    const bad = run.payslips.find(
      (slip) => Math.abs(slip.gross - slip.total_deductions - slip.net) > 0.01
    )
    if (bad) throw new Error(`Net does not add up for ${bad.name}`)
    return `200, ${run.payslips.length} payslips, net ₹${run.total_net}, ${run.missing.length} without salary`
  }
)
await D5(
  'API-PY-04',
  'Payroll',
  'GET',
  '/admin/payroll/payslips/:id/pdf',
  'Payslip PDF',
  '200 application/pdf',
  async () => {
    if (!draftRunId) return 'Skipped: no draft run'
    const run = (await admin('GET', `/admin/payroll/runs/${draftRunId}`)).body.data
    const response = await fetch(`${API}/admin/payroll/payslips/${run.payslips[0].id}/pdf`, {
      headers: { authorization: `Bearer ${adminToken}` },
    })
    const bytes = Buffer.from(await response.arrayBuffer())
    if (response.status !== 200 || !bytes.subarray(0, 4).equals(Buffer.from('%PDF')))
      throw new Error(`Got ${response.status} ${response.headers.get('content-type')}`)
    return `200 PDF, ${Math.round(bytes.length / 1024)} KB`
  }
)
await D5(
  'API-PY-05',
  'Payroll',
  'POST',
  '/admin/payroll/runs/:id/finalize',
  'Finalise September 2026 and the teacher downloads the payslip in the app',
  '200 final; teacher sees it in /me/payslips and gets the PDF',
  async () => {
    let run = (await admin('GET', '/admin/payroll/runs?search=2026-09')).body.data.items[0]
    if (!run || run.status !== 'finalized') {
      const created = await admin('POST', '/admin/payroll/runs', { month: '2026-09' })
      expectStatus(created, 200)
      expectStatus(await admin('POST', `/admin/payroll/runs/${created.body.data.id}/finalize`), 200)
    }
    const mine = await teacher('GET', '/me/payslips')
    expectStatus(mine, 200)
    const slip = mine.body.data.items.find((item) => item.month === '2026-09')
    if (!slip) throw new Error('Teacher has no September payslip')
    const response = await fetch(`${API}/me/payslips/${slip.id}/pdf`, {
      headers: { authorization: `Bearer ${teacherToken}` },
    })
    if (response.status !== 200) throw new Error(`PDF ${response.status}`)
    const rerun = await admin('POST', '/admin/payroll/runs', { month: '2026-09' })
    expectStatus(rerun, 409, 'RUN_FINALIZED')
    return `final; teacher net ₹${slip.net}; PDF 200; re-run blocked with RUN_FINALIZED`
  }
)
await D5(
  'API-PY-06',
  'Payroll',
  'DELETE',
  '/admin/payroll/runs/:id',
  'Delete the October draft',
  '200',
  async () => {
    if (!draftRunId) return 'Skipped: no draft run'
    return expectStatus(await admin('DELETE', `/admin/payroll/runs/${draftRunId}`), 200)
  }
)

await D5(
  'API-TR-01',
  'Transport',
  'POST',
  '/admin/transport/vehicles',
  'Add a bus with nothing filled',
  '400 VALIDATION_FAILED on registration_no, name',
  async () =>
    expectFields(await admin('POST', '/admin/transport/vehicles', {}), ['registration_no', 'name'])
)
await D5(
  'API-TR-02',
  'Transport',
  'POST',
  '/admin/transport/vehicles',
  'Registration number in the wrong format',
  '400 VALIDATION_FAILED on registration_no',
  async () =>
    expectFields(
      await admin('POST', '/admin/transport/vehicles', {
        registration_no: 'BUS-ONE',
        name: 'Bus X',
      }),
      ['registration_no']
    )
)
await D5(
  'API-TR-03',
  'Transport',
  'GET',
  '/admin/transport/routes/:id',
  'Every route is drawn: stops with coordinates and the school',
  '200, each route has ordered stops and a distance',
  async () => {
    const routes = (await admin('GET', '/admin/transport/routes')).body.data
    if (!routes.length) throw new Error('No routes')
    const drawn = []
    for (const route of routes) {
      const detail = (await admin('GET', `/admin/transport/routes/${route.id}`)).body.data
      if (detail.stop_list.length < 2) throw new Error(`${route.code} has fewer than 2 stops`)
      const ordered = detail.stop_list.every((stop, index) => stop.sequence === index + 1)
      if (!ordered || detail.stop_list.some((stop) => typeof stop.lat !== 'number'))
        throw new Error(`${route.code} stops are not usable`)
      drawn.push(`${route.code} ${detail.stop_list.length} stops ${detail.distance_km} km`)
    }
    return `200, ${drawn.join('; ')}`
  }
)
await D5(
  'API-TR-04',
  'Transport',
  'PUT',
  '/admin/transport/routes/:id/stops',
  'Stop with a latitude out of range',
  '400 VALIDATION_FAILED on the stop latitude',
  async () => {
    const route = (await admin('GET', '/admin/transport/routes')).body.data[0]
    return expectFields(
      await admin('PUT', `/admin/transport/routes/${route.id}/stops`, {
        items: [{ name: 'Bad stop', lat: 123, lng: 80 }],
      }),
      ['items']
    )
  }
)
await D5(
  'API-TR-05',
  'Transport',
  'POST',
  '/admin/transport/routes',
  'Create a route, add two stops, auto order, delete',
  '201, stops saved, ordered, deleted',
  async () => {
    const code = `T${RUN.slice(-3)}`
    const created = await admin('POST', '/admin/transport/routes', {
      code,
      name: `Regression ${RUN}`,
    })
    expectStatus(created, 201)
    const id = created.body.data.id
    const saved = await admin('PUT', `/admin/transport/routes/${id}/stops`, {
      items: [
        { name: 'Near stop', lat: 13.0849, lng: 80.2105 },
        { name: 'Far stop', lat: 13.0846, lng: 80.1767 },
      ],
    })
    expectStatus(saved, 200)
    const ordered = await admin('POST', `/admin/transport/routes/${id}/auto-sequence`)
    expectStatus(ordered, 200)
    const first = ordered.body.data.stop_list[0].name
    expectStatus(await admin('DELETE', `/admin/transport/routes/${id}`), 200)
    const school = (await admin('GET', '/admin/school')).body.data
    const away = (lat, lng) => Math.hypot(lat - school.latitude, lng - school.longitude)
    const expected = away(13.0849, 80.2105) > away(13.0846, 80.1767) ? 'Near stop' : 'Far stop'
    if (first !== expected) throw new Error(`Auto order started at ${first}, expected ${expected}`)
    return `201, 2 stops, auto order starts at the stop farthest from the school (${expected}), deleted`
  }
)
await D5(
  'API-TR-06',
  'Transport',
  'GET',
  '/mobile/parent/children/:id/transport',
  'Parent sees the bus, stop and times',
  '200 with route and stop, or null when the child walks',
  async () => {
    if (!child) throw new Error('Demo parent has no child')
    const result = await parent('GET', `/mobile/parent/children/${child.id}/transport`)
    expectStatus(result, 200)
    const card = result.body.data
    return card
      ? `200, ${card.route.name}, ${card.stop.name} at ${card.stop.pickup_time}`
      : '200, child walks (null)'
  }
)
await D5(
  'API-TR-07',
  'Transport',
  'GET',
  '/admin/transport/expiries',
  'Documents ending within 30 days',
  '200 with the seeded PUC, insurance and expired fitness',
  async () => {
    const result = await admin('GET', '/admin/transport/expiries?days=30')
    expectStatus(result, 200)
    const kinds = new Set(result.body.data.map((item) => item.kind))
    if (!kinds.size) throw new Error('Nothing due')
    return `200, ${result.body.data.length} due: ${[...kinds].join(', ')}`
  }
)

await D5(
  'API-TR-08',
  'Transport',
  'GET',
  '/admin/transport/students',
  'Students on the bus with the default sort, a search and paging',
  '200 every time (was 500 before the fix)',
  async () => {
    for (const query of ['', '?search=a', '?route_id=1&page=2&limit=5']) {
      expectStatus(await admin('GET', `/admin/transport/students${query}`), 200)
    }
    return '200 for default sort, search and page 2'
  }
)

await check(
  {
    id: 'API-AU-05',
    module: 'Auth',
    method: 'POST',
    endpoint: '/auth/otp/request',
    scenario: 'Super admin asks for an OTP in the mobile app',
    expected: '403 APP_NOT_ALLOWED, no SMS sent',
    day: 'Day 5',
  },
  async () =>
    expectStatus(
      await guest('POST', '/auth/otp/request', { mobile: '9999999999', app: 'mobile' }),
      403,
      'APP_NOT_ALLOWED'
    )
)
await check(
  {
    id: 'API-AU-06',
    module: 'Auth',
    method: 'POST',
    endpoint: '/auth/otp/request',
    scenario: 'Parent asks for an OTP on the admin web',
    expected: '403 APP_NOT_ALLOWED, no SMS sent',
    day: 'Day 5',
  },
  async () =>
    expectStatus(
      await guest('POST', '/auth/otp/request', { mobile: '9000000005', app: 'admin' }),
      403,
      'APP_NOT_ALLOWED'
    )
)
await check(
  {
    id: 'API-AU-07',
    module: 'Auth',
    method: 'GET',
    endpoint: '/me',
    scenario: 'Profile lists the sections for the role switcher',
    expected: '200 with mobile_apps and sections (label and roles)',
    day: 'Day 5',
  },
  async () => {
    const me = (await parent('GET', '/me')).body.data
    if (!me.mobile_apps?.includes('parent'))
      throw new Error(`mobile_apps is ${JSON.stringify(me.mobile_apps)}`)
    const section = me.sections.find((item) => item.app === 'parent')
    if (!section?.roles.length) throw new Error('No Parent section with roles')
    return `200, mobile_apps ${JSON.stringify(me.mobile_apps)}, sections ${me.sections.map((item) => item.label).join(', ')}`
  }
)

const D6 = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'Day 6' }, fn)
await D6(
  'API-TP-01',
  'Live trips',
  'POST',
  '/integrations/telematics/events',
  'Trip event without a valid signature',
  '401 SIGNATURE_INVALID',
  async () =>
    expectStatus(
      await guest('POST', '/integrations/telematics/events', { type: 'trip.started' }),
      401,
      'SIGNATURE_INVALID'
    )
)
await D6(
  'API-TP-02',
  'Live trips',
  'POST',
  '/admin/transport/trips',
  'Start a trip with nothing filled',
  '400 VALIDATION_FAILED on route_id, kind',
  async () => expectFields(await admin('POST', '/admin/transport/trips', {}), ['route_id', 'kind'])
)
await D6(
  'API-TP-03',
  'Live trips',
  'GET',
  '/admin/transport/trips/:id',
  'Latest trip: stop timeline in travel order and events',
  '200, every stop approached before it was reached',
  async () => {
    const list = await admin('GET', '/admin/transport/trips?limit=1')
    expectStatus(list, 200)
    const latest = list.body.data.items[0]
    if (!latest) return 'Skipped: no trip has run yet'
    const detail = (await admin('GET', `/admin/transport/trips/${latest.id}`)).body.data
    for (const stop of detail.stop_list.filter((item) => item.arrived_at)) {
      if (!stop.approached_at || new Date(stop.approached_at) > new Date(stop.arrived_at))
        throw new Error(`${stop.name}: approaching did not come before arrival`)
    }
    return `200, trip ${latest.id} ${latest.status}, ${detail.stop_list.length} stops, ${detail.events.length} events`
  }
)
await D6(
  'API-TP-04',
  'Live trips',
  'GET',
  '/mobile/parent/children/:id/bus',
  'Parent bus card',
  '200 with status and headline (null when the child walks)',
  async () => {
    const result = await parent('GET', `/mobile/parent/children/${child.id}/bus`)
    expectStatus(result, 200)
    const bus = result.body.data
    return bus ? `200, ${bus.status}: "${bus.headline}"` : '200, child does not use the bus'
  }
)
await D6(
  'API-TP-05',
  'Live trips',
  'GET',
  '/mobile/driver/trips/today',
  'Parent opens the driver screen',
  '403 FORBIDDEN',
  async () => expectStatus(await parent('GET', '/mobile/driver/trips/today'), 403)
)
await D6(
  'API-TP-06',
  'Live trips',
  'WS',
  '/live',
  'Socket without a token',
  'Connection refused with TOKEN_MISSING',
  async () => {
    const { io } = await import('socket.io-client')
    const origin = API.replace(/\/api\/v1$/, '')
    const socket = io(`${origin}/live`, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
    })
    const outcome = await new Promise((resolve) => {
      socket.on('connect', () => resolve('connected'))
      socket.on('connect_error', (error) => resolve(error.data?.error ?? error.message))
    })
    socket.close()
    if (outcome !== 'TOKEN_MISSING') throw new Error(`Got ${outcome}`)
    return 'refused: TOKEN_MISSING'
  }
)

const TA = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'Teacher app' }, fn)
const teacherRoster = teacherSection
  ? ((await teacher('GET', `/mobile/teacher/sections/${teacherSection}/students`)).body?.data ?? [])
  : []
const rosterStudent = teacherRoster[0]
await TA(
  'API-TA-01',
  'Teacher app',
  'GET',
  '/mobile/teacher/timetable/today',
  "Teacher's day with student count per period",
  '200 with periods, kind and students',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/timetable/today')
    expectStatus(result, 200)
    const day = result.body.data
    if (!Array.isArray(day.periods) || !day.periods.length) throw new Error('No periods')
    const lesson = day.periods.find((item) => item.kind === 'class' || item.kind === 'substitute')
    if (lesson && !(lesson.students >= 0)) throw new Error('students count missing')
    return `200, ${day.day_name}, ${day.my_periods} periods${lesson ? `, ${lesson.section.name} has ${lesson.students} students` : ''}`
  }
)
await TA(
  'API-TA-02',
  'Teacher app',
  'GET',
  '/mobile/teacher/timetable/today',
  'Parent opens the teacher timetable',
  '403 FORBIDDEN',
  async () => expectStatus(await parent('GET', '/mobile/teacher/timetable/today'), 403)
)
await TA(
  'API-TA-03',
  'Teacher app',
  'GET',
  '/mobile/teacher/students/:id/history',
  'Full history of a student in my section',
  '200 with attendance, behaviour, achievements, results',
  async () => {
    if (!rosterStudent) return 'Skipped: teacher has no section'
    const result = await teacher('GET', `/mobile/teacher/students/${rosterStudent.id}/history`)
    expectStatus(result, 200)
    const data = result.body.data
    for (const key of [
      'attendance_year',
      'attendance_month',
      'behaviour',
      'achievements',
      'results',
    ])
      if (!(key in data)) throw new Error(`${key} missing`)
    return `200, ${data.student.full_name}: ${data.attendance_year.percent}% attendance, ${data.results.length} results, ${data.achievements.length} achievements`
  }
)
await TA(
  'API-TA-04',
  'Teacher app',
  'GET',
  '/mobile/teacher/students/:id/history',
  'History of a student outside my sections',
  '403 NOT_YOUR_SECTION',
  async () => {
    const others = (await admin('GET', '/admin/students?limit=50')).body.data.items
    const outsider = others.find((item) => !teacherRoster.some((row) => row.id === item.id))
    if (!outsider) return 'Skipped: every student is in my section'
    return expectStatus(
      await teacher('GET', `/mobile/teacher/students/${outsider.id}/history`),
      403,
      'NOT_YOUR_SECTION'
    )
  }
)
await TA(
  'API-TA-05',
  'Achievements',
  'POST',
  '/mobile/teacher/students/:id/achievements',
  'Add an achievement with nothing filled',
  '400 VALIDATION_FAILED on title, category, achieved_on',
  async () => {
    if (!rosterStudent) return 'Skipped: teacher has no section'
    return expectFields(
      await teacher('POST', `/mobile/teacher/students/${rosterStudent.id}/achievements`, {}),
      ['title', 'category', 'achieved_on']
    )
  }
)
await TA(
  'API-TA-06',
  'Achievements',
  'POST',
  '/mobile/teacher/students/:id/achievements',
  'Teacher adds an achievement; admin sees it and deletes it',
  '201, listed for admin, 200 on delete',
  async () => {
    if (!rosterStudent) return 'Skipped: teacher has no section'
    const added = await teacher(
      'POST',
      `/mobile/teacher/students/${rosterStudent.id}/achievements`,
      {
        title: `Regression quiz ${RUN}`,
        category: 'competition',
        level: 'district',
        position: '2nd place',
        achieved_on: TODAY_IST,
      }
    )
    expectStatus(added, 201)
    const list = (await admin('GET', `/admin/students/${rosterStudent.id}/achievements`)).body.data
    if (!list.some((item) => item.id === added.body.data.id))
      throw new Error('Admin list does not show it')
    expectStatus(
      await admin(
        'DELETE',
        `/admin/students/${rosterStudent.id}/achievements/${added.body.data.id}`
      ),
      200
    )
    return `201 "${added.body.data.title}", admin sees it, deleted`
  }
)
await TA(
  'API-TA-07',
  'Achievements',
  'GET',
  '/mobile/parent/children/:id/achievements',
  "Parent sees the child's achievements",
  '200 list',
  async () => {
    const result = await parent('GET', `/mobile/parent/children/${child.id}/achievements`)
    expectStatus(result, 200)
    return `200, ${result.body.data.length} achievements`
  }
)
await TA('API-TA-08', 'Exams', 'GET', '/admin/exams', 'Exam list', '200 paginated', async () => {
  const result = await admin('GET', '/admin/exams?limit=5')
  expectStatus(result, 200)
  return `200, ${result.body.data.total} exams`
})
await TA(
  'API-TA-09',
  'Exams',
  'POST',
  '/admin/exams',
  'Create an exam with nothing filled',
  '400 VALIDATION_FAILED',
  async () => expectStatus(await admin('POST', '/admin/exams', {}), 400, 'VALIDATION_FAILED')
)
await TA(
  'API-TA-10',
  'Exams',
  'GET',
  '/admin/exams/:id/toppers',
  'Top rank holders of the latest exam',
  '200',
  async () => {
    const exam = (await admin('GET', '/admin/exams?limit=1')).body.data.items[0]
    if (!exam) return 'Skipped: no exam yet'
    const result = await admin('GET', `/admin/exams/${exam.id}/toppers`)
    expectStatus(result, 200)
    return `200, ${exam.name}`
  }
)
await TA(
  'API-TA-11',
  'Exams',
  'GET',
  '/mobile/teacher/sections/:id/ranking',
  'Teacher sees the section ranking',
  '200',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    return expectStatus(
      await teacher('GET', `/mobile/teacher/sections/${teacherSection}/ranking`),
      200
    )
  }
)
await TA(
  'API-TA-12',
  'Fees',
  'GET',
  '/admin/fees/insights',
  'Fee insight counts',
  '200',
  async () => expectStatus(await admin('GET', '/admin/fees/insights'), 200)
)
await TA(
  'API-TA-13',
  'Fees',
  'POST',
  '/admin/fees/heads',
  'Fee head with nothing filled',
  '400 VALIDATION_FAILED',
  async () => expectStatus(await admin('POST', '/admin/fees/heads', {}), 400, 'VALIDATION_FAILED')
)
await TA(
  'API-TA-14',
  'Fees',
  'GET',
  '/mobile/parent/children/:id/fees',
  "Parent sees the child's fees",
  '200',
  async () => expectStatus(await parent('GET', `/mobile/parent/children/${child.id}/fees`), 200)
)
await TA(
  'API-TA-15',
  'Fees',
  'GET',
  '/mobile/teacher/sections/:id/students',
  'Roster carries the fee key (filled for the class teacher only)',
  '200 with fee on each row',
  async () => {
    if (!rosterStudent) return 'Skipped: teacher has no section'
    if (!('fee' in rosterStudent)) throw new Error('fee key missing')
    return `200, first fee: ${JSON.stringify(rosterStudent.fee).slice(0, 60)}`
  }
)

const AO = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'AO and logo' }, fn)
await AO(
  'API-AO-01',
  'AO access',
  'GET',
  '/me',
  'AO signs in to the admin web',
  '200, admin app, substitutes.manage, no payroll or users.manage',
  async () => {
    const me = (await ao('GET', '/me')).body.data
    if (!me.apps.includes('admin')) throw new Error(`apps ${me.apps}`)
    if (!me.permissions.includes('substitutes.manage')) throw new Error('No substitutes.manage')
    for (const code of ['payroll.view', 'users.manage', 'staff.bank', 'schools.manage'])
      if (me.permissions.includes(code)) throw new Error(`AO has ${code}`)
    return `200, ${me.permissions.length} permissions`
  }
)
await AO(
  'API-AO-02',
  'AO access',
  'GET',
  '/admin/payroll/runs',
  'AO opens payroll',
  '403 FORBIDDEN',
  async () => expectStatus(await ao('GET', '/admin/payroll/runs'), 403, 'FORBIDDEN')
)
await AO(
  'API-AO-03',
  'AO access',
  'PATCH',
  '/admin/school',
  'AO edits school setup',
  '403 FORBIDDEN',
  async () => expectStatus(await ao('PATCH', '/admin/school', { name: 'x' }), 403, 'FORBIDDEN')
)
await AO(
  'API-AO-04',
  'Substitutes',
  'POST',
  '/admin/substitutes',
  'School admin tries to assign a substitute',
  '403 FORBIDDEN (only the AO assigns)',
  async () =>
    expectStatus(
      await admin('POST', '/admin/substitutes', {
        date: TODAY_IST,
        slot_id: 1,
        substitute_user_id: 1,
      }),
      403,
      'FORBIDDEN'
    )
)
await AO(
  'API-AO-05',
  'Substitutes',
  'POST',
  '/admin/substitutes',
  'AO assigns with nothing filled',
  '400 VALIDATION_FAILED (allowed, checked)',
  async () => expectStatus(await ao('POST', '/admin/substitutes', {}), 400, 'VALIDATION_FAILED')
)
await AO(
  'API-AO-06',
  'School logo',
  'PATCH',
  '/admin/school',
  'Logo pointing at a file that does not exist',
  '400 VALIDATION_FAILED on logo_file_id',
  async () =>
    expectFields(await admin('PATCH', '/admin/school', { logo_file_id: 999999 }), ['logo_file_id'])
)
await AO(
  'API-AO-07',
  'School logo',
  'GET',
  '/me',
  'Profile carries the school logo link',
  '200 with school.logo_url (null when none)',
  async () => {
    const me = (await admin('GET', '/me')).body.data
    if (!('logo_url' in me.school)) throw new Error('school.logo_url missing')
    return `200, logo_url ${me.school.logo_url ? 'set' : 'null'}`
  }
)

const CB = (id, method, endpoint, scenario, expected, fn) =>
  check(
    { id, module: 'Combine class', method, endpoint, scenario, expected, day: 'AO and logo' },
    fn
  )
const combineCase = await (async () => {
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(Date.now() + 5.5 * 3600 * 1000 + offset * 86400000)
      .toISOString()
      .slice(0, 10)
    const board = (await ao('GET', `/admin/substitutes?date=${day}`)).body?.data
    for (const period of (board?.teachers ?? []).flatMap((item) => item.periods)) {
      if (period.substitution_id) continue
      const options = (
        await ao('GET', `/admin/substitutes/combine-options?date=${day}&slot_id=${period.slot_id}`)
      ).body?.data
      if (options?.targets.length >= 2) return { day, period, options }
    }
  }
  return null
})()
await CB(
  'API-CB-01',
  'POST',
  '/admin/substitutes/combine',
  'Combine with nothing filled',
  '400 VALIDATION_FAILED on date, slot_id, mode',
  async () =>
    expectFields(await ao('POST', '/admin/substitutes/combine', {}), ['date', 'slot_id', 'mode'])
)
await CB(
  'API-CB-02',
  'GET',
  '/admin/substitutes/combine-options',
  'Sections the class can sit with',
  '200 with boys and girls count and running sections',
  async () => {
    if (!combineCase) return 'Skipped: no uncovered period with two running sections this week'
    const { options } = combineCase
    if (options.students.total !== options.students.boys + options.students.girls)
      throw new Error('Counts do not add up')
    if (options.targets.some((item) => item.section.id === combineCase.period.section.id))
      throw new Error('Own section listed')
    return `200, ${options.students.total} students, targets ${options.targets.map((item) => item.section.name).join(', ')}`
  }
)
await CB(
  'API-CB-03',
  'POST',
  '/admin/substitutes/combine',
  'Boys and girls to the same section',
  '400 on girls_section_id',
  async () => {
    if (!combineCase) return 'Skipped: no case'
    const target = combineCase.options.targets[0].section.id
    return expectFields(
      await ao('POST', '/admin/substitutes/combine', {
        date: combineCase.day,
        slot_id: combineCase.period.slot_id,
        mode: 'split',
        boys_section_id: target,
        girls_section_id: target,
      }),
      ['girls_section_id']
    )
  }
)
await CB(
  'API-CB-04',
  'POST',
  '/admin/substitutes/combine',
  'Section with no class in that period',
  '409 SECTION_NOT_AVAILABLE',
  async () => {
    if (!combineCase) return 'Skipped: no case'
    return expectStatus(
      await ao('POST', '/admin/substitutes/combine', {
        date: combineCase.day,
        slot_id: combineCase.period.slot_id,
        mode: 'whole',
        section_id: 999999,
      }),
      409,
      'SECTION_NOT_AVAILABLE'
    )
  }
)
await CB(
  'API-CB-05',
  'POST',
  '/admin/substitutes/combine',
  'School admin tries to combine',
  '403 FORBIDDEN',
  async () => {
    if (!combineCase) return 'Skipped: no case'
    return expectStatus(
      await admin('POST', '/admin/substitutes/combine', {
        date: combineCase.day,
        slot_id: combineCase.period.slot_id,
        mode: 'whole',
        section_id: combineCase.options.targets[0].section.id,
      }),
      403,
      'FORBIDDEN'
    )
  }
)
await CB(
  'API-CB-06',
  'POST',
  '/admin/substitutes/combine',
  'AO splits boys and girls, then removes it',
  '200 kind combine with two groups, covered; removed',
  async () => {
    if (!combineCase) return 'Skipped: no case'
    const [boys, girls] = combineCase.options.targets
    const result = await ao('POST', '/admin/substitutes/combine', {
      date: combineCase.day,
      slot_id: combineCase.period.slot_id,
      mode: 'split',
      boys_section_id: boys.section.id,
      girls_section_id: girls.section.id,
    })
    expectStatus(result, 200)
    const period = result.body.data.teachers
      .flatMap((item) => item.periods)
      .find((item) => item.slot_id === combineCase.period.slot_id)
    if (period.kind !== 'combine' || period.combined_into.length !== 2)
      throw new Error(JSON.stringify(period.combined_into))
    expectStatus(await ao('DELETE', `/admin/substitutes/${period.substitution_id}`), 200)
    return `200, ${period.combined_into.map((item) => `${item.group} ${item.students} -> ${item.section.name}`).join(', ')}; removed`
  }
)

const SP = (id, method, endpoint, scenario, expected, fn) =>
  check(
    { id, module: 'Sports and activities', method, endpoint, scenario, expected, day: 'Sports' },
    fn
  )
await SP(
  'API-SP-01',
  'POST',
  '/admin/students/:id/achievements',
  'Sports achievement without indoor or outdoor',
  '400 on venue_type',
  async () =>
    expectFields(
      await admin('POST', `/admin/students/${studentId}/achievements`, {
        title: 'Sports day sprint',
        category: 'sports',
        achieved_on: TODAY_IST,
      }),
      ['venue_type']
    )
)
await SP(
  'API-SP-02',
  'POST',
  '/admin/students/:id/achievements',
  'District inter-school team winner scores 20 points',
  '201, points 20, team name kept',
  async () => {
    const result = await admin('POST', `/admin/students/${studentId}/achievements`, {
      title: `Regression football ${RUN}`,
      category: 'sports',
      level: 'district',
      result: 'winner',
      event_scope: 'inter_school',
      venue_type: 'outdoor',
      participation: 'team',
      team_name: 'U-14 team',
      prize_received: 'Trophy',
      school_reward: 'Medal',
      achieved_on: TODAY_IST,
    })
    expectStatus(result, 201)
    if (result.body.data.points !== 20) throw new Error(`points ${result.body.data.points}`)
    if (result.body.data.team_name !== 'U-14 team') throw new Error('team name lost')
    return `201, ${result.body.data.points} points`
  }
)
await SP(
  'API-SP-03',
  'GET',
  '/admin/achievements/leaderboard',
  'Sports leaderboard',
  '200, ranked by points, equal points share a rank',
  async () => {
    const result = await admin('GET', '/admin/achievements/leaderboard?category=sports&limit=50')
    expectStatus(result, 200)
    const rows = result.body.data.rows
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index].points > rows[index - 1].points) throw new Error('Not sorted by points')
      if (
        rows[index].points === rows[index - 1].points &&
        rows[index].rank !== rows[index - 1].rank
      )
        throw new Error('Tie not shared')
    }
    if (!rows.some((row) => row.student.id === studentId)) throw new Error('New winner missing')
    return `200, ${rows.length} students, top ${rows[0]?.student.name} ${rows[0]?.points} pts`
  }
)
await SP(
  'API-SP-04',
  'GET',
  '/admin/achievements',
  'Filter inter-school podium finishes',
  '200, only inter-school top 3 results',
  async () => {
    const result = await admin(
      'GET',
      '/admin/achievements?event_scope=inter_school&result=podium&limit=50'
    )
    expectStatus(result, 200)
    const bad = result.body.data.items.find(
      (item) => item.event_scope !== 'inter_school' || item.result === 'participated'
    )
    if (bad) throw new Error(`Unexpected ${bad.title}`)
    return `200, ${result.body.data.total} achievements`
  }
)
await SP('API-SP-05', 'GET', '/admin/achievements', 'Unknown sort', '400 INVALID_SORT', async () =>
  expectStatus(await admin('GET', '/admin/achievements?sort=nope'), 400, 'INVALID_SORT')
)
await SP(
  'API-SP-06',
  'GET',
  '/admin/achievements/insights',
  'Insight counts',
  '200 with sports, wins, outside school',
  async () => {
    const result = await admin('GET', '/admin/achievements/insights')
    expectStatus(result, 200)
    const data = result.body.data
    if (data.sports > data.total || data.wins > data.total) throw new Error(JSON.stringify(data))
    return `200, ${JSON.stringify(data)}`
  }
)
await SP(
  'API-SP-07',
  'GET',
  '/mobile/teacher/sections/:id/activity-ranking',
  'Teacher sees my section activity ranking',
  '200',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    return expectStatus(
      await teacher('GET', `/mobile/teacher/sections/${teacherSection}/activity-ranking`),
      200
    )
  }
)

const D7 = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'Day 7' }, fn)
const vehicles = (await admin('GET', '/admin/transport/vehicles?limit=5')).body?.data?.items ?? []
const vehicle = vehicles[0]
await D7(
  'API-D7-01',
  'Boarding',
  'POST',
  '/mobile/driver/trips/:id/boardings',
  'Parent tries to mark boarding',
  '403 FORBIDDEN',
  async () =>
    expectStatus(
      await parent('POST', '/mobile/driver/trips/1/boardings', {
        action: 'boarded',
        student_id: 1,
      }),
      403
    )
)
await D7(
  'API-D7-02',
  'SOS',
  'POST',
  '/mobile/driver/sos',
  'Parent presses SOS',
  '403 FORBIDDEN',
  async () => expectStatus(await parent('POST', '/mobile/driver/sos', {}), 403)
)
await D7(
  'API-D7-03',
  'Alerts',
  'GET',
  '/admin/fleet/alerts',
  'Alerts centre list and insights',
  '200 paginated and counts',
  async () => {
    const list = await admin('GET', '/admin/fleet/alerts?limit=5')
    expectStatus(list, 200)
    expectStatus(await admin('GET', '/admin/fleet/alerts/insights'), 200)
    return `200, ${list.body.data.total} alerts`
  }
)
await D7(
  'API-D7-04',
  'Alerts',
  'POST',
  '/admin/fleet/alerts/:id/resolve',
  'Resolve without a note',
  '400 on resolution_note',
  async () => {
    const open = (await admin('GET', '/admin/fleet/alerts?limit=1')).body.data.items[0]
    return expectFields(
      await admin('POST', `/admin/fleet/alerts/${open?.id ?? 999999}/resolve`, {}),
      ['resolution_note']
    )
  }
)
await D7(
  'API-D7-05',
  'Alerts',
  'POST',
  '/admin/fleet/alerts/:id/acknowledge',
  'Alert that does not exist',
  '404 ALERT_NOT_FOUND',
  async () =>
    expectStatus(
      await admin('POST', '/admin/fleet/alerts/999999/acknowledge'),
      404,
      'ALERT_NOT_FOUND'
    )
)
await D7(
  'API-D7-06',
  'Alerts',
  'POST',
  '/admin/fleet/alerts/:id/resolve',
  'AO (view only) tries to resolve',
  '403 FORBIDDEN',
  async () =>
    expectStatus(
      await ao('POST', '/admin/fleet/alerts/999999/resolve', { resolution_note: 'Handled' }),
      403
    )
)
await D7(
  'API-D7-07',
  'Maintenance',
  'POST',
  '/admin/fleet/maintenance',
  'Ticket with nothing filled',
  '400 on vehicle_id, title',
  async () =>
    expectFields(await admin('POST', '/admin/fleet/maintenance', {}), ['vehicle_id', 'title'])
)
await D7(
  'API-D7-08',
  'Maintenance',
  'GET',
  '/admin/fleet/maintenance',
  'Tickets list and insights',
  '200',
  async () => {
    expectStatus(await admin('GET', '/admin/fleet/maintenance/insights'), 200)
    return expectStatus(await admin('GET', '/admin/fleet/maintenance?limit=5'), 200)
  }
)
await D7(
  'API-D7-09',
  'Fuel log',
  'POST',
  '/admin/fleet/fuel',
  'Fuel entry with nothing filled',
  '400 on vehicle_id, filled_on, litres, amount, odometer_km',
  async () =>
    expectFields(await admin('POST', '/admin/fleet/fuel', {}), [
      'vehicle_id',
      'filled_on',
      'litres',
      'amount',
      'odometer_km',
    ])
)
await D7(
  'API-D7-10',
  'Fuel log',
  'POST',
  '/admin/fleet/fuel',
  'Fuel entry dated in the future',
  '400 on filled_on',
  async () => {
    if (!vehicle) return 'Skipped: no bus'
    const future = new Date(Date.now() + 5.5 * 3600 * 1000 + 3 * 86400000)
      .toISOString()
      .slice(0, 10)
    return expectFields(
      await admin('POST', '/admin/fleet/fuel', {
        vehicle_id: vehicle.id,
        filled_on: future,
        litres: 40,
        amount: 3800,
        odometer_km: 99999,
      }),
      ['filled_on']
    )
  }
)
await D7(
  'API-D7-11',
  'Vehicle health',
  'GET',
  '/admin/fleet/buses/:id/health',
  'Health card of a bus',
  '200 with status',
  async () => {
    if (!vehicle) return 'Skipped: no bus'
    const result = await admin('GET', `/admin/fleet/buses/${vehicle.id}/health`)
    expectStatus(result, 200)
    return `200, ${result.body.data.status}`
  }
)
await D7(
  'API-D7-12',
  'Playback',
  'GET',
  '/admin/fleet/trips/:id/playback',
  'Replay of the latest ended trip',
  '200 with points in time order',
  async () => {
    const ended = (await admin('GET', '/admin/transport/trips?limit=1&status=ended')).body.data
      .items[0]
    if (!ended) return 'Skipped: no ended trip'
    const result = await admin('GET', `/admin/fleet/trips/${ended.id}/playback`)
    expectStatus(result, 200)
    const points = result.body.data.points ?? result.body.data.track ?? []
    for (let index = 1; index < points.length; index += 1)
      if (
        new Date(points[index].at ?? points[index].time) <
        new Date(points[index - 1].at ?? points[index - 1].time)
      )
        throw new Error('Points out of order')
    return `200, ${points.length} points`
  }
)

await TA(
  'API-BN-01',
  'Teacher app',
  'GET',
  '/mobile/teacher/banner',
  'Home alert banner',
  '200, banners sorted critical → warning → info',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/banner')
    expectStatus(result, 200)
    const order = { critical: 0, warning: 1, info: 2 }
    const banners = result.body.data.banners
    for (let index = 1; index < banners.length; index += 1)
      if (order[banners[index].severity] < order[banners[index - 1].severity])
        throw new Error('Not sorted by severity')
    if (banners.some((item) => !item.code || !item.action?.screen))
      throw new Error('Banner without code or action')
    return `200, ${banners.map((item) => item.code).join(', ') || 'no banners'}`
  }
)
await TA(
  'API-BN-02',
  'Teacher app',
  'GET',
  '/mobile/teacher/banner',
  'Parent opens the teacher banner',
  '403 FORBIDDEN',
  async () => expectStatus(await parent('GET', '/mobile/teacher/banner'), 403)
)

const D9 = (id, module, method, endpoint, scenario, expected, fn) =>
  check({ id, module, method, endpoint, scenario, expected, day: 'Day 9' }, fn)
await D9(
  'API-D9-01',
  'Dashboard',
  'GET',
  '/admin/dashboard',
  'Dashboard for the school admin',
  '200 with students, attendance, buses and alerts',
  async () => {
    const result = await admin('GET', '/admin/dashboard')
    expectStatus(result, 200)
    const data = result.body.data
    for (const key of ['students', 'attendance', 'buses', 'alerts'])
      if (!data[key]) throw new Error(`${key} missing`)
    return `200, ${data.students.total} students, students present ${data.attendance.students.percent ?? '–'}%, buses ${data.buses.total}`
  }
)
await D9(
  'API-D9-02',
  'Dashboard',
  'GET',
  '/admin/dashboard',
  'Parent token on the dashboard',
  'Every section null or 403',
  async () => {
    const result = await parent('GET', '/admin/dashboard')
    if (result.status === 403) return '403'
    expectStatus(result, 200)
    const filled = Object.entries(result.body.data).filter(
      ([key, value]) => key !== 'date' && value !== null
    )
    if (filled.length) throw new Error(`Parent sees ${filled.map(([key]) => key).join(', ')}`)
    return '200, all sections null'
  }
)
await D9(
  'API-D9-03',
  'Parent bus v2',
  'GET',
  '/api/v2/mobile/parent/children/:id/bus',
  'Bus card v2 with the stop timeline',
  '200 with timeline stops; v1 still works',
  async () => {
    const v1 = await parent('GET', `/mobile/parent/children/${child.id}/bus`)
    expectStatus(v1, 200)
    const response = await fetch(
      API.replace('/v1', '/v2') + `/mobile/parent/children/${child.id}/bus`,
      {
        headers: { authorization: `Bearer ${parentToken}` },
      }
    )
    const body = await response.json()
    if (response.status !== 200) throw new Error(`v2 ${response.status} ${body.error}`)
    if (!body.data) return '200, child does not use the bus'
    const stops = body.data.timeline?.stops ?? []
    for (let index = 1; index < stops.length; index += 1)
      if (stops[index].sequence < stops[index - 1].sequence && body.data.timeline.kind === 'pickup')
        throw new Error('Stops out of order')
    return `200, ${body.data.timeline?.source ?? 'no timeline'}, ${stops.length} stops`
  }
)
await D9(
  'API-D9-04',
  'Parent preview',
  'GET',
  '/admin/students/:id/parent-view',
  'Parent app preview of a child',
  '200; unknown student 404',
  async () => {
    expectStatus(await admin('GET', `/admin/students/${child.id}/parent-view`), 200)
    return expectStatus(
      await admin('GET', '/admin/students/999999/parent-view'),
      404,
      'STUDENT_NOT_FOUND'
    )
  }
)
await D9(
  'API-D9-05',
  'Meetings',
  'POST',
  '/mobile/teacher/meetings',
  'Teacher books a meeting with parents, parent sees it, teacher cancels',
  '201, listed for parent, 200 cancelled',
  async () => {
    if (!rosterStudent) return 'Skipped: teacher has no section'
    const when = new Date(Date.now() + 3 * 86400000)
    when.setUTCHours(5, 0, 0, 0)
    const made = await teacher('POST', '/mobile/teacher/meetings', {
      student_id: rosterStudent.id,
      title: `Regression meeting ${RUN}`,
      scheduled_at: when.toISOString(),
      duration_minutes: 15,
    })
    expectStatus(made, 201)
    expectStatus(await admin('GET', `/admin/meetings/${made.body.data.id}`), 200)
    const cancelled = await teacher(
      'POST',
      `/mobile/teacher/meetings/${made.body.data.id}/cancel`,
      { reason: 'Regression' }
    )
    expectStatus(cancelled, 200)
    return `201, then ${cancelled.body.data.status}`
  }
)
await D9(
  'API-D9-06',
  'Meetings',
  'POST',
  '/mobile/teacher/meetings',
  'Meeting with nothing filled',
  '400 on student_id, title, scheduled_at',
  async () =>
    expectFields(await teacher('POST', '/mobile/teacher/meetings', {}), [
      'student_id',
      'title',
      'scheduled_at',
    ])
)
await D9(
  'API-D9-07',
  'Meetings',
  'GET',
  '/admin/meetings',
  'Meetings list and insights',
  '200',
  async () => {
    expectStatus(await admin('GET', '/admin/meetings/insights'), 200)
    return expectStatus(await admin('GET', '/admin/meetings?limit=5'), 200)
  }
)

await TA(
  'API-BE-01',
  'Teacher app',
  'GET',
  '/mobile/teacher/sections/:id/students',
  'Roster by rank, descending',
  '200, ranks in descending order, unranked last',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    const result = await teacher(
      'GET',
      `/mobile/teacher/sections/${teacherSection}/students?sort=rank&order=desc`
    )
    expectStatus(result, 200)
    const ranks = result.body.data.map((item) => item.rank)
    const ranked = ranks.filter((rank) => rank !== null)
    if (ranks.slice(0, ranked.length).some((rank) => rank === null))
      throw new Error('Unranked before ranked')
    for (let index = 1; index < ranked.length; index += 1)
      if (ranked[index] > ranked[index - 1]) throw new Error('Not descending')
    return `200, ${ranks.join(',')}`
  }
)
await TA(
  'API-BE-02',
  'Teacher app',
  'GET',
  '/mobile/teacher/sections/:id/benches',
  'Bench groups in roll order',
  '200, First/…/Last covering every student once',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    const result = await teacher(
      'GET',
      `/mobile/teacher/sections/${teacherSection}/benches?sort=roll_no&order=asc&groups=3`
    )
    expectStatus(result, 200)
    const { groups, total } = result.body.data
    if (groups.reduce((sum, group) => sum + group.count, 0) !== total)
      throw new Error('Counts do not add up')
    if (groups.at(-1).label !== 'Last') throw new Error('Last group label')
    return `200, ${groups.map((group) => `${group.label} ${group.count}`).join(', ')}`
  }
)
await TA(
  'API-BE-03',
  'Teacher app',
  'GET',
  '/mobile/teacher/sections/:id/students',
  'Unknown sort value',
  '400 on sort',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    return expectFields(
      await teacher('GET', `/mobile/teacher/sections/${teacherSection}/students?sort=height`),
      ['sort']
    )
  }
)

await TA(
  'API-PS-01',
  'Payslips',
  'GET',
  '/mobile/teacher/payslips/periods',
  'Teacher payslip years and months',
  '200 with years newest first',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/payslips/periods')
    expectStatus(result, 200)
    const years = result.body.data.years
    for (let index = 1; index < years.length; index += 1)
      if (years[index].year > years[index - 1].year) throw new Error('Not newest first')
    return `200, ${years.map((year) => `${year.year}: ${year.months.length} months`).join(', ') || 'no payslips'}`
  }
)
await TA(
  'API-PS-02',
  'Payslips',
  'GET',
  '/mobile/teacher/payslips/:id',
  'Payslip preview and PDF',
  '200 with earnings and deductions; PDF downloads',
  async () => {
    const list = await teacher('GET', '/mobile/teacher/payslips?limit=1')
    expectStatus(list, 200)
    const slip = list.body.data.items[0]
    if (!slip) return 'Skipped: no final payslip yet'
    const preview = await teacher('GET', `/mobile/teacher/payslips/${slip.id}`)
    expectStatus(preview, 200)
    const data = preview.body.data
    const earned = data.earnings.reduce((sum, line) => sum + line.amount, 0)
    if (Math.abs(earned - data.gross) > 1)
      throw new Error(`Earnings ${earned} vs gross ${data.gross}`)
    const pdf = await teacher('GET', `/mobile/teacher/payslips/${slip.id}/pdf`)
    if (pdf.status !== 200 || !pdf.type.includes('pdf'))
      throw new Error(`PDF ${pdf.status} ${pdf.type}`)
    return `200, ${data.month_label} net ${data.net}, PDF ok`
  }
)
await TA(
  'API-PS-03',
  'Payslips',
  'GET',
  '/mobile/teacher/payslips',
  'Month filter out of range',
  '400 on month',
  async () => expectFields(await teacher('GET', '/mobile/teacher/payslips?month=13'), ['month'])
)
await TA(
  'API-PS-04',
  'Payslips',
  'GET',
  '/mobile/teacher/payslips/:id',
  'Someone else’s payslip',
  '404 PAYSLIP_NOT_FOUND',
  async () =>
    expectStatus(await teacher('GET', '/mobile/teacher/payslips/999999'), 404, 'PAYSLIP_NOT_FOUND')
)

await TA(
  'API-SX-01',
  'Teacher app',
  'GET',
  '/mobile/teacher/profile',
  'Staff profile for the Me screen',
  '200 with headline and subjects',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/profile')
    expectStatus(result, 200)
    if (!result.body.data.headline) throw new Error('No headline')
    return `200, ${result.body.data.headline}`
  }
)
await TA(
  'API-SX-02',
  'Teacher app',
  'GET',
  '/mobile/teacher/leaves/preview',
  'Leave preview over a weekend',
  '200; Sunday not counted',
  async () => {
    const balances = (await teacher('GET', '/mobile/teacher/leave-balances')).body.data
    const type = balances[0].leave_type.id
    const result = await teacher(
      'GET',
      `/mobile/teacher/leaves/preview?leave_type_id=${type}&from_date=2026-11-14&to_date=2026-11-16`
    )
    expectStatus(result, 200)
    if (result.body.data.dates.includes('2026-11-15')) throw new Error('Sunday counted')
    return `200, ${result.body.data.days} days, ${result.body.data.period_count} periods`
  }
)
await TA(
  'API-SX-03',
  'Teacher app',
  'GET',
  '/mobile/teacher/leaves/preview',
  'Leave preview with the last day before the first',
  '400 on to_date',
  async () => {
    const balances = (await teacher('GET', '/mobile/teacher/leave-balances')).body.data
    return expectFields(
      await teacher(
        'GET',
        `/mobile/teacher/leaves/preview?leave_type_id=${balances[0].leave_type.id}&from_date=2026-11-16&to_date=2026-11-14`
      ),
      ['to_date']
    )
  }
)
await TA(
  'API-SX-04',
  'Teacher app',
  'GET',
  '/mobile/teacher/classes',
  'My classes with weekly periods and class-teacher summary',
  '200; summary only for class-teacher sections',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/classes')
    expectStatus(result, 200)
    for (const item of result.body.data) {
      if (typeof item.periods_per_week !== 'number') throw new Error('periods_per_week missing')
      if (Boolean(item.class_teacher_summary) !== item.is_class_teacher)
        throw new Error(`Summary mismatch for ${item.class_name}-${item.section_name}`)
    }
    return `200, ${result.body.data.length} classes`
  }
)
await TA(
  'API-SX-05',
  'Teacher app',
  'GET',
  '/mobile/teacher/sections/:id/students',
  'Roster shows today’s attendance status',
  '200 with today_status on each row',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    const result = await teacher('GET', `/mobile/teacher/sections/${teacherSection}/students`)
    expectStatus(result, 200)
    if (result.body.data.some((item) => !item.today_status)) throw new Error('today_status missing')
    return `200, ${[...new Set(result.body.data.map((item) => item.today_status))].join(', ')}`
  }
)
await TA(
  'API-SX-06',
  'Teacher app',
  'GET',
  '/mobile/teacher/check-in',
  'Check-in status has the school gate location',
  '200 with school_latitude and school_longitude',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/check-in')
    expectStatus(result, 200)
    if (!('school_latitude' in result.body.data)) throw new Error('school_latitude missing')
    return `200, ${result.body.data.school_latitude}, ${result.body.data.school_longitude}`
  }
)

await TA(
  'API-AB-01',
  'App banners',
  'POST',
  '/admin/app-banners',
  'Banner with nothing filled',
  '400 on title, starts_on, ends_on (image is optional)',
  async () =>
    expectFields(await admin('POST', '/admin/app-banners', {}), ['title', 'starts_on', 'ends_on'])
)
await TA(
  'API-AB-02',
  'App banners',
  'GET',
  '/admin/app-banners',
  'Banner list and insights',
  '200',
  async () => {
    expectStatus(await admin('GET', '/admin/app-banners/insights'), 200)
    return expectStatus(await admin('GET', '/admin/app-banners?state=live'), 200)
  }
)
await TA(
  'API-AB-03',
  'App banners',
  'GET',
  '/mobile/parent/banner',
  'Parent app banners',
  '200 with a list of SCHOOL_BANNER items',
  async () => {
    const result = await parent('GET', '/mobile/parent/banner')
    expectStatus(result, 200)
    if (result.body.data.banners.some((item) => item.code !== 'SCHOOL_BANNER'))
      throw new Error('Unexpected code')
    return `200, ${result.body.data.banners.length} banners`
  }
)
await TA(
  'API-AB-04',
  'App banners',
  'POST',
  '/admin/app-banners',
  'Teacher tries to add a banner',
  '403',
  async () => expectStatus(await teacher('POST', '/admin/app-banners', {}), 403)
)

const published = (await admin('GET', '/admin/exams?status=published&limit=1')).body?.data
  ?.items?.[0]
const publishedDetail = published
  ? (await admin('GET', `/admin/exams/${published.id}`)).body.data
  : null
const rcSection = publishedDetail?.class_details?.[0]?.sections?.[0]?.id
const rcStudent = rcSection
  ? (await admin('GET', `/admin/exams/${published.id}/sections/${rcSection}/results`)).body?.data
      ?.rows?.[0]?.student_id
  : undefined
const pdfOk = (result) => {
  if (result.status !== 200 || !result.type.includes('application/pdf'))
    throw new Error(`Got ${result.status} ${result.type}`)
  return '200 application/pdf'
}
await TA(
  'API-RCD-01',
  'Report card',
  'GET',
  '/admin/students/{id}/report-card',
  'Whole-year report card',
  '200 with columns, subjects, overall, attendance and options',
  async () => {
    if (!rcStudent) return 'Skipped: no published results'
    const result = await admin('GET', `/admin/students/${rcStudent}/report-card`)
    expectStatus(result, 200)
    const card = result.body.data
    if (card.scope.kind !== 'year' || !card.columns.length || !card.subjects.length)
      throw new Error('Empty card')
    if (card.subjects.some((row) => row.cells.length !== card.columns.length))
      throw new Error('Cells do not match columns')
    if (!card.options.exams.length || !card.pdf_path) throw new Error('options or pdf_path missing')
    return `200, ${card.columns.length} exams, ${card.subjects.length} subjects, ${card.overall.percent}% ${card.overall.grade}`
  }
)
await TA(
  'API-RCD-02',
  'Report card',
  'GET',
  '/admin/students/{id}/report-card?exam_id=',
  'Report card for one exam',
  '200 with one column',
  async () => {
    if (!rcStudent) return 'Skipped: no published results'
    const result = await admin(
      'GET',
      `/admin/students/${rcStudent}/report-card?exam_id=${published.id}`
    )
    expectStatus(result, 200)
    if (result.body.data.scope.kind !== 'exam' || result.body.data.columns.length !== 1)
      throw new Error('Wrong scope')
    return '200, 1 exam'
  }
)
await TA(
  'API-RCD-03',
  'Report card',
  'GET',
  '/admin/students/{id}/report-card/pdf',
  'Printable report card',
  '200 application/pdf',
  async () => {
    if (!rcStudent) return 'Skipped: no published results'
    const response = await fetch(`${API}/admin/students/${rcStudent}/report-card/pdf`, {
      headers: { authorization: `Bearer ${adminToken}` },
    })
    return pdfOk({ status: response.status, type: response.headers.get('content-type') ?? '' })
  }
)
await TA(
  'API-RCD-04',
  'Report card',
  'GET',
  '/admin/report-cards/sections/{id}/pdf',
  'Report cards of a whole section',
  '200 application/pdf',
  async () => {
    if (!rcSection) return 'Skipped: no published results'
    const response = await fetch(
      `${API}/admin/report-cards/sections/${rcSection}/pdf?exam_id=${published.id}`,
      { headers: { authorization: `Bearer ${adminToken}` } }
    )
    return pdfOk({ status: response.status, type: response.headers.get('content-type') ?? '' })
  }
)
await TA(
  'API-RCD-05',
  'Report card',
  'GET',
  '/admin/students/{id}/report-card?exam_id=999999',
  'Unknown exam',
  '404 EXAM_NOT_FOUND',
  async () => {
    if (!rcStudent) return 'Skipped: no published results'
    return expectStatus(
      await admin('GET', `/admin/students/${rcStudent}/report-card?exam_id=999999`),
      404,
      'EXAM_NOT_FOUND'
    )
  }
)
await TA(
  'API-RCD-06',
  'Report card',
  'GET',
  '/admin/students/{id}/report-card?term_id=abc',
  'Bad term id',
  '400 on term_id',
  async () =>
    expectFields(await admin('GET', `/admin/students/${rcStudent ?? 1}/report-card?term_id=abc`), [
      'term_id',
    ])
)
await TA(
  'API-RCD-07',
  'Report card',
  'GET',
  '/mobile/parent/children/{id}/report-card',
  'Parent opens a child that is not theirs',
  '404 CHILD_NOT_FOUND',
  async () =>
    expectStatus(
      await parent('GET', '/mobile/parent/children/999999/report-card'),
      404,
      'CHILD_NOT_FOUND'
    )
)
await TA(
  'API-RCD-08',
  'Report card',
  'GET',
  '/admin/students/{id}/report-card',
  'Teacher without exams.view',
  '403',
  async () =>
    expectStatus(await teacher('GET', `/admin/students/${rcStudent ?? 1}/report-card`), 403)
)

const anonymous = client(null)
await TA(
  'API-OTP-01',
  'Sign-in',
  'POST',
  '/auth/otp/resend',
  'Resend OTP with the Android app hash',
  '200 with resend_in',
  async () => {
    const result = await anonymous('POST', '/auth/otp/resend', {
      mobile: '9000000005',
      app: 'mobile',
      app_hash: 'Xy12AbCd3Ef',
    })
    if (result.status === 429) return '429 resend too soon (cool-down running)'
    expectStatus(result, 200)
    if (!result.body.data.resend_in) throw new Error('resend_in missing')
    return `200, resend in ${result.body.data.resend_in}s`
  }
)
await TA(
  'API-OTP-02',
  'Sign-in',
  'POST',
  '/auth/otp/resend',
  'App hash in the wrong format',
  '400 on app_hash',
  async () =>
    expectFields(
      await anonymous('POST', '/auth/otp/resend', { mobile: '9000000005', app_hash: 'bad hash!' }),
      ['app_hash']
    )
)
await TA(
  'API-OTP-03',
  'Sign-in',
  'POST',
  '/auth/otp/resend',
  'Resend for a number that is not a user',
  '404 MOBILE_NOT_REGISTERED',
  async () =>
    expectStatus(
      await anonymous('POST', '/auth/otp/resend', { mobile: '9999999998' }),
      404,
      'MOBILE_NOT_REGISTERED'
    )
)

const lastWorkingDay = (() => {
  for (let offset = 1; ; offset += 1) {
    const day = new Date(Date.now() + 5.5 * 3600 * 1000 - offset * 86400000)
      .toISOString()
      .slice(0, 10)
    if (new Date(`${day}T00:00:00Z`).getUTCDay() !== 0) return day
  }
})()
await TA(
  'API-BLK-01',
  'Bulk attendance',
  'GET',
  '/admin/staff-attendance/board?page=2&limit=10',
  'Staff board a page at a time',
  '200 with 10 rows and paging fields',
  async () => {
    const result = await ao(
      'GET',
      `/admin/staff-attendance/board?date=${lastWorkingDay}&page=1&limit=10`
    )
    expectStatus(result, 200)
    const data = result.body.data
    if (data.staff.length > 10) throw new Error(`Got ${data.staff.length} rows`)
    for (const key of ['page', 'limit', 'filtered_total', 'total_pages', 'has_next']) {
      if (!(key in data)) throw new Error(`${key} missing`)
    }
    return `200, page ${data.page} of ${data.total_pages}, ${data.staff.length} of ${data.filtered_total}`
  }
)
await TA(
  'API-BLK-02',
  'Bulk attendance',
  'GET',
  '/admin/staff-attendance/board?status=not_checked_in&search=',
  'Search and status filter on the staff board',
  '200, every row matches',
  async () => {
    const result = await ao(
      'GET',
      `/admin/staff-attendance/board?date=${lastWorkingDay}&status=not_checked_in&limit=100`
    )
    expectStatus(result, 200)
    if (result.body.data.staff.some((row) => !['not_checked_in', 'absent'].includes(row.status)))
      throw new Error('A row does not match the status')
    return `200, ${result.body.data.filtered_total} not checked in`
  }
)
await TA(
  'API-BLK-03',
  'Bulk attendance',
  'PUT',
  '/admin/staff-attendance/bulk',
  'Bulk staff with nobody chosen',
  '400 on user_ids',
  async () =>
    expectFields(
      await ao('PUT', '/admin/staff-attendance/bulk', { date: lastWorkingDay, status: 'present' }),
      ['user_ids']
    )
)
await TA(
  'API-BLK-04',
  'Bulk attendance',
  'PUT',
  '/admin/staff-attendance/bulk',
  'AO marks two staff present without a reason',
  '200 with marked',
  async () => {
    const board = await ao('GET', `/admin/staff-attendance/board?date=${lastWorkingDay}&limit=100`)
    const ids = board.body.data.staff
      .filter((row) => row.status !== 'on_leave')
      .slice(0, 2)
      .map((row) => row.user_id)
    const result = await ao('PUT', '/admin/staff-attendance/bulk', {
      date: lastWorkingDay,
      user_ids: ids,
      status: 'present',
    })
    expectStatus(result, 200)
    if (result.body.data.marked !== ids.length)
      throw new Error(`Marked ${result.body.data.marked} of ${ids.length}`)
    return `200, marked ${result.body.data.marked}`
  }
)
await TA(
  'API-BLK-05',
  'Bulk attendance',
  'PUT',
  '/admin/attendance/bulk',
  'Bulk sections with a wrong status',
  '400 on status',
  async () =>
    expectFields(
      await ao('PUT', '/admin/attendance/bulk', { date: lastWorkingDay, status: 'here' }),
      ['status']
    )
)
await TA(
  'API-BLK-06',
  'Bulk attendance',
  'PUT',
  '/admin/attendance/bulk',
  'A marked section is skipped without overwrite',
  '200 with the section in skipped',
  async () => {
    const board = await ao('GET', `/admin/attendance/board?date=${lastWorkingDay}`)
    if (!board.body.data.working_day) return `Skipped: ${lastWorkingDay} is not a school day`
    const marked = board.body.data.sections.find((row) => row.marked)
    if (!marked) return 'Skipped: no marked section'
    const result = await ao('PUT', '/admin/attendance/bulk', {
      date: lastWorkingDay,
      section_ids: [marked.section_id],
      status: 'present',
    })
    expectStatus(result, 200)
    if (result.body.data.skipped[0]?.reason !== 'Already marked') throw new Error('Not skipped')
    return '200, skipped: Already marked'
  }
)
await TA(
  'API-BLK-07',
  'Bulk attendance',
  'PUT',
  '/admin/staff-attendance/bulk',
  'Teacher tries bulk marking',
  '403',
  async () =>
    expectStatus(
      await teacher('PUT', '/admin/staff-attendance/bulk', {
        date: lastWorkingDay,
        status: 'present',
        all_not_checked_in: true,
      }),
      403
    )
)

const sessionBoard = (
  await ao('GET', `/admin/attendance/board?date=${lastWorkingDay}&session=afternoon`)
).body?.data
const sessionSection = sessionBoard?.sections?.[0]?.section_id
await TA(
  'API-SES-01',
  'Attendance sessions',
  'GET',
  '/admin/attendance/board?session=afternoon',
  'Board for the afternoon session',
  '200 with session and morning/afternoon marked flags',
  async () => {
    if (!sessionBoard) throw new Error('No board')
    if (sessionBoard.session !== 'afternoon') throw new Error(`session ${sessionBoard.session}`)
    if (!('morning_marked' in (sessionBoard.sections[0] ?? {})))
      throw new Error('morning_marked missing')
    return `200, ${sessionBoard.sections_not_marked} sections not marked in the afternoon`
  }
)
await TA(
  'API-SES-02',
  'Attendance sessions',
  'GET',
  '/admin/attendance/sections/{id}?session=afternoon',
  'Afternoon roster',
  '200 with session afternoon and period 5',
  async () => {
    const result = await ao(
      'GET',
      `/admin/attendance/sections/${sessionSection}?date=${lastWorkingDay}&session=afternoon`
    )
    expectStatus(result, 200)
    if (result.body.data.period !== 5) throw new Error(`period ${result.body.data.period}`)
    return '200, afternoon = period 5'
  }
)
await TA(
  'API-SES-03',
  'Attendance sessions',
  'GET',
  '/admin/attendance/sections/{id}?period=3',
  'Any period other than 1st and 5th',
  '400 PERIOD_NOT_ALLOWED',
  async () =>
    expectStatus(
      await ao(
        'GET',
        `/admin/attendance/sections/${sessionSection}?date=${lastWorkingDay}&period=3`
      ),
      400,
      'PERIOD_NOT_ALLOWED'
    )
)
await TA(
  'API-SES-04',
  'Attendance sessions',
  'GET',
  '/mobile/parent/children/{id}/attendance/today',
  'Parent today has both sessions',
  '200 with status, morning and afternoon',
  async () => {
    const kids = (await parent('GET', '/mobile/parent/children')).body.data
    const kid = (kids.items ?? kids)[0]
    const result = await parent('GET', `/mobile/parent/children/${kid.id}/attendance/today`)
    expectStatus(result, 200)
    for (const key of ['status', 'morning', 'afternoon'])
      if (!(key in result.body.data)) throw new Error(`${key} missing`)
    return `200, day ${result.body.data.status}, morning ${result.body.data.morning}, afternoon ${result.body.data.afternoon}`
  }
)
await TA(
  'API-SES-05',
  'Attendance reports',
  'GET',
  '/admin/attendance/classes/{id}/report',
  'Class-wise monthly report',
  '200 with sections and average',
  async () => {
    const classes = (await ao('GET', '/admin/classes')).body.data
    const withSections = classes.find((item) => item.sections?.length)
    const result = await ao(
      'GET',
      `/admin/attendance/classes/${withSections.id}/report?month=${lastWorkingDay.slice(0, 7)}`
    )
    expectStatus(result, 200)
    if (!Array.isArray(result.body.data.sections)) throw new Error('sections missing')
    return `200, class ${result.body.data.class.name}: ${result.body.data.sections.length} sections, ${result.body.data.percent ?? '—'}%`
  }
)
await TA(
  'API-SES-06',
  'Attendance reports',
  'GET',
  '/admin/attendance/sections/{id}/report/xlsx',
  'Section report as Excel',
  '200 spreadsheet',
  async () => {
    const response = await fetch(
      `${API}/admin/attendance/sections/${sessionSection}/report/xlsx?month=${lastWorkingDay.slice(0, 7)}`,
      { headers: { authorization: `Bearer ${adminToken}` } }
    )
    const type = response.headers.get('content-type') ?? ''
    if (response.status !== 200 || !type.includes('spreadsheetml'))
      throw new Error(`Got ${response.status} ${type}`)
    return '200 xlsx'
  }
)
await TA(
  'API-SES-07',
  'Attendance reports',
  'GET',
  '/admin/attendance/classes/99999/report',
  'Unknown class',
  '404 CLASS_NOT_FOUND',
  async () =>
    expectStatus(
      await ao('GET', `/admin/attendance/classes/99999/report?month=${lastWorkingDay.slice(0, 7)}`),
      404,
      'CLASS_NOT_FOUND'
    )
)
await TA(
  'API-SES-08',
  'Attendance sessions',
  'PUT',
  '/mobile/teacher/sections/{id}/attendance',
  'Teacher saves an earlier day',
  '400 SESSION_CLOSED (only the office can)',
  async () => {
    if (!teacherSection) return 'Skipped: demo teacher has no section'
    const roster = await teacher(
      'GET',
      `/mobile/teacher/sections/${teacherSection}/attendance?date=${lastWorkingDay}&session=morning`
    )
    expectStatus(roster, 200)
    if (roster.body.data.open) throw new Error('An earlier day should not be open for a teacher')
    const items = roster.body.data.students.map((row) => ({
      student_id: row.student_id,
      status: row.status,
    }))
    return expectStatus(
      await teacher('PUT', `/mobile/teacher/sections/${teacherSection}/attendance`, {
        date: lastWorkingDay,
        session: 'morning',
        items,
      }),
      400,
      'SESSION_CLOSED'
    )
  }
)

const replyKid = ((await parent('GET', '/mobile/parent/children')).body.data.items ??
  (await parent('GET', '/mobile/parent/children')).body.data)[0]
const replyTeacher = (await parent('GET', `/mobile/parent/children/${replyKid.id}/teachers`)).body
  .data?.[0]
const replyAt = new Date(Date.now() + 3 * 86400e3)
replyAt.setUTCHours(9, 0, 0, 0)
const replyMeeting = replyTeacher
  ? (
      await parent('POST', `/mobile/parent/children/${replyKid.id}/meetings`, {
        teacher_user_id: replyTeacher.id,
        title: `RT reply ${RUN}`,
        scheduled_at: replyAt.toISOString(),
      })
    ).body.data
  : null
await TA(
  'API-MTR-01',
  'Meeting replies',
  'POST',
  '/mobile/parent/children/{id}/meetings',
  'Parent books a meeting',
  '201 with response pending',
  async () => {
    if (!replyMeeting) throw new Error('Could not book')
    if (replyMeeting.response !== 'pending') throw new Error(`response ${replyMeeting.response}`)
    return '201, pending'
  }
)
await TA(
  'API-MTR-02',
  'Meeting replies',
  'POST',
  '/mobile/parent/meetings/{id}/accept',
  'Parent replies to their own booking',
  '403 NOT_MEETING_INVITEE',
  async () =>
    expectStatus(
      await parent('POST', `/mobile/parent/meetings/${replyMeeting.id}/accept`, {}),
      403,
      'NOT_MEETING_INVITEE'
    )
)
await TA(
  'API-MTR-03',
  'Meeting replies',
  'POST',
  '/mobile/teacher/meetings/{id}/decline',
  'Teacher declines with a note',
  '200 declined, still scheduled',
  async () => {
    const result = await teacher('POST', `/mobile/teacher/meetings/${replyMeeting.id}/decline`, {
      note: 'Exam duty',
    })
    expectStatus(result, 200)
    if (result.body.data.response !== 'declined' || result.body.data.status !== 'scheduled')
      throw new Error(`${result.body.data.response} / ${result.body.data.status}`)
    return '200, declined and still scheduled'
  }
)
await TA(
  'API-MTR-04',
  'Meeting replies',
  'POST',
  '/mobile/teacher/meetings/{id}/accept',
  'Teacher changes to accept',
  '200 accepted',
  async () => {
    const result = await teacher('POST', `/mobile/teacher/meetings/${replyMeeting.id}/accept`, {})
    expectStatus(result, 200)
    if (result.body.data.response !== 'accepted') throw new Error(result.body.data.response)
    return '200, accepted'
  }
)
await TA(
  'API-MTR-05',
  'Meeting replies',
  'POST',
  '/mobile/teacher/meetings/{id}/accept',
  'Reply after the meeting is cancelled',
  '409 MEETING_REPLY_CLOSED',
  async () => {
    await parent('POST', `/mobile/parent/meetings/${replyMeeting.id}/cancel`, {
      reason: 'Regression clean up',
    })
    return expectStatus(
      await teacher('POST', `/mobile/teacher/meetings/${replyMeeting.id}/accept`, {}),
      409,
      'MEETING_REPLY_CLOSED'
    )
  }
)

const ringMeeting = rosterStudent
  ? (
      await teacher('POST', '/mobile/teacher/meetings', {
        student_id: rosterStudent.id,
        title: `RT ring ${RUN}`,
        scheduled_at: new Date(Date.now() + 2 * 60000).toISOString(),
        duration_minutes: 15,
      })
    ).body.data
  : null
await TA(
  'API-RING-01',
  'Meeting calls',
  'POST',
  '/mobile/teacher/meetings/{id}/join',
  'Join before the parent accepts',
  '409 MEETING_NOT_ACCEPTED and can_join false',
  async () => {
    if (!ringMeeting) return 'Skipped: teacher has no section'
    if (ringMeeting.can_join !== false) throw new Error('can_join should be false while pending')
    return expectStatus(
      await teacher('POST', `/mobile/teacher/meetings/${ringMeeting.id}/join`, {
        platform: 'android',
      }),
      409,
      'MEETING_NOT_ACCEPTED'
    )
  }
)
await TA(
  'API-RING-05',
  'Meeting calls',
  'POST',
  '/mobile/teacher/meetings',
  'Teacher books a meeting with themselves as the parent',
  '400 SAME_PERSON',
  async () => {
    if (!rosterStudent) return 'Skipped: teacher has no section'
    const me = (await teacher('GET', '/me')).body.data
    const when = new Date(Date.now() + 3 * 86400000).toISOString()
    return expectStatus(
      await teacher('POST', '/mobile/teacher/meetings', {
        student_id: rosterStudent.id,
        parent_user_id: me.id,
        title: 'Self',
        scheduled_at: when,
      }),
      400,
      'SAME_PERSON'
    )
  }
)
await TA(
  'API-RING-02',
  'Meeting calls',
  'POST',
  '/mobile/teacher/meetings/{id}/reject-call',
  'Reject a call that is not ringing',
  '200, nothing changes',
  async () => {
    if (!ringMeeting) return 'Skipped: teacher has no section'
    const result = await teacher('POST', `/mobile/teacher/meetings/${ringMeeting.id}/reject-call`)
    expectStatus(result, 200)
    if (result.body.data.status !== 'scheduled' || result.body.data.active_participants !== 0)
      throw new Error(JSON.stringify(result.body.data))
    return '200, scheduled, nobody in the call'
  }
)
await TA(
  'API-RING-03',
  'Meeting calls',
  'POST',
  '/mobile/parent/meetings/{id}/reject-call',
  'Reject a call on a meeting that does not exist',
  '404 MEETING_NOT_FOUND',
  async () =>
    expectStatus(
      await parent('POST', '/mobile/parent/meetings/999999/reject-call'),
      404,
      'MEETING_NOT_FOUND'
    )
)
await TA(
  'API-RING-04',
  'Meeting calls',
  'POST',
  '/mobile/teacher/meetings',
  'A cancelled meeting frees the slot for a new booking',
  '201 for the same time after cancel',
  async () => {
    if (!ringMeeting) return 'Skipped: teacher has no section'
    expectStatus(
      await teacher('POST', `/mobile/teacher/meetings/${ringMeeting.id}/cancel`, {
        reason: 'Regression',
      }),
      200
    )
    const again = await teacher('POST', '/mobile/teacher/meetings', {
      student_id: rosterStudent.id,
      title: `RT ring again ${RUN}`,
      scheduled_at: ringMeeting.scheduled_at,
      duration_minutes: 15,
    })
    expectStatus(again, 201)
    await teacher('POST', `/mobile/teacher/meetings/${again.body.data.id}/cancel`, {
      reason: 'Regression clean up',
    })
    return '201, slot free again'
  }
)

await TA(
  'API-REP-01',
  'Attendance reports',
  'GET',
  '/admin/attendance/sections/{id}/day',
  'Daily report of a section',
  '200 with students, summary and marked flags',
  async () => {
    if (!sessionSection) return 'Skipped: no section'
    const result = await ao(
      'GET',
      `/admin/attendance/sections/${sessionSection}/day?date=${lastWorkingDay}`
    )
    expectStatus(result, 200)
    const data = result.body.data
    if (!Array.isArray(data.students) || !data.summary || !('morning_marked' in data))
      throw new Error('Missing fields')
    return `200, ${data.students.length} students`
  }
)
await TA(
  'API-REP-02',
  'Attendance reports',
  'GET',
  '/admin/attendance/sections/{id}/day',
  'Daily report with a wrong date format',
  '400 on date',
  async () =>
    expectFields(
      await ao('GET', `/admin/attendance/sections/${sessionSection ?? 1}/day?date=10-11-2026`),
      ['date']
    )
)
await TA(
  'API-REP-03',
  'Attendance reports',
  'GET',
  '/mobile/parent/children/{id}/attendance/summary',
  'Parent sees the year and month-wise %',
  '200 with year and months',
  async () => {
    const result = await parent('GET', `/mobile/parent/children/${replyKid.id}/attendance/summary`)
    expectStatus(result, 200)
    if (!result.body.data.year || !Array.isArray(result.body.data.months))
      throw new Error('Missing year or months')
    return `200, ${result.body.data.months.length} months, year ${result.body.data.year.percent}%`
  }
)
await TA(
  'API-REP-04',
  'Attendance reports',
  'GET',
  '/admin/attendance/students/{id}/summary',
  'Admin sees the same year summary as the parent',
  '200, same year %',
  async () => {
    const mine = (await parent('GET', `/mobile/parent/children/${replyKid.id}/attendance/summary`))
      .body.data
    const result = await admin('GET', `/admin/attendance/students/${replyKid.id}/summary`)
    expectStatus(result, 200)
    if (result.body.data.year.percent !== mine.year.percent)
      throw new Error(`${result.body.data.year.percent} vs ${mine.year.percent}`)
    return '200, same %'
  }
)
await TA(
  'API-REP-05',
  'Attendance reports',
  'GET',
  '/mobile/teacher/sections/{id}/attendance/report',
  'A teacher who is not the class teacher opens the monthly report',
  '403 NOT_CLASS_TEACHER or 200 for own class',
  async () => {
    if (!sessionSection) return 'Skipped: no section'
    const result = await teacher(
      'GET',
      `/mobile/teacher/sections/${sessionSection}/attendance/report?month=${lastWorkingDay.slice(0, 7)}`
    )
    if (result.status === 200) return '200, own class'
    return expectStatus(result, 403, 'NOT_CLASS_TEACHER')
  }
)
await TA(
  'API-GRC-01',
  'Attendance grace',
  'GET',
  '/admin/attendance/board',
  'Board shows the window with grace and the missed count',
  '200 with closes_at, grace_minutes, sections_missed',
  async () => {
    const result = await ao('GET', `/admin/attendance/board?date=${lastWorkingDay}&session=morning`)
    expectStatus(result, 200)
    const data = result.body.data
    if (
      typeof data.grace_minutes !== 'number' ||
      !('sections_missed' in data) ||
      !('closes_at' in data)
    )
      throw new Error('Missing grace fields')
    if (!data.sections.every((row) => 'missed' in row))
      throw new Error('missed missing on a section')
    return `200, closes ${data.closes_at}, ${data.sections_missed} missed`
  }
)
await TA(
  'API-GRC-02',
  'Attendance grace',
  'GET',
  '/admin/attendance/board?status=missed',
  'Missed filter returns only missed sections',
  '200, every section missed',
  async () => {
    const result = await ao(
      'GET',
      `/admin/attendance/board?date=${lastWorkingDay}&session=morning&status=missed`
    )
    expectStatus(result, 200)
    if (!result.body.data.sections.every((row) => row.missed))
      throw new Error('A section is not missed')
    return `200, ${result.body.data.sections.length} missed`
  }
)
await TA(
  'API-GRC-03',
  'Attendance grace',
  'GET',
  '/admin/attendance/missed',
  'Monthly missed report per class teacher',
  '200 with total_missed and teachers',
  async () => {
    const result = await ao('GET', `/admin/attendance/missed?month=${lastWorkingDay.slice(0, 7)}`)
    expectStatus(result, 200)
    if (!Array.isArray(result.body.data.teachers)) throw new Error('No teachers list')
    return `200, ${result.body.data.total_missed} missed`
  }
)
await TA(
  'API-GRC-04',
  'Attendance grace',
  'PATCH',
  '/admin/school',
  'Grace over 30 minutes',
  '400 on attendance_grace_minutes',
  async () =>
    expectFields(await admin('PATCH', '/admin/school', { attendance_grace_minutes: 45 }), [
      'attendance_grace_minutes',
    ])
)
await TA(
  'API-GRC-05',
  'Attendance grace',
  'GET',
  '/mobile/teacher/sections/{id}/attendance/current',
  'Teacher opens the current session without a date',
  '200 with today, session and closes_at',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    const result = await teacher(
      'GET',
      `/mobile/teacher/sections/${teacherSection}/attendance/current`
    )
    expectStatus(result, 200)
    const data = result.body.data
    if (!['morning', 'afternoon'].includes(data.session) || typeof data.grace_minutes !== 'number')
      throw new Error('Bad session or grace')
    return `200, ${data.session} ${data.open ? 'open' : 'closed'} until ${data.closes_at}`
  }
)
await TA(
  'API-GRC-06',
  'Attendance grace',
  'PUT',
  '/mobile/teacher/sections/{id}/attendance/current',
  'Teacher sends a date to the current call',
  '400, date is not allowed',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    return expectFields(
      await teacher('PUT', `/mobile/teacher/sections/${teacherSection}/attendance/current`, {
        date: lastWorkingDay,
        items: [{ student_id: 1, status: 'P' }],
      }),
      ['date']
    )
  }
)
await TA(
  'API-GRC-07',
  'Attendance grace',
  'PATCH',
  '/mobile/teacher/sections/{id}/attendance/current',
  'Teacher marks outside the period plus grace',
  '400 SESSION_CLOSED or SESSION_NOT_OPEN, or 200 inside the window',
  async () => {
    if (!teacherSection) return 'Skipped: teacher has no section'
    const roster = (
      await teacher('GET', `/mobile/teacher/sections/${teacherSection}/attendance/current`)
    ).body.data
    if (!roster?.students?.length || !roster.working_day)
      return 'Skipped: no students or not a school day'
    if (roster.open) return 'Skipped: the window is open now; not marking real attendance'
    const result = await teacher(
      'PATCH',
      `/mobile/teacher/sections/${teacherSection}/attendance/current`,
      { items: [{ student_id: roster.students[0].student_id, status: 'L' }] }
    )
    expectStatus(result, 400)
    if (!['SESSION_CLOSED', 'SESSION_NOT_OPEN'].includes(result.body.error))
      throw new Error(result.body.error)
    return `400 ${result.body.error}`
  }
)

await TA(
  'API-GRC-08',
  'Attendance restriction',
  'GET',
  '/mobile/teacher/sections/{id}/attendance/current',
  'Teacher opens current attendance for a section they do not teach in active period',
  '403 NOT_PERIOD_TEACHER',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/sections/9/attendance/current')
    expectStatus(result, 403)
    if (result.body.error !== 'NOT_PERIOD_TEACHER')
      throw new Error(`Expected NOT_PERIOD_TEACHER but got ${result.body.error}`)
    return `403 ${result.body.error}`
  }
)

await TA(
  'API-PPR-01',
  'Parent profile',
  'GET',
  '/mobile/parent/profile',
  'Parent opens their profile',
  '200 with name, mobile and children',
  async () => {
    const result = await parent('GET', '/mobile/parent/profile')
    expectStatus(result, 200)
    const data = result.body.data
    if (!data.mobile || !Array.isArray(data.children) || !Array.isArray(data.co_guardians))
      throw new Error('Missing profile fields')
    return `200, ${data.children.length} children`
  }
)
await TA(
  'API-PPR-02',
  'Parent profile',
  'PATCH',
  '/mobile/parent/profile',
  'Parent changes city and clears it again',
  '200 with the new city, then null',
  async () => {
    const before = (await parent('GET', '/mobile/parent/profile')).body.data
    const changed = await parent('PATCH', '/mobile/parent/profile', { city: `Regression ${RUN}` })
    expectStatus(changed, 200)
    if (changed.body.data.city !== `Regression ${RUN}`) throw new Error(changed.body.data.city)
    expectStatus(
      await parent('PATCH', '/mobile/parent/profile', { city: before.city ?? null }),
      200
    )
    return '200, saved and restored'
  }
)
await TA(
  'API-PPR-03',
  'Parent profile',
  'PATCH',
  '/mobile/parent/profile',
  'Parent tries to change name and mobile',
  '400 on name and mobile',
  async () =>
    expectFields(
      await parent('PATCH', '/mobile/parent/profile', {
        name: 'Someone else',
        mobile: '9000000001',
      }),
      ['name', 'mobile']
    )
)
await TA(
  'API-PPR-04',
  'Parent profile',
  'PATCH',
  '/mobile/parent/profile',
  'Wrong pincode and alternate mobile',
  '400 on pincode and alt_mobile',
  async () =>
    expectFields(
      await parent('PATCH', '/mobile/parent/profile', { pincode: '12', alt_mobile: '123' }),
      ['pincode', 'alt_mobile']
    )
)
await TA(
  'API-PPR-05',
  'Parent profile',
  'GET',
  '/mobile/parent/profile',
  'Teacher opens the parent profile',
  '403',
  async () => expectStatus(await teacher('GET', '/mobile/parent/profile'), 403)
)

await TA(
  'API-PTT-01',
  'Parent: timetable and teachers',
  'GET',
  '/mobile/parent/children/{id}/timetable',
  'Child timetable for today',
  '200 with day and periods (bell order)',
  async () => {
    const result = await parent('GET', `/mobile/parent/children/${replyKid.id}/timetable`)
    expectStatus(result, 200)
    const data = result.body.data
    if (!data.day || !Array.isArray(data.periods)) throw new Error('Missing day or periods')
    if (
      data.working_day &&
      !data.periods.some((row) => row.is_break !== undefined && 'teacher' in row)
    )
      throw new Error('Period shape')
    return `200, ${data.day}, ${data.periods.length} rows`
  }
)
await TA(
  'API-PTT-02',
  'Parent: timetable and teachers',
  'GET',
  '/mobile/parent/children/{id}/timetable?date=',
  'Timetable with a wrong date format',
  '400 on date',
  async () =>
    expectFields(
      await parent('GET', `/mobile/parent/children/${replyKid.id}/timetable?date=11-11-2026`),
      ['date']
    )
)
await TA(
  'API-PTT-03',
  'Parent: timetable and teachers',
  'GET',
  '/mobile/parent/children/{id}/teachers',
  'Teachers with designation and experience',
  '200, class teacher first, experience_years present',
  async () => {
    const result = await parent('GET', `/mobile/parent/children/${replyKid.id}/teachers`)
    expectStatus(result, 200)
    const first = result.body.data[0]
    if (first && (typeof first.experience_years !== 'number' || !('designation' in first)))
      throw new Error('Missing teacher details')
    return `200, ${result.body.data.length} teachers`
  }
)
await TA(
  'API-PTT-04',
  'Parent: timetable and teachers',
  'GET',
  '/mobile/parent/children/{id}/teachers/{teacherId}',
  'Teacher profile with qualifications and classes',
  '200 with classes; no phone or email',
  async () => {
    const list = (await parent('GET', `/mobile/parent/children/${replyKid.id}/teachers`)).body.data
    if (!list.length) return 'Skipped: no teachers for this child'
    const result = await parent(
      'GET',
      `/mobile/parent/children/${replyKid.id}/teachers/${list[0].id}`
    )
    expectStatus(result, 200)
    const data = result.body.data
    if (!Array.isArray(data.classes) || !Array.isArray(data.qualifications))
      throw new Error('Missing classes or qualifications')
    if ('mobile' in data || 'email' in data) throw new Error('Private contact details shown')
    return `200, ${data.classes.length} classes`
  }
)
await TA(
  'API-PTT-06',
  'Parent: timetable and teachers',
  'GET',
  '/mobile/parent/children/{id}/teachers-overview',
  'Class teacher on its own, then subject teachers',
  '200; class teacher not repeated in subject teachers',
  async () => {
    const result = await parent('GET', `/mobile/parent/children/${replyKid.id}/teachers-overview`)
    expectStatus(result, 200)
    const { class_teacher: classTeacher, subject_teachers: subjects } = result.body.data
    if (!Array.isArray(subjects)) throw new Error('subject_teachers missing')
    if (classTeacher && subjects.some((row) => row.id === classTeacher.id))
      throw new Error('Class teacher repeated')
    if (subjects.some((row) => row.is_class_teacher))
      throw new Error('Class teacher in subject list')
    return `200, class teacher ${classTeacher?.name ?? 'none'}, ${subjects.length} subject teachers`
  }
)
await TA(
  'API-PTT-05',
  'Parent: timetable and teachers',
  'GET',
  '/mobile/parent/children/{id}/teachers/{teacherId}',
  'Profile of a teacher who does not teach the child',
  '404 TEACHER_NOT_FOUND',
  async () =>
    expectStatus(
      await parent('GET', `/mobile/parent/children/${replyKid.id}/teachers/999999`),
      404,
      'TEACHER_NOT_FOUND'
    )
)

await TA(
  'API-CHY-01',
  'Chat by academic year',
  'GET',
  '/admin/chat/threads?academic_year_id=',
  'Office opens an earlier academic year',
  '200; every conversation of that year is archived',
  async () => {
    const years = (await admin('GET', '/admin/academic-years')).body.data ?? []
    const current = years.find((row) => row.is_current)
    const past = years.find(
      (row) => current && !row.is_current && row.end_date < current.start_date
    )
    if (!past) return 'Skipped: no earlier academic year'
    const result = await admin('GET', `/admin/chat/threads?academic_year_id=${past.id}`)
    expectStatus(result, 200)
    if (result.body.data.items.some((row) => !row.archived))
      throw new Error('A past-year conversation is not archived')
    return `200, ${result.body.data.total} archived conversations in ${past.name}`
  }
)
await TA(
  'API-CHY-02',
  'Chat by academic year',
  'GET',
  '/admin/chat/threads',
  'Current year list has no archived conversations',
  '200; archived false for all',
  async () => {
    const result = await admin('GET', '/admin/chat/threads')
    expectStatus(result, 200)
    if (result.body.data.items.some((row) => row.archived))
      throw new Error('Archived conversation in the current year')
    return `200, ${result.body.data.items.length} current conversations`
  }
)
await TA(
  'API-CHY-03',
  'Chat by academic year',
  'GET',
  '/admin/chat/threads?academic_year_id=abc',
  'Wrong academic year value',
  '400 on academic_year_id',
  async () =>
    expectFields(await admin('GET', '/admin/chat/threads?academic_year_id=abc'), [
      'academic_year_id',
    ])
)

const yearsForSwitch = (await admin('GET', '/admin/academic-years')).body.data ?? []
const currentYear = yearsForSwitch.find((row) => row.is_current)
const pastYear = yearsForSwitch.find(
  (row) => currentYear && !row.is_current && row.end_date < currentYear.start_date
)
const inYear = (id) => client(adminToken, { 'x-academic-year-id': String(id) })
await TA(
  'API-AYS-01',
  'Academic year switcher',
  'GET',
  '/admin/students (X-Academic-Year-Id)',
  'Office views students of an earlier year',
  '200; only students enrolled that year, with their class that year',
  async () => {
    if (!pastYear) return 'Skipped: no earlier academic year'
    const past = await inYear(pastYear.id)('GET', '/admin/students?limit=100')
    expectStatus(past, 200)
    const now = await admin('GET', '/admin/students?limit=1')
    if (past.body.data.total > now.body.data.total)
      throw new Error('Earlier year shows more students than this year')
    return `200, ${past.body.data.total} students in ${pastYear.name} (this year ${now.body.data.total})`
  }
)
await TA(
  'API-AYS-02',
  'Academic year switcher',
  'GET',
  '/admin/attendance/board (X-Academic-Year-Id)',
  'Attendance board of an earlier year',
  '200',
  async () => {
    if (!pastYear) return 'Skipped: no earlier academic year'
    const result = await inYear(pastYear.id)(
      'GET',
      `/admin/attendance/board?date=${pastYear.end_date.slice(0, 10)}`
    )
    expectStatus(result, 200)
    return `200 for ${pastYear.name}`
  }
)
await TA(
  'API-AYS-03',
  'Academic year switcher',
  'POST',
  '/admin/academic-years (X-Academic-Year-Id)',
  'Change something while viewing an earlier year',
  '403 YEAR_READ_ONLY',
  async () => {
    if (!pastYear) return 'Skipped: no earlier academic year'
    return expectStatus(
      await inYear(pastYear.id)('POST', '/admin/academic-years', {}),
      403,
      'YEAR_READ_ONLY'
    )
  }
)
await TA(
  'API-AYS-04',
  'Academic year switcher',
  'GET',
  '/admin/students (X-Academic-Year-Id: 999999)',
  'Year that is not this school',
  '404 ACADEMIC_YEAR_NOT_FOUND',
  async () =>
    expectStatus(await inYear(999999)('GET', '/admin/students'), 404, 'ACADEMIC_YEAR_NOT_FOUND')
)
await TA(
  'API-AYS-05',
  'Academic year switcher',
  'GET',
  '/admin/students (X-Academic-Year-Id: abc)',
  'Wrong header value',
  '400 INVALID_ACADEMIC_YEAR',
  async () =>
    expectStatus(await inYear('abc')('GET', '/admin/students'), 400, 'INVALID_ACADEMIC_YEAR')
)
await TA(
  'API-AYS-06',
  'Academic year switcher',
  'GET',
  '/mobile/parent/children (X-Academic-Year-Id)',
  'Apps ignore the header and stay on this year',
  '200',
  async () => {
    const result = await client(parentToken, { 'x-academic-year-id': 'abc' })(
      'GET',
      '/mobile/parent/children'
    )
    return expectStatus(result, 200)
  }
)

await TA(
  'API-YP-01',
  'Year performance',
  'GET',
  '/admin/dashboard/year-performance',
  'Office compares academic years on the dashboard',
  '200; newest year first with students, attendance, studies, activities and fees',
  async () => {
    const result = await admin('GET', '/admin/dashboard/year-performance')
    expectStatus(result, 200)
    const rows = result.body.data.years
    if (!rows.length) throw new Error('No academic years')
    if (!rows[0].academic_year.is_current) throw new Error('Current year is not first')
    for (const key of ['students', 'attendance', 'studies', 'activities', 'fees'])
      if (!rows[0][key]) throw new Error(`${key} missing for the school admin`)
    if (!Array.isArray(rows[0].fees.heads)) throw new Error('Fee heads missing')
    const heads = rows[0].fees.heads
      .map((head) => `${head.name} ${head.collection_percent ?? '-'}%`)
      .join(', ')
    return `200, ${rows.map((row) => `${row.academic_year.name}: pass ${row.studies.pass_percent ?? '-'}%, attendance ${row.attendance.percent ?? '-'}%, ${row.activities.total} achievements`).join('; ')}; heads: ${heads}`
  }
)
await TA(
  'API-YP-02',
  'Year performance',
  'GET',
  '/admin/dashboard/year-performance',
  'Earlier year chosen in the switcher',
  '200; still lists every year so they can be compared',
  async () => {
    const result = await (pastYear ? inYear(pastYear.id) : admin)(
      'GET',
      '/admin/dashboard/year-performance'
    )
    expectStatus(result, 200)
    return `200, ${result.body.data.years.length} years`
  }
)
await TA(
  'API-YP-03',
  'Year performance',
  'GET',
  '/admin/dashboard/year-performance',
  'Without a token',
  '401',
  async () => expectStatus(await guest('GET', '/admin/dashboard/year-performance'), 401)
)

const loadMatrix = (await admin('GET', '/admin/teacher-assignments')).body.data
const loadCells = (loadMatrix?.rows ?? []).flatMap((row) =>
  row.cells.map((cell) => ({ ...cell, section_id: row.section_id }))
)
const loadTeacher = [...(loadMatrix?.teachers ?? [])]
  .filter((teacher) => teacher.load_periods > 0)
  .sort(
    (a, b) => a.max_periods_per_week - a.load_periods - (b.max_periods_per_week - b.load_periods)
  )[0]
await TA(
  'API-TLM-01',
  'Teacher weekly limit',
  'PUT',
  '/admin/teacher-assignments',
  'Give a teacher more periods a week than their limit',
  '409 TEACHER_OVER_LIMIT; nothing saved',
  async () => {
    const room = loadTeacher ? loadTeacher.max_periods_per_week - loadTeacher.load_periods : 99
    const cell = loadCells.find((item) => item.teacher_user_id !== loadTeacher?.user_id)
    if (!loadTeacher || !cell || room + 1 > 15) return 'Skipped: no teacher close to the limit'
    const result = await admin('PUT', '/admin/teacher-assignments', {
      items: [
        {
          section_id: cell.section_id,
          subject_id: cell.subject_id,
          teacher_user_id: loadTeacher.user_id,
          periods_per_week: Math.max(1, room + 1),
        },
      ],
    })
    const message = expectStatus(result, 409, 'TEACHER_OVER_LIMIT')
    const after = (await admin('GET', '/admin/teacher-assignments')).body.data
    if (
      after.teachers.find((teacher) => teacher.user_id === loadTeacher.user_id).load_periods !==
      loadTeacher.load_periods
    )
      throw new Error('Load changed although the save was refused')
    return message
  }
)
await TA(
  'API-TLM-02',
  'Teacher weekly limit',
  'PATCH',
  '/admin/staff/{id}',
  'Lower a teacher weekly limit below the periods they already have',
  '409 LIMIT_BELOW_LOAD',
  async () => {
    if (!loadTeacher || loadTeacher.load_periods < 2) return 'Skipped: no teacher with periods'
    const staff = (
      await admin('GET', `/admin/staff?search=${encodeURIComponent(loadTeacher.name)}&limit=20`)
    ).body.data.items.find((item) => item.user_id === loadTeacher.user_id)
    if (!staff) return 'Skipped: teacher not in the staff list'
    return expectStatus(
      await admin('PATCH', `/admin/staff/${staff.id}`, { max_periods_per_week: 1 }),
      409,
      'LIMIT_BELOW_LOAD'
    )
  }
)

const perf = (await admin('GET', '/admin/performance/classes')).body.data
const perfSection = perf?.sections.find((row) => row.below_average > 0)
await TA(
  'API-CP-01',
  'Class performance',
  'GET',
  '/admin/performance/classes',
  'Class-wise report for every section',
  '200; average, pass, fail and attendance % per section with school totals',
  async () => {
    const result = await admin('GET', '/admin/performance/classes')
    expectStatus(result, 200)
    const { totals, sections } = result.body.data
    if (!sections.length) throw new Error('No sections')
    for (const row of sections) {
      if (row.pass_percent !== null && Math.abs(row.pass_percent + row.fail_percent - 100) > 0.2)
        throw new Error(`${row.name}: pass + fail is not 100`)
    }
    return `200, ${sections.length} sections; school average ${totals.average_percent}%, pass ${totals.pass_percent}%, fail ${totals.fail_percent}%, attendance ${totals.attendance_percent}%`
  }
)
await TA(
  'API-CP-02',
  'Class performance',
  'GET',
  '/admin/performance/sections/{id}/below-average',
  'Students below the class average',
  '200; each student below the line, lowest first, with weak subjects',
  async () => {
    if (!perfSection) return 'Skipped: no section with students below average'
    const result = await admin(
      'GET',
      `/admin/performance/sections/${perfSection.section_id}/below-average`
    )
    expectStatus(result, 200)
    const { line, students } = result.body.data
    if (students.some((row) => row.percent >= line))
      throw new Error('A student is not below the line')
    if (students.some((row, index) => index && row.percent < students[index - 1].percent))
      throw new Error('Not lowest first')
    if (students.length !== perfSection.below_average)
      throw new Error(`Report says ${perfSection.below_average}, list has ${students.length}`)
    return `200, ${students.length} students below ${line}% in ${perfSection.name}`
  }
)
await TA(
  'API-CP-03',
  'Class performance',
  'GET',
  '/admin/performance/sections/{id}/below-average?below=40',
  'Own line instead of the class average',
  '200; line is 40',
  async () => {
    if (!perfSection) return 'Skipped: no section'
    const result = await admin(
      'GET',
      `/admin/performance/sections/${perfSection.section_id}/below-average?below=40`
    )
    expectStatus(result, 200)
    if (result.body.data.line !== 40) throw new Error(`line is ${result.body.data.line}`)
    return `200, ${result.body.data.students.length} students below 40%`
  }
)

const specialPeriods = ((await admin('GET', '/admin/timetable/periods')).body.data ?? []).filter(
  (row) => !row.is_break && row.period_no
)
const specialMatrix = (await admin('GET', '/admin/teacher-assignments')).body.data
const specialRoster = perfSection
  ? (await admin('GET', `/admin/performance/sections/${perfSection.section_id}/below-average`)).body
      .data.students
  : []
let specialId = null
let specialSlot = null
await TA(
  'API-SC-01',
  'Special classes',
  'POST',
  '/admin/special-classes',
  'Student from another section',
  '400 STUDENT_NOT_IN_SECTION; nothing saved',
  async () => {
    if (!perfSection || !specialPeriods.length) return 'Skipped: no section or bell schedule'
    const result = await admin('POST', '/admin/special-classes', {
      section_id: perfSection.section_id,
      teacher_user_id: specialMatrix.teachers[0].user_id,
      day_of_week: 6,
      period_no: specialPeriods[specialPeriods.length - 1].period_no,
      title: 'Regression check',
      student_ids: [999999],
    })
    return expectStatus(result, 400, 'STUDENT_NOT_IN_SECTION')
  }
)
await TA(
  'API-SC-02',
  'Special classes',
  'POST',
  '/admin/special-classes',
  'Special class for below-average students in a free period',
  '200; day, period, time, teacher and students back',
  async () => {
    if (!perfSection || !specialRoster.length) return 'Skipped: no below-average students'
    const tried = []
    for (const period of [...specialPeriods].reverse()) {
      for (const teacherRow of specialMatrix.teachers.filter(
        (row) => row.load_periods < row.max_periods_per_week
      )) {
        const body = {
          section_id: perfSection.section_id,
          teacher_user_id: teacherRow.user_id,
          day_of_week: 6,
          period_no: period.period_no,
          title: 'Regression support class',
          notes: 'Created by the regression run and removed after',
          student_ids: specialRoster.slice(0, 2).map((row) => row.student_id),
        }
        const result = await admin('POST', '/admin/special-classes', body)
        if (result.status === 200 || result.status === 201) {
          specialId = result.body.data.id
          specialSlot = body
          if (result.body.data.students.length !== body.student_ids.length)
            throw new Error('Students not saved')
          return `${result.status}, ${result.body.data.title} on ${result.body.data.day} period ${result.body.data.period_no} with ${result.body.data.teacher.name}`
        }
        tried.push(result.body.error)
        if (tried.length > 12) break
      }
      if (tried.length > 12) break
    }
    throw new Error(`Could not place it: ${[...new Set(tried)].join(', ')}`)
  }
)
await TA(
  'API-SC-03',
  'Special classes',
  'POST',
  '/admin/special-classes',
  'Second special class in the same section and period',
  '409 SPECIAL_CLASS_CLASH',
  async () => {
    if (!specialSlot) return 'Skipped: no special class created'
    const other = specialMatrix.teachers.find((row) => row.user_id !== specialSlot.teacher_user_id)
    return expectStatus(
      await admin('POST', '/admin/special-classes', {
        ...specialSlot,
        teacher_user_id: other.user_id,
      }),
      409,
      'SPECIAL_CLASS_CLASH'
    )
  }
)
await TA(
  'API-SC-04',
  'Special classes',
  'PATCH',
  '/admin/special-classes/{id}',
  'Keep only one student',
  '200; one student left',
  async () => {
    if (!specialId) return 'Skipped: no special class created'
    const result = await admin('PATCH', `/admin/special-classes/${specialId}`, {
      student_ids: specialSlot.student_ids.slice(0, 1),
    })
    expectStatus(result, 200)
    if (result.body.data.students.length !== 1) throw new Error('Students not updated')
    return '200, 1 student'
  }
)
await TA(
  'API-SC-05',
  'Special classes',
  'GET',
  '/admin/performance/sections/{id}/below-average',
  'Below-average list shows the special class',
  '200; the student is marked as attending',
  async () => {
    if (!specialId) return 'Skipped: no special class created'
    const result = await admin(
      'GET',
      `/admin/performance/sections/${specialSlot.section_id}/below-average`
    )
    const row = result.body.data.students.find(
      (item) => item.student_id === specialSlot.student_ids[0]
    )
    if (!row?.special_classes.some((item) => item.id === specialId))
      throw new Error('Special class not shown')
    return '200, shown on the student'
  }
)
await TA(
  'API-SC-06',
  'Special classes',
  'DELETE',
  '/admin/special-classes/{id}',
  'Stop the special class',
  '200; gone from the list',
  async () => {
    if (!specialId) return 'Skipped: no special class created'
    expectStatus(await admin('DELETE', `/admin/special-classes/${specialId}`), 200)
    const left = (await admin('GET', `/admin/special-classes?section_id=${specialSlot.section_id}`))
      .body.data
    if (left.some((row) => row.id === specialId)) throw new Error('Still listed')
    return '200, removed'
  }
)
await TA(
  'API-SC-07',
  'Special classes',
  'GET',
  '/mobile/teacher/special-classes',
  'Staff app list of my special classes',
  '200 list',
  async () => {
    const result = await teacher('GET', '/mobile/teacher/special-classes')
    expectStatus(result, 200)
    return `200, ${result.body.data.length} special classes`
  }
)

const todayIso = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)
const extraBell = specialPeriods.length ? specialPeriods[specialPeriods.length - 1] : null
const extraIds = []
const extraBody = (patch) => ({
  timing: 'extra_time',
  kind: 'extra',
  section_id: perfSection?.section_id,
  teacher_user_id: specialMatrix.teachers[0]?.user_id,
  days: [1, 3],
  start_time: '20:00',
  end_time: '20:45',
  start_date: '2027-01-04',
  end_date: '2027-01-29',
  title: 'Regression extra class',
  student_ids: specialRoster.slice(0, 2).map((row) => row.student_id),
  ...patch,
})
await TA(
  'API-EX-01',
  'Extra classes',
  'POST',
  '/admin/special-classes',
  'Extra class after school on Mon and Wed for chosen students',
  '201; when reads every Mon, Wed with the time and dates',
  async () => {
    if (!perfSection || !specialRoster.length) return 'Skipped: no below-average students'
    const result = await admin('POST', '/admin/special-classes', extraBody({}))
    expectStatus(result, 201)
    extraIds.push(result.body.data.id)
    if (!result.body.data.when.startsWith('every Mon, Wed')) throw new Error(result.body.data.when)
    return `201, ${result.body.data.when}`
  }
)
await TA(
  'API-EX-02',
  'Extra classes',
  'POST',
  '/admin/special-classes',
  'Extra class during a teaching period',
  '409 DURING_CLASS_TIME',
  async () => {
    if (!extraBell) return 'Skipped: no bell schedule'
    return expectStatus(
      await admin(
        'POST',
        '/admin/special-classes',
        extraBody({
          start_time: extraBell.start_time,
          end_time: extraBell.end_time,
          teacher_user_id: specialMatrix.teachers[1].user_id,
        })
      ),
      409,
      'DURING_CLASS_TIME'
    )
  }
)
await TA(
  'API-EX-03',
  'Extra classes',
  'POST',
  '/admin/special-classes',
  'Same teacher at an overlapping time',
  '409 TEACHER_CLASH',
  async () => {
    if (!extraIds.length) return 'Skipped: no extra class'
    return expectStatus(
      await admin(
        'POST',
        '/admin/special-classes',
        extraBody({
          start_time: '20:30',
          end_time: '21:00',
          days: [3],
          student_ids: specialRoster.slice(2, 3).map((row) => row.student_id),
        })
      ),
      409,
      'TEACHER_CLASH'
    )
  }
)
await TA(
  'API-EX-04',
  'Extra classes',
  'POST',
  '/admin/special-classes',
  'Same student at an overlapping time with another teacher',
  '409 STUDENT_CLASH',
  async () => {
    if (!extraIds.length) return 'Skipped: no extra class'
    return expectStatus(
      await admin(
        'POST',
        '/admin/special-classes',
        extraBody({
          teacher_user_id: specialMatrix.teachers[1].user_id,
          start_time: '20:30',
          end_time: '21:15',
        })
      ),
      409,
      'STUDENT_CLASH'
    )
  }
)
await TA(
  'API-EX-05',
  'Extra classes',
  'POST',
  '/admin/special-classes',
  'Whole-class special class on a Sunday, full day',
  '201; every student of the section is in it',
  async () => {
    if (!perfSection) return 'Skipped: no section'
    const result = await admin(
      'POST',
      '/admin/special-classes',
      extraBody({
        kind: 'special',
        days: [],
        start_date: '2027-01-10',
        end_date: '2027-01-10',
        start_time: '09:00',
        end_time: '16:00',
        day_part: 'full',
        teacher_user_id: specialMatrix.teachers[2].user_id,
        title: 'Regression revision day',
        student_ids: undefined,
      })
    )
    expectStatus(result, 201)
    extraIds.push(result.body.data.id)
    if (result.body.data.students.length !== perfSection.students)
      throw new Error(`${result.body.data.students.length} of ${perfSection.students} students`)
    return `201, ${result.body.data.students.length} students, ${result.body.data.when}`
  }
)
await TA(
  'API-EX-06',
  'Extra classes',
  'PUT',
  '/admin/special-classes/settings',
  'Whole-class special class for a class that is not turned on',
  '400 CLASS_NOT_ALLOWED',
  async () => {
    if (!perfSection) return 'Skipped: no section'
    const other = perf.sections.find((row) => row.class_id !== perfSection.class_id)
    try {
      expectStatus(
        await admin('PUT', '/admin/special-classes/settings', { class_ids: [other.class_id] }),
        200
      )
      return expectStatus(
        await admin(
          'POST',
          '/admin/special-classes',
          extraBody({
            kind: 'special',
            start_date: '2027-02-01',
            end_date: '2027-02-26',
            title: 'Not allowed',
            student_ids: undefined,
          })
        ),
        400,
        'CLASS_NOT_ALLOWED'
      )
    } finally {
      await admin('PUT', '/admin/special-classes/settings', { class_ids: null })
    }
  }
)
await TA(
  'API-EX-07',
  'Extra classes',
  'PUT',
  '/admin/special-classes/{id}/attendance',
  'Take attendance of an extra class held today',
  '200; the absent student stays absent, the rest present',
  async () => {
    if (!perfSection || !specialRoster.length) return 'Skipped: no students'
    const created = await admin(
      'POST',
      '/admin/special-classes',
      extraBody({
        days: [],
        start_date: todayIso,
        end_date: todayIso,
        start_time: '21:00',
        end_time: '21:30',
        teacher_user_id: specialMatrix.teachers[3].user_id,
        title: 'Regression attendance check',
      })
    )
    expectStatus(created, 201)
    extraIds.push(created.body.data.id)
    const absent = specialRoster[0].student_id
    const result = await admin('PUT', `/admin/special-classes/${created.body.data.id}/attendance`, {
      date: todayIso,
      items: [{ student_id: absent, status: 'absent' }],
    })
    expectStatus(result, 200)
    const rows = result.body.data.students
    if (rows.find((row) => row.student_id === absent).status !== 'absent')
      throw new Error('Absent not saved')
    if (rows.some((row) => row.student_id !== absent && row.status !== 'present'))
      throw new Error('Others not present')
    return `200, ${rows.length} students, 1 absent`
  }
)
await TA(
  'API-EX-08',
  'Extra classes',
  'PUT',
  '/mobile/teacher/special-classes/{id}/attendance',
  'Another teacher tries to take the attendance',
  '403 NOT_YOUR_SPECIAL_CLASS',
  async () => {
    const mine = (await teacher('GET', '/mobile/teacher/special-classes')).body.data.map(
      (row) => row.id
    )
    const other = extraIds.find((id) => !mine.includes(id))
    if (!other) return 'Skipped: teacher takes every class'
    return expectStatus(
      await teacher('PUT', `/mobile/teacher/special-classes/${other}/attendance`, {
        date: todayIso,
        items: [{ student_id: specialRoster[0].student_id, status: 'present' }],
      }),
      403,
      'NOT_YOUR_SPECIAL_CLASS'
    )
  }
)
await TA(
  'API-EX-09',
  'Extra classes',
  'GET',
  '/admin/special-classes?teacher_user_id=',
  'Teacher profile list of special and extra classes',
  '200; only that teacher',
  async () => {
    const teacherId = specialMatrix.teachers[0].user_id
    const result = await admin('GET', `/admin/special-classes?teacher_user_id=${teacherId}`)
    expectStatus(result, 200)
    if (result.body.data.some((row) => row.teacher.id !== teacherId))
      throw new Error('Other teachers listed')
    return `200, ${result.body.data.length} classes`
  }
)
await TA(
  'API-EX-11',
  'Extra classes',
  'POST',
  '/admin/special-classes',
  'Same special class for two sections with one teacher at the same time (combined class)',
  '201 for both sections',
  async () => {
    const pair = perf.sections.filter((row) => row.students > 0).slice(0, 2)
    if (pair.length < 2) return 'Skipped: need two sections'
    const body = (sectionId) =>
      extraBody({
        kind: 'special',
        section_id: sectionId,
        teacher_user_id: specialMatrix.teachers[4].user_id,
        days: [2],
        start_time: '19:00',
        end_time: '19:45',
        title: 'Regression combined class',
        student_ids: undefined,
      })
    for (const row of pair) {
      const result = await admin('POST', '/admin/special-classes', body(row.section_id))
      expectStatus(result, 201)
      extraIds.push(result.body.data.id)
    }
    return `201 for ${pair.map((row) => row.name).join(' and ')}`
  }
)
await TA(
  'API-EX-10',
  'Extra classes',
  'DELETE',
  '/admin/special-classes/{id}',
  'Stop the test classes',
  '200 each',
  async () => {
    for (const id of extraIds)
      expectStatus(await admin('DELETE', `/admin/special-classes/${id}`), 200)
    return `200, ${extraIds.length} removed`
  }
)
await TA(
  'API-BAND-01',
  'Class performance',
  'GET',
  '/admin/performance/sections/{id}/below-average?band=average',
  'Average students',
  '200; everyone within 10 points of the class average',
  async () => {
    if (!perfSection) return 'Skipped: no section'
    const result = await admin(
      'GET',
      `/admin/performance/sections/${perfSection.section_id}/below-average?band=average`
    )
    expectStatus(result, 200)
    const { from, to, students } = result.body.data
    if (students.some((row) => row.percent < from || row.percent > to))
      throw new Error('A student is outside the band')
    return `200, ${students.length} students between ${from}% and ${to}%`
  }
)
await TA(
  'API-BAND-02',
  'Class performance',
  'GET',
  '/admin/performance/sections/{id}/below-average?band=range&from=35&to=60',
  'Custom range',
  '200; everyone between 35 and 60%',
  async () => {
    if (!perfSection) return 'Skipped: no section'
    const result = await admin(
      'GET',
      `/admin/performance/sections/${perfSection.section_id}/below-average?band=range&from=35&to=60`
    )
    expectStatus(result, 200)
    if (result.body.data.students.some((row) => row.percent < 35 || row.percent > 60))
      throw new Error('Outside the range')
    return `200, ${result.body.data.students.length} students`
  }
)

const holidayKid = ((await parent('GET', '/mobile/parent/children')).body.data ?? [])[0]
const holidayClasses = (await admin('GET', '/admin/classes')).body.data ?? []
const kidClass = holidayClasses.find((row) => row.name === holidayKid?.class_name)
const otherClass = holidayClasses.find((row) => row.id !== kidClass?.id)
let classHolidayId = null
await TA(
  'API-CH-01',
  'Class holidays',
  'POST',
  '/admin/holidays',
  'Holiday only for one class',
  '201; whole_school false with the class named',
  async () => {
    if (!kidClass) return 'Skipped: no child class'
    const result = await admin('POST', '/admin/holidays', {
      date: '2027-01-12',
      name: 'Regression study leave',
      class_ids: [kidClass.id],
    })
    expectStatus(result, 201)
    classHolidayId = result.body.data.id
    if (result.body.data.whole_school || result.body.data.classes[0]?.id !== kidClass.id)
      throw new Error('Classes not saved')
    return `201, ${result.body.data.classes.map((row) => row.name).join(', ')}`
  }
)
await TA(
  'API-CH-02',
  'Class holidays',
  'GET',
  '/mobile/parent/children/{id}/holidays',
  'Parent of a child in that class sees it',
  '200; the class holiday is listed',
  async () => {
    if (!classHolidayId) return 'Skipped: no class holiday'
    const result = await parent('GET', `/mobile/parent/children/${holidayKid.id}/holidays`)
    expectStatus(result, 200)
    if (!result.body.data.all.some((row) => row.id === classHolidayId))
      throw new Error('Not listed for the child')
    return '200, listed'
  }
)
await TA(
  'API-CH-03',
  'Class holidays',
  'GET',
  '/admin/attendance/board?date=',
  'Attendance board on that day',
  '200; that class shows the holiday and is not counted as missed',
  async () => {
    if (!classHolidayId) return 'Skipped: no class holiday'
    const result = await admin('GET', '/admin/attendance/board?date=2027-01-12')
    expectStatus(result, 200)
    const off = result.body.data.sections.filter((row) => row.holiday === 'Regression study leave')
    if (!off.length) throw new Error('No section shows the holiday')
    if (off.some((row) => row.missed)) throw new Error('Holiday section counted as missed')
    return `200, ${off.length} sections on holiday`
  }
)
await TA(
  'API-CH-04',
  'Class holidays',
  'POST',
  '/admin/holidays',
  'Class that is not in the school',
  '400 on class_ids',
  async () =>
    expectFields(
      await admin('POST', '/admin/holidays', {
        date: '2027-01-13',
        name: 'Wrong class',
        class_ids: [999999],
      }),
      ['class_ids']
    )
)
await TA(
  'API-CH-05',
  'Class holidays',
  'DELETE',
  '/admin/holidays/{id}',
  'Remove the test holiday',
  '200',
  async () => {
    if (!classHolidayId) return 'Skipped: no class holiday'
    return expectStatus(await admin('DELETE', `/admin/holidays/${classHolidayId}`), 200)
  }
)

await TA(
  'API-BELL-SP1',
  'Timetable',
  'PUT',
  '/admin/timetable/periods',
  'Add a special class slot and its break after the last period',
  '200; the special slot has no period number and teaching periods stay the same',
  async () => {
    const before = (await admin('GET', '/admin/timetable/periods')).body.data
    const items = before.map(({ name, start_time, end_time, is_break, is_special }) => ({
      name,
      start_time,
      end_time,
      is_break,
      is_special,
    }))
    const teaching = before.filter((row) => row.period_no !== null).length
    try {
      const last = items.at(-1).end_time
      const result = await admin('PUT', '/admin/timetable/periods', {
        items: [
          ...items,
          { name: 'Special class break', start_time: last, end_time: '23:00', is_break: true },
          {
            name: 'Special class',
            start_time: '23:00',
            end_time: '23:45',
            is_special: true,
            section_ids: [perfSection?.section_id ?? 1],
          },
        ],
      })
      expectStatus(result, 200)
      const special = result.body.data.at(-1)
      if (!special.is_special || special.period_no !== null)
        throw new Error('Special slot got a period number')
      if (!special.section_ids?.length) throw new Error('Sections not saved on the special slot')
      if (result.body.data.filter((row) => row.period_no !== null).length !== teaching)
        throw new Error('Teaching periods changed')
      return `200, ${teaching} teaching periods, special slot ${special.start_time}–${special.end_time}`
    } finally {
      await admin('PUT', '/admin/timetable/periods', { items })
    }
  }
)

await TA(
  'API-BELL-SP2',
  'Timetable',
  'PUT',
  '/admin/timetable/periods',
  'Special class slot placed between two periods',
  '400 BELL_INVALID; nothing saved',
  async () => {
    const before = (await admin('GET', '/admin/timetable/periods')).body.data
    const items = before.map(({ name, start_time, end_time, is_break, is_special }) => ({
      name,
      start_time,
      end_time,
      is_break,
      is_special,
    }))
    const firstEnd = items[0].end_time
    const bad = [
      items[0],
      { name: 'Special class', start_time: firstEnd, end_time: firstEnd, is_special: true },
      ...items.slice(1),
    ]
    bad[1].end_time = items[1].start_time
    return expectStatus(
      await admin('PUT', '/admin/timetable/periods', { items: bad }),
      400,
      'BELL_INVALID'
    )
  }
)

const schoolBefore = (await admin('GET', '/admin/school')).body.data
await TA(
  'API-AM-01',
  'Attendance mode',
  'GET',
  '/admin/attendance/board?period=3',
  'Period-wise attendance: board and roster of the 3rd period',
  '200; mode period, period 3',
  async () => {
    try {
      expectStatus(await admin('PATCH', '/admin/school', { attendance_mode: 'period' }), 200)
      const board = await admin('GET', `/admin/attendance/board?date=${lastWorkingDay}&period=3`)
      expectStatus(board, 200)
      if (board.body.data.mode !== 'period' || board.body.data.period !== 3)
        throw new Error(`Got ${board.body.data.mode} ${board.body.data.period}`)
      const sectionId = board.body.data.sections[0]?.section_id
      const roster = await admin(
        'GET',
        `/admin/attendance/sections/${sectionId}?date=${lastWorkingDay}&period=3`
      )
      expectStatus(roster, 200)
      if (roster.body.data.period !== 3) throw new Error('Roster is not for period 3')
      return `200, board and roster for the 3rd period (${board.body.data.sections.length} sections)`
    } finally {
      await admin('PATCH', '/admin/school', {
        attendance_mode: schoolBefore?.attendance_mode ?? 'session',
      })
    }
  }
)
await TA(
  'API-AM-02',
  'Attendance mode',
  'GET',
  '/admin/attendance/board?period=3',
  'Session-wise school asked for the 3rd period',
  '400 PERIOD_NOT_ALLOWED',
  async () =>
    expectStatus(
      await admin('GET', `/admin/attendance/board?date=${lastWorkingDay}&period=3`),
      400,
      'PERIOD_NOT_ALLOWED'
    )
)
await TA(
  'API-AM-03',
  'Attendance mode',
  'PATCH',
  '/admin/school',
  'Wrong attendance mode',
  '400 on attendance_mode',
  async () =>
    expectFields(await admin('PATCH', '/admin/school', { attendance_mode: 'hourly' }), [
      'attendance_mode',
    ])
)

await TA(
  'API-HW-01',
  'Homework',
  'PATCH',
  '/admin/school',
  'Try to turn on office review of homework posts',
  '400; review can no longer be set',
  async () => {
    const result = await admin('PATCH', '/admin/school', { diary_review_mode: 'all' })
    expectStatus(result, 400)
    const school = (await admin('GET', '/admin/school')).body.data
    if (school.diary_review_mode !== 'none') throw new Error(`Mode is ${school.diary_review_mode}`)
    return `400, mode stays ${school.diary_review_mode}`
  }
)
await TA(
  'API-HW-02',
  'Homework',
  'GET',
  '/admin/diary/insights',
  'Nothing waits for office review',
  '200; pending_review is 0',
  async () => {
    const result = await admin('GET', '/admin/diary/insights')
    expectStatus(result, 200)
    if (result.body.data.pending_review !== 0)
      throw new Error(`${result.body.data.pending_review} posts still waiting`)
    return '200, 0 waiting'
  }
)

const chatKid = ((await parent('GET', '/mobile/parent/children')).body.data ?? [])[0]
const chatTeacher = chatKid
  ? ((await parent('GET', `/mobile/parent/children/${chatKid.id}/teachers-overview`)).body.data ??
    {})
  : {}
const chatTeacherId = chatTeacher.class_teacher?.id ?? chatTeacher.subject_teachers?.[0]?.id
let chatThreadId = null
let groupThreadId = null
const uploadAs = async (token, name, type, size) => {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(size).fill(7)], { type }), name)
  form.append('purpose', 'chat_media')
  const response = await fetch(`${API}/files`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form,
  })
  return { status: response.status, body: await response.json() }
}
await TA(
  'API-CHD-01',
  'Chat delete',
  'POST',
  '/mobile/parent/chat/threads/{id}/messages/{messageId}/delete',
  'Parent deletes own message for everyone',
  '200; deleted, body null, undo available for 10 seconds',
  async () => {
    if (!chatKid || !chatTeacherId) return 'Skipped: no child teacher'
    const thread = await parent('POST', `/mobile/parent/children/${chatKid.id}/chat/threads`, {
      teacher_user_id: chatTeacherId,
    })
    expectStatus(thread, 200)
    chatThreadId = thread.body.data.id
    const sent = await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/messages`, {
      body: 'Regression message to delete',
    })
    expectStatus(sent, 201)
    if (!sent.body.data.can_delete_for_everyone)
      throw new Error('Own new message cannot be deleted for everyone')
    const result = await parent(
      'POST',
      `/mobile/parent/chat/threads/${chatThreadId}/messages/${sent.body.data.id}/delete`,
      { for: 'everyone' }
    )
    expectStatus(result, 200)
    const message = result.body.data.message
    if (!message.deleted || message.body !== null || !result.body.data.undo_until)
      throw new Error('Not deleted for everyone')
    const undone = await parent(
      'POST',
      `/mobile/parent/chat/threads/${chatThreadId}/messages/${sent.body.data.id}/undo-delete`
    )
    expectStatus(undone, 200)
    if (undone.body.data.deleted || undone.body.data.body !== 'Regression message to delete')
      throw new Error('Undo did not restore')
    const again = await parent(
      'POST',
      `/mobile/parent/chat/threads/${chatThreadId}/messages/${sent.body.data.id}/delete`,
      { for: 'everyone' }
    )
    expectStatus(again, 200)
    const audit = (await admin('GET', `/admin/chat/threads/${chatThreadId}`)).body.data
    const seen = audit.messages.find((row) => row.id === sent.body.data.id)
    if (!seen?.deleted || seen.original_body !== 'Regression message to delete' || !seen.deleted_by)
      throw new Error('Office cannot see the deleted message')
    return '200; deleted, undone, deleted again; the office still reads the original'
  }
)
await TA(
  'API-CHD-02',
  'Chat delete',
  'POST',
  '/mobile/parent/chat/threads/{id}/messages/{messageId}/delete',
  'Delete for me',
  '200; gone from my history, the office sees who deleted it',
  async () => {
    if (!chatThreadId) return 'Skipped: no thread'
    const sent = await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/messages`, {
      body: 'Regression delete for me',
    })
    const result = await parent(
      'POST',
      `/mobile/parent/chat/threads/${chatThreadId}/messages/${sent.body.data.id}/delete`,
      { for: 'me' }
    )
    expectStatus(result, 200)
    const history = (await parent('GET', `/mobile/parent/chat/threads/${chatThreadId}/messages`))
      .body.data.items
    if (history.some((row) => row.id === sent.body.data.id)) throw new Error('Still in my history')
    const audit = (await admin('GET', `/admin/chat/threads/${chatThreadId}`)).body.data
    if (!audit.messages.find((row) => row.id === sent.body.data.id)?.deleted_for_me_by.length)
      throw new Error('Office not told')
    return '200; hidden for me only'
  }
)
await TA(
  'API-CHD-03',
  'Chat delete',
  'POST',
  '/mobile/parent/chat/threads/{id}/messages/{messageId}/undo-delete',
  'Undo with nothing deleted',
  '409 NOTHING_TO_UNDO',
  async () => {
    if (!chatThreadId) return 'Skipped: no thread'
    const sent = await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/messages`, {
      body: 'Regression nothing to undo',
    })
    return expectStatus(
      await parent(
        'POST',
        `/mobile/parent/chat/threads/${chatThreadId}/messages/${sent.body.data.id}/undo-delete`
      ),
      409,
      'NOTHING_TO_UNDO'
    )
  }
)
await TA(
  'API-CHD-04',
  'Chat media',
  'POST',
  '/mobile/parent/chat/threads/{id}/messages',
  'Send a voice message',
  '201; kind voice with its length',
  async () => {
    if (!chatThreadId) return 'Skipped: no thread'
    const file = await uploadAs(parentToken, 'note.m4a', 'audio/mp4', 2048)
    expectStatus(file, 201)
    const sent = await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/messages`, {
      file_id: file.body.data.id,
      duration_seconds: 42,
    })
    expectStatus(sent, 201)
    if (sent.body.data.kind !== 'voice' || sent.body.data.duration_seconds !== 42)
      throw new Error(`Got ${sent.body.data.kind}`)
    return '201, voice 42 s'
  }
)
await TA(
  'API-CHD-05',
  'Chat media',
  'POST',
  '/mobile/parent/chat/threads/{id}/messages',
  'Video longer than 2 minutes',
  '400 VIDEO_TOO_LONG',
  async () => {
    if (!chatThreadId) return 'Skipped: no thread'
    const file = await uploadAs(parentToken, 'clip.mp4', 'video/mp4', 4096)
    expectStatus(file, 201)
    return expectStatus(
      await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/messages`, {
        file_id: file.body.data.id,
        duration_seconds: 200,
      }),
      400,
      'VIDEO_TOO_LONG'
    )
  }
)
await TA(
  'API-CHD-06',
  'Chat delete',
  'POST',
  '/mobile/parent/chat/threads/{id}/clear',
  'Clear the chat for me',
  '200; my history is empty, the office still sees every message',
  async () => {
    if (!chatThreadId) return 'Skipped: no thread'
    const result = await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/clear`)
    expectStatus(result, 200)
    const history = (await parent('GET', `/mobile/parent/chat/threads/${chatThreadId}/messages`))
      .body.data.items
    if (history.length) throw new Error(`${history.length} messages still shown`)
    const audit = (await admin('GET', `/admin/chat/threads/${chatThreadId}`)).body.data
    if (!audit.messages.length || !audit.audit.some((row) => row.action === 'cleared_chat'))
      throw new Error('Office lost the history')
    return `200; office still has ${audit.messages.length} messages`
  }
)

await TA(
  'API-CHD-07',
  'Chat edit',
  'POST',
  '/mobile/parent/chat/threads/{id}/messages/{messageId}/edit',
  'Parent edits own message within 24 hours',
  '200; edited true, body updated',
  async () => {
    if (!chatThreadId) return 'Skipped: no thread'
    const sent = await parent('POST', `/mobile/parent/chat/threads/${chatThreadId}/messages`, {
      body: 'Message before edit',
    })
    expectStatus(sent, 201)
    const edited = await parent(
      'POST',
      `/mobile/parent/chat/threads/${chatThreadId}/messages/${sent.body.data.id}/edit`,
      { body: 'Message after edit' }
    )
    expectStatus(edited, 200)
    if (
      !edited.body.data.edited ||
      edited.body.data.body !== 'Message after edit' ||
      !edited.body.data.edited_at
    )
      throw new Error('Edit not reflected on returned message')
    const history = (await parent('GET', `/mobile/parent/chat/threads/${chatThreadId}/messages`))
      .body.data.items
    const found = history.find((m) => m.id === sent.body.data.id)
    if (!found || !found.edited || found.body !== 'Message after edit')
      throw new Error('Edit not reflected in history')
    return '200; edited true, body updated'
  }
)

await TA(
  'API-CHG-01',
  'Group chat',
  'POST',
  '/mobile/teacher/chat/groups',
  'Teacher creates a named group chat with parent member',
  '201; returns thread with is_group true and group title',
  async () => {
    const res = await teacher('POST', '/mobile/teacher/chat/groups', {
      name: 'Class 6A Parents Group',
      member_user_ids: chatKid?.parent_user_id ? [chatKid.parent_user_id] : [],
    })
    expectStatus(res, 201)
    if (!res.body.data.is_group || res.body.data.title !== 'Class 6A Parents Group')
      throw new Error('Not a group chat')
    groupThreadId = res.body.data.id
    return `201; group thread ${groupThreadId} created`
  }
)

await TA(
  'API-CHG-02',
  'Group chat',
  'POST',
  '/mobile/teacher/chat/threads/{id}/messages',
  'Send message to group chat',
  '201; message sent to all group members',
  async () => {
    if (!groupThreadId) return 'Skipped: no group thread'
    const sent = await teacher('POST', `/mobile/teacher/chat/threads/${groupThreadId}/messages`, {
      body: 'Welcome to Class 6A Parents Group!',
    })
    expectStatus(sent, 201)
    const history = await teacher('GET', `/mobile/teacher/chat/threads/${groupThreadId}/messages`)
    expectStatus(history, 200)
    if (!history.body.data.items.some((m) => m.body === 'Welcome to Class 6A Parents Group!'))
      throw new Error('Message not in history')
    return '201; message posted to group'
  }
)

await TA(
  'API-CHG-03',
  'Group chat',
  'POST',
  '/mobile/teacher/chat/groups/{id}/members',
  'Add members to group chat',
  '200; members list updated',
  async () => {
    if (!groupThreadId) return 'Skipped: no group thread'
    const res = await teacher('POST', `/mobile/teacher/chat/groups/${groupThreadId}/members`, {
      user_ids: chatTeacherId ? [chatTeacherId] : [],
    })
    expectStatus(res, 200)
    return '200; member added'
  }
)

await TA(
  'API-CHG-04',
  'Group chat audit',
  'GET',
  '/admin/chat/threads',
  'Group chat appears in Chat Audit in admin panel',
  '200; thread list includes group chat with title and is_group',
  async () => {
    if (!groupThreadId) return 'Skipped: no group thread'
    const res = await admin('GET', '/admin/chat/threads')
    expectStatus(res, 200)
    const found = res.body.data.items.find((t) => t.id === groupThreadId)
    if (!found || !found.is_group || found.title !== 'Class 6A Parents Group')
      throw new Error('Group chat missing from chat audit')
    return `200; found in audit with ${found.member_count} members`
  }
)

let testTeacherSigFileId = null
let testParentSigFileId = null

await TA(
  'API-SIG-01',
  'Teacher signature',
  'PUT',
  '/mobile/teacher/signature',
  'Teacher uploads official signature image',
  '200; returns updated signature_file_id and signed signature_url',
  async () => {
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    const form = new FormData()
    form.append('file', new Blob([png1x1], { type: 'image/png' }), 'teacher_sig.png')
    form.append('purpose', 'school_logo')
    const up = await fetch(`${API}/files`, {
      method: 'POST',
      headers: { authorization: `Bearer ${teacherToken}` },
      body: form,
    }).then((r) => r.json())
    testTeacherSigFileId = up.data.id
    const res = await teacher('PUT', '/mobile/teacher/signature', {
      signature_file_id: testTeacherSigFileId,
    })
    expectStatus(res, 200)
    if (res.body.data.signature_file_id !== testTeacherSigFileId || !res.body.data.signature_url) {
      throw new Error('Teacher signature not updated')
    }
    return `200; file ${testTeacherSigFileId} mapped`
  }
)

await TA(
  'API-SIG-02',
  'Parent signature',
  'PUT',
  '/mobile/parent/signature',
  'Parent uploads official signature image',
  '200; returns updated signature_file_id and signed signature_url',
  async () => {
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    const form = new FormData()
    form.append('file', new Blob([png1x1], { type: 'image/png' }), 'parent_sig.png')
    form.append('purpose', 'school_logo')
    const up = await fetch(`${API}/files`, {
      method: 'POST',
      headers: { authorization: `Bearer ${parentToken}` },
      body: form,
    }).then((r) => r.json())
    testParentSigFileId = up.data.id
    const res = await parent('PUT', '/mobile/parent/signature', {
      signature_file_id: testParentSigFileId,
    })
    expectStatus(res, 200)
    if (res.body.data.signature_file_id !== testParentSigFileId || !res.body.data.signature_url) {
      throw new Error('Parent signature not updated')
    }
    return `200; file ${testParentSigFileId} mapped`
  }
)

await TA(
  'API-SIG-03',
  'Section signatures status',
  'GET',
  '/mobile/teacher/sections/{id}/report-cards/signatures',
  'Class teacher retrieves signature status summary and students list',
  '200; returns summary counts (total, teacher_signed, parent_signed, parent_pending) and student roster',
  async () => {
    if (!teacherSection) return 'Skipped: no teacher section'
    const res = await teacher('GET', `/mobile/teacher/sections/${teacherSection}/report-cards/signatures`)
    expectStatus(res, 200)
    const { summary, students } = res.body.data
    if (typeof summary.total !== 'number' || !Array.isArray(students)) {
      throw new Error('Invalid section signatures response')
    }
    return `200; ${summary.total} students, ${summary.parent_pending} pending parent sign`
  }
)

await TA(
  'API-SIG-04',
  'Teacher sign section report cards',
  'POST',
  '/mobile/teacher/sections/{id}/report-cards/sign',
  'Class teacher batch signs all students report cards for current scope',
  '201; returns updated section signatures status',
  async () => {
    if (!teacherSection) return 'Skipped: no teacher section'
    const res = await teacher('POST', `/mobile/teacher/sections/${teacherSection}/report-cards/sign`, {})
    expectStatus(res, 201)
    const { summary } = res.body.data
    if (summary.teacher_signed === 0) throw new Error('Teacher signature not recorded')
    return `201; ${summary.teacher_signed}/${summary.total} signed by teacher`
  }
)

await TA(
  'API-SIG-05',
  'Parent sign child report card',
  'POST',
  '/mobile/parent/children/{id}/report-card/sign',
  'Parent acknowledges and signs child report card',
  '201; returns full report card with parent signature and signed flag',
  async () => {
    if (!chatKid) return 'Skipped: no child'
    const res = await parent('POST', `/mobile/parent/children/${chatKid.id}/report-card/sign`, {})
    expectStatus(res, 201)
    const { student } = res.body.data
    if (!student.parent_signed || !student.parent_signature_url) {
      throw new Error('Parent signature not present in returned card')
    }
    return `201; signed at ${student.parent_signed_at}`
  }
)

await TA(
  'API-REP-06',
  'Attendance reports',
  'GET',
  '/mobile/parent/children/{id}/attendance/summary',
  'Parent asks for a child that is not theirs',
  '404 CHILD_NOT_FOUND',
  async () =>
    expectStatus(
      await parent('GET', '/mobile/parent/children/999999/attendance/summary'),
      404,
      'CHILD_NOT_FOUND'
    )
)

await TA(
  'API-PAT-01',
  'Attendance',
  'PATCH',
  '/admin/attendance/sections/{id}',
  'Mark three students with P, A and L in one call',
  '200 present, absent, late; L is late',
  async () => {
    const roster = (
      await ao(
        'GET',
        `/admin/attendance/sections/${sessionSection}?date=${lastWorkingDay}&session=afternoon`
      )
    ).body.data
    if (!roster?.working_day || roster.students.length < 3)
      return 'Skipped: no school day or too few students'
    const [a, b, c] = roster.students
    const result = await ao('PATCH', `/admin/attendance/sections/${sessionSection}`, {
      date: lastWorkingDay,
      session: 'afternoon',
      items: [
        { student_id: a.student_id, status: 'P' },
        { student_id: b.student_id, status: 'A' },
        { student_id: c.student_id, status: 'L' },
      ],
    })
    expectStatus(result, 200)
    const got = result.body.data.students
      .slice(0, 3)
      .map((row) => row.status)
      .join(',')
    if (got !== 'present,absent,late') throw new Error(got)
    return `200, ${got}`
  }
)
await TA(
  'API-PAT-02',
  'Attendance',
  'PATCH',
  '/admin/attendance/sections/{id}',
  'A student from another section',
  '400 STUDENT_NOT_IN_SECTION',
  async () =>
    expectStatus(
      await ao('PATCH', `/admin/attendance/sections/${sessionSection}`, {
        date: lastWorkingDay,
        session: 'afternoon',
        items: [{ student_id: 999999, status: 'A' }],
      }),
      400,
      'STUDENT_NOT_IN_SECTION'
    )
)
await TA(
  'API-PAT-03',
  'Devices',
  'POST',
  '/me/devices',
  'Register a phone with push_token',
  '200 Device registered',
  async () => {
    const result = await teacher('POST', '/me/devices', {
      push_token: `rt-${RUN}`,
      platform: 'android',
    })
    expectStatus(result, 200)
    await teacher('DELETE', `/me/devices?push_token=rt-${RUN}`)
    return '200'
  }
)

const halfKid = ((await parent('GET', '/mobile/parent/children')).body.data.items ??
  (await parent('GET', '/mobile/parent/children')).body.data)[0]
const halfDay = new Date(Date.now() + 5.5 * 3600e3 + 25 * 86400e3)
if (halfDay.getUTCDay() === 0) halfDay.setUTCDate(halfDay.getUTCDate() + 1)
const halfDate = halfDay.toISOString().slice(0, 10)
await TA(
  'API-HDL-01',
  'Student leave',
  'POST',
  '/mobile/parent/children/{id}/leaves',
  'Half-day leave (morning)',
  '201 with days 0.5 and half_day morning',
  async () => {
    const result = await parent('POST', `/mobile/parent/children/${halfKid.id}/leaves`, {
      from_date: halfDate,
      to_date: halfDate,
      half_day: 'morning',
      reason: `Regression half day ${RUN}`,
    })
    expectStatus(result, 201)
    if (result.body.data.days !== 0.5 || result.body.data.half_day !== 'morning')
      throw new Error(`${result.body.data.days} ${result.body.data.half_day}`)
    await parent(
      'POST',
      `/mobile/parent/children/${halfKid.id}/leaves/${result.body.data.id}/cancel`
    )
    return '201, 0.5 day'
  }
)
await TA(
  'API-HDL-02',
  'Student leave',
  'POST',
  '/mobile/parent/children/{id}/leaves',
  'Half day over two dates',
  '400 on to_date',
  async () => {
    const next = new Date(`${halfDate}T00:00:00Z`)
    next.setUTCDate(next.getUTCDate() + 1)
    return expectFields(
      await parent('POST', `/mobile/parent/children/${halfKid.id}/leaves`, {
        from_date: halfDate,
        to_date: next.toISOString().slice(0, 10),
        half_day: 'afternoon',
        reason: 'Regression bad half day',
      }),
      ['to_date']
    )
  }
)

await admin('DELETE', `/admin/students/${studentId}`)
if (userId) await admin('DELETE', `/admin/users/${userId}`)

const passed = results.filter((row) => row.status === 'Pass').length
fs.writeFileSync(
  path.join(OUT, 'api.json'),
  JSON.stringify({ run_at: new Date().toISOString(), api: API, day: DAY, results }, null, 2)
)
console.log(`\n${passed}/${results.length} API checks passed. Results: e2e/results/api.json`)
process.exit(passed === results.length ? 0 : 1)
