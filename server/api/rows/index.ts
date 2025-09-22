import Row from '~/server/models/Row'
import dbConnect from '~/server/utils/db'

export default defineEventHandler(async () => {
  await dbConnect()
  const rows = await Row.find(
    {},
    'request_no book_no book_date last_status amount_sell comment created_at step3_at'
  )
    .sort({ created_at: -1, _id: -1 })
    .lean()
  return rows
})
