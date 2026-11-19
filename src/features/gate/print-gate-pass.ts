import { formatDate } from '@/lib/format'
import type { GatePass } from './api'
import { PASS_STATUS, relationText } from './labels'

const escape = (value: string | null | undefined) =>
  (value ?? '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

function slipHtml(pass: GatePass, school: { name: string; logo_url: string | null } | null) {
  const photo = pass.student.photo?.url
    ? `<img class="photo" src="${escape(pass.student.photo.url)}" alt="">`
    : `<div class="photo empty">${escape(pass.student.name.slice(0, 1))}</div>`
  const pickup = [pass.pickup.name, relationText(pass.pickup.relation)].filter(Boolean).join(' · ')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(pass.pass_no)}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card { width: 100mm; border: 1.5px solid #1d4ed8; border-radius: 4mm; overflow: hidden; }
  .head { display: flex; align-items: center; gap: 3mm; background: #1d4ed8; color: #fff; padding: 3mm 4mm; }
  .head img { height: 9mm; width: 9mm; object-fit: contain; background: #fff; border-radius: 1.5mm; }
  .head .school { font-weight: 700; font-size: 11pt; line-height: 1.2; }
  .head .kind { font-size: 8pt; opacity: .9; letter-spacing: .5px; text-transform: uppercase; }
  .body { padding: 4mm; display: grid; gap: 3mm; }
  .who { display: flex; gap: 3mm; align-items: center; }
  .photo { width: 18mm; height: 22mm; border-radius: 2mm; object-fit: cover; border: 1px solid #d1d5db; }
  .photo.empty { display: grid; place-items: center; background: #f3f4f6; font-size: 16pt; font-weight: 700; color: #6b7280; }
  .name { font-weight: 700; font-size: 11pt; }
  .muted { color: #6b7280; font-size: 8pt; }
  .codes { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .box { border: 1px solid #d1d5db; border-radius: 2mm; padding: 2mm 3mm; }
  .big { font-family: 'Courier New', monospace; font-weight: 700; font-size: 16pt; letter-spacing: 1px; }
  dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 3mm; }
  dt, .lbl { color: #6b7280; font-size: 7pt; text-transform: uppercase; letter-spacing: .3px; }
  dd { margin: .5mm 0 0; font-size: 8.5pt; font-weight: 600; }
  .wide { grid-column: span 2; }
  .foot { border-top: 1px dashed #d1d5db; padding-top: 2mm; font-size: 7pt; color: #6b7280; }
</style></head><body>
<div class="card">
  <div class="head">
    ${school?.logo_url ? `<img src="${escape(school.logo_url)}" alt="">` : ''}
    <div><div class="school">${escape(school?.name ?? 'School')}</div><div class="kind">Gate pass</div></div>
  </div>
  <div class="body">
    <div class="who">
      ${photo}
      <div>
        <div class="name">${escape(pass.student.name)}</div>
        <div class="muted">${escape(pass.student.class_section ?? '')} · ${escape(pass.student.admission_no)}</div>
        <div class="muted">${escape(PASS_STATUS[pass.status].label)}</div>
      </div>
    </div>
    <div class="codes">
      <div class="box"><div class="lbl">Pass number</div><div class="big">${escape(pass.pass_no)}</div></div>
      <div class="box"><div class="lbl">Gate code</div><div class="big">${escape(pass.code ?? '—')}</div></div>
    </div>
    <dl>
      <div><dt>Date</dt><dd>${escape(formatDate(pass.pass_date))}</dd></div>
      <div><dt>Leave between</dt><dd>${escape(pass.from_time)} – ${escape(pass.until_time)}</dd></div>
      <div class="wide"><dt>Picked up by</dt><dd>${escape(pickup)}${pass.pickup.mobile ? ` · ${escape(pass.pickup.mobile)}` : ''}</dd></div>
      <div class="wide"><dt>Reason</dt><dd>${escape(pass.reason)}</dd></div>
    </dl>
    <div class="foot">Show this slip at the gate. The guard checks the pass number and code and the person picking up.</div>
  </div>
</div>
</body></html>`
}

export function printGatePass(
  pass: GatePass,
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
  doc.write(slipHtml(pass, school))
  doc.close()
  const ready = Promise.all(
    Array.from(doc.images).map((image) =>
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
