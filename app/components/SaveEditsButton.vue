<script setup lang="ts">
import { HEADER_PAGE_KEY, FOOTER_PAGE_KEY } from '../stores/canvasElements'
import { usePageDialogStore } from '../stores/pageDialog'

// Tombol commit tunggal buat SEMUA perubahan admin yang masih berupa draft:
// background content (backgroundSettings.ts), dialog halaman (pageDialog.ts),
// elemen teks/gambar canvas content HALAMAN + HEADER + FOOTER (canvasElements.ts),
// preset font (fontPresets.ts), DAN visibilitas/background/tinggi header/footer
// (sectionVisibility.ts).
const adminAuth = useAdminAuthStore()
const bg = useBackgroundStore()
const route = useRoute()
const currentPageKey = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : 'home'
})
const content = computed(() => useCanvasElementsStore(currentPageKey.value))
const pageDialog = computed(() => usePageDialogStore(currentPageKey.value))
const header = useCanvasElementsStore(HEADER_PAGE_KEY)
const footer = useCanvasElementsStore(FOOTER_PAGE_KEY)
const fonts = useFontPresetsStore()
const sections = useSectionVisibilityStore()
const toast = useToast()
const { t } = useI18n()

const isDirty = computed(() =>
  bg.isDirty || pageDialog.value.isDirty || content.value.isDirty || header.isDirty || footer.isDirty || fonts.isDirty || sections.isDirty
)
const saving = computed(() =>
  bg.saving || pageDialog.value.saving || content.value.saving || header.saving || footer.saving || fonts.saving || sections.saving
)

async function onSaveClick() {
  try {
    await Promise.all([
      bg.isDirty ? bg.save() : Promise.resolve(),
      pageDialog.value.isDirty ? pageDialog.value.save() : Promise.resolve(),
      content.value.isDirty ? content.value.save() : Promise.resolve(),
      header.isDirty ? header.save() : Promise.resolve(),
      footer.isDirty ? footer.save() : Promise.resolve(),
      fonts.isDirty ? fonts.save() : Promise.resolve(),
      sections.isDirty ? sections.save() : Promise.resolve()
    ])
    toast.add({
      title: t('admin.save.savedTitle'),
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({
      title: t('admin.save.saveFailedTitle'),
      description: bg.error ?? pageDialog.value.error ?? content.value.error ?? header.error ?? footer.error ?? fonts.error ?? sections.error ?? undefined,
      color: 'error',
      icon: 'i-lucide-alert-triangle'
    })
  }
}

function onDiscardClick() {
  const confirmed = window.confirm(t('admin.save.confirmDiscard'))
  if (!confirmed) return

  bg.resetDraft()
  pageDialog.value.resetDraft()
  content.value.resetDraft()
  header.resetDraft()
  footer.resetDraft()
  fonts.resetDraft()
  sections.resetDraft()

  toast.add({
    title: t('admin.save.discardedTitle'),
    icon: 'i-lucide-undo-2',
    color: 'neutral'
  })
}
</script>

<template>
  <div
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode && isDirty"
    class="save-edits-group fixed top-4 right-4 z-[100] flex items-center gap-2"
  >
    <UButton
      :label="t('admin.save.discard')"
      icon="i-lucide-x"
      color="neutral"
      variant="outline"
      size="lg"
      :disabled="saving"
      class="bg-default shadow-lg cursor-pointer"
      :aria-label="t('admin.save.discardAria')"
      @click="onDiscardClick"
    />
    <UButton
      :label="t('admin.save.save')"
      icon="i-lucide-check"
      color="primary"
      variant="solid"
      size="lg"
      :loading="saving"
      class="shadow-lg cursor-pointer"
      :aria-label="t('admin.save.saveAria')"
      @click="onSaveClick"
    />
  </div>
</template>

<style scoped>
@media (max-width: 480px) {
  .save-edits-group {
    display: none;
  }
}
</style>
