<script setup lang="ts">
// Ikon utama buat nyala/matiin "edit mode". Cuma tampil kalau lagi login
// sebagai admin/superadmin. Begitu edit mode nyala, ikon-ikon tool lain
// muncul di bawahnya satu per satu (mulai dari OuterBackgroundButton.vue).
//
// Label & aria-label lewat t() (lihat app/i18n.config.ts) — beda dari
// LanguageSwitcher.vue yang ganti bahasa KONTEN canvas, locale yang sama
// ini JUGA yang nentuin bahasa semua tombol/panel admin di sini.
const adminAuth = useAdminAuthStore()
const { t } = useI18n()
</script>

<template>
  <div
    v-if="adminAuth.isAuthenticated"
    class="edit-mode-toggle fixed top-4 left-4 z-50 flex w-16 flex-col items-center gap-1"
  >
    <UButton
      :icon="adminAuth.isEditMode ? 'i-lucide-x' : 'i-lucide-pencil'"
      :color="adminAuth.isEditMode ? 'primary' : 'neutral'"
      variant="solid"
      size="lg"
      square
      class="size-11 shrink-0 justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
      :class="adminAuth.isEditMode ? 'ring-2 ring-primary ring-offset-2' : ''"
      :aria-label="adminAuth.isEditMode ? t('admin.editMode.closeAria') : t('admin.editMode.openAria')"
      @click="adminAuth.toggleEditMode()"
    />
    <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
      {{ adminAuth.isEditMode ? t('admin.editMode.close') : t('admin.editMode.edit') }}
    </span>
  </div>
</template>

<style scoped>
/* app-shell max 390px — di bawah ~480px gak ada ruang putih di kiri buat
   tombol ini, jadi disembunyikan aja. */
@media (max-width: 480px) {
  .edit-mode-toggle {
    display: none;
  }
}
</style>
