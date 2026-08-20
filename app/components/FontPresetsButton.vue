<script setup lang="ts">
// Tool berikutnya di cluster kiri (setelah SectionVisibilityButton — lihat
// app.vue): kelola preset tipografi global (Primary/Secondary/dst — lihat
// fontPresets.ts). Preset di sini dipakai elemen teks canvas lewat dropdown
// "Font" pas elemen teks dipilih (lihat CanvasEditor.vue). Edit di panel ini
// cuma ubah draft — baru kesimpan ke database pas klik Save
// (SaveEditsButton.vue, satu tombol yang sama buat background + canvas +
// font presets + header/footer).
const adminAuth = useAdminAuthStore()
const fonts = useFontPresetsStore()
const { t } = useI18n()

const isPanelOpen = ref(false)

// Computed (bukan const array biasa) — labelnya lewat t() jadi WAJIB
// reaktif ke locale yang lagi aktif (lihat LanguageSwitcher.vue), kalau
// dibiarkan const array biasa, label-nya kebekukan di bahasa pas komponen
// pertama kali di-render & gak ikut ganti pas admin ganti bahasa.
const FONT_WEIGHTS = computed(() => [
  { label: t('admin.fonts.weightNormal'), value: 400 },
  { label: t('admin.fonts.weightMedium'), value: 500 },
  { label: t('admin.fonts.weightSemibold'), value: 600 },
  { label: t('admin.fonts.weightBold'), value: 700 }
])

// Daftar pendek Google Fonts populer buat quick-pick di dropdown —
// bukan daftar lengkap (Google Fonts ada ratusan), cuma jalan pintas biar
// admin gak perlu hafal ejaan persis. Nama lain di luar daftar ini tetep
// bisa dipakai lewat mode "ketik manual" (tombol pensil), selama ejaannya
// PERSIS sama kayak nama font-nya di fonts.google.com (GoogleFontsLoader.vue
// yang otomatis nge-fetch stylesheet-nya berdasarkan nama ini).
const GOOGLE_FONT_SUGGESTIONS = [
  'Poppins', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Nunito',
  'Raleway', 'Playfair Display', 'Merriweather', 'Oswald', 'Source Sans 3',
  'Work Sans', 'Rubik', 'Quicksand', 'Manrope', 'DM Sans', 'Fira Sans',
  'Ubuntu', 'PT Sans'
]

// Satu field family (bukan dua field select+input kayak sebelumnya — itu
// yang bikin panel kepenuhan cuma buat 3 preset) yang bisa DI-TOGGLE antara
// mode "pilih dari daftar" (default, buat font populer) dan mode "ketik
// manual" (buat font lain yang gak ada di daftar). ID preset yang lagi di
// mode manual disimpan di sini; preset yang nilainya udah custom sejak awal
// (mis. hasil ketik manual sebelumnya) otomatis kedeteksi manual juga tanpa
// perlu ditambah ke set ini dulu — lihat isCustomFamily().
const manualFamilyIds = ref<Set<string>>(new Set())

function isCustomFamily(preset: { id: string, fontFamily: string }) {
  if (manualFamilyIds.value.has(preset.id)) return true
  if (!preset.fontFamily || preset.fontFamily === 'inherit') return false
  return !GOOGLE_FONT_SUGGESTIONS.includes(preset.fontFamily)
}

function toggleFamilyMode(preset: { id: string, fontFamily: string }) {
  if (isCustomFamily(preset)) {
    manualFamilyIds.value.delete(preset.id)
    // Balik ke mode pilih tapi nilainya bukan salah satu opsi daftar —
    // set ke opsi pertama biar dropdown-nya gak nampilin state kosong.
    if (!GOOGLE_FONT_SUGGESTIONS.includes(preset.fontFamily)) {
      fonts.updatePreset(preset.id, { fontFamily: GOOGLE_FONT_SUGGESTIONS[0] })
    }
  } else {
    manualFamilyIds.value.add(preset.id)
    // 'inherit' cuma default kosong internal — kosongin beneran biar admin
    // ngetik dari nol, bukan harus hapus teks "inherit" dulu.
    if (preset.fontFamily === 'inherit') {
      fonts.updatePreset(preset.id, { fontFamily: '' })
    }
  }
}
</script>

<template>
  <UPopover
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    v-model:open="isPanelOpen"
    :content="{ side: 'right', align: 'start' }"
  >
    <div class="font-presets-trigger fixed top-[192px] left-4 z-40 flex w-16 flex-col items-center gap-1">
      <UButton
        icon="i-lucide-case-sensitive"
        :color="isPanelOpen ? 'primary' : 'neutral'"
        variant="solid"
        size="lg"
        square
        class="size-11 shrink-0 justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
        :class="isPanelOpen ? 'ring-2 ring-primary ring-offset-2' : ''"
        :aria-label="t('admin.fonts.aria')"
      />
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.fonts.label') }}
      </span>
    </div>

    <template #content>
      <div class="w-72 space-y-3 p-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium">
            {{ t('admin.fonts.panelTitle') }}
          </p>
          <UButton
            :label="t('admin.fonts.add')"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="xs"
            class="cursor-pointer"
            @click="fonts.addPreset"
          />
        </div>

        <p v-if="fonts.draftPresets.length === 0" class="text-xs text-muted">
          {{ t('admin.fonts.emptyState') }}
        </p>

        <!-- max-h + scroll: preset ke-4 dst gak bikin panelnya melebar
             sampai keluar layar, tinggal di-scroll di dalam sini.
             Scrollbar-nya di-custom (lihat <style> di bawah) biar gak
             nongol gede & abu-abu terang kayak bawaan browser. -->
        <div class="font-presets-list max-h-72 space-y-2 overflow-y-auto pr-1.5">
          <div
            v-for="preset in fonts.draftPresets"
            :key="preset.id"
            class="space-y-1.5 rounded border border-default p-2"
          >
            <div class="flex items-center gap-1.5">
              <UInput
                :model-value="preset.name"
                :placeholder="t('admin.fonts.namePlaceholder')"
                size="sm"
                class="flex-1"
                @update:model-value="(v) => fonts.updatePreset(preset.id, { name: String(v) })"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                square
                class="cursor-pointer"
                :aria-label="t('admin.fonts.deleteAria')"
                @click="fonts.removePreset(preset.id)"
              />
            </div>

            <div class="flex items-center gap-1.5">
              <UInput
                v-if="isCustomFamily(preset)"
                :model-value="preset.fontFamily"
                :placeholder="t('admin.fonts.manualFontPlaceholder')"
                size="sm"
                class="flex-1"
                @update:model-value="(v) => fonts.updatePreset(preset.id, { fontFamily: String(v) })"
              />
              <USelect
                v-else
                :model-value="preset.fontFamily === 'inherit' ? undefined : preset.fontFamily"
                :items="GOOGLE_FONT_SUGGESTIONS"
                :placeholder="t('admin.fonts.pickGoogleFont')"
                size="sm"
                class="flex-1"
                @update:model-value="(v) => fonts.updatePreset(preset.id, { fontFamily: String(v) })"
              />
              <UButton
                :icon="isCustomFamily(preset) ? 'i-lucide-list' : 'i-lucide-pencil'"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="cursor-pointer"
                :aria-label="isCustomFamily(preset) ? t('admin.fonts.pickFromListAria') : t('admin.fonts.typeManualAria')"
                @click="toggleFamilyMode(preset)"
              />
            </div>

            <div class="flex items-center gap-1.5">
              <UInput
                :model-value="preset.fontSize"
                type="number"
                :placeholder="t('admin.fonts.sizePlaceholder')"
                size="sm"
                class="flex-1"
                @update:model-value="(v) => fonts.updatePreset(preset.id, { fontSize: Number(v) || preset.fontSize })"
              />

              <USelect
                :model-value="preset.fontWeight"
                :items="FONT_WEIGHTS"
                value-key="value"
                size="sm"
                class="flex-1"
                @update:model-value="(v) => fonts.updatePreset(preset.id, { fontWeight: Number(v) })"
              />

              <!-- Native color picker -->
              <UTooltip :text="t('admin.fonts.colorTitle', { color: preset.color || '#ffffff' })">
                <input
                  type="color"
                  class="h-8 w-9 shrink-0 cursor-pointer rounded border border-default bg-transparent p-0"
                  :value="preset.color || '#ffffff'"
                  :aria-label="t('admin.fonts.colorAria', { name: preset.name })"
                  @input="(e) => fonts.updatePreset(preset.id, { color: (e.target as HTMLInputElement).value })"
                >
              </UTooltip>
            </div>
          </div>
        </div>

        <p v-if="fonts.isDirty" class="text-xs text-muted">
          {{ t('admin.fonts.dirtyNotice') }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
@media (max-width: 480px) {
  .font-presets-trigger {
    display: none;
  }
}

/* Scrollbar custom buat daftar preset — tipis & nge-blend sama panel gelap,
   ganti bawaan browser yang gede & abu-abu terang (kelihatan nabrak di
   screenshot). Firefox pakai scrollbar-width/scrollbar-color, browser
   berbasis Chromium (Chrome/Edge/Brave dst) pakai ::-webkit-scrollbar. */
.font-presets-list {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-border-accented) transparent;
}

.font-presets-list::-webkit-scrollbar {
  width: 6px;
}

.font-presets-list::-webkit-scrollbar-track {
  background: transparent;
}

.font-presets-list::-webkit-scrollbar-thumb {
  background-color: var(--ui-border-accented);
  border-radius: 9999px;
}

.font-presets-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--ui-text-dimmed);
}
</style>
