<script setup lang="ts">
// Pemilih bahasa buat PENGUNJUNG BIASA (bukan cuma admin) — beda dari
// cluster ikon admin di app.vue (EditModeToggle dkk, yang sengaja di LUAR
// .app-shell & disembunyikan di HP asli). Komponen ini DI DALAM
// .app-shell (dipasang di app.vue) supaya kelihatan di HP asli juga,
// nempel di pojok kanan-atas "layar HP" — `position: fixed` di sini tetap
// "nempel" relatif ke KOTAK .app-shell (bukan viewport asli), soalnya
// .app-shell punya `transform: scale(...)` (lihat main.css) yang otomatis
// jadi containing block buat descendant fixed/absolute-nya, jadi ikut
// ke-scale & ke-posisi bareng frame HP-nya, bukan geser ke pojok browser
// asli.
//
// Ganti bahasa di sini CUMA ganti `locale` (dipakai buat: 1) semua label
// UI admin lewat $t()/t(), 2) versi bahasa konten canvas yang dipilih di
// CanvasEditor.vue — lihat contentEn/contentJa di canvasElements.ts).
// TIDAK ngubah URL sama sekali (strategy: 'no_prefix', lihat nuxt.config.ts).
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() => locales.value)
</script>

<template>
  <div class="language-switcher fixed top-2 right-2 z-40 flex gap-0.5 rounded-full bg-black/40 p-0.5 backdrop-blur-sm">
    <button
      v-for="l in availableLocales"
      :key="l.code"
      type="button"
      class="cursor-pointer rounded-full px-2 py-1 text-[10px] font-medium uppercase leading-none transition-colors"
      :class="locale === l.code ? 'bg-white text-black' : 'text-white/80 hover:text-white'"
      :aria-label="`${l.name}`"
      :aria-pressed="locale === l.code"
      @click="setLocale(l.code)"
    >
      {{ l.code }}
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  /* Sengaja gak ada media query hide-di-HP kayak cluster admin —
     switcher ini justru BUAT pengunjung HP juga, bukan cuma desktop. */
}
</style>
