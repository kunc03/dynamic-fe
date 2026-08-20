<script setup lang="ts">
// Tombol Logout Admin / Superadmin di cluster kiri admin (setelah OnClickActionButton — lihat app.vue):
// Hanya muncul jika user login sebagai admin / superadmin (adminAuth.isAuthenticated).
const adminAuth = useAdminAuthStore()
const toast = useToast()
const { t } = useI18n()

async function onLogout() {
  const confirmed = window.confirm(t('admin.logout.confirm') || 'Apakah Anda yakin ingin logout sebagai admin/superadmin?')
  if (!confirmed) return

  await adminAuth.logout()
  toast.add({
    title: t('admin.logout.success') || 'Berhasil logout.',
    color: 'success',
    icon: 'i-lucide-check'
  })
}
</script>

<template>
  <div
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    class="admin-logout-trigger fixed top-[456px] left-4 z-40 flex w-16 flex-col items-center gap-1"
  >
    <UTooltip :text="t('admin.logout.aria')">
      <UButton
        icon="i-lucide-log-out"
        color="neutral"
        variant="solid"
        size="lg"
        square
        :loading="adminAuth.loading"
        class="size-11 shrink-0 justify-center shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:!bg-rose-600 hover:!text-white"
        :aria-label="t('admin.logout.aria')"
        @click="onLogout"
      />
    </UTooltip>
    <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
      {{ t('admin.logout.label') }}
    </span>
  </div>
</template>
