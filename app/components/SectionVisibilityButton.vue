<script setup lang="ts">
// Tool di cluster kiri (lihat app.vue): kelola header & footer GLOBAL —
// toggle tampil/sembunyi, tinggi kotak, boleh-meluber-keluar, + background
// masing-masing (lihat sectionVisibility.ts, SiteHeader.vue, SiteFooter.vue).
// Isi header/footer sendiri (text/gambar) diedit langsung di canvas-nya
// masing-masing (tombol "+" & drag/resize ada di dalam CanvasEditor.vue),
// panel ini CUMA buat pengaturan KOTAK section-nya.
// Edit di sini cuma ubah draft (+ live preview langsung kelihatan) — baru
// kesimpan ke database pas klik Save (SaveEditsButton.vue, tombol yang sama
// buat semua tool edit mode).
const adminAuth = useAdminAuthStore()
const sections = useSectionVisibilityStore()
const { t } = useI18n()

const isPanelOpen = ref(false)

const headerFileInputRef = ref<HTMLInputElement | null>(null)
const footerFileInputRef = ref<HTMLInputElement | null>(null)

function onHeaderColorInput(event: Event) {
  sections.setDraftHeaderBgColor((event.target as HTMLInputElement).value)
}

function onFooterColorInput(event: Event) {
  sections.setDraftFooterBgColor((event.target as HTMLInputElement).value)
}

function triggerHeaderFilePicker() {
  headerFileInputRef.value?.click()
}

function triggerFooterFilePicker() {
  footerFileInputRef.value?.click()
}

async function onHeaderFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) return
  await sections.setDraftHeaderBgImageFile(file)
}

async function onFooterFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) return
  await sections.setDraftFooterBgImageFile(file)
}

</script>

<template>
  <UPopover
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    v-model:open="isPanelOpen"
    :content="{ side: 'right', align: 'start' }"
  >
    <div class="section-visibility-trigger fixed top-[192px] left-4 z-40 flex w-16 flex-col items-center gap-1">
      <UButton
        icon="i-lucide-panel-top"
        color="neutral"
        variant="solid"
        size="lg"
        square
        class="size-11 shrink-0 justify-center shadow-lg cursor-pointer"
        :aria-label="t('admin.sections.aria')"
      />
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.sections.label') }}
      </span>
    </div>

    <template #content>
      <div class="w-72 space-y-4 p-4">
        <p class="text-sm font-medium">
          {{ t('admin.sections.panelTitle') }}
        </p>

        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-muted">{{ t('admin.sections.showHeader') }}</span>
          <USwitch
            :model-value="sections.draftHeaderVisible"
            @update:model-value="(v) => sections.setDraftHeaderVisible(!!v)"
          />
        </div>

        <!-- Tinggi kotak header (px) + toggle "boleh meluber keluar" — satu
             baris ringkas. Meluber OFF (default) = elemen yang lebih gede
             dari kotak ini otomatis kepotong (gak numpuk sama canvas
             content di bawahnya, lihat CanvasEditor.vue); ON = admin
             sengaja izinin elemen (mis. gambar hero) nongol keluar. -->
        <div class="flex items-center gap-1.5">
          <span class="flex-1 text-xs text-muted">{{ t('admin.sections.heightHeader') }}</span>
          <UInput
            :model-value="sections.draftHeaderHeight"
            type="number"
            min="20"
            size="xs"
            class="w-16"
            @update:model-value="(v) => sections.setDraftHeaderHeight(Number(v) || sections.draftHeaderHeight)"
          />
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs text-muted">{{ t('admin.sections.allowOverflow') }}</span>
          <USwitch
            :model-value="sections.draftHeaderClipOverflow === false"
            @update:model-value="(v) => sections.setDraftHeaderClipOverflow(!v)"
          />
        </div>

        <!-- Background header: warna (native color picker), upload gambar,
             atau reset ke transparan — satu baris ringkas, konsisten sama
             pola OuterBackgroundButton.vue tapi dipadetin biar gak
             kepanjangan (ada 2 section di panel yang sama: header+footer). -->
        <div class="flex items-center gap-1.5">
          <span class="flex-1 text-xs text-muted">{{ t('admin.sections.bgHeader') }}</span>
          <input
            type="color"
            class="h-8 w-9 shrink-0 cursor-pointer rounded border border-default bg-transparent p-0"
            :value="sections.draftHeaderBgColor || '#0f172a'"
            :title="t('admin.sections.colorHeaderAria')"
            :aria-label="t('admin.sections.colorHeaderAria')"
            @input="onHeaderColorInput"
          >
          <UButton
            icon="i-lucide-upload"
            color="neutral"
            variant="outline"
            size="xs"
            square
            class="cursor-pointer"
            :aria-label="t('admin.sections.uploadHeaderAria')"
            :title="t('admin.sections.uploadTitle')"
            @click="triggerHeaderFilePicker"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="cursor-pointer"
            :aria-label="t('admin.sections.resetHeaderAria')"
            :title="t('admin.sections.resetTitle')"
            @click="sections.resetDraftHeaderBgToDefault"
          />
          <input
            ref="headerFileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onHeaderFileChange"
          >
        </div>

        <hr class="border-default">

        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-muted">{{ t('admin.sections.showFooter') }}</span>
          <USwitch
            :model-value="sections.draftFooterVisible"
            @update:model-value="(v) => sections.setDraftFooterVisible(!!v)"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <span class="flex-1 text-xs text-muted">{{ t('admin.sections.heightFooter') }}</span>
          <UInput
            :model-value="sections.draftFooterHeight"
            type="number"
            min="20"
            size="xs"
            class="w-16"
            @update:model-value="(v) => sections.setDraftFooterHeight(Number(v) || sections.draftFooterHeight)"
          />
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs text-muted">{{ t('admin.sections.allowOverflow') }}</span>
          <USwitch
            :model-value="sections.draftFooterClipOverflow === false"
            @update:model-value="(v) => sections.setDraftFooterClipOverflow(!v)"
          />
        </div>

        <div class="flex items-center gap-1.5">
          <span class="flex-1 text-xs text-muted">{{ t('admin.sections.bgFooter') }}</span>
          <input
            type="color"
            class="h-8 w-9 shrink-0 cursor-pointer rounded border border-default bg-transparent p-0"
            :value="sections.draftFooterBgColor || '#0f172a'"
            :title="t('admin.sections.colorFooterAria')"
            :aria-label="t('admin.sections.colorFooterAria')"
            @input="onFooterColorInput"
          >
          <UButton
            icon="i-lucide-upload"
            color="neutral"
            variant="outline"
            size="xs"
            square
            class="cursor-pointer"
            :aria-label="t('admin.sections.uploadFooterAria')"
            :title="t('admin.sections.uploadTitle')"
            @click="triggerFooterFilePicker"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="cursor-pointer"
            :aria-label="t('admin.sections.resetFooterAria')"
            :title="t('admin.sections.resetTitle')"
            @click="sections.resetDraftFooterBgToDefault"
          />
          <input
            ref="footerFileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFooterFileChange"
          >
        </div>

        <p class="text-xs text-muted">
          {{ t('admin.sections.note') }}
        </p>

        <p v-if="sections.isDirty" class="text-xs text-muted">
          {{ t('admin.sections.dirtyNotice') }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
@media (max-width: 480px) {
  .section-visibility-trigger {
    display: none;
  }
}
</style>
