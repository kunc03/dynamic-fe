// Dipakai bareng oleh SEMUA halaman canvas (app/pages/index.vue buat
// 'home', app/pages/[slug].vue buat halaman tambahan) — sebelum ini
// rumus `contentMinHeight` cuma ada di index.vue sendiri-sendiri; begitu
// halaman tambahan (multi-page, lihat PagesPanel.vue/stores/pages.ts)
// butuh persis rumus yang sama, diangkat ke sini biar gak dobel-tulis &
// gampang diubah di satu tempat kalau formulanya perlu disesuaikan lagi.
//
// Lihat penjelasan lengkap kenapa rumusnya begini (kenapa dibagi
// --app-scale, kenapa dikurangi header/footer, kenapa pakai angka
// eksplisit bukan flex) di komentar asli app/pages/index.vue (sebelum
// diekstrak ke sini) — intinya: content ini anak dari .app-shell yang
// tingginya LOKAL (`100dvh / --app-scale`, lihat main.css &
// AppScaleController.vue), dikurangi tinggi header+footer yang BENERAN
// dirender sekarang (headerRenderedHeight/footerRenderedHeight di
// sectionVisibility.ts) supaya kalau isi canvas-nya pendek, semua muat
// satu layar tanpa footer ke-dorong keluar.
export function useContentMinHeight() {
  const sections = useSectionVisibilityStore()

  return computed(
    () =>
      `calc((100dvh / var(--app-scale, 1)) - ${sections.headerRenderedHeight}px - ${sections.footerRenderedHeight}px)`
  )
}
