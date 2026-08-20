import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {}

  // Resolusi cerdas untuk field email (mendukung nama variabel dinamis seperti email, email_xxx, atau nilai berformat email)
  let email = body.email || body.username || body.identifier
  if (!email) {
    for (const [k, v] of Object.entries(body)) {
      if (k.toLowerCase().includes('email') && typeof v === 'string' && v.trim()) {
        email = v
        break
      }
    }
  }
  if (!email) {
    for (const [_, v] of Object.entries(body)) {
      if (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
        email = v
        break
      }
    }
  }

  // Resolusi cerdas untuk field password (mendukung nama variabel dinamis seperti password, password_xxx, pwd, dll)
  let password = body.password || body.pass || body.pwd
  if (!password) {
    for (const [k, v] of Object.entries(body)) {
      if ((k.toLowerCase().includes('pass') || k.toLowerCase().includes('pwd')) && typeof v === 'string' && v.trim()) {
        password = v
        break
      }
    }
  }

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email dan password wajib diisi.'
    })
  }

  try {
    const client = await serverSupabaseClient(event)
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password)
    })

    if (error || !data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: error?.message || 'Email atau password salah.'
      })
    }

    return {
      success: true,
      message: 'Berhasil login!',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role
      },
      session: {
        access_token: data.session?.access_token,
        expires_at: data.session?.expires_at
      }
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Terjadi kesalahan pada server saat proses login.'
    })
  }
})
