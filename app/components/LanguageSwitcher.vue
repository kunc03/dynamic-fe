<script setup lang="ts">
// Pemilih bahasa dinamis global di navbar admin
const adminAuth = useAdminAuthStore()
const siteLanguages = useSiteLanguagesStore()
const { locales, setLocale } = useI18n()
const { contentLocale, setContentLocale } = useContentLocale()

onMounted(() => {
  siteLanguages.load()
})

const activeLanguages = computed(() => siteLanguages.activeLanguages)

function onSelectLocale(code: string) {
  setContentLocale(code)
  if (locales.value.some(l => l.code === code)) {
    setLocale(code)
  }
}
</script>

<template>
  <div
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    class="language-switcher fixed top-5 left-[84px] z-50 flex gap-0.5 rounded-full bg-black/60 p-0.5 shadow-md backdrop-blur-md"
  >
    <button
      v-for="l in activeLanguages"
      :key="l.code"
      type="button"
      class="cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase leading-none transition-colors"
      :class="(contentLocale === l.code || (!contentLocale && l.isDefault)) ? 'bg-white text-black shadow-sm' : 'text-white/80 hover:text-white'"
      :aria-label="`${l.name}`"
      :aria-pressed="contentLocale === l.code"
      @click="onSelectLocale(l.code)"
    >
      {{ l.code }}
    </button>
  </div>
</template>

<style scoped>
@media (max-width: 480px) {
  .language-switcher {
    display: none;
  }
}
</style>
