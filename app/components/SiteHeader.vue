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
const route = useRoute()
const sections = useSectionVisibilityStore()
const currentPageKey = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : 'home'
})

const shouldRender = computed(() => sections.isHeaderVisible(currentPageKey.value))

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
    v-if="shouldRender"
    class="relative w-full shrink-0 z-20"
    :style="[{ height: `${sections.headerEffectiveHeight}px` }, backgroundStyle]"
  >
    <CanvasEditor :page-key="HEADER_PAGE_KEY" :clip-overflow="sections.headerEffectiveClipOverflow" />
  </div>
</template>
