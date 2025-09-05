import mongoose from 'mongoose'

const approveSchema = new mongoose.Schema({
  step: String,
  operator: String,
  detail: String,
  document: String,
  document_no: String,
  date: String,
  comment: String,
  status: Number
}, { timestamps: true })

export default mongoose.models.Approve || mongoose.model('Approve', approveSchema)
