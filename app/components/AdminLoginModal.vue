<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

// Modal login khusus admin/superadmin.
// Dipicu lewat shortcut keyboard Alt+Shift+A — tidak ada tombol/link
// yang mengarah ke sini di UI publik (lihat app/plugins/admin-shortcut.client.ts).
const store = useAdminAuthStore()
const { t } = useI18n()

// Schema computed (bukan const biasa) — pesan error zod-nya lewat t(),
// jadi ikut ganti kalau admin ganti bahasa SEBELUM submit form (mis. buka
// modal, ganti bahasa lewat LanguageSwitcher.vue, baru isi form).
const schema = computed(() => z.object({
  email: z.string().email(t('admin.login.emailInvalid')),
  password: z.string().min(6, t('admin.login.passwordMin'))
}))

type Schema = z.output<typeof schema.value>

const state = reactive({
  email: '',
  password: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await store.login(event.data.email, event.data.password)
}

// Reset form setiap kali modal ditutup.
watch(
  () => store.isOpen,
  (open) => {
    if (!open) {
      state.email = ''
      state.password = ''
      store.error = null
    }
  }
)
</script>

<template>
  <UModal
    v-model:open="store.isOpen"
    :title="t('admin.login.title')"
    :description="t('admin.login.description')"
    :dismissible="!store.loading"
    :portal="false"
    :ui="{ content: 'w-[calc(100%-2rem)] max-w-lg rounded-lg shadow-lg ring ring-default' }"
  >
    <template #body>
      <UAlert
        v-if="store.error"
        color="error"
        variant="soft"
        :title="store.error"
        class="mb-4"
      />

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField :label="t('admin.login.email')" name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="admin@example.com"
            autocomplete="username"
            class="w-full"
            :disabled="store.loading"
          />
        </UFormField>

        <UFormField :label="t('admin.login.password')" name="password">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            class="w-full"
            :disabled="store.loading"
          />
        </UFormField>

        <UButton type="submit" block :loading="store.loading" class="cursor-pointer">
          {{ t('admin.login.submit') }}
        </UButton>
      </UForm>
    </template>
  </UModal>
</template>
