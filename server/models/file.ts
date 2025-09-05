// server/models/file.ts
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

  // ✅ ฟิลด์ใหม่
  fileSha256:       { type: String, index: true },     // sparse unique index ด้านล่าง
  program:          { type: String },
  unit_display:     { type: String },
  asset_pea_numbers:{ type: [String], default: [] },
})

// เดิม
fileSchema.index({ request_no: 1, step: 1, uploadedAt: -1 })
// ✅ กันไฟล์ซ้ำทั้งก้อน
fileSchema.index({ fileSha256: 1 }, { unique: true, sparse: true, name: 'uniq_fileSha256' })

export default mongoose.models.File || mongoose.model('File', fileSchema)
