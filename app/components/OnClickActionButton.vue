<script setup lang="ts">
import { useActiveCanvasSelection } from '../stores/canvasElements'

// Tool kelima di cluster kiri admin (setelah FontPresetsButton — lihat app.vue):
// kelola aksi interaktif OnClick per elemen canvas (teks maupun gambar).
//
// Kondisi Aktif:
// - Hanya aktif/enabled jika ada elemen canvas yang sedang dipilih (activeElement != null).
// - Jika tidak ada elemen yang dipilih, tombol dalam status disabled (redup).
//
// Aksi yang didukung saat ini:
// - 'none' / null: elemen statis biasa.
// - 'translate': saat diklik oleh pengunjung, membuka popup pilihan bahasa (ID, EN, JA)
//   tepat di posisi elemen tersebut (bisa berbentuk Tab atau Dropdown, dengan warna kustom).
const adminAuth = useAdminAuthStore()
const { activeElement, activeCanvas } = useActiveCanvasSelection()
const { t } = useI18n()

const isPanelOpen = ref(false)

const isElementSelected = computed(() => !!activeElement.value && !!activeCanvas.value)

const NONE_ACTION_VALUE = '__none__'

const actionOptions = computed(() => [
  { label: t('admin.onclick.none'), value: NONE_ACTION_VALUE },
  { label: t('admin.onclick.translate'), value: 'translate' }
])

const currentActionValue = computed(() => {
  if (!activeElement.value?.onClickAction) return NONE_ACTION_VALUE
  return activeElement.value.onClickAction
})

function onActionChange(value: string | number | null) {
  if (!activeElement.value || !activeCanvas.value) return
  const action = value === NONE_ACTION_VALUE || value === null || value === undefined ? null : String(value)
  activeCanvas.value.updateElement(activeElement.value.id, { onClickAction: action })
}

const DEFAULT_TRANSLATE_CONFIG = {
  style: 'tab' as 'tab' | 'dropdown',
  bgColor: '#18181b',
  textColor: '#ffffff',
  activeBgColor: '#10b981',
  activeTextColor: '#ffffff'
}

const currentConfig = computed(() => ({
  style: (activeElement.value?.onClickConfig?.style ?? DEFAULT_TRANSLATE_CONFIG.style) as 'tab' | 'dropdown',
  bgColor: activeElement.value?.onClickConfig?.bgColor ?? DEFAULT_TRANSLATE_CONFIG.bgColor,
  textColor: activeElement.value?.onClickConfig?.textColor ?? DEFAULT_TRANSLATE_CONFIG.textColor,
  activeBgColor: activeElement.value?.onClickConfig?.activeBgColor ?? DEFAULT_TRANSLATE_CONFIG.activeBgColor,
  activeTextColor: activeElement.value?.onClickConfig?.activeTextColor ?? DEFAULT_TRANSLATE_CONFIG.activeTextColor
}))

function updateConfig(patch: Partial<typeof DEFAULT_TRANSLATE_CONFIG>) {
  if (!activeElement.value || !activeCanvas.value) return
  const newConfig = {
    ...currentConfig.value,
    ...patch
  }
  activeCanvas.value.updateElement(activeElement.value.id, { onClickConfig: newConfig })
}

// Tutup popover otomatis jika seleksi elemen hilang
watch(isElementSelected, (selected) => {
  if (!selected) {
    isPanelOpen.value = false
  }
})
</script>

<template>
  <UPopover
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    v-model:open="isPanelOpen"
    :disabled="!isElementSelected"
    :content="{ side: 'right', align: 'start' }"
  >
    <div class="onclick-action-trigger fixed top-[368px] left-4 z-40 flex w-16 flex-col items-center gap-1">
      <UTooltip :text="!isElementSelected ? t('admin.onclick.disabledHint') : undefined" :disabled="isElementSelected">
        <UButton
          icon="i-lucide-mouse-pointer-click"
          :color="isElementSelected ? (isPanelOpen || currentActionValue !== NONE_ACTION_VALUE ? 'primary' : 'neutral') : 'neutral'"
          variant="solid"
          size="lg"
          square
          :disabled="!isElementSelected"
          class="size-11 shrink-0 justify-center shadow-lg transition-all duration-200"
          :class="[
            isElementSelected ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-40',
            isPanelOpen ? 'ring-2 ring-primary ring-offset-2' : ''
          ]"
          :aria-label="t('admin.onclick.aria')"
        />
      </UTooltip>
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.onclick.label') }}
      </span>
    </div>

    <template #content>
      <div v-if="activeElement" class="w-80 max-h-[85vh] overflow-y-auto space-y-3 p-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium">
            {{ t('admin.onclick.panelTitle') }}
          </p>
          <span class="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {{ activeElement.type }}
          </span>
        </div>

        <p class="text-xs text-muted">
          {{ t('admin.onclick.description') }}
        </p>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-muted">
            {{ t('admin.onclick.actionLabel') }}
          </label>
          <USelect
            :model-value="currentActionValue"
            :items="actionOptions"
            value-key="value"
            size="sm"
            class="w-full"
            @update:model-value="onActionChange"
          />
        </div>

        <!-- Pengaturan Kustom Translate (Bentuk & Warna) -->
        <template v-if="currentActionValue === 'translate'">
          <!-- Bentuk Tampilan: Tab vs Dropdown -->
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-muted">
              {{ t('admin.onclick.displayStyle') }}
            </label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                class="cursor-pointer rounded-md border p-2 text-xs font-medium transition-all"
                :class="currentConfig.style === 'tab' ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 dark:border-neutral-700 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
                @click="updateConfig({ style: 'tab' })"
              >
                <div class="flex items-center justify-center gap-1.5">
                  <UIcon name="i-lucide-square-equal" class="size-3.5" />
                  <span>{{ t('admin.onclick.styleTab') }}</span>
                </div>
              </button>
              <button
                type="button"
                class="cursor-pointer rounded-md border p-2 text-xs font-medium transition-all"
                :class="currentConfig.style === 'dropdown' ? 'border-primary bg-primary/10 text-primary' : 'border-neutral-200 dark:border-neutral-700 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
                @click="updateConfig({ style: 'dropdown' })"
              >
                <div class="flex items-center justify-center gap-1.5">
                  <UIcon name="i-lucide-menu" class="size-3.5" />
                  <span>{{ t('admin.onclick.styleDropdown') }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Kustomisasi Warna -->
          <div class="space-y-2 rounded-lg border border-neutral-200 p-2.5 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30">
            <p class="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {{ t('admin.onclick.styleCustomization') }}
            </p>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <!-- Background Color -->
              <label class="flex items-center justify-between gap-1.5 rounded bg-white p-1.5 shadow-2xs dark:bg-neutral-800">
                <span class="text-muted text-[11px] truncate">{{ t('admin.onclick.bgColor') }}</span>
                <input
                  type="color"
                  :value="currentConfig.bgColor"
                  class="size-6 shrink-0 cursor-pointer rounded border border-neutral-300 bg-transparent p-0 dark:border-neutral-600"
                  @input="(e) => updateConfig({ bgColor: (e.target as HTMLInputElement).value })"
                />
              </label>

              <!-- Text Color -->
              <label class="flex items-center justify-between gap-1.5 rounded bg-white p-1.5 shadow-2xs dark:bg-neutral-800">
                <span class="text-muted text-[11px] truncate">{{ t('admin.onclick.textColor') }}</span>
                <input
                  type="color"
                  :value="currentConfig.textColor"
                  class="size-6 shrink-0 cursor-pointer rounded border border-neutral-300 bg-transparent p-0 dark:border-neutral-600"
                  @input="(e) => updateConfig({ textColor: (e.target as HTMLInputElement).value })"
                />
              </label>

              <!-- Active Background Color -->
              <label class="flex items-center justify-between gap-1.5 rounded bg-white p-1.5 shadow-2xs dark:bg-neutral-800">
                <span class="text-muted text-[11px] truncate">{{ t('admin.onclick.activeBgColor') }}</span>
                <input
                  type="color"
                  :value="currentConfig.activeBgColor"
                  class="size-6 shrink-0 cursor-pointer rounded border border-neutral-300 bg-transparent p-0 dark:border-neutral-600"
                  @input="(e) => updateConfig({ activeBgColor: (e.target as HTMLInputElement).value })"
                />
              </label>

              <!-- Active Text Color -->
              <label class="flex items-center justify-between gap-1.5 rounded bg-white p-1.5 shadow-2xs dark:bg-neutral-800">
                <span class="text-muted text-[11px] truncate">{{ t('admin.onclick.activeTextColor') }}</span>
                <input
                  type="color"
                  :value="currentConfig.activeTextColor"
                  class="size-6 shrink-0 cursor-pointer rounded border border-neutral-300 bg-transparent p-0 dark:border-neutral-600"
                  @input="(e) => updateConfig({ activeTextColor: (e.target as HTMLInputElement).value })"
                />
              </label>
            </div>
          </div>

          <!-- Live Mini Preview -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-medium text-muted">{{ t('admin.onclick.preview') }}</span>
            <div class="flex items-center justify-center rounded-lg bg-neutral-200/60 p-3 dark:bg-neutral-950/60 min-h-[60px]">
              <!-- Tab Style Preview -->
              <div
                v-if="currentConfig.style === 'tab'"
                class="flex gap-1 rounded-full p-1 shadow-lg"
                :style="{ backgroundColor: currentConfig.bgColor }"
              >
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase"
                  :style="{ color: currentConfig.textColor }"
                >ID</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase shadow-xs"
                  :style="{ backgroundColor: currentConfig.activeBgColor, color: currentConfig.activeTextColor }"
                >EN</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase"
                  :style="{ color: currentConfig.textColor }"
                >JA</span>
              </div>

              <!-- Dropdown Style Preview -->
              <div
                v-else
                class="w-36 rounded-lg p-1.5 shadow-lg flex flex-col gap-1"
                :style="{ backgroundColor: currentConfig.bgColor }"
              >
                <div
                  class="flex items-center justify-between rounded px-2 py-1 text-[11px] font-medium"
                  :style="{ color: currentConfig.textColor }"
                >
                  <span>Indonesia</span>
                  <span class="text-[10px] opacity-70">ID</span>
                </div>
                <div
                  class="flex items-center justify-between rounded px-2 py-1 text-[11px] font-medium shadow-2xs"
                  :style="{ backgroundColor: currentConfig.activeBgColor, color: currentConfig.activeTextColor }"
                >
                  <span>English</span>
                  <span class="text-[10px] opacity-90 font-bold">EN</span>
                </div>
                <div
                  class="flex items-center justify-between rounded px-2 py-1 text-[11px] font-medium"
                  :style="{ color: currentConfig.textColor }"
                >
                  <span>日本語</span>
                  <span class="text-[10px] opacity-70">JA</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <p v-if="activeCanvas?.isDirty" class="text-[11px] text-amber-600 dark:text-amber-400">
          {{ t('admin.onclick.dirtyNotice') }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
@media (max-width: 480px) {
  .onclick-action-trigger {
    display: none;
  }
}
</style>
