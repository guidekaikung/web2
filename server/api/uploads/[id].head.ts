import { defineEventHandler, setResponseStatus } from 'h3'
import mongoose from 'mongoose'
import FileModel from '~/server/models/file'

// แปลงชนิดต่างๆ มาเป็น Buffer เพื่อหา length ได้
function toBuffer(raw: any): Buffer {
  if (!raw) return Buffer.alloc(0)
  if (Buffer.isBuffer(raw)) return raw
  if (raw instanceof Uint8Array) return Buffer.from(raw)
  if (raw?.type === 'Buffer' && Array.isArray(raw.data)) return Buffer.from(raw.data)
  if (raw?._bsontype === 'Binary') {
    // driver ใหม่มี raw.buffer / เก่ามี raw.value(true)
    // @ts-ignore
    if (raw.buffer) return Buffer.from(raw.buffer)
    // @ts-ignore
    if (typeof raw.value === 'function') return Buffer.from(raw.value(true))
  }
  try { return Buffer.from(raw as any) } catch { return Buffer.alloc(0) }
}

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id || !mongoose.isValidObjectId(id)) {
    setResponseStatus(event, 400)
    return // Invalid id
  }

  const doc = await FileModel.findById(id)
    .select('data mimetype originalFilename storedFilename')
    .lean()
    .exec()

  if (!doc || !(doc as any).data) {
    setResponseStatus(event, 404)
    return // File not found
  }

  const mime = (doc as any).mimetype || 'application/octet-stream'
  const filename =
    (doc as any).originalFilename ||
    (doc as any).storedFilename ||
    'file'

  const buf = toBuffer((doc as any).data)

  event.node.res.setHeader('Content-Type', mime)
  const cd = `inline; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  event.node.res.setHeader('Content-Disposition', cd)
  event.node.res.setHeader('Content-Length', String(buf.length))
  event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
  event.node.res.setHeader('Cache-Control', 'no-store')

  setResponseStatus(event, 200)
  return // ❗️HEAD: ไม่ต้องส่งบอดี้
})
