import FileModel from '~/server/models/file'
import { getRouterParam, readBody } from 'h3'
import ApproveModel from '~/server//models/approve' // สมมุติว่าโมเดลชื่อ ApproveModel

export default defineEventHandler(async (event) => {
  const step = getRouterParam(event, 'step')  // อ่านจาก URL เช่น /approve-detail/13
  const body = await readBody(event)
  const fileId = body.document

  if (!step || !fileId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing step or document ID' })
  }

  // 👇 สมมุติว่าเก็บแต่ละขั้นไว้ใน collection เดียว (เช่น approve_detail)
  const result = await ApproveModel.findOneAndUpdate(
    { step: step },
    { document: fileId },
    { new: true }
  )

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Step not found' })
  }

  return { success: true }
})
