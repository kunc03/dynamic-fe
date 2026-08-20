<script setup lang="ts">
// Panel daftar halaman di sebelah KANAN di luar konten (.app-shell).
// Menampilkan daftar semua halaman dalam format grid/flex-wrap horizontal (kiri ke kanan, lalu turun ke baris berikutnya):
// 1. Nomor urut
// 2. Card preview (canvas thumbnail) dengan live preview diperbesar tepat di BAWAH (atau ATAS) kartu saat di-hover
// 3. Nama halaman dan path
// Dilengkapi kartu "+" untuk menambah halaman baru secara sejajar.
const adminAuth = useAdminAuthStore()
const pagesStore = usePagesStore()
const route = useRoute()
const { t } = useI18n()

// Muat daftar halaman saat komponen mount
onMounted(() => {
  pagesStore.load()
})

const pageEntries = computed(() => [
  { slug: 'home', title: t('admin.pages.home'), path: '/' },
  ...pagesStore.pages.map(p => ({ slug: p.slug, title: p.title, path: `/${p.slug}` }))
])

function isActivePage(path: string) {
  return route.path === path
}

function goToPage(path: string) {
  hoveredEntry.value = null
  hoveredRect.value = null
  if (route.path !== path) {
    navigateTo(path)
  }
}

// --- Hover State & Teleported Floating Preview ---
interface HoveredEntry {
  slug: string
  title: string
  path: string
  idx: number
}

const hoveredEntry = ref<HoveredEntry | null>(null)
const hoveredRect = ref<{ top: number, left: number, width: number, height: number, right: number, bottom: number } | null>(null)
let hoverTimeout: any = null

function updateHoverTarget(entry: { slug: string, title: string, path: string }, idx: number, target: HTMLElement) {
  clearTimeout(hoverTimeout)
  const rect = target.getBoundingClientRect()
  hoveredRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  }
  hoveredEntry.value = { ...entry, idx }
}

function onMouseEnterCard(entry: { slug: string, title: string, path: string }, idx: number, event: MouseEvent) {
  updateHoverTarget(entry, idx, event.currentTarget as HTMLElement)
}

function onMouseLeaveCard() {
  hoverTimeout = setTimeout(() => {
    hoveredEntry.value = null
    hoveredRect.value = null
  }, 60)
}

const PREVIEW_WIDTH = 260
const PREVIEW_HEIGHT = 410
const isPlacedBelow = ref(true)

const calculatedLeft = computed(() => {
  if (import.meta.server || !hoveredRect.value) return 0
  const rect = hoveredRect.value
  const cardCenterX = rect.left + (rect.width / 2)
  let left = cardCenterX - (PREVIEW_WIDTH / 2)

  // Clamp horizontal agar tidak keluar layar kiri maupun kanan
  const maxLeft = window.innerWidth - PREVIEW_WIDTH - 12
  return Math.max(12, Math.min(maxLeft, left))
})

const previewPosition = computed(() => {
  if (import.meta.server || !hoveredRect.value) return { top: '0px', left: '0px' }
  const rect = hoveredRect.value

  const spaceBelow = window.innerHeight - rect.bottom
  let top = 0

  if (spaceBelow >= PREVIEW_HEIGHT + 16) {
    isPlacedBelow.value = true
    top = rect.bottom + 10
  } else {
    isPlacedBelow.value = false
    top = rect.top - PREVIEW_HEIGHT - 10
    top = Math.max(12, top)
  }

  return {
    top: `${top}px`,
    left: `${calculatedLeft.value}px`
  }
})

// Panah penunjuk selalu presisi menunjuk ke titik tengah kartu yang sedang di-hover
const arrowLeft = computed(() => {
  if (!hoveredRect.value) return '50%'
  const cardCenterX = hoveredRect.value.left + (hoveredRect.value.width / 2)
  const offset = cardCenterX - calculatedLeft.value
  return `${Math.max(18, Math.min(PREVIEW_WIDTH - 18, offset))}px`
})

// --- Form tambah halaman baru ---
const isAddPopoverOpen = ref(false)
const newTitle = ref('')
const newSlug = ref('')
const slugTouched = ref(false)

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(newTitle, (title) => {
  if (!slugTouched.value) newSlug.value = slugify(title)
})

function onSlugInput(value: string) {
  slugTouched.value = true
  newSlug.value = slugify(value)
}

const canSubmit = computed(() =>
  newTitle.value.trim().length > 0 && newSlug.value.length > 0 && !pagesStore.saving
)

async function onAddPage() {
  if (!canSubmit.value) return

  try {
    const created = await pagesStore.addPage(newTitle.value.trim(), newSlug.value)
    newTitle.value = ''
    newSlug.value = ''
    slugTouched.value = false
    isAddPopoverOpen.value = false
    await navigateTo(`/${created.slug}`)
  } catch {
    // Error ditangani di pagesStore.error
  }
}
</script>

<template>
  <div
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    class="pages-sidebar-rail fixed top-20 left-[calc(50%+215px)] right-6 z-40 flex flex-row flex-wrap items-start gap-4 max-h-[calc(100vh-100px)] overflow-y-auto pb-8 pr-2 pl-1 scrollbar-none"
  >
    <!-- Daftar Kartu Halaman -->
    <div
      v-for="(entry, idx) in pageEntries"
      :key="entry.path"
      class="relative flex flex-col items-center gap-1.5 group w-[80px] shrink-0 cursor-pointer select-none"
      @mouseenter="(e) => onMouseEnterCard(entry, idx, e)"
      @mousemove="(e) => onMouseEnterCard(entry, idx, e)"
      @mouseleave="onMouseLeaveCard"
      @click="goToPage(entry.path)"
    >
      <!-- 1. Nomor Urut -->
      <div
        class="flex items-center justify-center size-5 rounded-full text-[10px] font-bold transition-all"
        :class="isActivePage(entry.path)
          ? 'bg-primary text-white shadow-[0_0_8px_rgba(16,185,129,0.5)] ring-1 ring-primary'
          : 'bg-neutral-800 text-gray-300 ring-1 ring-white/10'"
      >
        {{ idx + 1 }}
      </div>

      <!-- 2. Card Preview Thumbnail -->
      <div class="relative transition-all duration-200">
        <div
          class="rounded-xl overflow-hidden shadow-md transition-all duration-200 group-hover:scale-105"
          :class="isActivePage(entry.path)
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-neutral-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'ring-1 ring-neutral-700 group-hover:ring-neutral-500 opacity-85 group-hover:opacity-100'"
        >
          <PageCanvasPreview
            :page-key="entry.slug"
            :width="76"
            :height="118"
            :include-header-footer="true"
          />
        </div>
      </div>

      <!-- 3. Nama Halaman dan Path -->
      <div class="flex flex-col items-center text-center w-full leading-tight">
        <span
          class="text-[11px] font-medium truncate w-full"
          :class="isActivePage(entry.path) ? 'text-primary font-semibold' : 'text-gray-700'"
        >
          {{ entry.title }}
        </span>
        <span class="text-[9px] font-mono text-gray-400 truncate w-full">
          {{ entry.path }}
        </span>
      </div>
    </div>

    <!-- Tombol / Kartu Tambah Halaman Baru (+) sejajar dalam flex-wrap -->
    <div class="flex flex-col items-center gap-1.5 w-[80px] shrink-0 select-none">
      <div class="size-5" />
      <UPopover v-model:open="isAddPopoverOpen" :content="{ side: 'bottom', align: 'center' }">
        <button
          type="button"
          class="cursor-pointer w-[76px] h-[118px] rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition-all duration-150 shadow-sm"
          :aria-label="t('admin.pages.addNew')"
        >
          <UIcon name="i-lucide-plus" class="size-6" />
          <span class="text-[10px] font-medium text-center px-1 leading-tight">
            {{ t('admin.pages.addNew') }}
          </span>
        </button>

        <template #content>
          <div class="w-64 space-y-2.5 p-3.5 bg-neutral-950 text-white border border-white/15 rounded-xl shadow-2xl">
            <p class="text-xs font-semibold text-white">
              {{ t('admin.pages.addNew') }}
            </p>

            <UInput
              v-model="newTitle"
              :placeholder="t('admin.pages.titlePlaceholder')"
              size="xs"
              autofocus
            />
            <UInput
              :model-value="newSlug"
              :placeholder="t('admin.pages.slugPlaceholder')"
              size="xs"
              @update:model-value="(v) => onSlugInput(String(v))"
            />
            <p class="text-[10px] text-gray-400">
              {{ t('admin.pages.openAt') }} <code class="text-primary">/{{ newSlug || t('admin.pages.slugPlaceholder') }}</code>
            </p>

            <UButton
              :label="t('admin.pages.submit')"
              icon="i-lucide-plus"
              color="primary"
              size="xs"
              block
              class="cursor-pointer"
              :loading="pagesStore.saving"
              :disabled="!canSubmit"
              @click="onAddPage"
            />

            <p v-if="pagesStore.error" class="text-[10px] text-red-400">
              {{ pagesStore.error }}
            </p>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Floating Enlarged Live Preview Popover on Hover (pointer-events-none agar tidak menghalangi kursor) -->
    <Teleport to="body">
      <div
        v-if="hoveredEntry && hoveredRect"
        class="hover-preview-card fixed z-[9999] w-[260px] max-w-[260px] box-border flex flex-col gap-2 rounded-2xl bg-neutral-950/95 p-3 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/20 backdrop-blur-2xl pointer-events-none transition-[left,top] duration-150 ease-out overflow-hidden"
        :style="previewPosition"
      >
        <!-- Tooltip Arrow Indicator (Selalu Menunjuk Presisi ke Tengah Kartu yang Di-Hover) -->
        <div
          v-if="isPlacedBelow"
          class="absolute -top-1.5 size-3 rotate-45 bg-neutral-950 border-t border-l border-white/20"
          :style="{ left: arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }"
        />
        <div
          v-else
          class="absolute -bottom-1.5 size-3 rotate-45 bg-neutral-950 border-b border-r border-white/20"
          :style="{ left: arrowLeft, transform: 'translateX(-50%) rotate(45deg)' }"
        />

        <!-- Header Info (Text Truncated agar Lebar Tidak Bertambah) -->
        <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-2 w-full min-w-0 overflow-hidden">
          <div class="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <span class="flex items-center justify-center size-4 rounded-full bg-primary text-white text-[9px] font-bold shrink-0">
              {{ hoveredEntry.idx + 1 }}
            </span>
            <span class="text-xs font-semibold text-white tracking-wide truncate max-w-[85px]">
              {{ hoveredEntry.title }}
            </span>
            <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-white/10 text-gray-300 truncate max-w-[65px] shrink-0">
              {{ hoveredEntry.path }}
            </span>
          </div>
          <span class="text-[10px] text-primary/90 font-medium whitespace-nowrap shrink-0">
            {{ t('admin.pages.clickToOpen') }}
          </span>
        </div>

        <!-- Live Canvas Scaled Preview -->
        <div
          class="relative rounded-xl overflow-hidden ring-1 ring-white/15 bg-neutral-900 shadow-inner mx-auto"
        >
          <PageCanvasPreview
            :key="hoveredEntry.slug"
            :page-key="hoveredEntry.slug"
            :width="234"
            :height="360"
            :include-header-footer="true"
          />
        </div>

        <div class="text-center text-[10px] text-gray-400 pt-0.5 truncate w-full">
          {{ t('admin.pages.livePreviewHint') }}
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
@media (max-width: 480px) {
  .pages-sidebar-rail {
    display: none;
  }
}
</style>
