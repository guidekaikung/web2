// server/api/uploads/upload.post.ts
import { defineEventHandler, setResponseStatus } from 'h3'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import type { File as FormidableFile } from 'formidable'
import crypto from 'node:crypto'
import mongoose from 'mongoose'
import FileModel from '~/server/models/file'
import Timeline from '~/server/models/Timeline'
import { decodeThai, parseZAAR020, type ParseResult } from '~/server/utils/parse-zaar020'

// helper
const getField = (v: any) => (Array.isArray(v) ? v[0] : v)
function normalizePeaNumbers(arr: string[]) {
  const strings = Array.from(new Set((arr || []).map(n => (n ?? '').toString().replace(/\D/g, '')).filter(Boolean)))
  const numbers = strings.map(v => Number(v)).filter(v => Number.isFinite(v))
  return { strings, numbers }
}

export const config = { api: { bodyParser: false } }

export default defineEventHandler(async (event) => {
  const form = formidable({ multiples: false, keepExtensions: true })

  return await new Promise((resolve, reject) => {
    form.parse(event.node.req, async (err, fields, files) => {
      try {
        if (err) return reject(err)

        const file = (files.file?.[0] || files.file) as FormidableFile
        if (!file) {
          setResponseStatus(event, 400)
          return resolve({
            success: false,
            code: 'NO_FILE',
            error: 'ไม่พบไฟล์ที่อัปโหลด',
            user_message: 'ยังไม่ได้เลือกไฟล์'
          })
        }

        const requestNo  = String(getField(fields.request_no || '')).trim()
        const stepKey    = String(getField(fields.step || '')).trim()
        const documentNo = String(getField(fields.document_no || '')).trim()
        const dateSigned = String(getField(fields.date_signed || '')).trim()
        const amountRaw  = getField(fields.amount)
        const amount     = amountRaw !== undefined && amountRaw !== '' ? Number(amountRaw) : undefined

        // ✅ การ์ดกรณีส่งข้อมูลไม่ครบ
        if (!requestNo || !stepKey) {
          setResponseStatus(event, 400)
          return resolve({
            success: false,
            code: 'BAD_REQUEST',
            error: 'ข้อมูลไม่ครบ',
            user_message: 'ข้อมูลไม่ครบ (request_no/step)'
          })
        }

        const originalName = file.originalFilename || 'unknown'
        const mimetype = (file as any).mimetype || ''
        const ext = path.extname(originalName).toLowerCase()

        // อ่านไฟล์ + hash
        const buffer = fs.readFileSync(file.filepath)
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

        // กันไฟล์เดิมซ้ำทั้งก้อน
        const dup = await FileModel.findOne({ fileSha256: sha256 }).lean()
        if (dup) {
          setResponseStatus(event, 409)
          return resolve({
            success: false,
            code: 'DUPLICATE_FILE',
            error: 'ไฟล์นี้ถูกอัปโหลดไปแล้ว',
            user_message: 'ไฟล์นี้อัปโหลดไปแล้ว'
          })
        }

        let parsed: ParseResult | null = null
        if (ext === '.txt') {
          const text = decodeThai(buffer)
          try {
            parsed = parseZAAR020(text)
          } catch (e: any) {
            if (e?.message === 'NOT_ZAAR020') {
              setResponseStatus(event, 400)
              return resolve({
                success: false,
                code: 'NOT_ZAAR020',
                error: 'ไฟล์นี้ไม่ใช่โปรแกรม ZAAR020',
                user_message: 'ไฟล์นี้ไม่ใช่รายงาน ZAAR020'
              })
            }
            if (e?.message === 'DUPLICATE_IN_FILE') {
              setResponseStatus(event, 400)
              return resolve({
                success: false,
                code: 'DUPLICATE_IN_FILE',
                error: 'ไฟล์มีเลขสินทรัพย์ซ้ำในตัวเอง',
                duplicates_in_file: e.preview,
                user_message: `ไฟล์มีเลข PEA ซ้ำในตัวเอง: ${(e.preview||[]).join(', ')}`
              })
            }
            setResponseStatus(event, 400)
            return resolve({
              success: false,
              code: 'PARSE_ERROR',
              error: e?.message || 'PARSE_ERROR',
              user_message: 'ไฟล์รูปแบบไม่ถูกต้อง (PARSE_ERROR)'
            })
          }

          const dbx = mongoose.connection.db
          if (!dbx) {
            setResponseStatus(event, 500)
            return resolve({
              success: false,
              code: 'NO_DB',
              error: 'ยังไม่ได้เชื่อมต่อฐานข้อมูล',
              user_message: 'เซิร์ฟเวอร์ยังไม่เชื่อมฐานข้อมูล (NO_DB)'
            })
          }

          const scope = (process.env.ASSET_SCOPE || 'global').toLowerCase() as 'global'|'per_unit'
          const { strings: peaStr, numbers: peaNum } = normalizePeaNumbers(parsed.pea_numbers)
          if (!peaStr.length) {
            setResponseStatus(event, 400)
            return resolve({
              success: false,
              code: 'NO_PEA_NUMBER',
              error: 'ไม่พบเลขในคอลัมน์ เลขที่สินทรัพย์เดิม/PEA',
              user_message: 'ไม่พบเลขในคอลัมน์ “เลขที่สินทรัพย์เดิม/PEA”'
            })
          }

          const match: any = { $or: [{ pea_no: { $in: peaStr } }, { pea_no: { $in: peaNum } }] }
          if (scope === 'per_unit') match.unit_display = parsed.unit_display

          const assetsCol = dbx.collection('assets')
          const existed = await assetsCol.find(match).project({ pea_no: 1, _id: 0 }).toArray()
          if (existed.length > 0) {
            const preview = existed.slice(0, 10).map(x => String(x.pea_no))
            setResponseStatus(event, 409)
            return resolve({
              success: false,
              code: 'DUPLICATE_ASSET',
              error: scope === 'per_unit'
                ? `พบเลขสินทรัพย์ซ้ำในหน่วยนี้ ${existed.length} รายการ`
                : `พบเลขสินทรัพย์ซ้ำในระบบ ${existed.length} รายการ`,
              duplicates_preview: preview,
              user_message: `พบเลขสินทรัพย์เดิม/PEA ซ้ำ: ${preview.join(', ')}`
            })
          }
        }

        // ตั้งชื่อไฟล์เก็บ
        const now = new Date()
        const datePart = now.toISOString().split('T')[0]
        const nameOnly = path.parse(originalName).name.replace(/\s+/g, '_')
        const storedFilename = `${stepKey}__${nameOnly}__${datePart}${ext}`

        // บันทึกไฟล์ลง files
        const created = await FileModel.create({
          request_no: requestNo,
          step: stepKey,
          storedFilename,
          originalFilename: originalName,
          mimetype,
          uploadedAt: now,
          documentNo,
          dateSigned,
          amount,
          data: buffer,

          fileSha256: sha256,
          program: parsed?.program,
          unit_display: parsed?.unit_display,
          asset_pea_numbers: parsed?.pea_numbers ?? [],
        })

        // ลงทะเบียนเลข PEA เข้า assets (เก็บ unit_display เสมอ)
        if (parsed?.pea_numbers?.length) {
          const db2 = mongoose.connection.db
          if (db2) {
            const assetsCol2 = db2.collection('assets')
            const { strings: peaStr } = normalizePeaNumbers(parsed.pea_numbers)
            if (peaStr.length) {
              await assetsCol2.bulkWrite(
                peaStr.map((n: string) => ({ insertOne: { document: { pea_no: n, unit_display: parsed!.unit_display, last_upload_id: created._id } } })),
                { ordered: false }
              ).catch(() => {})
            }
          }
        }

        // อัปเดต Timeline เป็น done
        if (requestNo && stepKey) {
          const tl = await Timeline.findOne({ request_no: requestNo }).lean()
          if (tl) {
            const steps = (tl as any).steps || []
            const idx = steps.findIndex((s: any) => String(s.no) === stepKey)
            if (idx >= 0) {
              await Timeline.updateOne(
                { request_no: requestNo, 'steps.no': steps[idx].no },
                {
                  $set: {
                    'steps.$.status': 'done',
                    'steps.$.file': storedFilename,
                    'steps.$.createdAt': now,
                    'steps.$.amount': amount ?? undefined,
                    'steps.$.date_signed': dateSigned ?? undefined,
                    'steps.$.document_no': documentNo ?? undefined,
                  },
                }
              )
            }
          }
        }

        return resolve({
          success: true,
          id: (created as any)._id,
          filename: storedFilename,
          originalName: originalName,
          createdAt: (created as any).createdAt ?? now,
          timelineUpdated: Boolean(requestNo && stepKey)
        })
      } catch (e) {
        console.error(e)
        setResponseStatus(event, 500)
        return resolve({
          success: false,
          code: 'UPLOAD_FAILED',
          error: 'อัปโหลดไม่สำเร็จ',
          user_message: 'อัปโหลดไม่สำเร็จ (เกิดข้อผิดพลาดภายในระบบ)'
        })
      }
    })
  })
})
