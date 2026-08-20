// DEPRECATED — file ini SUDAH GAK DIPAKAI, biarpun masih ada di sini.
//
// @nuxtjs/i18n v10 punya opsi `restructureDir` yang DEFAULT-nya `'i18n'`,
// dan itu di-resolve relatif ke ROOT PROJECT, bukan ke `srcDir` ('app/').
// File config vue-i18n yang BENAR sekarang ada di:
//
//   dynamic-fe/i18n/i18n.config.ts
//
// (sejajar dengan folder `app/`, bukan di dalamnya). Isi terjemahannya ada
// di `dynamic-fe/i18n/locales/{id,en,ja}.json`.
//
// File `app/i18n.config.ts` ini (dan `app/locales/*.json` di sebelahnya)
// adalah sisa dari draft PERTAMA sebelum ketahuan lokasinya salah (nge-
// trigger error ENOENT "no such file or directory, open
// '...\\i18n\\locales\\en.json'" pas dev server jalan). Silakan hapus
// manual file ini + folder `app/locales/` — gak bisa dihapus otomatis dari
// sesi ini, cuma bisa ditimpa isinya.
export {}
