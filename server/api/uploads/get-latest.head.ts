// server/api/uploads/get-latest.head.ts
import dbConnect from '~/server/utils/db'
import FileModel from '~/server/models/file'
import { getQuery, setResponseStatus, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  await dbConnect()

  const q = getQuery(event) as {
    request_no?: string
    step?: string
    disposition?: string
  }

  const request_no  = (q.request_no || '').trim()
  const stepStr     = (q.step || '').trim()
  const disposition = q.disposition === 'attachment' ? 'attachment' : 'inline'

  if (!request_no || !stepStr) {
    setResponseStatus(event, 400)
    return
  }

  const latest = await FileModel.findOne({ request_no, step: stepStr })
    .sort({ uploadedAt: -1, _id: -1 })
    .select('_id')
    .lean()

  if (latest && (latest as any)._id) {
    const idStr = String((latest as any)._id)
    return sendRedirect(event, `/api/uploads/${encodeURIComponent(idStr)}?disposition=${disposition}`, 302)
  }

  // ไม่มีไฟล์ล่าสุด → HEAD ตอบ 204 เงียบ ๆ
  setResponseStatus(event, 204)
})
