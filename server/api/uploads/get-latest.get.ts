// server/api/uploads/get-latest.get.ts
import dbConnect from '~/server/utils/db'
import FileModel from '~/server/models/file'
import { getQuery, createError, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  await dbConnect()

  const q = getQuery(event) as {
    request_no?: string
    step?: string
    fallback?: string
    disposition?: string
  }

  const request_no  = (q.request_no || '').trim()
  const stepStr     = (q.step || '').trim()
  const fallback    = q.fallback ? String(q.fallback) : ''
  const disposition = q.disposition === 'attachment' ? 'attachment' : 'inline' // default: inline

  if (!request_no || !stepStr) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request_no or step' })
  }

  const latest = await FileModel.findOne({ request_no, step: stepStr })
    .sort({ uploadedAt: -1, _id: -1 })
    .select('_id')
    .lean()
    .exec()

  if (latest && (latest as any)._id) {
    const idStr = String((latest as any)._id)
    return sendRedirect(event, `/api/uploads/${encodeURIComponent(idStr)}?disposition=${disposition}`, 302)
  }

  if (fallback) {
    const url = fallback.startsWith('/') ? fallback : `/files/${fallback}`
    return sendRedirect(event, url, 302)
  }

  throw createError({ statusCode: 404, statusMessage: 'NO_LATEST_FILE' })
})
