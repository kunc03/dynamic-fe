// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Tech stack confirmed di Scope of Work (§2.1) + modul tambahan §2.2/§7.4
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt',
    '@nuxt/image',
    '@nuxtjs/i18n'
  ],

  css: ['~/assets/css/main.css'],

  // Script inline BLOCKING di <head> (bukan lewat komponen Vue biasa) buat
  // nge-set CSS var --app-scale SEBELUM browser sempat ngerender body sama
  // sekali — mencegah "flash" app-shell kelihatan gak ke-scale (390px
  // mentah, nyisain celah putih di kanan) sesaat sebelum
  // AppScaleController.vue (app/components/AppScaleController.vue) sempat
  // mount & jalan, apalagi kalau ada proses lain (mis. fetch data awal)
  // yang nunda proses hydration Vue. Rumusnya SENGAJA disalin manual di
  // sini (bukan di-import dari AppScaleController.vue) karena script ini
  // jalan SEBELUM aplikasi Vue-nya sendiri ke-load — begitu Vue mount,
  // AppScaleController.vue ngitung ulang nilai yang SAMA & lanjut nge-
  // update-nya tiap resize, jadi dua sisi ini WAJIB tetap sinkron kalau
  // salah satu formulanya (lebar desain 390 / breakpoint 480 / syarat
  // "pointer: coarse and hover: none" — lihat penjelasan lengkap syarat
  // touch-primary ini di AppScaleController.vue) diubah.
  app: {
    head: {
      script: [
        {
          key: 'app-scale-init',
          innerHTML: `(function(){try{var w=window.innerWidth;var touch=window.matchMedia('(pointer: coarse) and (hover: none)').matches;var s=(touch&&w<=480)?(w/390):1;document.documentElement.style.setProperty('--app-scale',String(s));}catch(e){}})();`,
          tagPosition: 'head'
        }
      ]
    }
  },

  // Supabase: redirect diatur manual lewat middleware requiresAuth/requiresGuest (§3.1, §3.4)
  supabase: {
    redirect: false
  },

  // Service worker (§7.4) — konfigurasi detail (manifest, ikon, strategi cache)
  // menyusul saat implementasi PWA per-halaman digarap
  pwa: {
    registerType: 'autoUpdate'
  },

  // i18n: 3 bahasa buat UI admin (EditModeToggle/OuterBackgroundButton/dst)
  // & fallback teks publik ("halaman tidak ditemukan") — isi terjemahannya
  // ada di app/locales/id.json, en.json, ja.json (opsi vue-i18n lain kayak
  // legacy/fallbackLocale tetap di app/i18n.config.ts). INI BEDA dari
  // terjemahan KONTEN canvas (teks yang admin isi sendiri per elemen,
  // lihat contentEn/contentJa di canvasElements.ts) yang disimpan di
  // database, bukan di sini.
  //
  // langDir: 'locales' — relatif ke srcDir ('app/', lihat Nuxt 4), jadi
  // resolve ke app/locales/. Tiap entri `locales` di bawah nunjuk ke SATU
  // file JSON (bukan lagi object `messages` inline di i18n.config.ts) —
  // @nuxtjs/i18n yang otomatis nge-load & gabungin isinya jadi messages
  // vue-i18n, sekaligus bisa lazy-load per-locale.
  //
  // strategy: 'no_prefix' — SENGAJA gak nambah prefix /en/... /ja/... ke
  // URL, karena route di app ini sudah dinamis lewat app/pages/[slug].vue
  // (lihat PagesPanel.vue/stores/pages.ts) & slug-nya sendiri yang jadi
  // page_key ke canvas_elements — nambah locale ke path bakal dobel-
  // komplex urusan matching route tanpa manfaat jelas buat kasus ini.
  // Bahasa yang lagi aktif cuma disimpan di cookie (persist: true di
  // bawah), URL-nya tetap sama.
  i18n: {
    vueI18n: './i18n.config.ts',
    defaultLocale: 'id',
    strategy: 'no_prefix',
    langDir: 'locales',
    locales: [
      { code: 'id', name: 'Indonesia', file: 'id.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'ja', name: '日本語', file: 'ja.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'app_locale',
      redirectOn: 'no prefix'
    }
  }
})
