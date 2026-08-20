<script setup lang="ts">
// Tool di cluster kiri edit mode: ubah background CONTENT (bagian DALAM app-shell).
// Tombolnya berada di luar .app-shell (lihat app.vue).
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
  input.value = ''

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
        :color="isPanelOpen ? 'primary' : 'neutral'"
        variant="solid"
        size="lg"
        square
        class="size-11 shrink-0 justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
        :class="isPanelOpen ? 'ring-2 ring-primary ring-offset-2' : ''"
        :aria-label="t('admin.background.aria')"
      />
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.background.label') }}
      </span>
    </div>

    <template #content>
      <div class="w-72 space-y-4 p-4">
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

        <!-- Dirty Notice -->
        <p v-if="bg.isDirty" class="text-xs text-amber-600 dark:text-amber-400">
          {{ t('admin.background.dirtyNotice') }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
/* app-shell max 390px — di bawah ~480px disembunyikan */
@media (max-width: 480px) {
  .outer-bg-trigger {
    display: none;
  }
}
</style>
