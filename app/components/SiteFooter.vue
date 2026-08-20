<script setup lang="ts">
import { FOOTER_PAGE_KEY } from '../stores/canvasElements'

// Footer GLOBAL — pasangan SiteHeader.vue, dipasang SEKALI di app.vue DI
// DALAM .app-shell (di bawah <NuxtLayout>). Lihat SiteHeader.vue buat
// penjelasan lengkap pola page-key khusus (FOOTER_PAGE_KEY), background,
// tinggi & clip-overflow yang bisa diatur admin, & kenapa logic
// tampil/sembunyi ada di sectionVisibility.ts — sama persis, cuma buat
// footer.
const route = useRoute()
const sections = useSectionVisibilityStore()
const currentPageKey = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : 'home'
})

const shouldRender = computed(() => sections.isFooterVisible(currentPageKey.value))

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
    v-if="shouldRender"
    class="relative w-full shrink-0 z-20"
    :style="[{ height: `${sections.footerEffectiveHeight}px` }, backgroundStyle]"
  >
    <CanvasEditor :page-key="FOOTER_PAGE_KEY" :clip-overflow="sections.footerEffectiveClipOverflow" />
  </div>
</template>
