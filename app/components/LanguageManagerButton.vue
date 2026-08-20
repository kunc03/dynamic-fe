<script setup lang="ts">
import { ref, computed } from 'vue'

const adminAuth = useAdminAuthStore()
const siteLanguages = useSiteLanguagesStore()
const { t } = useI18n()

const isPanelOpen = ref(false)
const newCode = ref('')
const newName = ref('')
const addError = ref<string | null>(null)

function onOpenPanel() {
  siteLanguages.resetDraft()
  newCode.value = ''
  newName.value = ''
  addError.value = null
  isPanelOpen.value = true
}

function handleAddLanguage() {
  addError.value = null
  const code = newCode.value.trim().toLowerCase()
  const name = newName.value.trim()

  if (!code || !name) {
    addError.value = 'Kode dan nama bahasa wajib diisi.'
    return
  }

  if (code.length > 10 || !/^[a-z0-9-]+$/.test(code)) {
    addError.value = 'Kode bahasa hanya boleh berisi huruf kecil/angka (misal: en, ja, ko, zh).'
    return
  }

  const success = siteLanguages.addLanguage(code, name)
  if (!success) {
    addError.value = `Bahasa dengan kode "${code}" sudah ada.`
    return
  }

  newCode.value = ''
  newName.value = ''
}

async function handleSave() {
  try {
    await siteLanguages.save()
    isPanelOpen.value = false
  } catch (err: any) {
    // Error is stored in store
  }
}
</script>

<template>
  <div v-if="adminAuth.isAuthenticated && adminAuth.isEditMode">
    <div class="language-manager-trigger fixed top-[280px] left-4 z-40 flex w-16 flex-col items-center gap-1">
      <UButton
        icon="i-lucide-globe"
        :color="isPanelOpen ? 'primary' : 'neutral'"
        variant="solid"
        size="lg"
        square
        class="size-11 shrink-0 justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
        :class="isPanelOpen ? 'ring-2 ring-primary ring-offset-2' : ''"
        :aria-label="t('admin.language.aria')"
        @click="onOpenPanel"
      />
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.language.label') }}
      </span>
    </div>

    <!-- Modal Pengaturan Bahasa -->
    <UModal
      v-model:open="isPanelOpen"
      :ui="{
        content: 'w-[calc(100%-2rem)] max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-0 overflow-hidden'
      }"
    >
      <template #content>
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-globe" class="size-5 text-primary" />
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
              Kelola Bahasa Konten
            </h3>
          </div>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="cursor-pointer size-7 justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="Tutup"
            @click="isPanelOpen = false"
          />
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Atur bahasa yang aktif untuk konten kanvas dan dialog. Bahasa yang aktif akan muncul di pilihan pengunjung dan opsi terjemahan admin.
          </p>

          <!-- Form Tambah Bahasa Baru -->
          <div class="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2.5">
            <h4 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <UIcon name="i-lucide-plus" class="size-3.5 text-primary" />
              Tambah Bahasa Baru
            </h4>

            <div class="grid grid-cols-5 gap-2">
              <div class="col-span-2 space-y-1">
                <label class="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">Kode (mis. ko, zh)</label>
                <UInput
                  v-model="newCode"
                  placeholder="ko"
                  size="xs"
                  class="w-full uppercase"
                  maxlength="10"
                  @keydown.enter.prevent="handleAddLanguage"
                />
              </div>
              <div class="col-span-3 space-y-1">
                <label class="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">Nama Bahasa (mis. 한국어)</label>
                <div class="flex items-center gap-1.5">
                  <UInput
                    v-model="newName"
                    placeholder="한국어"
                    size="xs"
                    class="w-full"
                    @keydown.enter.prevent="handleAddLanguage"
                  />
                  <UButton
                    label="Tambah"
                    color="primary"
                    variant="solid"
                    size="xs"
                    class="cursor-pointer shrink-0 font-medium"
                    @click="handleAddLanguage"
                  />
                </div>
              </div>
            </div>

            <p v-if="addError" class="text-[11px] text-red-500 font-medium">
              {{ addError }}
            </p>
          </div>

          <!-- Daftar Bahasa -->
          <div class="space-y-2">
            <h4 class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Daftar Bahasa Tersedia ({{ siteLanguages.draftLanguages.length }})
            </h4>

            <div class="space-y-1.5">
              <div
                v-for="(lang, index) in siteLanguages.draftLanguages"
                :key="lang.code"
                class="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                <div class="flex items-center gap-2.5">
                  <!-- Tombol Urutan (Up / Down) -->
                  <div class="flex flex-col gap-0.5">
                    <button
                      type="button"
                      class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 cursor-pointer disabled:cursor-default"
                      :disabled="index === 0"
                      @click="siteLanguages.reorderLanguage(index, index - 1)"
                    >
                      <UIcon name="i-lucide-chevron-up" class="size-3" />
                    </button>
                    <button
                      type="button"
                      class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 cursor-pointer disabled:cursor-default"
                      :disabled="index === siteLanguages.draftLanguages.length - 1"
                      @click="siteLanguages.reorderLanguage(index, index + 1)"
                    >
                      <UIcon name="i-lucide-chevron-down" class="size-3" />
                    </button>
                  </div>

                  <!-- Badge Kode -->
                  <span class="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase min-w-9 text-center">
                    {{ lang.code }}
                  </span>

                  <!-- Nama Bahasa -->
                  <div class="flex flex-col">
                    <span class="text-xs font-semibold text-neutral-900 dark:text-white">
                      {{ lang.name }}
                    </span>
                    <span v-if="lang.isDefault" class="text-[10px] text-primary font-medium">
                      Bahasa Utama (Default)
                    </span>
                    <span v-else-if="!lang.isActive" class="text-[10px] text-neutral-400">
                      Nonaktif
                    </span>
                  </div>
                </div>

                <!-- Kontrol Aksi (Toggle Aktif & Hapus) -->
                <div class="flex items-center gap-2">
                  <template v-if="!lang.isDefault">
                    <USwitch
                      :model-value="lang.isActive"
                      size="xs"
                      @update:model-value="siteLanguages.toggleLanguageActive(lang.code)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      square
                      class="cursor-pointer text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Hapus Bahasa"
                      @click="siteLanguages.removeLanguage(lang.code)"
                    />
                  </template>
                  <span v-else class="text-[11px] font-semibold text-neutral-400 px-2">
                    Terkunci
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p v-if="siteLanguages.error" class="text-xs text-red-500 font-medium">
            {{ siteLanguages.error }}
          </p>
        </div>

        <!-- Footer Modal -->
        <div class="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 px-5 py-3">
          <UButton
            label="Batal"
            color="neutral"
            variant="ghost"
            size="xs"
            class="cursor-pointer"
            @click="isPanelOpen = false"
          />
          <UButton
            label="Simpan Pengaturan Bahasa"
            icon="i-lucide-check"
            color="primary"
            variant="solid"
            size="xs"
            class="cursor-pointer font-medium"
            :loading="siteLanguages.saving"
            :disabled="!siteLanguages.isDirty"
            @click="handleSave"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
@media (max-width: 480px) {
  .language-manager-button {
    display: none;
  }
}
</style>
