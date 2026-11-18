import { formatDate } from '@/lib/format'
import type { BusPass } from './api'

const STATE_TEXT: Record<BusPass['state'], { label: string; color: string }> = {
  awaiting_payment: { label: 'Waiting for payment', color: '#6b7280' },
  active: { label: 'Active', color: '#15803d' },
  on_hold: { label: 'On hold', color: '#b91c1c' },
  expired: { label: 'Expired', color: '#6b7280' },
}

const escape = (value: string | null | undefined) =>
  (value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

const stopText = (stop: BusPass['pickup']) =>
  stop ? `${escape(stop.name)}${stop.time ? ` · ${escape(stop.time)}` : ''}` : '—'

function passHtml(pass: BusPass, school: { name: string; logo_url: string | null } | null) {
  const state = STATE_TEXT[pass.state]
  const photo = pass.student.photo_url
    ? `<img class="photo" src="${escape(pass.student.photo_url)}" alt="">`
    : `<div class="photo empty">${escape(pass.student.full_name.slice(0, 1))}</div>`
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(pass.pass_no)}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card { width: 90mm; border: 1.5px solid #15803d; border-radius: 4mm; overflow: hidden; }
  .head { display: flex; align-items: center; gap: 3mm; background: #15803d; color: #fff; padding: 3mm 4mm; }
  .head img { height: 9mm; width: 9mm; object-fit: contain; background: #fff; border-radius: 1.5mm; }
  .head .school { font-weight: 700; font-size: 11pt; line-height: 1.2; }
  .head .kind { font-size: 8pt; opacity: .9; letter-spacing: .5px; text-transform: uppercase; }
  .body { padding: 4mm; display: grid; gap: 3mm; }
  .who { display: flex; gap: 3mm; align-items: center; }
  .photo { width: 18mm; height: 22mm; border-radius: 2mm; object-fit: cover; border: 1px solid #d1d5db; }
  .photo.empty { display: grid; place-items: center; background: #f3f4f6; font-size: 16pt; font-weight: 700; color: #6b7280; }
  .name { font-weight: 700; font-size: 11pt; }
  .muted { color: #6b7280; font-size: 8pt; }
  .no { font-family: 'Courier New', monospace; font-weight: 700; font-size: 10pt; margin-top: 1mm; }
  .state { display: inline-block; margin-top: 1mm; padding: .5mm 2mm; border-radius: 3mm; font-size: 8pt; font-weight: 700; color: #fff; background: ${state.color}; }
  dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 3mm; }
  dt { color: #6b7280; font-size: 7pt; text-transform: uppercase; letter-spacing: .3px; }
  dd { margin: .5mm 0 0; font-size: 8.5pt; font-weight: 600; }
  .wide { grid-column: span 2; }
  .foot { border-top: 1px dashed #d1d5db; padding-top: 2mm; font-size: 7pt; color: #6b7280; }
</style></head><body>
<div class="card">
  <div class="head">
    ${school?.logo_url ? `<img src="${escape(school.logo_url)}" alt="">` : ''}
    <div><div class="school">${escape(school?.name ?? 'School')}</div><div class="kind">School bus pass</div></div>
  </div>
  <div class="body">
    <div class="who">
      ${photo}
      <div>
        <div class="name">${escape(pass.student.full_name)}</div>
        <div class="muted">${escape(pass.student.class_section ?? '')} · ${escape(pass.student.admission_no)}</div>
        <div class="no">${escape(pass.pass_no)}</div>
        <span class="state">${state.label}</span>
      </div>
    </div>
    <dl>
      <div class="wide"><dt>Route</dt><dd>${escape(pass.route.name)}</dd></div>
      <div><dt>Morning pickup</dt><dd>${stopText(pass.pickup)}</dd></div>
      <div><dt>Evening drop</dt><dd>${stopText(pass.drop)}</dd></div>
      <div><dt>Bus</dt><dd>${pass.bus ? `${escape(pass.bus.name)} · ${escape(pass.bus.registration_no)}` : '—'}</dd></div>
      <div><dt>Valid</dt><dd>${escape(formatDate(pass.valid_from))} – ${escape(formatDate(pass.valid_until))}</dd></div>
    </dl>
    <div class="foot">Show this pass when boarding the school bus. If found, please return it to the school office.</div>
  </div>
</div>
</body></html>`
}

export function printBusPass(
  pass: BusPass,
  school: { name: string; logo_url: string | null } | null
) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.style.right = '0'
  frame.style.bottom = '0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  const win = frame.contentWindow
  if (!doc || !win) {
    frame.remove()
    return
  }
  doc.open()
  doc.write(passHtml(pass, school))
  doc.close()
  const images = Array.from(doc.images)
  const ready = Promise.all(
    images.map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.onload = () => resolve()
            image.onerror = () => resolve()
          })
    )
  )
  void ready.then(() => {
    win.focus()
    win.print()
    window.setTimeout(() => frame.remove(), 1000)
  })
}
