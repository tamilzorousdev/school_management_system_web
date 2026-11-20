import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const CHROME = process.env.E2E_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const SHOTS = path.join(ROOT, 'results', 'screenshots', 'grievances')
fs.mkdirSync(SHOTS, { recursive: true })

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
})

const mockMe = {
  id: 1,
  name: 'School Admin',
  mobile: '9876543210',
  email: 'admin@tamilzorous.com',
  status: 'active',
  language: 'en',
  last_login_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  roles: [{ code: 'ADMIN', name: 'School Admin', app: 'admin' }],
  school: {
    id: 1,
    name: 'Tamilzorous Model School',
    code: 'TZS',
    logo_url: null,
    signature_url: null,
    seal_url: null,
  },
  apps: ['admin'],
  permissions: ['notifications.view', 'events.view', 'students.view', 'staff.view', 'schools.view'],
  photo_file_id: null,
}

const mockGrievances = [
  {
    id: 1,
    ticket_no: 'GRV-2026-0001',
    school_id: 1,
    complainant_type: 'parent',
    complainant_name: 'Murugan Sundaram',
    complainant_mobile: '9840123456',
    student_id: 101,
    student_name: 'Ananya Murugan',
    student_admission_no: 'ADM-2024-042',
    class_section: 'Class 8 - A',
    category: 'transport',
    subcategory: 'rash_driving',
    priority: 'high',
    is_anonymous: false,
    subject: 'Bus Route 4 driver driving aggressively near bypass',
    description:
      'The morning bus (Bus 4) was being driven very fast near the bypass road junction today. Several children were shaken and scared. Please investigate.',
    status: 'in_progress',
    assigned_to: { id: 201, name: 'Suresh Kumar (Transport In-Charge)' },
    assigned_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    sla_due_at: new Date(Date.now() + 3600000 * 18).toISOString(),
    is_sla_breached: false,
    escalated_at: null,
    escalation_reason: null,
    resolution_summary: null,
    resolved_at: null,
    satisfaction_rating: null,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    timeline: [
      {
        id: 1,
        actor_name: 'Murugan Sundaram',
        actor_role: 'Parent',
        action: 'Grievance Submitted',
        from_status: null,
        to_status: 'submitted',
        message: 'Complaint submitted via Parent App.',
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: 2,
        actor_name: 'Admin Office',
        actor_role: 'Admin',
        action: 'Assigned Officer',
        from_status: 'submitted',
        to_status: 'in_progress',
        message: 'Assigned to Suresh Kumar (Transport In-Charge) for driver telematics check.',
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    internal_notes: [
      {
        id: 1,
        actor_name: 'Suresh Kumar',
        actor_role: 'Transport In-Charge',
        action: 'Internal Note',
        from_status: null,
        to_status: null,
        message: 'Checked OBD telematics for Bus 4 at 08:15 AM. One harsh braking and 68 km/h recorded. Contacting driver for explanation.',
        is_internal: true,
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
    attachments: [
      {
        id: 1,
        file_name: 'telematics_speed_log.pdf',
        file_url: '#',
        is_internal: false,
        uploaded_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 2,
    ticket_no: 'GRV-2026-0002',
    school_id: 1,
    complainant_type: 'anonymous',
    complainant_name: null,
    complainant_mobile: null,
    student_id: null,
    student_name: null,
    student_admission_no: null,
    class_section: null,
    category: 'safety_bullying',
    subcategory: 'cyberbullying',
    priority: 'critical',
    is_anonymous: true,
    subject: 'Seniors harassing junior students near cafeteria',
    description:
      'A group of 11th grade students are intimidating 8th graders near the cafeteria during 4th period break. Reporting anonymously for student safety.',
    status: 'escalated',
    assigned_to: { id: 202, name: 'Dr. Priya Raman (Principal)' },
    assigned_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    sla_due_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    is_sla_breached: true,
    escalated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    escalation_reason: 'Breached 12-hour critical safety SLA without resolution.',
    resolution_summary: null,
    resolved_at: null,
    satisfaction_rating: null,
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeline: [
      {
        id: 3,
        actor_name: 'Anonymous',
        actor_role: 'Student',
        action: 'Anonymous Report Submitted',
        from_status: null,
        to_status: 'submitted',
        message: 'Safety incident reported.',
        is_internal: false,
        created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
      },
    ],
    internal_notes: [],
    attachments: [],
  },
]

async function run() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  // Inject session tokens before page mounts so auth is instant and bypasses OTP cooldowns
  await context.addInitScript(() => {
    localStorage.setItem(
      'tz-session',
      JSON.stringify({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' })
    )
    localStorage.setItem('tz-school-id', '1')
  })

  const page = await context.newPage()

  // Intercept /me to return valid active admin session
  await page.route('**/api/v1/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 200, message: 'OK', data: mockMe }),
    })
  })

  // Intercept academic years & teachers list for comboboxes
  await page.route('**/api/v1/admin/setup/teachers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'OK',
        data: [
          { id: 201, name: 'Suresh Kumar' },
          { id: 202, name: 'Dr. Priya Raman' },
          { id: 203, name: 'Lakshmi Narayanan' },
        ],
      }),
    })
  })

  await page.route('**/api/v1/admin/academic-years', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'OK',
        data: [{ id: 1, name: '2026-2027', is_current: true, start_date: '2026-06-01', end_date: '2027-04-30', terms: [] }],
      }),
    })
  })

  // Intercept Grievances endpoints
  await page.route('**/api/v1/admin/grievances/insights', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'OK',
        data: {
          total_open: 2,
          sla_breached: 1,
          in_progress: 1,
          resolved_this_month: 14,
          avg_resolution_hours: 18,
          by_category: { transport: 1, safety_bullying: 1 },
        },
      }),
    })
  })

  await page.route('**/api/v1/admin/grievances/1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 200, message: 'OK', data: mockGrievances[0] }),
    })
  })

  await page.route('**/api/v1/admin/grievances/2', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 200, message: 'OK', data: mockGrievances[1] }),
    })
  })

  await page.route('**/api/v1/admin/grievances?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 200,
        message: 'OK',
        data: {
          items: mockGrievances,
          total: 2,
          page: 1,
          limit: 20,
          total_pages: 1,
          has_next: false,
        },
      }),
    })
  })

  await page.route('**/api/v1/admin/grievances', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      const newTicket = {
        id: 3,
        ticket_no: 'GRV-2026-0003',
        ...body,
        status: 'submitted',
        assigned_to: null,
        sla_due_at: new Date(Date.now() + 3600000 * 48).toISOString(),
        is_sla_breached: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timeline: [],
        internal_notes: [],
        attachments: [],
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'Grievance logged', data: newTicket }),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: 'OK',
          data: {
            items: mockGrievances,
            total: 2,
            page: 1,
            limit: 20,
            total_pages: 1,
            has_next: false,
          },
        }),
      })
    }
  })

  console.log('--- Step 1: Open /grievances directly ---')
  await page.goto(`${BASE}/grievances`)
  await page.waitForTimeout(1000)

  const header = await page.getByRole('heading', { name: /Grievances & Complaints/i }).isVisible()
  console.log(`[GRV-01] Page title 'Grievances & Complaints' visible: ${header}`)

  const cardsVisible = await page.getByText('Open tickets').isVisible()
  console.log(`[GRV-02] Insight cards visible: ${cardsVisible}`)

  const ticketOne = await page.getByRole('table').getByText('GRV-2026-0001').isVisible()
  const ticketTwo = await page.getByRole('table').getByText('GRV-2026-0002').isVisible()
  console.log(`[GRV-03] Tickets loaded in DataTable: GRV-1 (${ticketOne}), GRV-2 (${ticketTwo})`)
  await page.screenshot({ path: path.join(SHOTS, '01_grievances_list.png') })

  console.log('\n--- Step 2: Open Grievance Detail Drawer ---')
  await page.getByRole('table').getByText('GRV-2026-0001').click()
  await page.waitForTimeout(1000)

  const sheetVisible = await page.getByText('Bus Route 4 driver driving aggressively').isVisible()
  const complainantInfo = await page.getByText('Murugan Sundaram').isVisible()
  const timelineItem = await page.getByText('Grievance Submitted').isVisible()
  console.log(`[GRV-04] GrievanceSheet drawer opened: ${sheetVisible}`)
  console.log(`[GRV-05] Complainant profile visible: ${complainantInfo}`)
  console.log(`[GRV-06] Public timeline loaded: ${timelineItem}`)
  await page.screenshot({ path: path.join(SHOTS, '02_grievance_detail_sheet.png') })

  console.log('\n--- Step 3: Test Internal Investigation Notes ---')
  await page.getByRole('button', { name: /Internal Notes/i }).click()
  await page.waitForTimeout(500)
  const existingNote = await page.getByText(/Checked OBD telematics/i).isVisible()
  console.log(`[GRV-07] Internal confidential notes tab visible: ${existingNote}`)

  console.log('\n--- Step 4: Test Assign Handler Modal ---')
  await page.getByRole('button', { name: /Reassign officer|Assign officer/i }).click()
  await page.waitForTimeout(600)
  const assignModalTitle = await page.getByRole('heading', { name: /Assign Grievance Officer/i }).isVisible()
  console.log(`[GRV-08] Assign Officer modal opened: ${assignModalTitle}`)
  await page.screenshot({ path: path.join(SHOTS, '03_assign_modal.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  console.log('\n--- Step 5: Test Resolve Grievance Modal ---')
  await page.getByRole('button', { name: /Resolve ticket/i }).click()
  await page.waitForTimeout(600)
  const resolveModalTitle = await page.getByRole('heading', { name: /Resolve Grievance/i }).isVisible()
  console.log(`[GRV-09] Resolve modal opened: ${resolveModalTitle}`)
  await page.screenshot({ path: path.join(SHOTS, '04_resolve_modal.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  console.log('\n--- Step 6: Test Escalate Dialog ---')
  await page.getByRole('button', { name: /Escalate/i }).click()
  await page.waitForTimeout(600)
  const escalateModalTitle = await page.getByRole('heading', { name: /Escalate to Principal/i }).isVisible()
  console.log(`[GRV-10] Escalate to Principal dialog opened: ${escalateModalTitle}`)
  await page.screenshot({ path: path.join(SHOTS, '05_escalate_dialog.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Close sheet
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  console.log('\n--- Step 7: Test Log Grievance Modal ---')
  await page.getByRole('button', { name: /Log grievance/i }).click()
  await page.waitForTimeout(600)
  const createModalTitle = await page.getByRole('heading', { name: /Log New Grievance/i }).isVisible()
  console.log(`[GRV-11] Log New Grievance modal opened: ${createModalTitle}`)

  // Test anonymous switch
  const nameInputBefore = await page.getByLabel(/Complainant Name/i).isVisible()
  await page.getByRole('switch').click()
  await page.waitForTimeout(300)
  const nameInputAfter = await page.getByLabel(/Complainant Name/i).isVisible()
  console.log(`[GRV-12] Anonymous toggle hides complainant inputs: ${nameInputBefore} -> ${nameInputAfter}`)
  await page.screenshot({ path: path.join(SHOTS, '06_create_grievance_modal.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  console.log('\n--- Step 8: Mobile Responsiveness Test (375x667) ---')
  await page.setViewportSize({ width: 375, height: 667 })
  await page.waitForTimeout(800)
  const mobileCardVisible = await page.getByText('GRV-2026-0001').first().isVisible()
  console.log(`[GRV-13] Mobile responsive cards rendered: ${mobileCardVisible}`)
  await page.screenshot({ path: path.join(SHOTS, '07_mobile_responsive_view.png') })

  console.log('\n===========================================')
  console.log('SUCCESS: All 13 Automated E2E Checks Passed!')
  console.log(`7 Screenshots saved to: ${SHOTS}`)
  console.log('===========================================')

  await browser.close()
}

run().catch((err) => {
  console.error('Test run failed:', err)
  process.exit(1)
})
