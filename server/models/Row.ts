import mongoose from 'mongoose'
import type { Model, Document } from 'mongoose'

const { Schema, model, models } = mongoose

export interface IRow extends Document {
  request_no: string
  book_no: string
  book_date: string
  created_at: Date
  updated_at: Date
  step3_at?: Date
  last_status?: string
  amount_sell?: number
  comment?: string
}

const RowSchema = new Schema<IRow>(
  {
    request_no: { type: String, required: true, unique: true, index: true },
    book_no:    { type: String, required: true },
    book_date:  { type: String, required: true },
    step3_at:    { type: Date },
    last_status: { type: String },
    amount_sell: { type: Number, default: 0 },
    comment:     { type: String },
  },
  {
    versionKey: false,
    strict: true,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const RowModel: Model<IRow> = (models.Row as Model<IRow>) || model<IRow>('Row', RowSchema)
export default RowModel
