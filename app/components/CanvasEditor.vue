<script setup lang="ts">
import Moveable from 'vue3-moveable'

// Overlay elemen teks/gambar posisi-bebas di atas SATU AREA (`pageKey`) —
// bisa dipakai buat content satu halaman (mis. 'home', dipasang di
// pages/index.vue) ATAU buat header/footer GLOBAL (HEADER_PAGE_KEY/
// FOOTER_PAGE_KEY dari canvasElements.ts, dipasang di app.vue lewat
// SiteHeader.vue/SiteFooter.vue) — beda dari EditModeToggle/
// OuterBackgroundButton/SaveEditsButton yang selalu satu instance global,
// komponen ini bisa dipasang BERKALI-KALI dengan pageKey beda-beda
// sekaligus di layar yang sama (header + content + footer bareng), makanya
// `useCanvasElementsStore()` di-factory-in per pageKey (lihat
// canvasElements.ts) biar state-nya gak numpuk jadi satu.
//
// Visitor biasa / admin yang lagi gak edit mode lihat `canvas.elements`
// (state TERSIMPAN). Admin yang lagi edit mode lihat `canvas.draftElements`
// (bisa digeser/resize/tambah/edit teks LANGSUNG kelihatan di sini — live
// preview — tapi baru kesimpan ke database pas klik Save, lihat
// SaveEditsButton.vue).
//
// `clipOverflow` — dulu di-deteksi OTOMATIS dari pageKey (selalu true buat
// header/footer). Sekarang eksplisit lewat prop dari pemanggilnya
// (SiteHeader.vue/SiteFooter.vue meneruskan
// sections.headerEffectiveClipOverflow/footerEffectiveClipOverflow, lihat
// sectionVisibility.ts), karena admin sekarang bisa MATIIN clip-nya sendiri
// kalau sengaja mau bikin elemen nongol keluar kotak header/footer. Default
// `false` buat canvas CONTENT biasa (pages/index.vue gak perlu ngirim prop
// ini sama sekali) — tingginya cuma `min-height`, elemen di bawah "layar
// pertama" harus tetap kelihatan (discroll lewat .app-shell), bukan
// ke-potong.
const props = withDefaults(defineProps<{
  pageKey: string
  clipOverflow?: boolean
}>(), {
  clipOverflow: false
})

const adminAuth = useAdminAuthStore()
const canvas = useCanvasElementsStore(props.pageKey)
const fonts = useFontPresetsStore()
const { t, locale } = useI18n()

// Faktor scale visual `.app-shell` saat ini (lihat AppScaleController.vue &
// penjelasan panjang di main.css) — diteruskan ke prop `zoom` Moveable di
// bawah, WAJIB biar drag/resize tetap nyambung 1:1 sama gerakan
// cursor/jari begitu app-shell lagi discale (HP dengan lebar != 390px).
// Tanpa ini Moveable ngitung delta drag pake asumsi target-nya GAK di
// dalam container yang di-transform, jadi elemen bakal kerasa "lompat"
// gak sesuai gerakan cursor pas lagi discale.
const appScale = useState('appScale', () => 1)

onMounted(() => {
  canvas.load()
})

// Jaga-jaga buat race unmount vs vue3-moveable: Moveable nempelin elemen
// kontrolnya sendiri ke document.body (di luar virtual DOM Vue), jadi kalau
// halaman ini di-unmount (pindah halaman, atau hot-reload pas dev) sementara
// ada elemen yang lagi TERPILIH, Moveable & Vue bisa rebutan bersihin DOM
// node yang sama -> "Cannot read properties of null (reading 'parentNode')".
// Clear seleksi duluan di sini bikin Moveable (v-if="... && selectedTarget")
// unmount SENDIRI lebih dulu, sebelum parent-nya ikut di-unmount.
onBeforeUnmount(() => {
  canvas.select(null)
})

const isEditable = computed(() => adminAuth.isAuthenticated && adminAuth.isEditMode)

const displayElements = computed(() => (isEditable.value ? canvas.draftElements : canvas.elements))

// --- Tombol "+" tambah elemen (text/gambar) ---
// Dulu ini komponen terpisah (AddCanvasElementButtons.vue) yang GLOBAL &
// cuma nunjuk ke SATU canvas (content halaman). Sekarang bisa ada beberapa
// canvas sekaligus di layar (header/content/footer), jadi tombolnya
// dipindah ke SINI — nempel LOKAL di pojok kanan-atas canvas masing-masing,
// biar jelas nambah elemen itu masuk ke canvas yang MANA. Komponen lama
// dipindah ke _to_delete/.
const isAddMenuOpen = ref(false)
const addFileInputRef = ref<HTMLInputElement | null>(null)

function toggleAddMenu() {
  isAddMenuOpen.value = !isAddMenuOpen.value
}

function onAddText() {
  canvas.addText()
  isAddMenuOpen.value = false
}

function triggerAddImagePicker() {
  addFileInputRef.value?.click()
}

function onAddImageFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  isAddMenuOpen.value = false

  if (!file || !file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = () => {
    canvas.addImage(reader.result as string)
  }
  reader.readAsDataURL(file)
}

// Preset yang lagi RELEVAN buat di-resolve: draft (biar edit preset di
// FontPresetsButton.vue langsung kelihatan di sini juga, sebelum di-Save)
// pas edit mode nyala, tersimpan pas enggak (visitor biasa).
const activeFontPresets = computed(() => (isEditable.value ? fonts.draftPresets : fonts.presets))

// Sentinel buat opsi "gak pakai preset" di dropdown — SENGAJA bukan string
// kosong ('') karena komponen Select Nuxt UI (Reka UI) gak boleh punya item
// dengan value='' (dipakai internal buat representasi "belum ada yang
// dipilih"), kasih '' bakal bikin komponennya error pas setup.
const NO_PRESET_VALUE = '__no-preset__'

// Dropdown pilihan font per elemen teks (lihat toolbar elemen terpilih di
// template) — NO_PRESET_VALUE = "gak pakai preset" (fallback default browser).
const fontSelectItems = computed(() => [
  { label: t('admin.canvas.noPreset'), value: NO_PRESET_VALUE },
  ...activeFontPresets.value.map(p => ({ label: p.name, value: p.id }))
])

// Teks yang ditampilin buat pengunjung/preview — pakai contentEn/contentJa
// (isi manual admin lewat popover "Terjemahkan" di toolbar, lihat di bawah)
// KALAU locale aktif en/ja DAN field itu udah diisi, selain itu (termasuk
// locale 'id', atau field terjemahan masih kosong) fallback ke `content`
// (bahasa aslinya). Cuma relevan buat type='text' — gambar gak punya
// terjemahan, `el.content`-nya cuma data url.
function displayText(el: { content: string, contentEn: string | null, contentJa: string | null }) {
  if (locale.value === 'en' && el.contentEn) return el.contentEn
  if (locale.value === 'ja' && el.contentJa) return el.contentJa
  return el.content
}

// Refs ke elemen DOM tiap kotak, dipakai Moveable buat nentuin target-nya.
const elRefs = ref<Record<string, HTMLElement | null>>({})
function setElRef(id: string, el: Element | null) {
  elRefs.value[id] = el as HTMLElement | null
}

const selectedTarget = computed(() => {
  if (!canvas.selectedId) return null
  return elRefs.value[canvas.selectedId] ?? null
})

// --- Snap guide (garis bantu + "magnet" pas drag/resize) ---
// Ref ke kontainer canvas sendiri, dipasang sebagai `snapContainer` Moveable
// biar koordinat verticalGuidelines/horizontalGuidelines di bawah PAKAI
// sistem koordinat LOKAL kontainer ini (0,0 di pojok kiri-atas canvas) —
// persis sama kayak sistem koordinat el.x/el.y sendiri, jadi gak perlu
// ribet convert ke koordinat viewport.
const canvasEditorRef = ref<HTMLElement | null>(null)
const containerSize = ref({ width: 0, height: 0 })

function measureContainerSize() {
  if (import.meta.server || !canvasEditorRef.value) return
  const rect = canvasEditorRef.value.getBoundingClientRect()
  containerSize.value = { width: rect.width, height: rect.height }
}

// Titik snap standar: tepi kiri/kanan/atas/bawah canvas + garis tengahnya
// (horizontal & vertikal) — ini yang bikin elemen "ketarik" pas mendekati
// posisi center/top/bottom/left/right kontainer.
const verticalGuidelines = computed(() => {
  const w = containerSize.value.width
  return w > 0 ? [0, w / 2, w] : []
})
const horizontalGuidelines = computed(() => {
  const h = containerSize.value.height
  return h > 0 ? [0, h / 2, h] : []
})

// Elemen LAIN (bukan yang lagi di-drag) jadi acuan snap juga — tepi &
// tengah elemen lain ikut jadi "magnet", biar gampang bikin beberapa
// elemen sejajar satu sama lain, bukan cuma sejajar ke kontainer.
const otherElementNodes = computed(() => {
  const selectedId = canvas.selectedId
  return Object.entries(elRefs.value)
    .filter(([id, node]) => id !== selectedId && node)
    .map(([, node]) => node as HTMLElement)
})

// Titik-titik yang dianggap "bisa nge-snap" — defaultnya Moveable cuma
// ngecek tepi (left/top/right/bottom), kita tambahin center (tengah
// horizontal) & middle (tengah vertikal) juga biar bisa nge-center-in
// elemen persis di tengah canvas/elemen lain.
const SNAP_DIRECTIONS = { left: true, top: true, right: true, bottom: true, center: true, middle: true }

// Batasi drag/resize dalam kotak canvas ini SENDIRI — TAPI cuma kalau
// `clipOverflow` nyala (lihat penjelasan prop-nya di atas). Kalau admin
// sengaja matiin clip (mau elemen bisa nongol keluar kotak header/footer),
// batasan drag/resize-nya ikut dilepas juga (`undefined` = vue3-moveable
// gak nerapin batasan apa pun) — percuma ngizinin visual-nya nongol keluar
// tapi tetap gak bisa DIGESER ke situ.
const moveableBounds = computed(() =>
  (props.clipOverflow ? { left: 0, top: 0, right: 0, bottom: 0, position: 'css' as const } : undefined)
)

let resizeObserver: ResizeObserver | null = null

// fontFamily/fontSize/fontWeight/color elemen teks di-RESOLVE dari
// fontPresets.ts tiap render (bukan disalin ke elemen) — lihat catatan di
// canvasElements.ts & fontPresets.ts. Elemen tanpa preset (fontPresetId
// null / preset udah dihapus) fallback ke warnanya sendiri (el.color, lihat
// canvasElements.ts), lalu ke undefined kalau itu juga kosong.
function resolvePresetFor(el: { type: string, fontPresetId: string | null }) {
  if (el.type !== 'text') return null
  return fonts.resolve(activeFontPresets.value, el.fontPresetId)
}

function fontStyle(el: { type: string, fontPresetId: string | null, color: string | null }) {
  const preset = resolvePresetFor(el)
  return {
    fontFamily: preset?.fontFamily ?? undefined,
    fontSize: preset ? `${preset.fontSize}px` : undefined,
    fontWeight: preset?.fontWeight ?? undefined,
    color: preset?.color ?? el.color ?? undefined
  }
}

function elementStyle(el: { x: number, y: number, width: number, height: number, zIndex: number, type: string, fontPresetId: string | null, color: string | null }) {
  return {
    position: 'absolute' as const,
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
    zIndex: el.zIndex,
    ...fontStyle(el)
  }
}

function onFontPresetChange(id: string, value: string | number | null) {
  const presetId = value === NO_PRESET_VALUE || value === null || value === undefined ? null : String(value)
  canvas.updateElement(id, { fontPresetId: presetId })
}

// --- Toolbar elemen terpilih (dropdown font + tombol hapus) ---
// Awalnya toolbar ini ditaruh DI DALAM `.canvas-element` (jadi anak dari
// kotak elemen), posisi -36px dari atas. Ternyata itu KETUTUP di dua
// keadaan sekaligus: (1) pas elemennya deket tepi atas/bawah canvas,
// toolbar-nya ke-render di luar area yang kelihatan; (2) inline style
// `zIndex: el.zIndex` di elementStyle() bikin `.canvas-element` jadi
// stacking context SENDIRI — anak-anaknya (termasuk toolbar) jadi KETUTUP
// sama overlay kontrol vue3-moveable (yang nempel ke document.body di luar
// stacking context itu), padahal secara visual harusnya di atas.
//
// Solusinya: toolbar di-Teleport ke <body> & diposisikan `fixed` pakai
// koordinat VIEWPORT asli dari getBoundingClientRect() elemen yang lagi
// dipilih (bukan lagi relatif ke elemen di dalam DOM tree canvas) — jadi
// gak lagi kena masalah stacking context ATAU kepotong batas atas/bawah
// canvas, dan otomatis nempatin diri di sisi yang ada ruangnya.
const TOOLBAR_HEIGHT_PX = 40
const TOOLBAR_GAP_PX = 8
// Lebar toolbar sekarang bervariasi (dropdown font muncul cuma buat teks,
// + 2 tombol urutan tumpuk + 1 tombol hapus) — dipakai buat nge-clamp posisi
// `left` biar gak keluar tepi kanan viewport pas elemen terpilih ada di
// dekat pinggir kanan canvas (390px lebar app-shell).
const TOOLBAR_MAX_WIDTH_PX = 240
const toolbarPos = ref<{ top: number, left: number } | null>(null)

function recomputeToolbarPosition() {
  if (import.meta.server) return

  const id = canvas.selectedId
  const node = id ? elRefs.value[id] : null
  if (!isEditable.value || !node) {
    toolbarPos.value = null
    return
  }

  const rect = node.getBoundingClientRect()
  // Taruh di ATAS kalau ruangnya cukup (gak ketutup tepi atas VIEWPORT),
  // kalau enggak baru taruh di BAWAH elemen.
  const placeBelow = rect.top < TOOLBAR_HEIGHT_PX + TOOLBAR_GAP_PX
  const maxLeft = window.innerWidth - TOOLBAR_MAX_WIDTH_PX - TOOLBAR_GAP_PX
  toolbarPos.value = {
    left: Math.min(rect.left, Math.max(maxLeft, TOOLBAR_GAP_PX)),
    top: placeBelow ? rect.bottom + TOOLBAR_GAP_PX : rect.top - TOOLBAR_HEIGHT_PX - TOOLBAR_GAP_PX
  }
}

// Ref ke instance Moveable (bukan ke target-nya) — dipakai buat manggil
// updateRect() secara manual. Moveable nyimpen sendiri "cache" ukuran &
// posisi target-nya buat gambar handle-nya, dan CUMA nge-refresh cache itu
// pas DIA SENDIRI yang gerakin target (drag/resize lewat dirinya). Kalau
// target-nya berubah ukuran/posisi lewat cara LAIN — misal reactive style
// dari Vue (abis commit edit teks, abis Save-reload ganti id, dst) —
// Moveable GAK OTOMATIS TAHU, handle-nya jadi "ketinggalan" di posisi lama
// sampai ada drag/resize baru. Ini penyebab keluhan "handle nempel di
// posisi sebelumnya" pas abis edit teks.
const moveableRef = ref<InstanceType<typeof Moveable> | null>(null)
function syncMoveableRect() {
  nextTick(() => {
    moveableRef.value?.updateRect()
  })
}

watch(() => canvas.selectedId, () => {
  nextTick(recomputeToolbarPosition)
  syncMoveableRect()
})

// Reposisi tiap layar di-scroll/resize, & tiap geometri elemen terpilih
// berubah (drag/resize/reload setelah Save) — signature string simpel biar
// gampang di-watch tanpa banding-in object baru tiap render.
const selectedGeometryKey = computed(() => {
  const el = canvas.selectedElement
  return el ? `${el.x},${el.y},${el.width},${el.height}` : ''
})
watch(selectedGeometryKey, () => {
  nextTick(recomputeToolbarPosition)
  syncMoveableRect()
})

onMounted(() => {
  window.addEventListener('resize', recomputeToolbarPosition)
  window.addEventListener('scroll', recomputeToolbarPosition, { passive: true, capture: true })

  // Ukuran kontainer canvas dipakai buat guideline center/tepi (lihat
  // verticalGuidelines/horizontalGuidelines) — diukur pas mount, terus
  // di-ResizeObserver biar ke-update kalau tinggi canvas berubah (nambah/
  // hapus elemen gak ngaruh ke tinggi container ini karena posisinya
  // absolute, tapi resize window/orientasi HP tetep perlu di-handle).
  measureContainerSize()
  if (canvasEditorRef.value) {
    resizeObserver = new ResizeObserver(measureContainerSize)
    resizeObserver.observe(canvasEditorRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputeToolbarPosition)
  window.removeEventListener('scroll', recomputeToolbarPosition, true)
  resizeObserver?.disconnect()
})

function onSelectElement(id: string, event: MouseEvent) {
  if (!isEditable.value) return
  event.stopPropagation()
  canvas.select(id)
}

function onBackgroundClick() {
  canvas.select(null)
  editingId.value = null
}

// --- Edit teks inline (double-click buat masuk mode edit) ---
const editingId = ref<string | null>(null)
const editingValue = ref('')
const textareaRefs = ref<Record<string, HTMLTextAreaElement | null>>({})
function setTextareaRef(id: string, el: Element | null) {
  textareaRefs.value[id] = el as HTMLTextAreaElement | null
}

function startEditText(el: { id: string, type: string, content: string }, event: MouseEvent) {
  if (!isEditable.value || el.type !== 'text') return
  event.stopPropagation()
  canvas.select(el.id)
  editingId.value = el.id
  editingValue.value = el.content
  nextTick(() => textareaRefs.value[el.id]?.focus())
  // Konten dalem kotak keganti dari <div> ke <textarea> — ukuran luar
  // kotaknya sendiri gak berubah (height inline tetep dari el.height), tapi
  // tetep sync-in Moveable biar handle-nya gak ketinggalan (lihat catatan
  // di syncMoveableRect()).
  syncMoveableRect()
}

function commitEditText(id: string) {
  if (editingId.value !== id) return
  canvas.updateElement(id, { content: editingValue.value })
  editingId.value = null
  syncMoveableRect()
}

// --- Terjemahan manual per elemen teks (EN/JA) ---
// Popover kecil di toolbar elemen terpilih, CUMA muncul buat type='text'.
// Admin ngetik versi Inggris/Jepang manual di sini (bukan auto-translate
// API — lihat catatan arsitektur i18n di app/i18n.config.ts), disimpan ke
// contentEn/contentJa elemen yang lagi dipilih. Kosong = fallback ke
// `content` asli buat locale itu (lihat displayText() di atas).
const isTranslatePanelOpen = ref(false)

function onTranslateEn(value: string) {
  const id = canvas.selectedId
  if (!id) return
  canvas.updateElement(id, { contentEn: value })
}

function onTranslateJa(value: string) {
  const id = canvas.selectedId
  if (!id) return
  canvas.updateElement(id, { contentJa: value })
}

// Panel terjemahan ditutup otomatis tiap ganti elemen terpilih (atau pas
// gak ada yang dipilih lagi) — biar gak "nyangkut" kebuka nunjukin
// terjemahan elemen SEBELUMNYA pas admin pindah pilih elemen lain.
watch(() => canvas.selectedId, () => {
  isTranslatePanelOpen.value = false
})

// --- Drag & resize (vue3-moveable) ---
// Selama drag/resize berlangsung, dorong perubahan lewat `render` event
// (cssText gabungan transform/width/height) biar gerakannya halus — baru
// pas SELESAI (dragEnd/resizeEnd) posisi/ukuran akhirnya di-hitung balik ke
// angka x/y/width/height biasa & disimpan ke draft (bukan transform, biar
// konsisten sama cara elementStyle() nge-render pakai left/top/width/height).
function onRender(e: { target: HTMLElement | SVGElement, cssText: string }) {
  (e.target as HTMLElement).style.cssText += e.cssText
  // Toolbar ikut "nempel" real-time selama drag/resize berlangsung, bukan
  // cuma pas selesai — enak diliat & langsung ke-reposisi kalau ternyata
  // geser ke deket tepi atas/bawah viewport.
  recomputeToolbarPosition()
}

function onDragEnd(e: { target: HTMLElement | SVGElement, lastEvent: { translate: [number, number] } | null }) {
  const id = canvas.selectedId
  const lastEvent = e.lastEvent
  if (!id || !lastEvent) return

  const el = canvas.draftElements.find(item => item.id === id)
  if (!el) return

  const target = e.target as HTMLElement
  const [dx, dy] = lastEvent.translate
  canvas.updateElement(id, { x: el.x + dx, y: el.y + dy })

  // PENTING: transform-nya (yang Moveable pakai buat gerakin visual selama
  // drag) baru dibersihin SETELAH Vue kelar nge-render left/top yang baru
  // (nextTick), BUKAN langsung sesudah updateElement. Soalnya updateElement
  // cuma UBAH STATE — DOM-nya (left/top) baru ke-update Vue di render
  // berikutnya (async). Kalau transform dibersihin duluan, ada SATU FRAME
  // di mana elemennya udah gak ada transform tapi left/top-nya MASIH nilai
  // LAMA (pre-drag) -> keliatan "balik sekilas ke posisi lama" (ini
  // penyebab lag/kedip yang dilaporkan), baru snap ke posisi baru pas Vue
  // akhirnya render. Nunggu nextTick dulu ngilangin celah itu.
  nextTick(() => {
    target.style.transform = ''
    moveableRef.value?.updateRect()
  })
}

function onResizeEnd(e: { target: HTMLElement | SVGElement, lastEvent: { width: number, height: number, drag: { translate: [number, number] } } | null }) {
  const id = canvas.selectedId
  const lastEvent = e.lastEvent
  if (!id || !lastEvent) return

  const el = canvas.draftElements.find(item => item.id === id)
  if (!el) return

  const target = e.target as HTMLElement
  const [dx, dy] = lastEvent.drag.translate
  canvas.updateElement(id, {
    x: el.x + dx,
    y: el.y + dy,
    width: lastEvent.width,
    height: lastEvent.height
  })

  // Sama kayak onDragEnd — tunggu Vue render ulang left/top/width/height
  // yang baru dulu baru bersihin transform, biar gak ada frame "ketinggalan"
  // di ukuran/posisi lama.
  nextTick(() => {
    target.style.transform = ''
    moveableRef.value?.updateRect()
  })
}
</script>

<template>
  <div
    ref="canvasEditorRef"
    class="canvas-editor"
    :class="{ 'canvas-editor--editable': isEditable, 'canvas-editor--clip-overflow': props.clipOverflow }"
    @click="onBackgroundClick"
  >
    <div
      v-for="el in displayElements"
      :key="el.id"
      :ref="(node) => setElRef(el.id, node as Element | null)"
      class="canvas-element"
      :class="{ 'canvas-element--selected': isEditable && canvas.selectedId === el.id }"
      :style="elementStyle(el)"
      @click="(event) => onSelectElement(el.id, event as MouseEvent)"
      @dblclick="(event) => startEditText(el, event as MouseEvent)"
    >
      <img
        v-if="el.type === 'image'"
        :src="el.content"
        class="h-full w-full object-cover pointer-events-none"
        draggable="false"
      >

      <textarea
        v-else-if="editingId === el.id"
        :ref="(node) => setTextareaRef(el.id, node as Element | null)"
        v-model="editingValue"
        class="h-full w-full resize-none border-none bg-transparent p-0 outline-none"
        :style="fontStyle(el)"
        @click.stop
        @blur="commitEditText(el.id)"
        @keydown.enter.exact.prevent="commitEditText(el.id)"
      />

      <div
        v-else
        class="h-full w-full whitespace-pre-wrap break-words pointer-events-none"
      >
        {{ displayText(el) }}
      </div>

    </div>

    <Moveable
      v-if="isEditable && selectedTarget"
      ref="moveableRef"
      :target="selectedTarget"
      :draggable="true"
      :resizable="true"
      :origin="false"
      :zoom="appScale"
      :bounds="moveableBounds"
      :snappable="true"
      :snap-container="canvasEditorRef"
      :snap-directions="SNAP_DIRECTIONS"
      :element-snap-directions="SNAP_DIRECTIONS"
      :vertical-guidelines="verticalGuidelines"
      :horizontal-guidelines="horizontalGuidelines"
      :element-guidelines="otherElementNodes"
      :snap-threshold="5"
      :is-display-snap-digit="false"
      @render="onRender"
      @dragEnd="onDragEnd"
      @resizeEnd="onResizeEnd"
    />

    <!-- Tombol "+" tambah elemen — LOKAL ke canvas ini (lihat catatan di
         script), nempel di pojok kanan-atas kontainernya sendiri. -->
    <template v-if="isEditable">
      <UButton
        :icon="isAddMenuOpen ? 'i-lucide-x' : 'i-lucide-plus'"
        color="neutral"
        variant="solid"
        size="sm"
        square
        class="canvas-add-trigger cursor-pointer"
        :aria-label="isAddMenuOpen ? t('admin.canvas.closeAddMenu') : t('admin.canvas.addElement')"
        :title="isAddMenuOpen ? t('admin.canvas.closeAddMenu') : t('admin.canvas.addElement')"
        @click.stop="toggleAddMenu"
      />

      <template v-if="isAddMenuOpen">
        <UButton
          icon="i-lucide-type"
          color="neutral"
          variant="solid"
          size="sm"
          square
          class="canvas-add-option canvas-add-option--text cursor-pointer"
          :aria-label="t('admin.canvas.addText')"
          :title="t('admin.canvas.addText')"
          @click.stop="onAddText"
        />
        <UButton
          icon="i-lucide-image-plus"
          color="neutral"
          variant="solid"
          size="sm"
          square
          class="canvas-add-option canvas-add-option--image cursor-pointer"
          :aria-label="t('admin.canvas.addImage')"
          :title="t('admin.canvas.addImage')"
          @click.stop="triggerAddImagePicker"
        />
      </template>

      <input
        ref="addFileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @click.stop
        @change="onAddImageFileChange"
      >
    </template>
  </div>

  <!-- Toolbar elemen terpilih — di-Teleport ke <body> & `fixed` positioned
       (lihat recomputeToolbarPosition() di script) biar gak ketutup overlay
       vue3-moveable atau kepotong tepi atas/bawah canvas. -->
  <Teleport to="body">
    <div
      v-if="isEditable && canvas.selectedElement && toolbarPos"
      class="canvas-toolbar-float"
      :style="{ top: `${toolbarPos.top}px`, left: `${toolbarPos.left}px` }"
      @click.stop
      @dblclick.stop
    >
      <USelect
        v-if="canvas.selectedElement.type === 'text'"
        :model-value="canvas.selectedElement.fontPresetId ?? NO_PRESET_VALUE"
        :items="fontSelectItems"
        value-key="value"
        :placeholder="t('admin.canvas.fontPlaceholder')"
        size="xs"
        class="w-32"
        @update:model-value="(v) => onFontPresetChange(canvas.selectedElement!.id, v as string | null)"
      />
      <!-- Terjemahan manual (EN/JA) — cuma buat elemen teks, lihat catatan
           di script (onTranslateEn/onTranslateJa/displayText()). Popover
           dipasang non-portal (`:portal="false"`) biar nempel deket toolbar
           float ini, bukan ketumpuk balik ke posisi default di tengah
           layar. -->
      <UPopover
        v-if="canvas.selectedElement.type === 'text'"
        v-model:open="isTranslatePanelOpen"
        :content="{ side: 'bottom', align: 'start' }"
      >
        <UButton
          icon="i-lucide-languages"
          color="neutral"
          variant="soft"
          size="xs"
          square
          class="cursor-pointer"
          :aria-label="t('admin.canvas.translateAria')"
          :title="t('admin.canvas.translateAria')"
        />
        <template #content>
          <div class="w-64 space-y-2 p-2">
            <label class="block space-y-1 text-xs text-muted">
              <span>{{ t('admin.canvas.translateEnglish') }}</span>
              <UTextarea
                :model-value="canvas.selectedElement.contentEn ?? ''"
                :placeholder="t('admin.canvas.translatePlaceholderEn')"
                size="xs"
                class="w-full"
                :rows="2"
                @update:model-value="(v) => onTranslateEn(String(v))"
              />
            </label>
            <label class="block space-y-1 text-xs text-muted">
              <span>{{ t('admin.canvas.translateJapanese') }}</span>
              <UTextarea
                :model-value="canvas.selectedElement.contentJa ?? ''"
                :placeholder="t('admin.canvas.translatePlaceholderJa')"
                size="xs"
                class="w-full"
                :rows="2"
                @update:model-value="(v) => onTranslateJa(String(v))"
              />
            </label>
          </div>
        </template>
      </UPopover>
      <!-- Urutan tumpuk (z-index) — "ke depan"/"ke belakang" LANGSUNG ke
           paling atas/bawah tumpukan (bukan geser satu-satu), cukup buat
           kasus umum: dua elemen numpuk (mis. gambar nutupin teks, atau
           sebaliknya) tinggal klik salah satu tombol ini. -->
      <UButton
        icon="i-lucide-chevrons-up"
        color="neutral"
        variant="soft"
        size="xs"
        square
        class="cursor-pointer"
        :aria-label="t('admin.canvas.bringToFront')"
        :title="t('admin.canvas.bringToFront')"
        @click="canvas.bringToFront(canvas.selectedElement!.id)"
      />
      <UButton
        icon="i-lucide-chevrons-down"
        color="neutral"
        variant="soft"
        size="xs"
        square
        class="cursor-pointer"
        :aria-label="t('admin.canvas.sendToBack')"
        :title="t('admin.canvas.sendToBack')"
        @click="canvas.sendToBack(canvas.selectedElement!.id)"
      />
      <UButton
        icon="i-lucide-x"
        color="error"
        variant="solid"
        size="xs"
        square
        class="cursor-pointer"
        :aria-label="t('admin.canvas.deleteElement')"
        :title="t('admin.canvas.deleteElement')"
        @click="canvas.removeElement(canvas.selectedElement!.id)"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.canvas-editor {
  position: absolute;
  inset: 0;

  /*
    `isolation: isolate` — bikin SETIAP instance CanvasEditor (header,
    content, footer) jadi stacking context-nya SENDIRI, biar nilai
    `zIndex: el.zIndex` (lihat elementStyle()) di SATU canvas gak
    ke-banding-bandingin langsung sama nilai zIndex di canvas LAIN cuma
    gara-gara kebetulan sama-sama nempel ke stacking context nenek moyang
    yang sama (app-shell). Tanpa ini, dua elemen di canvas BEDA yang
    sama-sama punya zIndex kecil (mis. sama-sama 0) bisa "adu tumpuk"
    berdasarkan urutan DOM header-vs-content-vs-footer, PADAHAL tombol "ke
    depan"/"ke belakang" (lihat toolbar elemen terpilih) cuma nge-reorder
    WITHIN satu canvas yang sama — gak akan pernah ngefek buat nyelesain
    "adu tumpuk" antar-canvas kayak gitu. isolation:isolate mastiin tiap
    canvas jadi "dunia z-index"-nya sendiri, konsisten sama ekspektasi
    admin (ngatur urutan tumpuk cuma berlaku PER canvas, gak nyebrang).
  */
  isolation: isolate;
}

/*
  Dipasang lewat prop `clipOverflow` (lihat penjelasannya di <script>) —
  default NYALA buat header/footer (kotak tinggi bisa diatur admin, lihat
  headerEffectiveHeight/footerEffectiveHeight di sectionVisibility.ts), biar
  elemen yang lebih GEDE dari kotaknya (mis. gambar default 160x120px vs
  kotak header 88px) gak "bocor" keluar & numpuk-jadi-satu SECARA VISUAL
  sama canvas LAIN di sebelahnya. Admin bisa MATIIN ini per header/footer
  lewat toggle di SectionVisibilityButton.vue kalau sengaja mau bikin
  elemen (mis. gambar hero) nongol keluar kotaknya. SENGAJA gak pernah
  dipasang buat canvas CONTENT biasa (pages/index.vue gak ngirim prop ini)
  — tingginya cuma `min-height` yang boleh membesar ngikutin isi, elemen di
  bawah "layar pertama" harus TETAP kelihatan (di-scroll lewat .app-shell),
  bukan ke-potong.
*/
.canvas-editor--clip-overflow {
  overflow: hidden;
}

/* Tombol "+" tambah elemen & opsi teks/gambar-nya — nempel di pojok
   kanan-atas canvas ini SENDIRI (bukan fixed ke viewport kayak toolbar
   elemen terpilih), sengaja disusun MENDATAR (bukan ke bawah) biar gak
   meluber keluar kontainer kalau canvas-nya pendek (mis. header/footer). */
.canvas-add-trigger {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 30;
}

.canvas-add-option {
  position: absolute;
  top: 4px;
  z-index: 30;
}

.canvas-add-option--text {
  right: 44px;
}

.canvas-add-option--image {
  right: 84px;
}

/* Elemen non-edit-mode (visitor biasa) sengaja gak nangkep klik sama
   sekali — cuma dekorasi/konten, bukan UI interaktif. */
.canvas-editor:not(.canvas-editor--editable) .canvas-element {
  pointer-events: none;
}

.canvas-editor--editable .canvas-element {
  cursor: move;
  outline: 1px dashed transparent;
}

.canvas-editor--editable .canvas-element:hover {
  outline-color: rgba(255, 255, 255, 0.4);
}

.canvas-element--selected {
  outline: 2px solid var(--ui-primary) !important;
}

/* Toolbar mini elemen terpilih (dropdown font preset + tombol hapus) —
   di-Teleport ke <body> & `position: fixed` (lihat recomputeToolbarPosition
   di script), BUKAN lagi anak dari `.canvas-element`. Ini sengaja, dua
   alasan: (1) inline `zIndex: el.zIndex` di elementStyle() bikin
   `.canvas-element` jadi stacking context sendiri, jadi child-nya (termasuk
   toolbar lama) ketutup overlay vue3-moveable yang nempel ke body di LUAR
   stacking context itu; (2) posisi `fixed` pakai koordinat viewport asli
   otomatis milih nongol di atas/bawah elemen tergantung mana yang ada
   ruangnya, gak kepotong tepi canvas kayak sebelumnya. z-index gede biar
   selalu di atas overlay Moveable & elemen canvas manapun. */
.canvas-toolbar-float {
  position: fixed;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}
</style>

<!--
  Style TERPISAH & SENGAJA TANPA `scoped`: garis bantu snap (guideline) di
  atas dibikin vue3-moveable lewat manipulasi DOM langsung (bukan lewat
  render Vue), jadi atribut scoping `<style scoped>` di atas gak bisa
  nyampe ke elemen-elemen itu sama sekali — makanya override tampilannya
  ditaruh di sini, non-scoped, biar bisa nge-target class yang dibikin
  library-nya langsung.

  Nama class-nya (`moveable-line`, `moveable-guideline`, `moveable-vertical`
  /`moveable-horizontal`) ngikutin konvensi resmi vue3-moveable (prefix
  "moveable-" + nama bagian) — kalau ternyata beda di versi yang kepasang,
  override warna/garis-putus ini gak ke-apply, TAPI fitur snap-nya (elemen
  "ketarik" ke center/tepi) tetep jalan normal karena itu logic terpisah,
  cuma tampilan garisnya balik ke default bawaan library (solid, bukan
  putus-putus).
-->
<style>
.moveable-line.moveable-guideline.moveable-vertical {
  background-color: transparent !important;
  background-image: repeating-linear-gradient(to bottom, #22c55e 0 6px, transparent 6px 12px) !important;
  width: 2px !important;
}

.moveable-line.moveable-guideline.moveable-horizontal {
  background-color: transparent !important;
  background-image: repeating-linear-gradient(to right, #22c55e 0 6px, transparent 6px 12px) !important;
  height: 2px !important;
}
</style>
