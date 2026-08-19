<template>
  <UApp>
    <!-- Wrapper mobile-width: didesain tetap 390px, di-center (desktop)
         atau di-scale ngisi lebar layar (HP asli) — lihat main.css &
         AppScaleController.vue. -->
    <div class="app-shell">
      <NuxtRouteAnnouncer />

      <!--
        Header GLOBAL (muncul di semua halaman) — DI DALAM .app-shell biar
        lebarnya ikut kebatasi 390px, DI ATAS <NuxtLayout> biar selalu di
        paling atas. Isinya dikelola lewat canvas sendiri (lihat
        SiteHeader.vue) — beda dari konten halaman yang per-halaman.
      -->
      <SiteHeader />

      <!-- Pemilih bahasa (ID/EN/JA) buat SEMUA pengunjung (bukan cuma
           admin) — lihat LanguageSwitcher.vue kenapa ini DI DALAM
           .app-shell (beda dari cluster ikon admin di bawah yang sengaja
           di luar). -->
      <LanguageSwitcher />

      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>

      <!-- Pasangan SiteHeader di atas, buat footer — lihat SiteFooter.vue. -->
      <SiteFooter />

      <!--
        Modal login rahasia admin/superadmin — buka dengan Alt+Shift+A.
        Harus di dalam .app-shell (bukan teleport ke <body>, lihat prop
        `portal="false"` di komponennya) supaya lebarnya ikut kebatasi 390px.
      -->
      <AdminLoginModal />
    </div>

    <!--
      Ikon-ikon edit mode admin/superadmin — sengaja di LUAR .app-shell (bukan
      dibatasi 390px) karena mereka nempel di area putih kiri-kanan, relatif
      ke viewport asli. Cluster kiri (top-4, top-20, top-36, top-52, ...)
      ditambah satu per satu tiap ada tool baru; SATU tombol Save terpisah
      di kanan atas buat commit SEMUA tool sekaligus.

      - EditModeToggle (top-4)              = ikon utama, nyala/matiin edit
        mode.
      - OuterBackgroundButton (top-20)      = ubah background CONTENT
        (bagian DALAM app-shell) — posisi tombolnya aja yang di luar.
      - SectionVisibilityButton (top-36)    = toggle tampil/sembunyiin
        header & footer GLOBAL (lihat sectionVisibility.ts, SiteHeader.vue,
        SiteFooter.vue). Isi header/footer sendiri diedit LANGSUNG di
        canvas-nya masing-masing (tombol "+" tambah elemen sekarang nempel
        LOKAL di tiap canvas — lihat CanvasEditor.vue — bukan tombol global
        terpisah kayak AddCanvasElementButtons.vue yang lama, soalnya
        sekarang ada 3 canvas sekaligus di layar yang sama: header + content
        + footer, jadi tombol "+" harus jelas nunjuk ke canvas yang mana).
      - FontPresetsButton (top-52)          = kelola preset tipografi global
        (Primary/Secondary/dst) yang direferensi elemen teks canvas lewat
        dropdown font di toolbar elemen terpilih (lihat fontPresets.ts).
      - SaveEditsButton (kanan atas)        = commit draft dari SEMUA tool
        di atas (background + canvas content/header/footer + font presets +
        visibilitas header/footer) sekaligus, cuma muncul kalau ada yang
        belum disimpan.

      Cluster KANAN (top-20, ...) beda dari cluster kiri — bukan setting
      tampilan global, tapi navigasi & manajemen daftar HALAMAN (multi-page,
      lihat stores/pages.ts & app/pages/[slug].vue):
      - PagesPanel (top-20 right-4)         = daftar halaman (Beranda +
        halaman tambahan) buat pindah-edit, + form tambah halaman baru
        (judul & slug/route-nya).
    -->
    <EditModeToggle />
    <OuterBackgroundButton />
    <SectionVisibilityButton />
    <FontPresetsButton />
    <PagesPanel />
    <SaveEditsButton />

    <!--
      Gak nge-render apa-apa — cuma nge-set CSS var `--app-scale` ke <html>
      berdasarkan lebar layar ASLI (lihat AppScaleController.vue & catatan
      panjang soal ini di main.css), biar .app-shell (didesain tetap di
      lebar 390px) tetap ngisi penuh layar HP APA PUN lebar aslinya (360,
      390, 412, 414, 428px, dst) TANPA bikin posisi elemen canvas ikut
      geser antar device beda lebar.
    -->
    <AppScaleController />

    <!--
      Gak nge-render apa-apa — cuma inject <link> stylesheet Google Fonts
      buat tiap font family yang dipakai preset tipografi (lihat
      fontPresets.ts & GoogleFontsLoader.vue), supaya nama font yang diketik
      admin di FontPresetsButton beneran ke-load, bukan cuma teks CSS yang
      fallback ke font default browser.
    -->
    <GoogleFontsLoader />
  </UApp>
</template>
