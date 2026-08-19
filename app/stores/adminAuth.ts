import { defineStore } from 'pinia'

// Role yang diizinkan masuk lewat modal admin/superadmin.
const ALLOWED_ROLES = ['admin', 'superadmin']

// Ambil role user dari tabel `profiles` (kolom `role`, id = user id Supabase).
// Kalau nama tabel/kolom di project ini beda, tinggal sesuaikan query di sini
// — cuma satu tempat ini yang perlu diubah.
//
// CATATAN RLS: query ini jalan pakai sesi user yang baru login (bukan service
// role), jadi tabel `profiles` wajib punya RLS policy yang mengizinkan user
// baca row miliknya sendiri (mis. `auth.uid() = id`). Kalau policy belum ada/
// salah, query di bawah akan gagal (dianggap "tidak ada akses") walau role-nya
// sebenarnya sudah benar di database.
async function fetchRole(userId: string | undefined | null): Promise<string | null> {
  // Jaga-jaga: kalau id belum ada, jangan sampai query jalan dengan
  // `id=eq.undefined` (Supabase bakal nolak, uuid gak valid).
  if (!userId) return null

  const supabase = useSupabaseClient()

  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !data) return null

  return (data.role as string | null | undefined) ?? null
}

// Store untuk modal login rahasia superadmin/admin.
// Modal ini TIDAK ditautkan ke UI manapun — hanya dibuka lewat shortcut
// keyboard Alt+Shift+A (lihat app/plugins/admin-shortcut.client.ts).
export const useAdminAuthStore = defineStore('adminAuth', () => {
  const isOpen = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Role user yang sedang login (null kalau belum login / bukan admin).
  const role = ref<string | null>(null)

  // Status login admin/superadmin, dipakai di tempat lain (mis. tombol edit
  // mode yang cuma muncul kalau lagi login sebagai admin/superadmin).
  const isAuthenticated = computed(() => !!role.value && ALLOWED_ROLES.includes(role.value))

  // "Edit mode": begitu admin/superadmin login, mereka TETAP di halaman yang
  // lagi dibuka (gak di-redirect kemana-mana). Yang muncul cuma ikon toggle
  // edit mode; begitu edit mode dinyalain, baru muncul ikon-ikon tool satu
  // per satu (mulai dari ubah background — lihat OuterBackgroundButton.vue).
  const isEditMode = ref(false)

  function toggleEditMode() {
    isEditMode.value = !isEditMode.value
  }

  // Setiap kali status login Supabase berubah — termasuk pas sesi dipulihkan
  // otomatis saat refresh halaman, atau logout dari tempat lain — refresh
  // role-nya dari tabel `profiles`. Ini yang bikin `isAuthenticated` tetap
  // akurat walau bukan lewat login() di modal ini (mis. sesi lama yang masih
  // aktif).
  //
  // SENGAJA pakai useSupabaseSession() di sini, BUKAN useSupabaseUser().
  // useSupabaseUser() dari modul @nuxtjs/supabase diisi lewat
  // `client.auth.getClaims()`, yang memverifikasi JWT lokal lewat endpoint
  // JWKS (`.well-known/jwks.json`) — itu cuma jalan kalau project Supabase-nya
  // sudah pindah ke "JWT Signing Keys" asimetris (RS256/ES256). Project ini
  // masih pakai legacy JWT secret (HS256 — cek header token di
  // SUPABASE_KEY/.env, "alg":"HS256"), jadi getClaims() SELALU gagal diam-diam
  // (ditangkap `.catch(() => null)` di plugin-nya) dan useSupabaseUser() jadi
  // SELALU null walau sesi sebenarnya valid — akibatnya ikon pencil (edit
  // mode) & apa pun yang bergantung ke isAuthenticated hilang tiap reload,
  // padahal sesi login-nya sendiri gak pernah benar-benar putus.
  // useSupabaseSession() diisi lewat `getSession()` (baca token yang
  // tersimpan, TANPA verifikasi JWKS), jadi gak kena masalah yang sama.
  const supabaseSession = useSupabaseSession()
  watch(
    supabaseSession,
    async (session) => {
      const userId = session?.user?.id

      if (!userId) {
        role.value = null
      } else if (import.meta.client) {
        // Query ke `profiles` sengaja cuma di client. Di server, sesi hasil
        // decode cookie kadang belum lengkap (mis. id belum ke-set), jadi
        // query di sini ditunda sampai hydration selesai di browser.
        role.value = await fetchRole(userId)
      }

      // Kalau ternyata jadi logout/bukan admin lagi, matiin juga edit mode-nya.
      if (!isAuthenticated.value) {
        isEditMode.value = false
      }
    },
    { immediate: true }
  )

  function open() {
    error.value = null
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value ? close() : open()
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError || !data.user) {
        throw new Error('Email atau password salah.')
      }

      const userRole = await fetchRole(data.user.id)
      role.value = userRole

      if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
        await supabase.auth.signOut()
        throw new Error('Akun ini tidak memiliki akses admin/superadmin.')
      }

      // Sengaja TIDAK redirect — tetap di halaman/path yang sedang dibuka.
      // Setelah ini cuma ikon toggle edit mode yang muncul (lihat EditModeToggle.vue).
      close()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Terjadi kesalahan saat login.'
    } finally {
      loading.value = false
    }
  }

  return {
    isOpen,
    loading,
    error,
    isAuthenticated,
    isEditMode,
    open,
    close,
    toggle,
    toggleEditMode,
    login
  }
})
