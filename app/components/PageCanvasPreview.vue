<script setup lang="ts">
import { HEADER_PAGE_KEY, FOOTER_PAGE_KEY, type CanvasElement } from '../stores/canvasElements'

// Komponen lightweight untuk me-render pratinjau canvas halaman berskala (mini/enlarged preview).
// Bekerja dengan mengambil data elemen canvas dari useCanvasElementsStore(pageKey)
// dan merender elemen visual (teks, gambar, tombol) serta latar belakang konten.
const props = withDefaults(defineProps<{
  pageKey: string
  width?: number
  height?: number
  includeHeaderFooter?: boolean
}>(), {
  width: 240,
  height: 380,
  includeHeaderFooter: true
})

const adminAuth = useAdminAuthStore()
const isEditable = computed(() => adminAuth.isAuthenticated && adminAuth.isEditMode)

const bg = useBackgroundStore()
const fonts = useFontPresetsStore()
const canvas = useCanvasElementsStore(props.pageKey)
const header = useCanvasElementsStore(HEADER_PAGE_KEY)
const footer = useCanvasElementsStore(FOOTER_PAGE_KEY)
const sections = useSectionVisibilityStore()
const { contentLocale } = useContentLocale()

onMounted(async () => {
  if (canvas.elements.length === 0 && canvas.draftElements.length === 0) {
    await canvas.load()
  }
  if (props.includeHeaderFooter) {
    if (header.elements.length === 0 && header.draftElements.length === 0) header.load()
    if (footer.elements.length === 0 && footer.draftElements.length === 0) footer.load()
  }
})

// Skala transformasi CSS dari basis desain 390px
const scale = computed(() => props.width / 390)

const activeFontPresets = computed(() => (isEditable.value ? fonts.draftPresets : fonts.presets))

function resolvePreset(el: CanvasElement) {
  if (el.type !== 'text' && el.type !== 'button' && el.type !== 'form_input') return null
  return fonts.resolve(activeFontPresets.value, el.fontPresetId)
}

function getFontStyle(el: CanvasElement) {
  const preset = resolvePreset(el)
  return {
    fontFamily: preset?.fontFamily ?? undefined,
    fontSize: preset ? `${preset.fontSize}px` : undefined,
    fontWeight: preset?.fontWeight ?? undefined,
    color: preset?.color ?? el.color ?? undefined,
    textAlign: (el.type === 'form_input' ? 'left' : 'center') as const
  }
}

function getElementStyle(el: CanvasElement) {
  return {
    position: 'absolute' as const,
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
    zIndex: el.zIndex,
    ...getFontStyle(el)
  }
}

function displayText(el: CanvasElement) {
  const current = contentLocale.value
  if (!current || current === 'id') return el.content
  if (el.translations && el.translations[current] && el.translations[current].trim().length > 0) {
    return el.translations[current]
  }
  if (current === 'en' && el.contentEn) return el.contentEn
  if (current === 'ja' && el.contentJa) return el.contentJa
  return el.content
}

function getDisplayFieldLabel(el: CanvasElement): string {
  if (!el.formConfig) return displayText(el)
  const lang = contentLocale.value
  if (lang && lang !== 'id') {
    if (el.formConfig.translations?.[lang]?.label) {
      return el.formConfig.translations[lang].label!
    }
    if (el.translations?.[lang]) {
      return el.translations[lang]
    }
    if (lang === 'en' && el.contentEn) return el.contentEn
    if (lang === 'ja' && el.contentJa) return el.contentJa
  }
  return el.formConfig.label || el.content
}

function getDisplayFieldPlaceholder(el: CanvasElement): string {
  if (!el.formConfig) return ''
  const lang = contentLocale.value
  if (lang && lang !== 'id' && el.formConfig.translations?.[lang]?.placeholder) {
    return el.formConfig.translations[lang].placeholder!
  }
  return el.formConfig.placeholder || ''
}

const displayElements = computed(() => (isEditable.value ? canvas.draftElements : canvas.elements))
const headerElements = computed(() => (isEditable.value ? header.draftElements : header.elements))
const footerElements = computed(() => (isEditable.value ? footer.draftElements : footer.elements))

const effectiveBgStyle = computed(() => {
  const pageBg = isEditable.value ? bg.getDraftPageBackground(props.pageKey) : bg.getPageBackground(props.pageKey)
  const mode = pageBg.mode
  const color = pageBg.color
  const img = pageBg.imageDataUrl

  if (mode === 'image' && img) {
    return {
      backgroundColor: 'transparent',
      backgroundImage: `url("${img}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }
  if (mode === 'color' && color) {
    return {
      backgroundColor: color,
      backgroundImage: 'none'
    }
  }
  return {
    backgroundColor: '#09090b',
    backgroundImage: 'none'
  }
})
</script>

<template>
  <div
    class="page-canvas-preview-container relative overflow-hidden select-none pointer-events-none rounded-lg"
    :style="{
      width: `${props.width}px`,
      height: `${props.height}px`,
      ...effectiveBgStyle
    }"
  >
    <!-- Virtual viewport 390px scaled down -->
    <div
      class="origin-top-left absolute top-0 left-0"
      :style="{
        width: '390px',
        height: `${props.height / scale}px`,
        transform: `scale(${scale})`
      }"
    >
      <!-- Optional Header -->
      <div
        v-if="props.includeHeaderFooter && sections.isHeaderVisible(props.pageKey)"
        class="relative border-b border-white/5"
        :style="{
          height: `${sections.headerEffectiveHeight}px`,
          backgroundColor: sections.headerEffectiveBgColor || 'transparent'
        }"
      >
        <div
          v-for="el in headerElements"
          :key="`h-${el.id}`"
          :style="getElementStyle(el)"
          class="flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="el.type === 'image'"
            :src="el.content"
            class="h-full w-full object-cover"
          >
          <div
            v-else-if="el.type === 'button'"
            class="h-full w-full flex items-center justify-center font-medium px-2 truncate"
            :style="{
              backgroundColor: el.onClickConfig?.bgColor || '#10b981',
              color: el.color || el.onClickConfig?.textColor || '#ffffff',
              borderRadius: `${el.onClickConfig?.borderRadius ?? 8}px`
            }"
          >
            {{ displayText(el) }}
          </div>
          <div v-else class="h-full w-full whitespace-pre-wrap break-words text-center">
            {{ displayText(el) }}
          </div>
        </div>
      </div>

      <!-- Main Page Canvas Elements -->
      <div class="relative w-[390px] min-h-[500px]">
        <div
          v-for="el in displayElements"
          :key="el.id"
          :style="getElementStyle(el)"
          class="flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="el.type === 'image'"
            :src="el.content"
            class="h-full w-full object-cover"
          >
          <div
            v-else-if="el.type === 'button'"
            class="h-full w-full flex items-center justify-center font-medium px-2 truncate"
            :style="{
              backgroundColor: el.onClickConfig?.bgColor || '#10b981',
              color: el.color || el.onClickConfig?.textColor || '#ffffff',
              borderRadius: `${el.onClickConfig?.borderRadius ?? 8}px`
            }"
          >
            {{ displayText(el) }}
          </div>
          <!-- Form Input Elements in Preview -->
          <div
            v-else-if="el.type === 'form_input' && el.formConfig"
            class="h-full w-full flex flex-col justify-center px-1 text-xs"
            :style="getFontStyle(el)"
          >
            <button
              v-if="el.formConfig.fieldType === 'submit'"
              type="button"
              class="h-full w-full flex items-center justify-center font-medium px-2 truncate rounded shadow-sm text-center"
              :style="{
                backgroundColor: el.formConfig.bgColor || '#10b981',
                color: el.formConfig.textColor || '#ffffff',
                borderRadius: `${el.formConfig.borderRadius ?? 8}px`
              }"
            >
              {{ getDisplayFieldLabel(el) }}
            </button>
            <div
              v-else-if="el.formConfig.fieldType === 'checkbox' || el.formConfig.fieldType === 'radio'"
              class="flex items-center gap-1.5 truncate"
              :style="{ color: el.formConfig.textColor || '#ffffff' }"
            >
              <div
                class="size-3.5 border shrink-0"
                :class="el.formConfig.fieldType === 'radio' ? 'rounded-full' : 'rounded'"
                :style="{ borderColor: el.formConfig.borderColor || '#52525b' }"
              />
              <span class="truncate text-[10px]">{{ getDisplayFieldLabel(el) }}</span>
            </div>
            <div v-else class="flex flex-col justify-center h-full w-full space-y-0.5">
              <span v-if="el.formConfig.label" class="text-[9px] opacity-80 truncate text-left" :style="{ color: el.formConfig.textColor || '#ffffff' }">
                {{ getDisplayFieldLabel(el) }}
              </span>
              <div
                class="flex-1 w-full rounded border px-1.5 flex items-center text-[9px] text-neutral-400 truncate text-left"
                :style="{
                  backgroundColor: el.formConfig.bgColor || '#18181b',
                  borderColor: el.formConfig.borderColor || '#3f3f46',
                  borderRadius: `${el.formConfig.borderRadius ?? 8}px`
                }"
              >
                {{ getDisplayFieldPlaceholder(el) || '...' }}
              </div>
            </div>
          </div>
          <div v-else class="h-full w-full whitespace-pre-wrap break-words text-center">
            {{ displayText(el) }}
          </div>
        </div>
      </div>

      <!-- Optional Footer -->
      <div
        v-if="props.includeHeaderFooter && sections.isFooterVisible(props.pageKey)"
        class="absolute bottom-0 left-0 w-full border-t border-white/5"
        :style="{
          height: `${sections.footerEffectiveHeight}px`,
          backgroundColor: sections.footerEffectiveBgColor || 'transparent'
        }"
      >
        <div
          v-for="el in footerElements"
          :key="`f-${el.id}`"
          :style="getElementStyle(el)"
          class="flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="el.type === 'image'"
            :src="el.content"
            class="h-full w-full object-cover"
          >
          <div
            v-else-if="el.type === 'button'"
            class="h-full w-full flex items-center justify-center font-medium px-2 truncate"
            :style="{
              backgroundColor: el.onClickConfig?.bgColor || '#10b981',
              color: el.color || el.onClickConfig?.textColor || '#ffffff',
              borderRadius: `${el.onClickConfig?.borderRadius ?? 8}px`
            }"
          >
            {{ displayText(el) }}
          </div>
          <!-- Form Input Elements in Preview -->
          <div
            v-else-if="el.type === 'form_input' && el.formConfig"
            class="h-full w-full flex flex-col justify-center px-1 text-xs"
            :style="getFontStyle(el)"
          >
            <button
              v-if="el.formConfig.fieldType === 'submit'"
              type="button"
              class="h-full w-full flex items-center justify-center font-medium px-2 truncate rounded shadow-sm text-center"
              :style="{
                backgroundColor: el.formConfig.bgColor || '#10b981',
                color: el.formConfig.textColor || '#ffffff',
                borderRadius: `${el.formConfig.borderRadius ?? 8}px`
              }"
            >
              {{ getDisplayFieldLabel(el) }}
            </button>
            <div
              v-else-if="el.formConfig.fieldType === 'checkbox' || el.formConfig.fieldType === 'radio'"
              class="flex items-center gap-1.5 truncate"
              :style="{ color: el.formConfig.textColor || '#ffffff' }"
            >
              <div
                class="size-3.5 border shrink-0"
                :class="el.formConfig.fieldType === 'radio' ? 'rounded-full' : 'rounded'"
                :style="{ borderColor: el.formConfig.borderColor || '#52525b' }"
              />
              <span class="truncate text-[10px]">{{ getDisplayFieldLabel(el) }}</span>
            </div>
            <div v-else class="flex flex-col justify-center h-full w-full space-y-0.5">
              <span v-if="el.formConfig.label" class="text-[9px] opacity-80 truncate text-left" :style="{ color: el.formConfig.textColor || '#ffffff' }">
                {{ getDisplayFieldLabel(el) }}
              </span>
              <div
                class="flex-1 w-full rounded border px-1.5 flex items-center text-[9px] text-neutral-400 truncate text-left"
                :style="{
                  backgroundColor: el.formConfig.bgColor || '#18181b',
                  borderColor: el.formConfig.borderColor || '#3f3f46',
                  borderRadius: `${el.formConfig.borderRadius ?? 8}px`
                }"
              >
                {{ getDisplayFieldPlaceholder(el) || '...' }}
              </div>
            </div>
          </div>
          <div v-else class="h-full w-full whitespace-pre-wrap break-words text-center">
            {{ displayText(el) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
