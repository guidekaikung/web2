import mongoose from 'mongoose'

const RowSchema = new mongoose.Schema({
  request_no: { type: String, required: true, unique: true },
  book_no: { type: String, required: true },
  book_date: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
})

export default mongoose.models.Row || mongoose.model('Row', RowSchema)
