// server/api/uploads/[id].get.ts
import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import mongoose from 'mongoose'
import FileModel from '~/server/models/file'
// ใช้ตัวถอดรหัสไทยที่คุณมีอยู่แล้ว
import { decodeThai } from '~/server/utils/parse-zaar020'

function toBuffer(raw: any): Buffer {
  if (!raw) return Buffer.alloc(0)
  if (Buffer.isBuffer(raw)) return raw
  if (raw instanceof Uint8Array) return Buffer.from(raw)
  if (raw?.type === 'Buffer' && Array.isArray(raw.data)) return Buffer.from(raw.data)
  if (raw?._bsontype === 'Binary') {
    if ((raw as any).buffer) return Buffer.from((raw as any).buffer)
    if (typeof (raw as any).value === 'function') return Buffer.from((raw as any).value(true))
  }
  try { return Buffer.from(raw as any) } catch { return Buffer.alloc(0) }
}

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id || !mongoose.isValidObjectId(id)) {
    setResponseStatus(event, 400)
    return 'Invalid id'
  }

  const doc = await FileModel.findById(id)
    .select('data mimetype originalFilename storedFilename')
    .lean()
    .exec()

  if (!doc || !(doc as any).data) {
    setResponseStatus(event, 404)
    return 'File not found'
  }

  const mime = (doc as any).mimetype || 'application/octet-stream'
  const filename =
    (doc as any).originalFilename ||
    (doc as any).storedFilename ||
    'file'

  const { disposition: dispQuery } = getQuery(event) as { disposition?: string }
  const disposition = dispQuery === 'attachment' ? 'attachment' : 'inline'

  const rawBuf = toBuffer((doc as any).data)

  // ---- ถ้าเป็นไฟล์ตัวอักษร → แปลงเป็น UTF-8 แล้วส่งด้วย charset ----
  if (mime.startsWith('text/')) {
    // decodeThai จะเดา TIS-620/Win-874 และคืนค่าเป็น string UTF-8
    const utf8Text = decodeThai(rawBuf)

    event.node.res.setHeader('Content-Type', `${mime}; charset=utf-8`)
    const cd = `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    event.node.res.setHeader('Content-Disposition', cd)
    event.node.res.setHeader('Content-Length', String(Buffer.byteLength(utf8Text, 'utf8')))
    event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
    event.node.res.setHeader('Cache-Control', 'no-store')

    if (event.node.req.method === 'HEAD') {
      setResponseStatus(event, 200)
      return
    }

    // ส่งเป็นสตริง UTF-8 (Header ระบุ charset แล้ว)
    event.node.res.end(utf8Text)
    return
  }

  // ---- ไฟล์ไบนารี (ภาพ/PDF/ฯลฯ) ส่งตามเดิม ----
  event.node.res.setHeader('Content-Type', mime)
  const cd = `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  event.node.res.setHeader('Content-Disposition', cd)
  event.node.res.setHeader('Content-Length', String(rawBuf.length))
  event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
  event.node.res.setHeader('Cache-Control', 'no-store')

  if (event.node.req.method === 'HEAD') {
    setResponseStatus(event, 200)
    return
  }

  event.node.res.end(rawBuf)
})
