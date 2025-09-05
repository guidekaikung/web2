import mongoose from 'mongoose'
const { Schema } = mongoose

const StepSchema = new Schema(
  {
    no:             { type: Schema.Types.Mixed, required: true }, // รองรับ '4.1'
    operator:       { type: String, default: '' },
    detail:         { type: String, default: '' },
    status:         { type: String, enum: ['pending', 'done'], default: 'pending' },
    document:       { type: String, default: '' },
    document_no:    { type: String, default: '' },
    date:           { type: String, default: '' },
    comment:        { type: String, default: '' },
    file:           { type: String, default: '' },
    amount:         { type: Number },
    date_signed:    { type: String, default: '' },
    document_hint:  { type: String, default: '' },
    createdAt:      { type: Date },
    url:            { type: String, default: '' },
  },
  { _id: false }
)

const TimelineSchema = new Schema({
  request_no: { type: String, required: true, unique: true, index: true },
  steps:      { type: [StepSchema], default: [] }
})

export default mongoose.models.Timeline || mongoose.model('Timeline', TimelineSchema)
