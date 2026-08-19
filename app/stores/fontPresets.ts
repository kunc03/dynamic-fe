import { defineStore } from 'pinia'

export interface FontPreset {
  id: string
  name: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  // Warna teks (hex, mis. "#ffffff") — sama kayak field lain di preset,
  // di-RESOLVE tiap render dari sini (bukan disalin ke elemen), jadi ubah
  // warna preset otomatis kebawa ke semua elemen teks yang pakainya. Elemen
  // teks yang gak pakai preset (fontPresetId null) tetep pakai warna
  // bawaannya sendiri (canvasElements.ts) — lihat fontStyle() di
  // CanvasEditor.vue.
  color: string
}

function clonePresets(list: FontPreset[]): FontPreset[] {
  return list.map(p => ({ ...p }))
}

// Preset tipografi global ("Primary", "Secondary", dst) — dikelola admin
// lewat FontPresetsButton.vue, dipakai elemen teks canvas (lihat
// canvasElements.ts, field `fontPresetId`) supaya font di seluruh halaman
// bisa diseragamkan dari SATU tempat. Sumber kebenarannya kolom
// `site_settings.font_presets` (jsonb, lihat migration
// 0014_font_presets.sql di project `be`).
//
// PENTING: elemen teks nyimpen REFERENSI ke id preset, BUKAN nyalin
// fontFamily/fontSize/fontWeight-nya. Jadi begitu admin ubah preset ini
// (via panel FontPresetsButton) & Save, SEMUA elemen teks yang pakai preset
// itu otomatis ikut berubah tampilannya (CanvasEditor.vue selalu resolve
// dari `presets` yang lagi aktif, bukan dari nilai yang di-snapshot pas
// elemen dibuat).
//
// Sama kayak backgroundSettings.ts & canvasElements.ts: ada state TERSIMPAN
// (`presets`) vs DRAFT (`draftPresets`) — edit di panel cuma ubah draft
// (live preview otomatis kebawa karena CanvasEditor baca draft pas edit
// mode nyala), baru kesimpan ke database pas klik Save (SaveEditsButton.vue,
// yang juga nyimpen background & posisi elemen canvas).
export const useFontPresetsStore = defineStore('fontPresets', () => {
  const presets = ref<FontPreset[]>([])
  const draftPresets = ref<FontPreset[]>([])

  const saving = ref(false)
  const error = ref<string | null>(null)

  const isDirty = computed(() =>
    JSON.stringify(draftPresets.value) !== JSON.stringify(presets.value)
  )

  function resetDraft() {
    draftPresets.value = clonePresets(presets.value)
  }

  // Cari preset (dari state yang lagi RELEVAN — draft kalau edit mode
  // nyala, tersimpan kalau enggak) buat resolve fontFamily/fontSize/
  // fontWeight elemen teks. Dipakai CanvasEditor.vue.
  function resolve(list: FontPreset[], id: string | null) {
    if (!id) return null
    return list.find(p => p.id === id) ?? null
  }

  async function load() {
    if (import.meta.server) return

    const supabase = useSupabaseClient()

    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select('font_presets')
      .eq('id', 1)
      .single()

    if (!fetchError && data?.font_presets) {
      // `color` ditambahin belakangan — preset lama yang ke-save SEBELUM
      // field ini ada gak bakal punya `color` di jsonb-nya, fallback ke
      // putih biar gak `undefined` pas di-resolve (lihat fontStyle() di
      // CanvasEditor.vue).
      presets.value = (data.font_presets as FontPreset[]).map(p => ({ ...p, color: p.color ?? '#ffffff' }))
    }

    resetDraft()
  }

  // Dipanggil dari panel FontPresetsButton.vue.
  function addPreset() {
    const preset: FontPreset = {
      id: `preset-${Math.random().toString(36).slice(2, 10)}`,
      name: `Font ${draftPresets.value.length + 1}`,
      fontFamily: 'inherit',
      fontSize: 16,
      fontWeight: 400,
      color: '#ffffff'
    }
    draftPresets.value = [...draftPresets.value, preset]
    return preset.id
  }

  function updatePreset(id: string, patch: Partial<Omit<FontPreset, 'id'>>) {
    draftPresets.value = draftPresets.value.map(p => (p.id === id ? { ...p, ...patch } : p))
  }

  function removePreset(id: string) {
    draftPresets.value = draftPresets.value.filter(p => p.id !== id)
  }

  // Commit draft -> tersimpan lewat RPC `save_font_presets` (SECURITY
  // DEFINER, cek is_admin() sendiri — lihat migration
  // 0014_font_presets.sql di project `be`).
  async function save() {
    if (import.meta.server || !isDirty.value) return

    saving.value = true
    error.value = null

    const supabase = useSupabaseClient()

    try {
      const { error: rpcError } = await supabase.rpc('save_font_presets', {
        p_presets: draftPresets.value
      })

      if (rpcError) throw rpcError

      presets.value = clonePresets(draftPresets.value)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Gagal menyimpan preset font.'
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    presets,
    draftPresets,
    isDirty,
    saving,
    error,
    load,
    resetDraft,
    resolve,
    addPreset,
    updatePreset,
    removePreset,
    save
  }
})
