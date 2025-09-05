import Row from '~/server/models/Row'
import dbConnect from '~/server/utils/db'

export default defineEventHandler(async () => {
  await dbConnect()
  const rows = await Row.find().sort({ created_at: -1 }).lean()
  return rows
})
