// server/utils/ensure-step.ts
import Timeline from '~/server/models/Timeline'
import FileModel from '~/server/models/file'

export async function ensureStep1Done(requestNo: string) {
  // วิธีที่เชื่อถือได้ที่สุด: ดู Timeline ว่า step 1 = done
  const tl = await Timeline.findOne({ request_no: requestNo }).lean()
  const steps = (tl as any)?.steps || []
  const s1 = steps.find((s: any) => String(s.no) === '1')
  if (!s1 || s1.status !== 'done') {
    const err: any = new Error('STEP1_NOT_DONE')
    err.statusCode = 409
    err.payload = { ok: false, code: 'STEP1_NOT_DONE', message: 'ยังไม่ได้อัปโหลดไฟล์ Step 1 ให้ผ่าน' }
    throw err
  }

  // ป้องกันงานตกหล่น: ต้องมีไฟล์ Step 1 ที่มี hash และ (ถ้าเป็น .txt) เก็บผลพาร์สไว้
  const f = await FileModel.findOne({ request_no: requestNo, step: '1', fileSha256: { $exists: true } }).lean()
  if (!f) {
    const err: any = new Error('STEP1_FILE_NOT_FOUND')
    err.statusCode = 409
    err.payload = { ok: false, code: 'STEP1_FILE_NOT_FOUND', message: 'ไม่พบไฟล์จาก Step 1 ที่ผ่านการตรวจ' }
    throw err
  }

  return { ok: true }
}
