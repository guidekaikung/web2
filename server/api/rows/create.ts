import { defineEventHandler, readBody, sendError, createError } from 'h3'
import Row from '~/server/models/Row'
import Timeline from '~/server/models/Timeline'
import { makeTimelineTemplate } from '~/server/utils/timelineTemplate'
import dbConnect from '~/server/utils/db'
import Counter from '~/server/models/Counter'

export default defineEventHandler(async (event) => {
  try {
    await dbConnect()
    const body = await readBody(event)

    // ออกเลขด้วย Counter (อะตอมมิก)
    const ctr = await Counter.findOneAndUpdate(
      { name: 'request_no' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    if (!ctr) {
      throw createError({ statusCode: 500, statusMessage: 'CounterNotCreated' })
    }

    const newRequestNo = `WAMCLBR${String(ctr.seq).padStart(6, '0')}` // เปลี่ยนเป็น 4/6 หลักตามต้องการ

    const newRow = await Row.create({
      request_no: newRequestNo,
      book_no: body.book_no,
      book_date: body.book_date
    })

    const exists = await Timeline.findOne({ request_no: newRequestNo }).lean()
    if (!exists) {
      await Timeline.create({
        request_no: newRequestNo,
        steps: makeTimelineTemplate()
      })
    }

    return { success: true, request_no: newRequestNo, data: newRow }
  } catch (error: any) {
    console.error('[rows/create] ERROR:', error?.stack || error)
    // ส่ง 500 ออกไปให้ frontend เห็น ไม่ใช่ 503
    return sendError(event, createError({ statusCode: error?.statusCode || 500, statusMessage: error?.statusMessage || 'Create Failed' }))
  }
})
