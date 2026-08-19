import { defineStore } from 'pinia'

export type SectionBgMode = 'color' | 'image'

// Tinggi DEFAULT header/footer sebelum admin pernah nge-custom (dipakai
// buat nilai awal ref di bawah & tombol "Reset ke default" di panel) — bukan
// lagi fixed permanen, admin sekarang bisa ubah lewat SectionVisibilityButton.vue
// (kolom header_height/footer_height, lihat migration
// 0017_header_footer_height_overflow.sql di project `be`).
export const DEFAULT_HEADER_HEIGHT_PX = 88
export const DEFAULT_FOOTER_HEIGHT_PX = 88

// Pengaturan GLOBAL header & footer: tampil/sembunyi + background masing-
// masing (lihat SiteHeader.vue / SiteFooter.vue, dipasang di app.vue) —
// dikontrol admin lewat SectionVisibilityButton.vue. Disimpan sebagai kolom
// di site_settings (singleton config, sama kayak content_bg_* &
// font_presets) — lihat migration 0015_header_footer.sql (visibilitas) &
// 0016_header_footer_background.sql (background) di project `be`.
//
// Kalau visible = false, section-nya TETAP ke-render (elemen-elemennya
// tetap ada di database) buat pengunjung biasa cuma disembunyikan (gak
// di-render sama sekali); admin yang lagi edit mode TETAP bisa lihat & edit
// isinya (ditandain outline putus-putus + label "disembunyikan", lihat
// SiteHeader.vue/SiteFooter.vue), biar bisa nyiapin isinya duluan sebelum
// beneran ditampilin ke publik.
//
// Background header/footer pakai pola PERSIS sama kayak backgroundSettings.ts
// (content background) — mode 'color' atau 'image', tapi diterapkan LOKAL
// lewat inline style di SiteHeader.vue/SiteFooter.vue sendiri (bukan custom
// property di <html>), soalnya header/footer itu kotak terbatas (fixed
// height), bukan seluruh halaman.
//
// Sama kayak store lain di project ini: ada state TERSIMPAN vs DRAFT — ubah
// apa pun di panel cuma ubah draft (+ live preview LANGSUNG kelihatan di
// header/footer aslinya), baru kesimpan ke database pas klik Save
// (SaveEditsButton.vue).
export const useSectionVisibilityStore = defineStore('sectionVisibility', () => {
  const adminAuth = useAdminAuthStore()

  const headerVisible = ref(true)
  const footerVisible = ref(true)

  const headerBgMode = ref<SectionBgMode>('color')
  const headerBgColor = ref<string | null>(null)
  const headerBgImage = ref<string | null>(null)

  const footerBgMode = ref<SectionBgMode>('color')
  const footerBgColor = ref<string | null>(null)
  const footerBgImage = ref<string | null>(null)

  const headerHeight = ref(DEFAULT_HEADER_HEIGHT_PX)
  const footerHeight = ref(DEFAULT_FOOTER_HEIGHT_PX)
  const headerClipOverflow = ref(true)
  const footerClipOverflow = ref(true)

  const draftHeaderVisible = ref(true)
  const draftFooterVisible = ref(true)

  const draftHeaderBgMode = ref<SectionBgMode>('color')
  const draftHeaderBgColor = ref<string | null>(null)
  const draftHeaderBgImage = ref<string | null>(null)

  const draftFooterBgMode = ref<SectionBgMode>('color')
  const draftFooterBgColor = ref<string | null>(null)
  const draftFooterBgImage = ref<string | null>(null)

  const draftHeaderHeight = ref(DEFAULT_HEADER_HEIGHT_PX)
  const draftFooterHeight = ref(DEFAULT_FOOTER_HEIGHT_PX)
  const draftHeaderClipOverflow = ref(true)
  const draftFooterClipOverflow = ref(true)

  const saving = ref(false)
  const error = ref<string | null>(null)

  const isDirty = computed(() =>
    draftHeaderVisible.value !== headerVisible.value
    || draftFooterVisible.value !== footerVisible.value
    || draftHeaderBgMode.value !== headerBgMode.value
    || draftHeaderBgColor.value !== headerBgColor.value
    || draftHeaderBgImage.value !== headerBgImage.value
    || draftFooterBgMode.value !== footerBgMode.value
    || draftFooterBgColor.value !== footerBgColor.value
    || draftFooterBgImage.value !== footerBgImage.value
    || draftHeaderHeight.value !== headerHeight.value
    || draftFooterHeight.value !== footerHeight.value
    || draftHeaderClipOverflow.value !== headerClipOverflow.value
    || draftFooterClipOverflow.value !== footerClipOverflow.value
  )

  // Admin edit mode lihat draft (biar toggle di panel langsung keliatan
  // efeknya), visitor biasa lihat state TERSIMPAN — logic ini dulu ke-
  // duplikat di SiteHeader.vue & SiteFooter.vue, sekarang disatukan di sini
  // + dipakai juga sama pages/index.vue buat ngitung sisa tinggi layar
  // (lihat headerRenderedHeight/footerRenderedHeight).
  const isEditable = computed(() => adminAuth.isAuthenticated && adminAuth.isEditMode)

  const headerIsVisible = computed(() => (isEditable.value ? draftHeaderVisible.value : headerVisible.value))
  const footerIsVisible = computed(() => (isEditable.value ? draftFooterVisible.value : footerVisible.value))

  // Admin edit mode: section TETAP dirender walau nonaktif (kotak putus-
  // putus), biar bisa nyiapin isinya duluan. Visitor biasa: gak dirender
  // sama sekali kalau nonaktif -> gak makan tinggi layar sama sekali.
  const headerShouldRender = computed(() => headerIsVisible.value || isEditable.value)
  const footerShouldRender = computed(() => footerIsVisible.value || isEditable.value)

  // Tinggi & clip-overflow yang LAGI DIPAKAI (draft pas edit mode, tersimpan
  // pas visitor biasa) — dipakai SiteHeader.vue/SiteFooter.vue buat style
  // kotaknya sendiri.
  const headerEffectiveHeight = computed(() => (isEditable.value ? draftHeaderHeight.value : headerHeight.value))
  const footerEffectiveHeight = computed(() => (isEditable.value ? draftFooterHeight.value : footerHeight.value))
  const headerEffectiveClipOverflow = computed(() =>
    (isEditable.value ? draftHeaderClipOverflow.value : headerClipOverflow.value)
  )
  const footerEffectiveClipOverflow = computed(() =>
    (isEditable.value ? draftFooterClipOverflow.value : footerClipOverflow.value)
  )

  // Tinggi yang BENERAN direbut header/footer dari layar saat ini — 0 kalau
  // lagi gak dirender sama sekali. Dipakai pages/index.vue buat nyisain
  // tinggi content persis pas "100dvh dikurangi ini", jadi footer gak
  // kedorong keluar layar & jadi harus di-scroll buat keliatan.
  const headerRenderedHeight = computed(() => (headerShouldRender.value ? headerEffectiveHeight.value : 0))
  const footerRenderedHeight = computed(() => (footerShouldRender.value ? footerEffectiveHeight.value : 0))

  function resetDraft() {
    draftHeaderVisible.value = headerVisible.value
    draftFooterVisible.value = footerVisible.value
    draftHeaderBgMode.value = headerBgMode.value
    draftHeaderBgColor.value = headerBgColor.value
    draftHeaderBgImage.value = headerBgImage.value
    draftFooterBgMode.value = footerBgMode.value
    draftFooterBgColor.value = footerBgColor.value
    draftFooterBgImage.value = footerBgImage.value
    draftHeaderHeight.value = headerHeight.value
    draftFooterHeight.value = footerHeight.value
    draftHeaderClipOverflow.value = headerClipOverflow.value
    draftFooterClipOverflow.value = footerClipOverflow.value
  }

  async function load() {
    if (import.meta.server) return

    const supabase = useSupabaseClient()

    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select(
        'header_visible, footer_visible, header_bg_mode, header_bg_color, header_bg_image, footer_bg_mode, footer_bg_color, footer_bg_image, header_height, footer_height, header_clip_overflow, footer_clip_overflow'
      )
      .eq('id', 1)
      .single()

    if (!fetchError && data) {
      headerVisible.value = data.header_visible ?? true
      footerVisible.value = data.footer_visible ?? true
      headerBgMode.value = data.header_bg_mode === 'image' ? 'image' : 'color'
      headerBgColor.value = data.header_bg_color ?? null
      headerBgImage.value = data.header_bg_image ?? null
      footerBgMode.value = data.footer_bg_mode === 'image' ? 'image' : 'color'
      footerBgColor.value = data.footer_bg_color ?? null
      footerBgImage.value = data.footer_bg_image ?? null
      headerHeight.value = data.header_height ?? DEFAULT_HEADER_HEIGHT_PX
      footerHeight.value = data.footer_height ?? DEFAULT_FOOTER_HEIGHT_PX
      headerClipOverflow.value = data.header_clip_overflow ?? true
      footerClipOverflow.value = data.footer_clip_overflow ?? true
    }

    resetDraft()
  }

  function setDraftHeaderVisible(value: boolean) {
    draftHeaderVisible.value = value
  }

  function setDraftFooterVisible(value: boolean) {
    draftFooterVisible.value = value
  }

  // --- Background header ---
  function setDraftHeaderBgColor(value: string) {
    draftHeaderBgMode.value = 'color'
    draftHeaderBgColor.value = value
    draftHeaderBgImage.value = null
  }

  function setDraftHeaderBgImageFile(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        draftHeaderBgMode.value = 'image'
        draftHeaderBgImage.value = reader.result as string
        resolve()
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  function resetDraftHeaderBgToDefault() {
    draftHeaderBgMode.value = 'color'
    draftHeaderBgColor.value = null
    draftHeaderBgImage.value = null
  }

  // --- Background footer ---
  function setDraftFooterBgColor(value: string) {
    draftFooterBgMode.value = 'color'
    draftFooterBgColor.value = value
    draftFooterBgImage.value = null
  }

  function setDraftFooterBgImageFile(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        draftFooterBgMode.value = 'image'
        draftFooterBgImage.value = reader.result as string
        resolve()
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  function resetDraftFooterBgToDefault() {
    draftFooterBgMode.value = 'color'
    draftFooterBgColor.value = null
    draftFooterBgImage.value = null
  }

  // --- Tinggi & clip-overflow header/footer ---
  // `value` di-clamp ke minimal 20px di sisi client (server juga nolak <= 0,
  // lihat migration 0017) — kotak sekecil apa pun masih butuh sedikit ruang
  // biar tombol "+" tambah elemen-nya sendiri gak keimpit.
  function setDraftHeaderHeight(value: number) {
    if (!Number.isFinite(value)) return
    draftHeaderHeight.value = Math.max(20, Math.round(value))
  }

  function setDraftFooterHeight(value: number) {
    if (!Number.isFinite(value)) return
    draftFooterHeight.value = Math.max(20, Math.round(value))
  }

  function setDraftHeaderClipOverflow(value: boolean) {
    draftHeaderClipOverflow.value = value
  }

  function setDraftFooterClipOverflow(value: boolean) {
    draftFooterClipOverflow.value = value
  }

  // Commit draft -> tersimpan lewat RPC `save_section_visibility` (SECURITY
  // DEFINER, cek is_admin() sendiri — lihat migration
  // 0016_header_footer_background.sql di project `be`).
  async function save() {
    if (import.meta.server || !isDirty.value) return

    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const { error: rpcError } = await supabase.rpc('save_section_visibility', {
        p_header_visible: draftHeaderVisible.value,
        p_footer_visible: draftFooterVisible.value,
        p_header_bg_mode: draftHeaderBgMode.value,
        p_header_bg_color: draftHeaderBgColor.value,
        p_header_bg_image: draftHeaderBgImage.value,
        p_footer_bg_mode: draftFooterBgMode.value,
        p_footer_bg_color: draftFooterBgColor.value,
        p_footer_bg_image: draftFooterBgImage.value,
        p_header_height: draftHeaderHeight.value,
        p_footer_height: draftFooterHeight.value,
        p_header_clip_overflow: draftHeaderClipOverflow.value,
        p_footer_clip_overflow: draftFooterClipOverflow.value
      })

      if (rpcError) throw rpcError

      headerVisible.value = draftHeaderVisible.value
      footerVisible.value = draftFooterVisible.value
      headerBgMode.value = draftHeaderBgMode.value
      headerBgColor.value = draftHeaderBgColor.value
      headerBgImage.value = draftHeaderBgImage.value
      footerBgMode.value = draftFooterBgMode.value
      footerBgColor.value = draftFooterBgColor.value
      footerBgImage.value = draftFooterBgImage.value
      headerHeight.value = draftHeaderHeight.value
      footerHeight.value = draftFooterHeight.value
      headerClipOverflow.value = draftHeaderClipOverflow.value
      footerClipOverflow.value = draftFooterClipOverflow.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan pengaturan header/footer.'
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    headerVisible,
    footerVisible,
    headerBgMode,
    headerBgColor,
    headerBgImage,
    footerBgMode,
    footerBgColor,
    footerBgImage,
    headerHeight,
    footerHeight,
    headerClipOverflow,
    footerClipOverflow,
    draftHeaderVisible,
    draftFooterVisible,
    draftHeaderBgMode,
    draftHeaderBgColor,
    draftHeaderBgImage,
    draftFooterBgMode,
    draftFooterBgColor,
    draftFooterBgImage,
    draftHeaderHeight,
    draftFooterHeight,
    draftHeaderClipOverflow,
    draftFooterClipOverflow,
    isDirty,
    isEditable,
    headerIsVisible,
    footerIsVisible,
    headerShouldRender,
    footerShouldRender,
    headerEffectiveHeight,
    footerEffectiveHeight,
    headerEffectiveClipOverflow,
    footerEffectiveClipOverflow,
    headerRenderedHeight,
    footerRenderedHeight,
    saving,
    error,
    load,
    resetDraft,
    setDraftHeaderVisible,
    setDraftFooterVisible,
    setDraftHeaderBgColor,
    setDraftHeaderBgImageFile,
    resetDraftHeaderBgToDefault,
    setDraftFooterBgColor,
    setDraftFooterBgImageFile,
    resetDraftFooterBgToDefault,
    setDraftHeaderHeight,
    setDraftFooterHeight,
    setDraftHeaderClipOverflow,
    setDraftFooterClipOverflow,
    save
  }
})
