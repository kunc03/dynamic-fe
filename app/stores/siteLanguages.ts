import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SiteLanguage {
  code: string
  name: string
  isDefault: boolean
  isActive: boolean
  orderIndex: number
}

export const DEFAULT_LANGUAGES: SiteLanguage[] = [
  { code: 'id', name: 'Indonesia', isDefault: true, isActive: true, orderIndex: 0 },
  { code: 'en', name: 'English', isDefault: false, isActive: true, orderIndex: 1 },
  { code: 'ja', name: '日本語', isDefault: false, isActive: true, orderIndex: 2 }
]

function cloneLanguages(list: SiteLanguage[]): SiteLanguage[] {
  return list.map(l => ({ ...l }))
}

export const useSiteLanguagesStore = defineStore('siteLanguages', () => {
  const languages = ref<SiteLanguage[]>(cloneLanguages(DEFAULT_LANGUAGES))
  const draftLanguages = ref<SiteLanguage[]>(cloneLanguages(DEFAULT_LANGUAGES))
  const saving = ref(false)
  const error = ref<string | null>(null)
  const isModalOpen = ref(false)

  // Daftar bahasa aktif (disortir berdasarkan orderIndex)
  const activeLanguages = computed(() => {
    return languages.value
      .filter(l => l.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  // Daftar draft bahasa aktif
  const draftActiveLanguages = computed(() => {
    return draftLanguages.value
      .filter(l => l.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  })

  const isDirty = computed(() => {
    if (draftLanguages.value.length !== languages.value.length) return true
    return JSON.stringify(draftLanguages.value) !== JSON.stringify(languages.value)
  })

  function resetDraft() {
    draftLanguages.value = cloneLanguages(languages.value)
    error.value = null
  }

  function addLanguage(code: string, name: string) {
    const cleanCode = code.trim().toLowerCase()
    const cleanName = name.trim()
    if (!cleanCode || !cleanName) return false

    // Cek duplikasi
    if (draftLanguages.value.some(l => l.code === cleanCode)) {
      return false
    }

    draftLanguages.value.push({
      code: cleanCode,
      name: cleanName,
      isDefault: false,
      isActive: true,
      orderIndex: draftLanguages.value.length
    })
    return true
  }

  function updateLanguage(code: string, patch: Partial<Omit<SiteLanguage, 'code' | 'isDefault'>>) {
    const index = draftLanguages.value.findIndex(l => l.code === code)
    if (index === -1) return
    const current = draftLanguages.value[index]
    draftLanguages.value[index] = { ...current, ...patch }
  }

  function toggleLanguageActive(code: string) {
    const target = draftLanguages.value.find(l => l.code === code)
    if (!target || target.isDefault) return
    target.isActive = !target.isActive
  }

  function removeLanguage(code: string) {
    const target = draftLanguages.value.find(l => l.code === code)
    if (!target || target.isDefault) return
    draftLanguages.value = draftLanguages.value.filter(l => l.code !== code)
    // Re-index
    draftLanguages.value.forEach((l, i) => {
      l.orderIndex = i
    })
  }

  function reorderLanguage(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= draftLanguages.value.length) return
    if (toIndex < 0 || toIndex >= draftLanguages.value.length) return
    const list = [...draftLanguages.value]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    list.forEach((l, i) => {
      l.orderIndex = i
    })
    draftLanguages.value = list
  }

  async function load() {
    if (import.meta.server) return

    const supabase = useSupabaseClient()

    try {
      const { data, error: fetchError } = await supabase
        .from('site_languages')
        .select('*')
        .order('order_index', { ascending: true })

      if (!fetchError && Array.isArray(data) && data.length > 0) {
        languages.value = data.map((row: any, i: number) => ({
          code: String(row.code).toLowerCase(),
          name: String(row.name),
          isDefault: !!(row.is_default ?? row.isDefault),
          isActive: row.is_active !== undefined ? !!row.is_active : (row.isActive !== undefined ? !!row.isActive : true),
          orderIndex: Number(row.order_index ?? row.orderIndex ?? i)
        }))
      } else {
        // Fallback default jika tabel belum ada / kosong
        languages.value = cloneLanguages(DEFAULT_LANGUAGES)
      }
    } catch {
      languages.value = cloneLanguages(DEFAULT_LANGUAGES)
    }

    resetDraft()
  }

  async function save() {
    if (import.meta.server || !isDirty.value) return

    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const payload = draftLanguages.value.map((l, i) => ({
        code: l.code.toLowerCase(),
        name: l.name,
        is_default: l.isDefault,
        isDefault: l.isDefault,
        is_active: l.isActive,
        isActive: l.isActive,
        order_index: i,
        orderIndex: i
      }))

      const { error: rpcError } = await supabase.rpc('save_site_languages', {
        p_languages: payload
      })

      if (rpcError) throw rpcError

      languages.value = cloneLanguages(draftLanguages.value)
    } catch (e: any) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan pengaturan bahasa.'
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    languages,
    draftLanguages,
    activeLanguages,
    draftActiveLanguages,
    isDirty,
    saving,
    error,
    isModalOpen,
    load,
    save,
    resetDraft,
    addLanguage,
    updateLanguage,
    toggleLanguageActive,
    removeLanguage,
    reorderLanguage
  }
})
