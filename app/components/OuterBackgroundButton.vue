<script setup lang="ts">
// Tool pertama di edit mode: ubah background CONTENT (bagian DALAM
// app-shell / "layar HP"-nya sendiri) — BUKAN area putih di luar. Tombolnya
// sengaja ditaruh di luar .app-shell (lihat app.vue) karena di situ ada
// ruang kosong buat nampung ikon-ikon tool, tapi yang berubah warnanya
// tetap bagian dalam.
//
// Milih warna/gambar di sini update draft (bg.draftMode/draftColor/
// draftImageDataUrl) DAN langsung nge-apply ke background CONTENT asli
// (live preview — lihat applyDraft() di backgroundSettings.ts), supaya
// admin bisa lihat hasilnya beneran di halamannya, bukan cuma di swatch
// kecil. Yang BELUM terjadi sampai klik tombol Save (kanan atas, lihat
// SaveContentBackgroundButton.vue) cuma penyimpanan ke database — kalau
// reload sebelum Save, balik lagi ke state tersimpan terakhir.
//
// Cuma tampil kalau edit mode lagi nyala (lihat EditModeToggle.vue), dan cuma
// di layar yang cukup lebar (di HP asli, gak ada area putih buat ditaruh
// tombolnya). Tool berikutnya akan ditambah satu per satu di bawah ikon ini.
const adminAuth = useAdminAuthStore()
const bg = useBackgroundStore()
const { t } = useI18n()

const isPanelOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function onColorInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  bg.setDraftColor(value)
}

function triggerFilePicker() {
  fileInputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // biar bisa pilih file yang sama lagi kalau perlu

  if (!file || !file.type.startsWith('image/')) return

  await bg.setDraftImageFile(file)
}
</script>

<template>
  <UPopover
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    v-model:open="isPanelOpen"
    :content="{ side: 'right', align: 'start' }"
  >
    <div class="outer-bg-trigger fixed top-[104px] left-4 z-40 flex w-16 flex-col items-center gap-1">
      <UButton
        icon="i-lucide-image"
        color="neutral"
        variant="solid"
        size="lg"
        square
        class="size-11 shrink-0 justify-center shadow-lg cursor-pointer"
        :aria-label="t('admin.background.aria')"
      />
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.background.label') }}
      </span>
    </div>

    <template #content>
      <div class="w-64 space-y-4 p-4">
        <p class="text-sm font-medium">
          {{ t('admin.background.panelTitle') }}
        </p>

        <div class="flex items-center justify-between gap-3">
          <label for="outer-bg-color" class="text-sm text-muted">{{ t('admin.background.colorLabel') }}</label>
          <input
            id="outer-bg-color"
            type="color"
            class="h-8 w-12 cursor-pointer rounded border border-default bg-transparent p-0"
            :value="bg.draftColor || '#0f172a'"
            @input="onColorInput"
          >
        </div>

        <div class="space-y-2">
          <p class="text-sm text-muted">
            {{ t('admin.background.orUpload') }}
          </p>

          <UButton
            :label="t('admin.background.pickImage')"
            icon="i-lucide-upload"
            color="neutral"
            variant="outline"
            block
            class="cursor-pointer"
            @click="triggerFilePicker"
          />

          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          >
        </div>

        <UButton
          :label="t('admin.background.resetDefault')"
          color="neutral"
          variant="ghost"
          size="sm"
          block
          class="cursor-pointer"
          @click="bg.resetDraftToThemeDefault"
        />

        <p v-if="bg.isDirty" class="text-xs text-muted">
          {{ t('admin.background.dirtyNotice') }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
/* app-shell max 390px — di bawah ~480px gak ada ruang putih di kiri buat
   tombol ini, jadi disembunyikan aja. */
@media (max-width: 480px) {
  .outer-bg-trigger {
    display: none;
  }
}
</style>
