import { defineStore } from 'pinia'

export interface SitePage {
  id: string
  slug: string
  title: string
  createdAt: string
}

// Daftar halaman TAMBAHAN (di luar 'home' bawaan, root "/", lihat
// app/pages/index.vue) yang admin bikin lewat panel navigasi
// (PagesPanel.vue) — tabel sumbernya `canvas_pages` di Supabase (lihat
// migration 0018_canvas_pages.sql di project `be`). Tabel ini CUMA nyimpen
// "halaman apa aja yang ada & judulnya apa" (slug + title) — ISI tiap
// halaman (elemen teks/gambar canvas-nya) tetap disimpan di
// `canvas_elements` (canvasElements.ts) pakai page_key = slug halaman ini,
// BUKAN duplikasi di sini.
//
// PENTING — ini SENGAJA tabel & RPC terpisah dari `page_configs` yang
// sudah ada duluan di project `be` (dipakai project `fe`, sistem Page
// Builder block-based dengan draft/publish/rollback, lihat komentar di
// migration 0013_canvas_elements.sql yang jelasin perbedaan yang sama
// buat canvas_elements vs page_configs.blocks). `page_configs` juga sudah
// punya RPC bernama `create_page(p_title, p_route)` — TAPI itu punya
// semantik beda total (khusus superadmin, page_key di-random generate,
// nyeed `blocks` ala Page Builder yang gak pernah dirender dynamic-fe).
// Makanya RPC di sini dikasih nama BEDA (`create_canvas_page`) biar gak
// collision/nimpa function yang sudah ada punya `fe`.
//
// 'home' SENGAJA gak punya baris di tabel ini — dia implisit (selalu ada,
// route-nya root "/"), PagesPanel.vue nambahin entri "Beranda" secara
// manual di awal daftar, gak dari store ini.
//
// Store singleton biasa (BUKAN factory per-pageKey kayak canvasElements.ts)
// — cuma ada SATU daftar halaman buat seluruh app, dipakai bareng dari
// panel navigasi & buat validasi slug pas app/pages/[slug].vue nge-cek
// apakah slug di URL valid.
export const usePagesStore = defineStore('pages', () => {
  const { t } = useI18n()

  const pages = ref<SitePage[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  // Ambil semua halaman tambahan, urut dari yang paling lama dibuat —
  // dipanggil dari PagesPanel.vue (pas panel dibuka pertama kali) & dari
  // app/pages/[slug].vue (buat validasi slug di URL).
  async function load() {
    if (import.meta.server) return

    loading.value = true

    const supabase = useSupabaseClient()
    const { data, error: fetchError } = await supabase
      .from('canvas_pages')
      .select('id, slug, title, created_at')
      .order('created_at', { ascending: true })

    if (!fetchError && data) {
      pages.value = data.map(row => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        createdAt: row.created_at
      }))
    }
    // Kalau fetch gagal (mis. offline) — biarin `pages` apa adanya (kosong
    // di load pertama), sama kayak pola store lain di project ini.

    loading.value = false
  }

  // Tambah halaman baru lewat RPC `create_canvas_page` (SECURITY DEFINER,
  // cek is_admin() sendiri di server — lihat migration
  // 0018_canvas_pages.sql), jadi walau tabel `canvas_pages` gak punya
  // policy INSERT buat siapa pun, cuma admin/superadmin yang login yang
  // bisa lewat RPC ini.
  //
  // BEDA dari tool lain di project ini (background/canvas/font/section
  // visibility) yang pola draft+klik Save — nambah halaman di sini
  // LANGSUNG kesimpan ke database begitu diklik, gak lewat draft dulu.
  // Alasannya: bikin halaman baru itu perubahan STRUKTURAL ("halaman apa
  // aja yang ada"), bukan konten visual yang wajar buat di-preview dulu
  // sebelum disimpan — begitu dibuat, adminnya emang mau langsung pindah
  // ke sana buat mulai ngisi kontennya (lihat onAddPage() di
  // PagesPanel.vue).
  async function addPage(title: string, slug: string) {
    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const { data, error: rpcError } = await supabase
        .rpc('create_canvas_page', { p_slug: slug, p_title: title })
        .single()

      if (rpcError) {
        throw new Error(rpcError.message || t('admin.pages.genericError'))
      }
      if (!data) throw new Error(t('admin.pages.genericError'))

      const created: SitePage = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        createdAt: data.created_at
      }
      pages.value = [...pages.value, created]

      return created
    } catch (e: any) {
      error.value = e?.message || (e instanceof Error ? e.message : t('admin.pages.genericError'))
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    pages,
    loading,
    saving,
    error,
    load,
    addPage
  }
})
