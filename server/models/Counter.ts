import mongoose from 'mongoose'
import type { Model, Document } from 'mongoose'
const { Schema, model, models } = mongoose

export interface ICounter extends Document {
  name: string
  seq: number
}

const CounterSchema = new Schema<ICounter>({
  name: { type: String, required: true, unique: true },
  seq:  { type: Number, default: 0 },
}, { timestamps: true })

const CounterModel: Model<ICounter> =
  (models.Counter as Model<ICounter>) || model<ICounter>('Counter', CounterSchema)

export default CounterModel
