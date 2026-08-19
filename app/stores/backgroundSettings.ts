import { defineStore } from 'pinia'

export type BackgroundMode = 'color' | 'image'

// Pengaturan background CONTENT (bagian DALAM app-shell / "layar HP"-nya
// sendiri) — BUKAN area putih di luar container. Sumber kebenarannya sekarang
// tabel `site_settings` di Supabase (kolom content_bg_*, lihat migration
// 0012_content_background_setting.sql di project `be`), bukan localStorage
// lagi, supaya SEMUA pengunjung lihat background yang sama — bukan cuma
// browser admin yang pernah nge-set.
//
// Ada dua "lapis" state di sini:
//   - mode/color/imageDataUrl  = state TERSIMPAN (sudah di database, ini
//     yang dilihat SEMUA pengunjung & yang dipakai buat apply() ulang tiap
//     kali app di-reload).
//   - draftMode/draftColor/draftImageDataUrl = state yang lagi DIEDIT admin
//     di panel (lihat OuterBackgroundButton.vue). Begitu draft ini berubah,
//     LANGSUNG di-apply ke <html> juga (live preview, lihat applyDraft())
//     supaya admin bisa lihat hasilnya di background asli — TAPI belum
//     ditulis ke database sampai admin klik tombol Save (lihat
//     SaveContentBackgroundButton.vue). Kalau admin reload tanpa Save,
//     load() akan nimpa lagi pakai state TERSIMPAN dari database, jadi
//     preview yang belum di-save otomatis "hilang" (memang belum pernah
//     kesimpan) — bukan bug.
export const useBackgroundStore = defineStore('backgroundSettings', () => {
  const mode = ref<BackgroundMode>('color')
  const color = ref<string | null>(null)
  const imageDataUrl = ref<string | null>(null)

  const draftMode = ref<BackgroundMode>('color')
  const draftColor = ref<string | null>(null)
  const draftImageDataUrl = ref<string | null>(null)

  const saving = ref(false)
  const error = ref<string | null>(null)

  // Ada perubahan yang belum disimpan? Dipakai SaveContentBackgroundButton.vue
  // buat nentuin kapan tombol Save-nya muncul.
  const isDirty = computed(() =>
    draftMode.value !== mode.value
    || draftColor.value !== color.value
    || draftImageDataUrl.value !== imageDataUrl.value
  )

  // Helper bersama: terapkan satu set nilai (mode/color/image) ke <html>.
  // Dipakai oleh apply() (state TERSIMPAN) & applyDraft() (state DRAFT,
  // buat live preview) supaya logic nge-set/hapus custom property-nya gak
  // dobel-nulis di dua tempat.
  function applyValues(m: BackgroundMode, c: string | null, img: string | null) {
    if (import.meta.server) return

    const root = document.documentElement

    if (m === 'image' && img) {
      root.style.setProperty('--app-content-bg-color', 'transparent')
      root.style.setProperty('--app-content-bg-image', `url("${img}")`)
    } else if (m === 'color' && c) {
      root.style.setProperty('--app-content-bg-color', c)
      root.style.setProperty('--app-content-bg-image', 'none')
    } else {
      // Belum pernah di-custom — hapus override-nya biar CSS fallback di
      // main.css balik ke --ui-bg.
      root.style.removeProperty('--app-content-bg-color')
      root.style.removeProperty('--app-content-bg-image')
    }
  }

  // Terapkan state TERSIMPAN ke <html>. Dipanggil dari load() pas app jalan.
  function apply() {
    applyValues(mode.value, color.value, imageDataUrl.value)
  }

  // Terapkan state DRAFT ke <html> — INI yang bikin live preview: begitu
  // admin ganti warna/upload gambar di panel, background asli LANGSUNG
  // berubah, walau belum kesimpan ke database. Dipanggil dari
  // setDraftColor/setDraftImageFile/resetDraftToThemeDefault.
  function applyDraft() {
    applyValues(draftMode.value, draftColor.value, draftImageDataUrl.value)
  }

  // Sinkronkan draft dari nilai tersimpan sekarang — dipanggil dari load()
  // di awal.
  function resetDraft() {
    draftMode.value = mode.value
    draftColor.value = color.value
    draftImageDataUrl.value = imageDataUrl.value
  }

  // Ambil setting tersimpan dari `site_settings` (baris singleton id=1) &
  // terapkan ke <html>. Dipanggil sekali dari
  // app/plugins/background-settings.client.ts pas app pertama kali jalan.
  async function load() {
    if (import.meta.server) return

    const supabase = useSupabaseClient()

    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select('content_bg_mode, content_bg_color, content_bg_image')
      .eq('id', 1)
      .single()

    if (!fetchError && data) {
      mode.value = data.content_bg_mode === 'image' ? 'image' : 'color'
      color.value = data.content_bg_color ?? null
      imageDataUrl.value = data.content_bg_image ?? null
    }
    // Kalau fetch gagal (mis. offline) — biarin default (mode='color',
    // color=null), CSS fallback ke --ui-bg tetap jalan, gak nge-blank-in app.

    resetDraft()
    apply()
  }

  // Dipanggil dari input warna di panel (lihat OuterBackgroundButton.vue).
  // Update draft & LANGSUNG live-preview ke background asli (applyDraft) —
  // tapi database BELUM berubah sampai klik Save.
  function setDraftColor(next: string) {
    draftMode.value = 'color'
    draftColor.value = next
    draftImageDataUrl.value = null
    applyDraft()
  }

  // Dipanggil dari file input di panel. Sama kayak setDraftColor, live
  // preview langsung, database belum berubah.
  function setDraftImageFile(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        draftMode.value = 'image'
        draftImageDataUrl.value = reader.result as string
        applyDraft()
        resolve()
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  // Tombol "Reset ke default" di panel — langsung live-preview balik ke
  // fallback tema juga, tetap butuh Save buat benar-benar kesimpan ke
  // database, konsisten sama aksi lain di panel ini.
  function resetDraftToThemeDefault() {
    draftMode.value = 'color'
    draftColor.value = null
    draftImageDataUrl.value = null
    applyDraft()
  }

  // Commit draft -> tersimpan: kirim ke RPC `update_content_background`
  // (SECURITY DEFINER, cek is_admin() sendiri di server — lihat migration
  // 0012_content_background_setting.sql di project `be`), baru kalau
  // sukses apply ke <html>. Dipanggil dari tombol Save
  // (SaveContentBackgroundButton.vue).
  async function save() {
    if (import.meta.server || !isDirty.value) return

    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const { error: rpcError } = await supabase.rpc('update_content_background', {
        p_mode: draftMode.value,
        p_color: draftColor.value,
        p_image: draftImageDataUrl.value
      })

      if (rpcError) throw rpcError

      mode.value = draftMode.value
      color.value = draftColor.value
      imageDataUrl.value = draftImageDataUrl.value
      apply()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan background.'
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    mode,
    color,
    imageDataUrl,
    draftMode,
    draftColor,
    draftImageDataUrl,
    isDirty,
    saving,
    error,
    load,
    resetDraft,
    setDraftColor,
    setDraftImageFile,
    resetDraftToThemeDefault,
    save
  }
})
