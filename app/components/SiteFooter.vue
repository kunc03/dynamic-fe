<script setup lang="ts">
import { FOOTER_PAGE_KEY } from '../stores/canvasElements'

// Footer GLOBAL — pasangan SiteHeader.vue, dipasang SEKALI di app.vue DI
// DALAM .app-shell (di bawah <NuxtLayout>). Lihat SiteHeader.vue buat
// penjelasan lengkap pola page-key khusus (FOOTER_PAGE_KEY), background,
// tinggi & clip-overflow yang bisa diatur admin, & kenapa logic
// tampil/sembunyi ada di sectionVisibility.ts — sama persis, cuma buat
// footer.
const sections = useSectionVisibilityStore()

const backgroundStyle = computed(() => {
  const mode = sections.isEditable ? sections.draftFooterBgMode : sections.footerBgMode
  const color = sections.isEditable ? sections.draftFooterBgColor : sections.footerBgColor
  const image = sections.isEditable ? sections.draftFooterBgImage : sections.footerBgImage

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
    v-if="sections.footerShouldRender"
    class="relative w-full"
    :class="{ 'border border-dashed border-default': !sections.footerIsVisible }"
    :style="[{ height: `${sections.footerEffectiveHeight}px` }, backgroundStyle]"
  >
    <span
      v-if="!sections.footerIsVisible"
      class="pointer-events-none absolute left-1 top-1 z-20 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white"
    >
      Footer disembunyikan dari pengunjung
    </span>

    <CanvasEditor :page-key="FOOTER_PAGE_KEY" :clip-overflow="sections.footerEffectiveClipOverflow" />
  </div>
</template>
