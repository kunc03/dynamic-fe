import { defineStore } from 'pinia'

export type SectionBgMode = 'color' | 'image'

export const DEFAULT_HEADER_HEIGHT_PX = 88
export const DEFAULT_FOOTER_HEIGHT_PX = 88

export interface PageSectionVisibility {
  header: boolean
  footer: boolean
}

const DEFAULT_PAGE_VISIBILITY: PageSectionVisibility = {
  header: true,
  footer: true
}

// Pengaturan Header & Footer:
// - Visibilitas (Show/Hide) sekarang diatur PER-HALAMAN (disimpan di `canvas_page_backgrounds`,
//   migration 0029_canvas_page_header_footer_visibility.sql).
// - Desain / Ukuran kotak Header & Footer (tinggi, overflow, warna/gambar background)
//   tetap bersifat global untuk konsistensi seluruh aplikasi (disimpan di `site_settings`).
export const useSectionVisibilityStore = defineStore('sectionVisibility', () => {
  const adminAuth = useAdminAuthStore()

  // Visibilitas per halaman
  const pageVisibilities = ref<Record<string, PageSectionVisibility>>({})
  const draftPageVisibilities = ref<Record<string, PageSectionVisibility>>({})

  // Pengaturan global bentuk & background header/footer
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

  function getSavedHeaderVisible(pageKey: string): boolean {
    return pageVisibilities.value[pageKey]?.header ?? DEFAULT_PAGE_VISIBILITY.header
  }

  function getSavedFooterVisible(pageKey: string): boolean {
    return pageVisibilities.value[pageKey]?.footer ?? DEFAULT_PAGE_VISIBILITY.footer
  }

  function getDraftHeaderVisible(pageKey: string): boolean {
    return draftPageVisibilities.value[pageKey]?.header ?? getSavedHeaderVisible(pageKey)
  }

  function getDraftFooterVisible(pageKey: string): boolean {
    return draftPageVisibilities.value[pageKey]?.footer ?? getSavedFooterVisible(pageKey)
  }

  function isPageVisibilityDirty(pageKey: string): boolean {
    const savedH = getSavedHeaderVisible(pageKey)
    const savedF = getSavedFooterVisible(pageKey)
    const draftH = getDraftHeaderVisible(pageKey)
    const draftF = getDraftFooterVisible(pageKey)
    return savedH !== draftH || savedF !== draftF
  }

  const isGlobalDirty = computed(() =>
    draftHeaderBgMode.value !== headerBgMode.value
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

  const isDirty = computed(() => {
    if (isGlobalDirty.value) return true
    const allKeys = new Set([...Object.keys(pageVisibilities.value), ...Object.keys(draftPageVisibilities.value)])
    for (const key of allKeys) {
      if (isPageVisibilityDirty(key)) return true
    }
    return false
  })

  const isEditable = computed(() => adminAuth.isAuthenticated && adminAuth.isEditMode)

  function isHeaderVisible(pageKey: string): boolean {
    return isEditable.value ? getDraftHeaderVisible(pageKey) : getSavedHeaderVisible(pageKey)
  }

  function isFooterVisible(pageKey: string): boolean {
    return isEditable.value ? getDraftFooterVisible(pageKey) : getSavedFooterVisible(pageKey)
  }

  function setDraftPageHeaderVisible(pageKey: string, value: boolean) {
    draftPageVisibilities.value = {
      ...draftPageVisibilities.value,
      [pageKey]: {
        header: value,
        footer: getDraftFooterVisible(pageKey)
      }
    }
  }

  function setDraftPageFooterVisible(pageKey: string, value: boolean) {
    draftPageVisibilities.value = {
      ...draftPageVisibilities.value,
      [pageKey]: {
        header: getDraftHeaderVisible(pageKey),
        footer: value
      }
    }
  }

  // Tinggi & clip-overflow yang LAGI DIPAKAI
  const headerEffectiveHeight = computed(() => (isEditable.value ? draftHeaderHeight.value : headerHeight.value))
  const footerEffectiveHeight = computed(() => (isEditable.value ? draftFooterHeight.value : footerHeight.value))
  const headerEffectiveClipOverflow = computed(() =>
    (isEditable.value ? draftHeaderClipOverflow.value : headerClipOverflow.value)
  )
  const footerEffectiveClipOverflow = computed(() =>
    (isEditable.value ? draftFooterClipOverflow.value : footerClipOverflow.value)
  )

  function getHeaderRenderedHeight(pageKey: string): number {
    return isHeaderVisible(pageKey) ? headerEffectiveHeight.value : 0
  }

  function getFooterRenderedHeight(pageKey: string): number {
    return isFooterVisible(pageKey) ? footerEffectiveHeight.value : 0
  }

  // Fallback kompatibilitas
  const headerRenderedHeight = computed(() => headerEffectiveHeight.value)
  const footerRenderedHeight = computed(() => footerEffectiveHeight.value)
  const headerShouldRender = computed(() => true)
  const footerShouldRender = computed(() => true)

  function resetDraft() {
    draftPageVisibilities.value = JSON.parse(JSON.stringify(pageVisibilities.value))
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

    // 1. Ambil visibilitas per halaman dari canvas_page_backgrounds
    const { data: pageBgs } = await supabase
      .from('canvas_page_backgrounds')
      .select('page_key, header_visible, footer_visible')

    const map: Record<string, PageSectionVisibility> = {}

    if (pageBgs && pageBgs.length > 0) {
      for (const row of pageBgs) {
        map[row.page_key] = {
          header: row.header_visible ?? true,
          footer: row.footer_visible ?? true
        }
      }
    }

    pageVisibilities.value = map

    // 2. Ambil styling global dari site_settings
    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select(
        'header_bg_mode, header_bg_color, header_bg_image, footer_bg_mode, footer_bg_color, footer_bg_image, header_height, footer_height, header_clip_overflow, footer_clip_overflow'
      )
      .eq('id', 1)
      .single()

    if (!fetchError && data) {
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

  async function save() {
    if (import.meta.server || !isDirty.value) return

    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      // 1. Simpan perubahan visibilitas per halaman
      const allKeys = new Set([...Object.keys(pageVisibilities.value), ...Object.keys(draftPageVisibilities.value)])
      for (const pageKey of allKeys) {
        if (isPageVisibilityDirty(pageKey)) {
          const draftH = getDraftHeaderVisible(pageKey)
          const draftF = getDraftFooterVisible(pageKey)
          await supabase.rpc('save_page_background', {
            p_page_key: pageKey,
            p_bg: {
              headerVisible: draftH,
              footerVisible: draftF
            }
          })
        }
      }

      pageVisibilities.value = JSON.parse(JSON.stringify(draftPageVisibilities.value))

      // 2. Simpan styling global jika berubah
      if (isGlobalDirty.value) {
        const { error: rpcError } = await supabase.rpc('save_section_visibility', {
          p_header_visible: true,
          p_footer_visible: true,
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
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan pengaturan header/footer.'
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    pageVisibilities,
    draftPageVisibilities,
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
    isHeaderVisible,
    isFooterVisible,
    getDraftHeaderVisible,
    getDraftFooterVisible,
    setDraftPageHeaderVisible,
    setDraftPageFooterVisible,
    isPageVisibilityDirty,
    headerShouldRender,
    footerShouldRender,
    headerEffectiveHeight,
    footerEffectiveHeight,
    headerEffectiveClipOverflow,
    footerEffectiveClipOverflow,
    headerRenderedHeight,
    footerRenderedHeight,
    getHeaderRenderedHeight,
    getFooterRenderedHeight,
    saving,
    error,
    load,
    resetDraft,
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
