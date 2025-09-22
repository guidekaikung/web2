import dbConnect from '~/server/utils/db'
import { defineEventHandler, setResponseStatus } from 'h3'
import mongoose from 'mongoose'
import FileModel from '~/server/models/file'
import Timeline from '~/server/models/Timeline'

export default defineEventHandler(async (event) => {
  await dbConnect()

  const id = event.context.params?.id
  if (!id || !mongoose.isValidObjectId(id)) {
    setResponseStatus(event, 400)
    return { success: false, code: 'BAD_ID', user_message: 'รหัสไฟล์ไม่ถูกต้อง' }
  }

  // 👇 cast type ให้ชัดเจนกัน TS 2339
  const file = await FileModel.findById(id)
    .select('_id request_no step')
    .lean()
    .exec() as null | { _id: any; request_no: string; step: string | number }

  if (!file?._id) {
    setResponseStatus(event, 404)
    return { success: false, code: 'NOT_FOUND', user_message: 'ไม่พบไฟล์' }
  }

  // ลบไฟล์ออก
  await FileModel.deleteOne({ _id: file._id })

  // ย้อนสถานะ timeline -> pending และล้าง reference ไฟล์/เวลา
  const unsetFields: Record<string, any> = {
    'steps.$.file': '',
    'steps.$.createdAt': '',
    'steps.$.document_no': '',
    'steps.$.amount': '',
    'steps.$.date_signed': ''
  }

  // บางระบบเก็บ steps.no เป็น string บางทีเป็น number
  // ลองอัปเดตด้วย string ก่อน ไม่ผ่านค่อยลอง number
  const stepAsString = typeof file.step === 'string' ? file.step : String(file.step)
  let res = await Timeline.updateOne(
    { request_no: file.request_no, 'steps.no': stepAsString },
    { $set: { 'steps.$.status': 'pending' }, $unset: unsetFields }
  )

  if (res.modifiedCount === 0) {
    const stepAsNumber = typeof file.step === 'number' ? file.step : Number(file.step)
    if (!Number.isNaN(stepAsNumber)) {
      res = await Timeline.updateOne(
        { request_no: file.request_no, 'steps.no': stepAsNumber },
        { $set: { 'steps.$.status': 'pending' }, $unset: unsetFields }
      )
    }
  }

  return { success: true, modified: res.modifiedCount, user_message: 'ลบไฟล์เรียบร้อย' }
})
