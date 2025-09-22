import ApproveModel from '~/server/models/approve'
import Row from '~/server/models/Row'
import dbConnect from '~/server/utils/db'
import { getRouterParam, readBody, createError } from 'h3'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await dbConnect()

  const step = getRouterParam(event, 'step') // '3'
  const { id, document } = (await readBody<{ id?: string; document?: string }>(event)) || {}
  if (!step) throw createError({ statusCode: 400, statusMessage: 'Missing step' })
  if (!id)   throw createError({ statusCode: 400, statusMessage: 'Missing id (request_no or _id)' })

  const now = new Date()
  const setPayload: Record<string, any> = { step: Number(step), updated_at: now }
  if (String(step) === '3') setPayload.step3_at = now
  if (document) setPayload.document = document

  const isObjectId = /^[a-f0-9]{24}$/i.test(id)
  const filter = isObjectId ? { _id: new ObjectId(id) } : { request_no: id }

  const updated = await ApproveModel.findOneAndUpdate(filter, { $set: setPayload }, { new: true })
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Request not found' })

  // 🪞 mirror เฉพาะฟิลด์เวลาไป Row เพื่อให้ /api/rows เห็นค่า
  const mirrorSet: Record<string, any> = { updated_at: now }
  if (String(step) === '3') mirrorSet.step3_at = now
  await Row.updateOne(filter, { $set: mirrorSet }).catch(() => {})

  return { success: true }
})
