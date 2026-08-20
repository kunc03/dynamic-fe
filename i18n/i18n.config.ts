// Konfigurasi vue-i18n buat @nuxtjs/i18n (lihat block `i18n` di
// nuxt.config.ts). PENTING soal LOKASI file ini — @nuxtjs/i18n v10 punya
// opsi `restructureDir` yang DEFAULT-nya `'i18n'`, dan opsi itu di-resolve
// relatif ke ROOT PROJECT (rootDir), BUKAN relatif ke `srcDir` ('app/',
// lihat Nuxt 4). Makanya file config vue-i18n & folder locales-nya WAJIB
// ada di `dynamic-fe/i18n/...` (sejajar dengan folder `app/`), BUKAN di
// `dynamic-fe/app/i18n.config.ts` / `dynamic-fe/app/locales/` — taruh di
// situ bikin @nuxtjs/i18n nyari file yang gak ada & error ENOENT pas dev
// server jalan (persis error yang muncul sebelum file ini dipindah ke
// sini).
//
// File ini cuma nyimpen opsi vue-i18n (legacy/fallbackLocale) — isi
// terjemahannya ADA DI i18n/locales/ (id.json, en.json, ja.json),
// didaftarkan lewat `locales: [{ code, file }]` + `langDir: 'locales'` di
// nuxt.config.ts.
//
// Beda dari terjemahan KONTEN canvas (teks/gambar yang admin isi lewat
// CanvasEditor, lihat contentEn/contentJa di canvasElements.ts) — itu
// per-ELEMEN & disimpan di database, BUKAN di i18n/locales/. Folder ini
// CUMA buat label/tombol/placeholder tetap di seluruh aplikasi (UI
// "chrome"-nya), bukan konten yang admin isi sendiri.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'id'
}))
