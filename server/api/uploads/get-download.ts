import FileModel from '~/server/models/file'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id?.toString()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file id' })
  }

  const file = await FileModel.findById(id)
  if (!file || !file.data) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  setHeader(event, 'Content-Type', file.mimetype || 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`)


  return file.data
})
