<script setup lang="ts">
import { HEADER_PAGE_KEY } from '../stores/canvasElements'

// Header GLOBAL — dipasang SEKALI di app.vue, DI DALAM .app-shell (di atas
// <NuxtLayout>) biar lebarnya ikut kebatasi 390px sama kayak content. Sama
// di semua halaman (beda dari elemen canvas content yang per-halaman),
// makanya isinya dikelola CanvasEditor.vue dengan page-key KHUSUS
// HEADER_PAGE_KEY ('__header__', lihat canvasElements.ts) alih-alih page
// key halaman beneran kayak 'home'.
//
// Tinggi & clip-overflow SEKARANG BISA DIATUR admin (lihat
// headerEffectiveHeight/headerEffectiveClipOverflow di sectionVisibility.ts,
// panel-nya di SectionVisibilityButton.vue) — dulu fixed 88px + selalu
// di-clip, sekarang admin bisa perbesar/perkecil kotaknya SENDIRI, dan
// kalau sengaja mau bikin elemen (mis. gambar hero) nongol keluar kotak
// header, tinggal matiin toggle "clip"-nya.
//
// Logic tampil/sembunyi (isVisible/shouldRender) disatukan di
// sectionVisibility.ts (headerIsVisible/headerShouldRender) — dulu
// di-duplikat sendiri-sendiri di sini & SiteFooter.vue.
const sections = useSectionVisibilityStore()

// Background header sendiri (independen dari background content) — sama
// pola mode 'color'/'image' kayak backgroundSettings.ts, tapi diterapkan
// LANGSUNG lewat inline style di kontainer ini (bukan custom property di
// <html>), soalnya header cuma kotak terbatas, bukan seluruh halaman. Gak
// pernah di-custom -> transparan, nembus ke background content di
// belakangnya (perilaku lama, sebelum fitur ini ada).
const backgroundStyle = computed(() => {
  const mode = sections.isEditable ? sections.draftHeaderBgMode : sections.headerBgMode
  const color = sections.isEditable ? sections.draftHeaderBgColor : sections.headerBgColor
  const image = sections.isEditable ? sections.draftHeaderBgImage : sections.headerBgImage

  if (mode === 'image' && image) {
    return {
      backgroundImage: `url("${image}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }

  if (mode === 'color' && color) {
    return { backgroundColor: color }
  }

  return {}
})
</script>

<template>
  <div
    v-if="sections.headerShouldRender"
    class="relative w-full"
    :class="{ 'border border-dashed border-default': !sections.headerIsVisible }"
    :style="[{ height: `${sections.headerEffectiveHeight}px` }, backgroundStyle]"
  >
    <span
      v-if="!sections.headerIsVisible"
      class="pointer-events-none absolute left-1 top-1 z-20 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white"
    >
      Header disembunyikan dari pengunjung
    </span>

    <CanvasEditor :page-key="HEADER_PAGE_KEY" :clip-overflow="sections.headerEffectiveClipOverflow" />
  </div>
</template>
