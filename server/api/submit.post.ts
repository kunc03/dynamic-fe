export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}

  // Menerima data payload form dinamis
  return {
    success: true,
    message: 'Data formulir berhasil diterima!',
    receivedAt: new Date().toISOString(),
    data: body
  }
})
