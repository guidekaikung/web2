// server/models/file.ts (ของเดิมไกด์ ใช้ต่อได้)
import mongoose from 'mongoose'
const { Schema } = mongoose

const fileSchema = new Schema({
  request_no:       { type: String, required: true, index: true },
  step:             { type: String, required: true, index: true },
  storedFilename:   { type: String, required: true },
  originalFilename: { type: String, required: true },
  mimetype:         { type: String },
  uploadedAt:       { type: Date, default: Date.now },
  documentNo:       { type: String },
  dateSigned:       { type: String },
  amount:           { type: Number },
  data:             { type: Schema.Types.Buffer },
  fileSha256:       { type: String, index: true },
  program:          { type: String },
  unit_display:     { type: String },
  asset_pea_numbers:{ type: [String], default: [] },
})
fileSchema.index({ request_no: 1, step: 1, uploadedAt: -1 })
fileSchema.index(
  { fileSha256: 1 },
  {
    unique: true,
    name: 'uniq_step1_hash_global',
    partialFilterExpression: { step: '1', fileSha256: { $exists: true } },
  }
)
export type FileDoc = {
  _id: mongoose.Types.ObjectId
  request_no: string
  step: string
  storedFilename: string
  originalFilename: string
  mimetype?: string
  uploadedAt: Date
  documentNo?: string
  dateSigned?: string
  amount?: number
  data: Buffer
  fileSha256?: string
  program?: string
  unit_display?: string
  asset_pea_numbers?: string[]
}
export default mongoose.models.File || mongoose.model('File', fileSchema)
