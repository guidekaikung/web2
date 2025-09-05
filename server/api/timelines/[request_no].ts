import dbConnect from '~/server/utils/db'
import Timeline from '~/server/models/Timeline'
import { makeTimelineTemplate } from '~/server/utils/timelineTemplate'

export default defineEventHandler(async (event) => {
  await dbConnect()

  const reqNo = event.context.params?.request_no as string
  if (!reqNo) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request_no' })
  }

  // หา timeline ตาม request_no
  let doc = await Timeline.findOne({ request_no: reqNo }).lean()

  // ถ้ายังไม่มี ให้สร้าง 13 ขั้นตอนสถานะ pending แล้วส่งกลับ (กัน 404)
  if (!doc) {
    const created = await Timeline.create({
      request_no: reqNo,
      steps: makeTimelineTemplate()
    })
    doc = created.toObject()
  }

  return doc
})
