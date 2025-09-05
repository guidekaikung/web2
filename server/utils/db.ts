import mongoose from 'mongoose'

let cached = (globalThis as any)._mongoose as {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

if (!cached) {
  cached = (globalThis as any)._mongoose = { conn: null, promise: null }
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn

  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not defined in .env')

  if (!cached.promise) {
    console.log('[db] connecting to', uri)
    cached.promise = mongoose.connect(uri, { bufferCommands: false }).then(m => m)
  }

  cached.conn = await cached.promise
  return cached.conn
}
