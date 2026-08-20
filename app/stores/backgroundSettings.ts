import { defineStore } from 'pinia'

export type BackgroundMode = 'color' | 'image'

export interface PageBackground {
  mode: BackgroundMode
  color: string | null
  imageDataUrl: string | null
}

const DEFAULT_PAGE_BG: PageBackground = {
  mode: 'color',
  color: null,
  imageDataUrl: null
}

// Pengaturan background CONTENT per halaman (`page_key`). Sumber kebenarannya
// tabel `canvas_page_backgrounds` di Supabase (lihat migration 0028_canvas_page_backgrounds.sql).
// Tiap halaman (mis. 'home', 'register', 'dashboard-v2') memiliki background
// (warna / gambar) masing-masing yang independen.
export const useBackgroundStore = defineStore('backgroundSettings', () => {
  const pageBackgrounds = ref<Record<string, PageBackground>>({})
  const draftPageBackgrounds = ref<Record<string, PageBackground>>({})

  const saving = ref(false)
  const error = ref<string | null>(null)

  function getPageBackground(pageKey: string): PageBackground {
    return pageBackgrounds.value[pageKey] || { ...DEFAULT_PAGE_BG }
  }

  function getDraftPageBackground(pageKey: string): PageBackground {
    return draftPageBackgrounds.value[pageKey] || getPageBackground(pageKey)
  }

  function isPageDirty(pageKey: string): boolean {
    const saved = getPageBackground(pageKey)
    const draft = getDraftPageBackground(pageKey)
    return saved.mode !== draft.mode || saved.color !== draft.color || saved.imageDataUrl !== draft.imageDataUrl
  }

  const isDirty = computed(() => {
    const allKeys = new Set([...Object.keys(pageBackgrounds.value), ...Object.keys(draftPageBackgrounds.value)])
    for (const key of allKeys) {
      if (isPageDirty(key)) return true
    }
    return false
  })

  // Helper bersama: terapkan satu set nilai (mode/color/image) ke CSS variables <html>
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
      root.style.removeProperty('--app-content-bg-color')
      root.style.removeProperty('--app-content-bg-image')
    }
  }

  function applyCurrentPageBackground(pageKey: string) {
    const adminAuth = useAdminAuthStore()
    const isEdit = adminAuth.isAuthenticated && adminAuth.isEditMode
    const bg = isEdit ? getDraftPageBackground(pageKey) : getPageBackground(pageKey)
    applyValues(bg.mode, bg.color, bg.imageDataUrl)
  }

  function resetDraft() {
    draftPageBackgrounds.value = JSON.parse(JSON.stringify(pageBackgrounds.value))
  }

  async function load() {
    if (import.meta.server) return

    const supabase = useSupabaseClient()

    // 1. Ambil dari canvas_page_backgrounds
    const { data: pageBgs } = await supabase
      .from('canvas_page_backgrounds')
      .select('page_key, bg_mode, bg_color, bg_image')

    const map: Record<string, PageBackground> = {}

    if (pageBgs && pageBgs.length > 0) {
      for (const row of pageBgs) {
        map[row.page_key] = {
          mode: row.bg_mode === 'image' ? 'image' : 'color',
          color: row.bg_color ?? null,
          imageDataUrl: row.bg_image ?? null
        }
      }
    }

    // 2. Fallback untuk 'home' jika belum ada di canvas_page_backgrounds
    if (!map.home) {
      const { data: siteSettings } = await supabase
        .from('site_settings')
        .select('content_bg_mode, content_bg_color, content_bg_image')
        .eq('id', 1)
        .single()

      if (siteSettings && (siteSettings.content_bg_color || siteSettings.content_bg_image)) {
        map.home = {
          mode: siteSettings.content_bg_mode === 'image' ? 'image' : 'color',
          color: siteSettings.content_bg_color ?? null,
          imageDataUrl: siteSettings.content_bg_image ?? null
        }
      }
    }

    pageBackgrounds.value = map
    resetDraft()
  }

  function setDraftPageColor(pageKey: string, next: string) {
    draftPageBackgrounds.value = {
      ...draftPageBackgrounds.value,
      [pageKey]: {
        mode: 'color',
        color: next,
        imageDataUrl: null
      }
    }
    applyCurrentPageBackground(pageKey)
  }

  function setDraftPageImageFile(pageKey: string, file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        draftPageBackgrounds.value = {
          ...draftPageBackgrounds.value,
          [pageKey]: {
            mode: 'image',
            color: null,
            imageDataUrl: reader.result as string
          }
        }
        applyCurrentPageBackground(pageKey)
        resolve()
      }

      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  function resetDraftPageToDefault(pageKey: string) {
    draftPageBackgrounds.value = {
      ...draftPageBackgrounds.value,
      [pageKey]: {
        mode: 'color',
        color: null,
        imageDataUrl: null
      }
    }
    applyCurrentPageBackground(pageKey)
  }

  async function save() {
    if (import.meta.server || !isDirty.value) return

    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const allKeys = new Set([...Object.keys(pageBackgrounds.value), ...Object.keys(draftPageBackgrounds.value)])
      for (const pageKey of allKeys) {
        if (isPageDirty(pageKey)) {
          const draftBg = getDraftPageBackground(pageKey)
          const { error: rpcError } = await supabase.rpc('save_page_background', {
            p_page_key: pageKey,
            p_bg: {
              mode: draftBg.mode,
              color: draftBg.color,
              imageDataUrl: draftBg.imageDataUrl
            }
          })

          if (rpcError) {
            // Fallback ke update_content_background jika home dan fungsi baru belum tersedia
            if (pageKey === 'home') {
              await supabase.rpc('update_content_background', {
                p_mode: draftBg.mode,
                p_color: draftBg.color,
                p_image: draftBg.imageDataUrl
              })
            } else {
              throw rpcError
            }
          }
        }
      }

      pageBackgrounds.value = JSON.parse(JSON.stringify(draftPageBackgrounds.value))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan background halaman.'
      throw e
    } finally {
      saving.value = false
    }
  }

  // Kompatibilitas mundur untuk 'home'
  const mode = computed(() => getPageBackground('home').mode)
  const color = computed(() => getPageBackground('home').color)
  const imageDataUrl = computed(() => getPageBackground('home').imageDataUrl)
  const draftMode = computed(() => getDraftPageBackground('home').mode)
  const draftColor = computed(() => getDraftPageBackground('home').color)
  const draftImageDataUrl = computed(() => getDraftPageBackground('home').imageDataUrl)

  return {
    pageBackgrounds,
    draftPageBackgrounds,
    isDirty,
    saving,
    error,
    mode,
    color,
    imageDataUrl,
    draftMode,
    draftColor,
    draftImageDataUrl,
    getPageBackground,
    getDraftPageBackground,
    isPageDirty,
    setDraftPageColor,
    setDraftPageImageFile,
    resetDraftPageToDefault,
    applyCurrentPageBackground,
    load,
    resetDraft,
    save
  }
})

