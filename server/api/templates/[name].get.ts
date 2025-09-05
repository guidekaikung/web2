import { defineEventHandler, getRouterParam, createError, setHeader, sendStream } from 'h3'
import { createReadStream, existsSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler((event) => {
  const name = getRouterParam(event, 'name') // ex. ZAAR020.docx
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template name' })
  }

  const filePath = join(process.cwd(), 'public', 'templates', name)
  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  // บังคับดาวน์โหลด
  setHeader(event, 'Content-Disposition', `attachment; filename="${name}"`)
  return sendStream(event, createReadStream(filePath))
})
