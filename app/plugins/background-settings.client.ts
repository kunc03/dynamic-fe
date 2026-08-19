// Ambil setting background content (warna/gambar) dari database
// (site_settings, lihat migration 0012_content_background_setting.sql di
// project `be`), lalu terapkan ke <html> begitu app jalan. Dulu baca dari
// localStorage per-browser; sekarang dari DB supaya SEMUA pengunjung lihat
// background yang sama, bukan cuma browser admin yang pernah nge-save.
//
// Preset font (fontPresets.ts) di-load bareng di sini juga (bukan per-page
// kayak canvasElements.ts) karena sifatnya GLOBAL — satu set preset yang
// sama dipakai elemen teks canvas di halaman manapun, lihat migration
// 0014_font_presets.sql di project `be`.
//
// Visibilitas header/footer (sectionVisibility.ts) juga GLOBAL, jadi
// di-load di sini juga — lihat migration 0015_header_footer.sql. Elemen
// header/footer SENDIRI (isinya) TIDAK di-load di sini — itu urusan
// masing-masing instance CanvasEditor.vue di SiteHeader.vue/SiteFooter.vue
// (dipanggil dari onMounted-nya sendiri), sama kayak canvas content
// halaman.
export default defineNuxtPlugin(() => {
  useBackgroundStore().load()
  useFontPresetsStore().load()
  useSectionVisibilityStore().load()
})
