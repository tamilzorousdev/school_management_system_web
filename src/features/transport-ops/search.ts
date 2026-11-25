import { z } from 'zod'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const opsDaySearchSchema = z.object({ date })

export type OpsDaySearch = z.infer<typeof opsDaySearchSchema>

export const busAttendanceSearchSchema = z.object({
  date,
  route_id: z.coerce.number().int().min(1).optional().catch(undefined),
  mismatch: z.literal(true).optional().catch(undefined),
  on_hold: z.literal(true).optional().catch(undefined),
})

export type BusAttendanceSearch = z.infer<typeof busAttendanceSearchSchema>

export const incidentsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(['open', 'resolved']).optional().catch(undefined),
  type: z
    .enum(['breakdown', 'accident', 'injury', 'medical', 'misbehaviour', 'fight', 'other'])
    .optional()
    .catch(undefined),
  sort: z.enum(['occurred_at', 'created_at']).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  id: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type IncidentsSearch = z.infer<typeof incidentsSearchSchema>
