// server/api/rows/create.ts
import { defineEventHandler, readBody, sendError, createError } from 'h3'
import Row from '~/server/models/Row'
import Timeline from '~/server/models/Timeline'
import { makeTimelineTemplate } from '~/server/utils/timelineTemplate'
import dbConnect from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    await dbConnect()

    // หา request ล่าสุดเพื่อกันสร้างใหม่ถ้า step1 ยังไม่ผ่าน
    const lastRow = await Row.findOne().sort({ created_at: -1 }).exec()
    let nextNumber = 1
    if (lastRow?.request_no) {
      const m = lastRow.request_no.match(/WAMCLBR(\d+)/)
      if (m) nextNumber = parseInt(m[1]) + 1

      // ✅ การ์ด: ห้ามสร้างคำขอใหม่ ถ้า request ล่าสุดยังไม่ผ่าน Step 1
      const tl = await Timeline.findOne({ request_no: lastRow.request_no }).lean()
      const steps = (tl as any)?.steps || []
      const s1 = steps.find((s: any) => String(s.no) === '1')
      if (!s1 || s1.status !== 'done') {
        return sendError(event, createError({
          statusCode: 409,
          statusMessage: 'STEP1_NOT_DONE',
          data: { ok: false, code: 'STEP1_NOT_DONE', message: `ยังไม่ได้อัปโหลดไฟล์ Step 1 ให้ผ่านของ ${lastRow.request_no}` }
        }))
      }
    }

    const newRequestNo = `WAMCLBR${nextNumber.toString().padStart(4, '0')}`

    const newRow = new Row({
      request_no: newRequestNo,
      book_no: body.book_no,
      book_date: body.book_date
    })
    await newRow.save()

    const exists = await Timeline.findOne({ request_no: newRequestNo }).lean()
    if (!exists) {
      await Timeline.create({
        request_no: newRequestNo,
        steps: makeTimelineTemplate()
      })
    }

    return { success: true, request_no: newRequestNo }
  } catch (error: any) {
    console.error('[CREATE ERROR]', error?.message || error)
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Create Failed' }))
  }
})
