import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import mongoose from 'mongoose'
import FileModel from '~/server/models/file'

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

  const rawMime = (doc as any).mimetype || 'application/octet-stream'
  // ถ้าเป็นไฟล์ข้อความ ให้ระบุ charset=windows-874 (เทียบ TIS-620)
  const mime = rawMime.startsWith('text/') && !/charset=/i.test(rawMime)
    ? `${rawMime}; charset=windows-874`
    : rawMime

  const filename =
    (doc as any).originalFilename ||
    (doc as any).storedFilename ||
    'file'

  const { disposition: dispQuery } = getQuery(event) as { disposition?: string }
  const disposition = dispQuery === 'attachment' ? 'attachment' : 'inline'

  const buf = toBuffer((doc as any).data)

  event.node.res.setHeader('Content-Type', mime)
  const cd = `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  event.node.res.setHeader('Content-Disposition', cd)
  event.node.res.setHeader('Content-Length', String(buf.length))
  event.node.res.setHeader('X-Content-Type-Options', 'nosniff')
  event.node.res.setHeader('Cache-Control', 'no-store')

  // รองรับ HEAD: ตอบแค่ header เพื่อให้ฝั่งหน้าเว็บรู้ชนิดไฟล์อย่างรวดเร็ว
  if (event.node.req.method === 'HEAD') {
    setResponseStatus(event, 200)
    return
  }

  event.node.res.end(buf)
})
