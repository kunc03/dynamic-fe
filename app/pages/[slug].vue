<script setup lang="ts">
// Halaman TAMBAHAN (bukan 'home') — route publik /<slug>, isinya sama
// persis kayak app/pages/index.vue (CanvasEditor pakai page_key = slug
// ini), cuma slug-nya diambil dari path URL secara dinamis, bukan
// hardcode 'home'. Dibuat admin lewat form "Tambah halaman" di
// PagesPanel.vue — daftar slug yang valid ada di tabel `pages` (lihat
// stores/pages.ts).
//
// Kalau slug di URL gak ketemu di daftar itu, tampilin pesan "halaman
// tidak ditemukan" alih-alih canvas kosong yang bikin bingung (baik itu
// typo pengunjung ATAU slug yang emang belum/gak pernah dibuat) — canvas
// kosong & pesan "tidak ditemukan" keduanya gak nampilin apa-apa secara
// visual, tapi pesannya bikin jelas ini BUKAN halaman yang sengaja
// dikosongin adminnya.
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { t } = useI18n()

const pagesStore = usePagesStore()
const contentMinHeight = useContentMinHeight()

// Pengecekan "ketemu/enggak" CUMA jalan di CLIENT (sama kayak semua fetch
// lain di project ini, mis. canvasElements.load() — lihat alasannya di
// sana: query Supabase butuh browser, gak dijalanin pas SSR). `checked`
// nahan render sampai pengecekan pertama selesai (baik itu berhasil
// nemuin ATAU gagal), biar gak sempat nge-flash pesan "tidak ditemukan"
// sekilas sebelum daftar halaman sempat ke-load duluan.
const isKnownPage = ref(false)
const checked = ref(false)

onMounted(async () => {
  if (pagesStore.pages.length === 0) await pagesStore.load()
  isKnownPage.value = pagesStore.pages.some(p => p.slug === slug.value)
  checked.value = true
})
</script>

<template>
  <div v-if="!checked" />

  <div v-else-if="isKnownPage" class="relative" :style="{ minHeight: contentMinHeight }">
    <CanvasEditor :page-key="slug" />
  </div>

  <div v-else class="flex items-center justify-center p-10 text-center text-muted">
    {{ t('page.notFound') }}
  </div>
</template>
