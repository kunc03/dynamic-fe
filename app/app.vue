<script setup lang="ts">
const route = useRoute()
const bg = useBackgroundStore()
const adminAuth = useAdminAuthStore()

const currentPageKey = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : 'home'
})

watch(
  [currentPageKey, () => adminAuth.isEditMode, () => bg.draftPageBackgrounds, () => bg.pageBackgrounds],
  () => {
    bg.applyCurrentPageBackground(currentPageKey.value)
  },
  { immediate: true, deep: true }
)
</script>

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
        paling atas (fixed di atas content).
      -->
      <SiteHeader />

      <!-- Area Scroll Konten Halaman (Independent Scroll) -->
      <div class="app-content-scroll">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>

      <!-- Pasangan SiteHeader di atas, buat footer (fixed di bawah content). -->
      <SiteFooter />

      <!--
        Modal login rahasia admin/superadmin — buka dengan Alt+Shift+A.
        Harus di dalam .app-shell (bukan teleport ke <body>, lihat prop
        `portal="false"` di komponennya) supaya lebarnya ikut kebatasi 390px.
      -->
      <ClientOnly>
        <AdminLoginModal />
      </ClientOnly>
    </div>

  <!--
    Ikon-ikon edit mode admin/superadmin — sengaja di LUAR .app-shell (bukan
    dibatasi 390px) karena mereka nempel di area putih kiri-kanan, relatif
    ke viewport asli.
  -->
  <ClientOnly>
    <EditModeToggle />
    <LanguageSwitcher />
    <SectionVisibilityButton />
    <FontPresetsButton />
    <LanguageManagerButton />
    <OnClickActionButton />
    <AdminLogoutButton />
    <PagesPanel />
    <SaveEditsButton />
    <PageClickDialogModal />
  </ClientOnly>

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
