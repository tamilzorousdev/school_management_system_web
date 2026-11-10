import { createRequire } from 'node:module'

const BACKEND = process.env.E2E_BACKEND_DIR ?? 'C:/Users/DELL/Telematics'
const require = createRequire(`${BACKEND}/package.json`)
require('dotenv').config({ path: `${BACKEND}/.env` })
const { Client } = require('pg')

if (process.env.NODE_ENV === 'production') {
  console.error('Test data clean-up is refused when NODE_ENV=production')
  process.exit(1)
}

const NAME = `^(RT|API) (User|Teacher|Mother|Father|Parent|Duplicate|Admin)\\y|^(RT|API)(Kid|App|Good|Bad)\\y`
const db = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
await db.connect()

const steps = [
  [
    'students',
    `UPDATE students SET deleted_at = now() WHERE deleted_at IS NULL AND first_name ~ $1`,
  ],
  [
    'admissions',
    `UPDATE admissions SET deleted_at = now() WHERE deleted_at IS NULL AND first_name ~ $1`,
  ],
  [
    'staff',
    `UPDATE staff SET deleted_at = now() WHERE deleted_at IS NULL AND user_id IN (SELECT id FROM users WHERE name ~ $1)`,
  ],
  ['guardians', `UPDATE guardians SET deleted_at = now() WHERE deleted_at IS NULL AND name ~ $1`],
  ['user roles', `DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE name ~ $1)`],
  [
    'users',
    `UPDATE users SET deleted_at = now(), status = 'inactive' WHERE deleted_at IS NULL AND name ~ $1`,
  ],
  [
    'subjects',
    `UPDATE subjects SET deleted_at = now() WHERE deleted_at IS NULL AND name ~ '^RT Subject'`,
  ],
  [
    'holidays',
    `UPDATE holidays SET deleted_at = now() WHERE deleted_at IS NULL AND name ~ '^RT Holiday'`,
  ],
  [
    'staff leaves',
    `UPDATE staff_leave_requests SET deleted_at = now() WHERE deleted_at IS NULL AND reason ~ '^Regression'`,
  ],
]
for (const [label, sql] of steps) {
  const result = await db.query(sql, sql.includes('$1') ? [NAME] : [])
  if (result.rowCount) console.log(`Removed ${result.rowCount} test ${label}`)
}
await db.end()
console.log('Test data clean-up done')
