<script setup lang="ts">
import Moveable from 'vue3-moveable'
import { useActiveCanvasSelection, HEADER_PAGE_KEY, FOOTER_PAGE_KEY, type CanvasElement, type FormFieldType, type CanvasFormConfig } from '../stores/canvasElements'
import { usePageDialogStore } from '../stores/pageDialog'

// Overlay elemen teks/gambar/tombol/form posisi-bebas di atas SATU AREA (`pageKey`)
const props = withDefaults(defineProps<{
  pageKey: string
  clipOverflow?: boolean
}>(), {
  clipOverflow: false
})

const toast = useToast()
const adminAuth = useAdminAuthStore()
const bg = useBackgroundStore()
const canvas = useCanvasElementsStore(props.pageKey)
const fonts = useFontPresetsStore()
const { t, locale, locales, setLocale } = useI18n()
const globalSelection = useActiveCanvasSelection()

watch(() => globalSelection.activeSelection.value, (sel) => {
  if (sel.pageKey !== props.pageKey && canvas.selectedId) {
    canvas.select(null)
  }
})

// Faktor scale visual `.app-shell` saat ini
const appScale = useState('appScale', () => 1)

onMounted(() => {
  canvas.load()
})

onBeforeUnmount(() => {
  canvas.select(null)
})

const isEditable = computed(() => adminAuth.isAuthenticated && adminAuth.isEditMode)

const displayElements = computed(() => (isEditable.value ? canvas.draftElements : canvas.elements))

// --- Pengaturan Background Halaman (Per-Page Canvas) ---
const isPageBgPopoverOpen = ref(false)
const pageBgFileInputRef = ref<HTMLInputElement | null>(null)

const currentPageBg = computed(() => bg.getPageBackground(props.pageKey))
const currentDraftPageBg = computed(() => bg.getDraftPageBackground(props.pageKey))
const isPageBgDirty = computed(() => bg.isPageDirty(props.pageKey))

function onPageColorInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  bg.setDraftPageColor(props.pageKey, value)
}

function triggerPageBgFilePicker() {
  pageBgFileInputRef.value?.click()
}

async function onPageBgFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) return
  await bg.setDraftPageImageFile(props.pageKey, file)
}

const sections = useSectionVisibilityStore()
const isPageSectionsPopoverOpen = ref(false)
const isPageSectionsDirty = computed(() => sections.isPageVisibilityDirty(props.pageKey))

function onResetPageBgDefault() {
  bg.resetDraftPageToDefault(props.pageKey)
}

// --- Tombol "+" tambah elemen (text/gambar/tombol/form) ---
const isAddMenuOpen = ref(false)
const isAddFormPopoverOpen = ref(false)
const isFormFieldSettingsOpen = ref(false)
const addFileInputRef = ref<HTMLInputElement | null>(null)

function toggleAddMenu() {
  isAddMenuOpen.value = !isAddMenuOpen.value
  if (!isAddMenuOpen.value) {
    isAddFormPopoverOpen.value = false
    isPageBgPopoverOpen.value = false
    isPageSectionsPopoverOpen.value = false
  }
}

function onAddText() {
  canvas.addText()
  isAddMenuOpen.value = false
}

function onAddButton() {
  canvas.addButton()
  isAddMenuOpen.value = false
}

function onAddFormInput(fieldType: FormFieldType) {
  canvas.addFormInput(fieldType)
  isAddFormPopoverOpen.value = false
  isAddMenuOpen.value = false
}

const formFieldTypesList = computed(() => [
  { type: 'text' as const, label: t('admin.form.typeText'), icon: 'i-lucide-type', desc: 'Single-line text' },
  { type: 'email' as const, label: t('admin.form.typeEmail'), icon: 'i-lucide-mail', desc: 'Email address' },
  { type: 'password' as const, label: t('admin.form.typePassword'), icon: 'i-lucide-lock', desc: 'Password input' },
  { type: 'number' as const, label: t('admin.form.typeNumber'), icon: 'i-lucide-hash', desc: 'Numeric quantity' },
  { type: 'tel' as const, label: t('admin.form.typeTel'), icon: 'i-lucide-phone', desc: 'WhatsApp / Phone' },
  { type: 'textarea' as const, label: t('admin.form.typeTextarea'), icon: 'i-lucide-align-left', desc: 'Multi-line textarea' },
  { type: 'select' as const, label: t('admin.form.typeSelect'), icon: 'i-lucide-chevron-down-square', desc: 'Dropdown select' },
  { type: 'checkbox' as const, label: t('admin.form.typeCheckbox'), icon: 'i-lucide-check-square', desc: 'Checkbox option' },
  { type: 'radio' as const, label: t('admin.form.typeRadio'), icon: 'i-lucide-circle-dot', desc: 'Radio option' },
  { type: 'submit' as const, label: t('admin.form.typeSubmit'), icon: 'i-lucide-send', desc: 'Submit action button' }
])

const formTypeSelectItems = computed(() => [
  { label: t('admin.form.typeText'), value: 'text' },
  { label: t('admin.form.typeEmail'), value: 'email' },
  { label: t('admin.form.typePassword'), value: 'password' },
  { label: t('admin.form.typeNumber'), value: 'number' },
  { label: t('admin.form.typeTel'), value: 'tel' },
  { label: t('admin.form.typeTextarea'), value: 'textarea' },
  { label: t('admin.form.typeSelect'), value: 'select' },
  { label: t('admin.form.typeCheckbox'), value: 'checkbox' },
  { label: t('admin.form.typeRadio'), value: 'radio' },
  { label: t('admin.form.typeSubmit'), value: 'submit' }
])

function updateSelectedFormField(patch: Partial<CanvasFormConfig>) {
  if (!canvas.selectedElement || !canvas.selectedElement.formConfig) return
  const currentCfg = { ...canvas.selectedElement.formConfig, ...patch }
  canvas.updateElement(canvas.selectedElement.id, {
    formConfig: currentCfg,
    content: currentCfg.label
  })
}

function getFormFieldTranslation(langCode: string, prop: 'label' | 'placeholder'): string {
  if (!canvas.selectedElement || !canvas.selectedElement.formConfig) return ''
  return canvas.selectedElement.formConfig.translations?.[langCode]?.[prop] || (prop === 'label' ? canvas.selectedElement.translations?.[langCode] || '' : '')
}

function updateFormFieldTranslation(langCode: string, prop: 'label' | 'placeholder', val: string) {
  if (!canvas.selectedElement || !canvas.selectedElement.formConfig) return
  const currentCfg = canvas.selectedElement.formConfig
  const fTrans = { ...(currentCfg.translations || {}) }
  fTrans[langCode] = { ...(fTrans[langCode] || {}), [prop]: val }

  const trans = { ...(canvas.selectedElement.translations || {}) }
  if (prop === 'label') {
    trans[langCode] = val
  }

  const patch: Partial<CanvasElement> = {
    translations: trans,
    formConfig: {
      ...currentCfg,
      translations: fTrans
    }
  }
  if (prop === 'label') {
    if (langCode === 'en') patch.contentEn = val
    if (langCode === 'ja') patch.contentJa = val
  }
  canvas.updateElement(canvas.selectedElement.id, patch)
}

function onAddDialog() {
  pageDialog.value.setDraftEnabled(true)
  pageDialog.value.openModal()
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

// --- Pengaturan Dialog Pop-up Lokal di Canvas ---
const isDialogPanelOpen = ref(false)
const dialogActiveTab = ref<'content' | 'form'>('content')
const bannerInputRef = ref<HTMLInputElement | null>(null)

function triggerBannerPicker() {
  bannerInputRef.value?.click()
}

async function onBannerFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file || !file.type.startsWith('image/')) return

  await pageDialog.value.setDraftImageFile(file)
}

const methodOptions = [
  { label: 'POST', value: 'POST' },
  { label: 'GET', value: 'GET' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' }
]

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

const siteLanguages = useSiteLanguagesStore()
const { contentLocale, setContentLocale } = useContentLocale()

onMounted(() => {
  siteLanguages.load()
})

const nonDefaultActiveLanguages = computed(() => {
  return siteLanguages.activeLanguages.filter(l => !l.isDefault)
})

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
  if (el.type !== 'text' && el.type !== 'button' && el.type !== 'form_input') return null
  return fonts.resolve(activeFontPresets.value, el.fontPresetId)
}

function fontStyle(el: { type: string, fontPresetId: string | null, color: string | null }) {
  const preset = resolvePresetFor(el)
  return {
    fontFamily: preset?.fontFamily ?? undefined,
    fontSize: preset ? `${preset.fontSize}px` : undefined,
    fontWeight: preset?.fontWeight ?? undefined,
    color: preset?.color ?? el.color ?? undefined,
    textAlign: (el.type === 'form_input' ? 'left' : 'center') as const
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

const pageDialog = computed(() => usePageDialogStore(props.pageKey))

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

  // Load konfigurasi dialog halaman (khusus canvas halaman konten biasa)
  if (props.pageKey !== HEADER_PAGE_KEY && props.pageKey !== FOOTER_PAGE_KEY) {
    pageDialog.value.load()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputeToolbarPosition)
  window.removeEventListener('scroll', recomputeToolbarPosition, true)
  resizeObserver?.disconnect()
})

// --- OnClick Action untuk Pengunjung (Non-Edit) ---
const visitorTranslateElId = ref<string | null>(null)

const visitorTranslateEl = computed(() => {
  if (isEditable.value || !visitorTranslateElId.value) return null
  return displayElements.value.find(item => item.id === visitorTranslateElId.value) ?? null
})

const visitorTranslatePos = ref<{ top: number, left: number, openUpwards: boolean } | null>(null)

function updateVisitorTranslatePos() {
  if (!visitorTranslateElId.value) {
    visitorTranslatePos.value = null
    return
  }
  const node = elRefs.value[visitorTranslateElId.value]
  if (!node) {
    visitorTranslatePos.value = null
    return
  }
  const rect = node.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const openUpwards = spaceBelow < 180 && rect.top > 180

  const shell = document.querySelector('.app-shell')
  const shellRect = shell?.getBoundingClientRect() ?? {
    left: 0,
    right: window.innerWidth,
    width: window.innerWidth
  }

  // Lebar menu (160px untuk w-40, atau ~200px untuk tab)
  const el = visitorTranslateEl.value
  const isDropdown = el ? getTranslateConfig(el).style === 'dropdown' : true
  const menuWidth = isDropdown ? 160 : 200
  const halfMenuWidth = menuWidth / 2
  const paddingFromEdge = 16 // Jarak aman minimal 16px dari tepi content

  const rawCenterLeft = rect.left + rect.width / 2
  const minCenterLeft = shellRect.left + paddingFromEdge + halfMenuWidth
  const maxCenterLeft = shellRect.right - paddingFromEdge - halfMenuWidth

  const clampedLeft = Math.max(minCenterLeft, Math.min(maxCenterLeft, rawCenterLeft))

  visitorTranslatePos.value = {
    top: openUpwards ? (rect.top - 8) : (rect.bottom + 8),
    left: clampedLeft,
    openUpwards
  }
}

watch(visitorTranslateElId, (newId) => {
  if (newId) {
    nextTick(updateVisitorTranslatePos)
  } else {
    visitorTranslatePos.value = null
  }
})

function onVisitorDocClick(e: MouseEvent) {
  if (visitorTranslateElId.value) {
    const target = e.target as HTMLElement | null
    if (target?.closest('.visitor-translate-portal')) return
    visitorTranslateElId.value = null
    visitorTranslatePos.value = null
  }
}

function onVisitorWindowChange() {
  if (visitorTranslateElId.value) {
    updateVisitorTranslatePos()
  }
}

onMounted(() => {
  window.addEventListener('scroll', onVisitorWindowChange, true)
  window.addEventListener('resize', onVisitorWindowChange)
  document.addEventListener('click', onVisitorDocClick)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onVisitorWindowChange, true)
  window.removeEventListener('resize', onVisitorWindowChange)
  document.removeEventListener('click', onVisitorDocClick)
})

const DEFAULT_TRANSLATE_CONFIG = {
  style: 'tab' as const,
  bgColor: '#18181b',
  textColor: '#ffffff',
  activeBgColor: '#10b981',
  activeTextColor: '#ffffff'
}

function getTranslateConfig(el: CanvasElement) {
  return {
    style: el.onClickConfig?.style ?? DEFAULT_TRANSLATE_CONFIG.style,
    bgColor: el.onClickConfig?.bgColor ?? DEFAULT_TRANSLATE_CONFIG.bgColor,
    textColor: el.onClickConfig?.textColor ?? DEFAULT_TRANSLATE_CONFIG.textColor,
    activeBgColor: el.onClickConfig?.activeBgColor ?? DEFAULT_TRANSLATE_CONFIG.activeBgColor,
    activeTextColor: el.onClickConfig?.activeTextColor ?? DEFAULT_TRANSLATE_CONFIG.activeTextColor
  }
}

function onElementClick(el: CanvasElement, event: MouseEvent) {
  if (isEditable.value) {
    event.stopPropagation()
    canvas.select(el.id)
  } else if (el.onClickAction === 'translate') {
    event.stopPropagation()
    visitorTranslateElId.value = visitorTranslateElId.value === el.id ? null : el.id
  } else if (el.type === 'button' || el.onClickAction === 'url' || el.onClickAction === 'dialog') {
    event.stopPropagation()
    if (el.onClickAction === 'dialog' || el.onClickConfig?.url === '#dialog') {
      pageDialog.value.openModal()
    } else if (el.onClickConfig?.url) {
      if (el.onClickConfig.url.startsWith('http://') || el.onClickConfig.url.startsWith('https://')) {
        window.open(el.onClickConfig.url, '_blank')
      } else {
        navigateTo(el.onClickConfig.url)
      }
    }
  }
}

function onSelectLocale(code: string) {
  setContentLocale(code as 'id' | 'en' | 'ja')
  visitorTranslateElId.value = null
  visitorTranslatePos.value = null
}

function onBackgroundClick() {
  if (isEditable.value) {
    canvas.select(null)
    editingId.value = null
    visitorTranslateElId.value = null
  } else {
    visitorTranslateElId.value = null
    // Jika dialog halaman diaktifkan pada halaman ini, buka modal pop-up
    if (props.pageKey !== HEADER_PAGE_KEY && props.pageKey !== FOOTER_PAGE_KEY) {
      if (pageDialog.value.enabled) {
        pageDialog.value.openModal()
      }
    }
  }
}

// --- Edit teks inline (double-click buat masuk mode edit) ---
const editingId = ref<string | null>(null)
const editingValue = ref('')
const textareaRefs = ref<Record<string, HTMLTextAreaElement | null>>({})
function setTextareaRef(id: string, el: Element | null) {
  textareaRefs.value[id] = el as HTMLTextAreaElement | null
}

function startEditText(el: { id: string, type: string, content: string }, event: MouseEvent) {
  if (!isEditable.value || (el.type !== 'text' && el.type !== 'button')) return
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

// --- Pengolahan Dynamic Form & Terjemahan ---
const isTranslatePanelOpen = ref(false)

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
  return el.formConfig.label || el.content || ''
}

function getDisplayFieldPlaceholder(el: CanvasElement): string {
  if (!el.formConfig) return ''
  const lang = contentLocale.value
  if (lang && lang !== 'id' && el.formConfig.translations?.[lang]?.placeholder) {
    return el.formConfig.translations[lang].placeholder!
  }
  return el.formConfig.placeholder || ''
}

const visitorFormValues = ref<Record<string, any>>({})
const visitorFormSubmitting = ref(false)
const showPassword = ref<Record<string, boolean>>({})

function onToggleCheckbox(fieldName: string) {
  visitorFormValues.value[fieldName] = !visitorFormValues.value[fieldName]
}

function onSelectRadio(fieldName: string, value: string) {
  visitorFormValues.value[fieldName] = value
}

async function onSubmitPageForm(submitEl: CanvasElement) {
  const cfg = submitEl.formConfig
  if (!cfg) return

  // Validasi field required
  const formElements = canvas.elements.filter(e => e.type === 'form_input' && e.formConfig && e.formConfig.fieldType !== 'submit')
  for (const el of formElements) {
    const f = el.formConfig!
    const val = visitorFormValues.value[f.name]
    if (f.required) {
      if (val === undefined || val === null || val === '' || (f.fieldType === 'checkbox' && !val)) {
        toast.add({
          title: `Field "${f.label || f.name}" wajib diisi`,
          color: 'error'
        })
        return
      }
    }
    if (f.fieldType === 'email' && val && typeof val === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(val)) {
        toast.add({
          title: t('admin.login.emailInvalid'),
          color: 'error'
        })
        return
      }
    }
  }

  const endpoint = cfg.endpoint || '/api/submit'
  const isLoginEndpoint = endpoint === '/api/login' || endpoint === 'login' || endpoint === 'auth/login'

  visitorFormSubmitting.value = true
  try {
    if (isLoginEndpoint) {
      let email = visitorFormValues.value.email || visitorFormValues.value.username || visitorFormValues.value.identifier
      if (!email) {
        for (const [k, v] of Object.entries(visitorFormValues.value)) {
          if (k.toLowerCase().includes('email') && typeof v === 'string' && v.trim()) {
            email = v
            break
          }
        }
      }
      if (!email) {
        for (const [_, v] of Object.entries(visitorFormValues.value)) {
          if (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
            email = v
            break
          }
        }
      }

      let password = visitorFormValues.value.password || visitorFormValues.value.pass || visitorFormValues.value.pwd
      if (!password) {
        for (const [k, v] of Object.entries(visitorFormValues.value)) {
          if ((k.toLowerCase().includes('pass') || k.toLowerCase().includes('pwd')) && typeof v === 'string' && v.trim()) {
            password = v
            break
          }
        }
      }

      if (!email || !password) {
        throw new Error('Email dan password wajib diisi.')
      }

      const supabase = useSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email).trim(),
        password: String(password)
      })

      if (error || !data.user) {
        throw new Error(error?.message || 'Email atau password salah.')
      }
    } else {
      const method = (cfg.method || 'POST').toUpperCase()
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: method !== 'GET' ? JSON.stringify(visitorFormValues.value) : undefined
      })

      if (!response.ok) {
        let errData: any = null
        try { errData = await response.json() } catch {}
        throw new Error(errData?.message || `HTTP ${response.status}: ${response.statusText}`)
      }
    }

    toast.add({
      title: cfg.successMessage || t('admin.form.submitSuccess'),
      color: 'success'
    })

    if (cfg.successUrl) {
      if (cfg.successUrl.startsWith('http://') || cfg.successUrl.startsWith('https://')) {
        window.location.href = cfg.successUrl
      } else {
        navigateTo(cfg.successUrl)
      }
    }

    visitorFormValues.value = {}
  } catch (err: any) {
    toast.add({
      title: t('admin.form.submitError'),
      description: err?.message || '',
      color: 'error'
    })
  } finally {
    visitorFormSubmitting.value = false
  }
}

function getElTranslation(el: CanvasElement | null, langCode: string): string {
  if (!el) return ''
  if (el.type === 'form_input' && el.formConfig?.translations?.[langCode]?.label) {
    return el.formConfig.translations[langCode].label!
  }
  if (el.translations && el.translations[langCode] !== undefined) {
    return el.translations[langCode] || ''
  }
  if (langCode === 'en') return el.contentEn || ''
  if (langCode === 'ja') return el.contentJa || ''
  return ''
}

function onTranslateLang(id: string, langCode: string, value: string) {
  const el = canvas.draftElements.find(e => e.id === id)
  if (!el) return
  const trans = { ...(el.translations || {}) }
  trans[langCode] = value
  const patch: Partial<CanvasElement> = {
    translations: trans
  }
  if (langCode === 'en') patch.contentEn = value
  if (langCode === 'ja') patch.contentJa = value
  if (el.formConfig) {
    const fTrans = { ...(el.formConfig.translations || {}) }
    fTrans[langCode] = { ...(fTrans[langCode] || {}), label: value }
    patch.formConfig = { ...el.formConfig, translations: fTrans }
  }
  canvas.updateElement(id, patch)
}

watch(() => canvas.selectedId, () => {
  isTranslatePanelOpen.value = false
  isFormFieldSettingsOpen.value = false
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
      :class="{
        'canvas-element--selected': isEditable && canvas.selectedId === el.id,
        'canvas-element--interactive': !isEditable && (!!el.onClickAction || el.type === 'form_input')
      }"
      :style="elementStyle(el)"
      @click="(event) => onElementClick(el, event as MouseEvent)"
      @dblclick="(event) => startEditText(el, event as MouseEvent)"
    >
      <img
        v-if="el.type === 'image'"
        :src="el.content"
        class="h-full w-full object-cover pointer-events-none"
        draggable="false"
      >

      <!-- Button Element -->
      <div
        v-else-if="el.type === 'button'"
        class="h-full w-full flex items-center justify-center font-medium shadow-md transition-all select-none overflow-hidden"
        :style="{
          backgroundColor: el.onClickConfig?.bgColor || '#10b981',
          color: el.color || el.onClickConfig?.textColor || '#ffffff',
          borderRadius: `${el.onClickConfig?.borderRadius ?? 8}px`,
          ...fontStyle(el)
        }"
      >
        <textarea
          v-if="editingId === el.id"
          :ref="(node) => setTextareaRef(el.id, node as Element | null)"
          v-model="editingValue"
          class="h-full w-full resize-none border-none bg-transparent p-0 text-center outline-none flex items-center justify-center"
          :style="fontStyle(el)"
          @click.stop
          @blur="commitEditText(el.id)"
          @keydown.enter.exact.prevent="commitEditText(el.id)"
        />
        <span v-else class="truncate pointer-events-none px-2">
          {{ displayText(el) }}
        </span>
      </div>

      <!-- Form Input Element (Dynamic Form Langsung di Halaman) -->
      <div
        v-else-if="el.type === 'form_input' && el.formConfig"
        class="h-full w-full flex flex-col justify-center select-none overflow-hidden"
        :style="fontStyle(el)"
      >
        <!-- 1. Submit Button -->
        <button
          v-if="el.formConfig.fieldType === 'submit'"
          type="button"
          class="h-full w-full flex items-center justify-center font-medium shadow-md transition-all px-3 text-center"
          :class="{
            'cursor-pointer hover:opacity-90 active:scale-[0.98]': !isEditable,
            'pointer-events-none': isEditable
          }"
          :style="{
            backgroundColor: el.formConfig.bgColor || '#10b981',
            color: el.formConfig.textColor || '#ffffff',
            borderRadius: `${el.formConfig.borderRadius ?? 8}px`,
            ...fontStyle(el)
          }"
          @click.stop="!isEditable && onSubmitPageForm(el)"
        >
          <UIcon v-if="visitorFormSubmitting" name="i-lucide-loader-2" class="size-4 animate-spin mr-1.5" />
          <span class="truncate">{{ getDisplayFieldLabel(el) }}</span>
        </button>

        <!-- 2. Checkbox -->
        <label
          v-else-if="el.formConfig.fieldType === 'checkbox'"
          class="h-full w-full flex items-center gap-2 px-2 select-none"
          :class="!isEditable ? 'cursor-pointer' : 'pointer-events-none'"
          @click.stop="!isEditable && onToggleCheckbox(el.formConfig.name)"
        >
          <div
            class="size-4.5 rounded border flex items-center justify-center transition-colors shrink-0"
            :style="{
              backgroundColor: visitorFormValues[el.formConfig.name] ? (el.formConfig.bgColor || '#10b981') : 'transparent',
              borderColor: el.formConfig.borderColor || '#52525b',
              color: el.formConfig.textColor || '#ffffff'
            }"
          >
            <UIcon
              v-if="visitorFormValues[el.formConfig.name]"
              name="i-lucide-check"
              class="size-3"
            />
          </div>
          <span class="text-xs font-normal truncate" :style="{ color: el.formConfig.textColor || '#ffffff' }">
            {{ getDisplayFieldLabel(el) }}
            <span v-if="el.formConfig.required" class="text-red-400 ml-0.5">*</span>
          </span>
        </label>

        <!-- 3. Radio Option -->
        <label
          v-else-if="el.formConfig.fieldType === 'radio'"
          class="h-full w-full flex items-center gap-2 px-2 select-none"
          :class="!isEditable ? 'cursor-pointer' : 'pointer-events-none'"
          @click.stop="!isEditable && onSelectRadio(el.formConfig.name, el.formConfig.label)"
        >
          <div
            class="size-4.5 rounded-full border flex items-center justify-center transition-colors shrink-0"
            :style="{
              borderColor: el.formConfig.borderColor || '#52525b'
            }"
          >
            <div
              v-if="visitorFormValues[el.formConfig.name] === el.formConfig.label"
              class="size-2.5 rounded-full"
              :style="{ backgroundColor: el.formConfig.bgColor || '#10b981' }"
            />
          </div>
          <span class="text-xs font-normal truncate" :style="{ color: el.formConfig.textColor || '#ffffff' }">
            {{ getDisplayFieldLabel(el) }}
            <span v-if="el.formConfig.required" class="text-red-400 ml-0.5">*</span>
          </span>
        </label>

        <!-- 4. Textarea Input -->
        <div v-else-if="el.formConfig.fieldType === 'textarea'" class="h-full w-full flex flex-col justify-center space-y-1">
          <div
            v-if="el.formConfig.label && el.formConfig.label.trim().length > 0"
            class="text-[11px] font-medium text-left px-1 truncate flex items-center gap-1 opacity-90"
            :style="{ color: el.formConfig.textColor || '#e4e4e7' }"
          >
            <span>{{ getDisplayFieldLabel(el) }}</span>
            <span v-if="el.formConfig.required" class="text-red-400">*</span>
          </div>
          <div
            class="relative flex-1 w-full rounded border overflow-hidden"
            :style="{
              backgroundColor: el.formConfig.bgColor || '#18181b',
              borderColor: el.formConfig.borderColor || '#3f3f46',
              borderRadius: `${el.formConfig.borderRadius ?? 8}px`
            }"
          >
            <textarea
              v-if="!isEditable"
              v-model="visitorFormValues[el.formConfig.name]"
              :placeholder="getDisplayFieldPlaceholder(el)"
              class="h-full w-full resize-none border-none bg-transparent p-2 text-xs text-white placeholder-neutral-500 outline-none"
              :style="{ color: el.formConfig.textColor || '#ffffff' }"
              @click.stop
            />
            <div
              v-else
              class="h-full w-full p-2 text-xs text-neutral-500 pointer-events-none truncate text-left"
            >
              {{ getDisplayFieldPlaceholder(el) || 'Tuliskan teks...' }}
            </div>
          </div>
        </div>

        <!-- 5. Select Dropdown -->
        <div v-else-if="el.formConfig.fieldType === 'select'" class="h-full w-full flex flex-col justify-center space-y-1">
          <div
            v-if="el.formConfig.label && el.formConfig.label.trim().length > 0"
            class="text-[11px] font-medium text-left px-1 truncate flex items-center gap-1 opacity-90"
            :style="{ color: el.formConfig.textColor || '#e4e4e7' }"
          >
            <span>{{ getDisplayFieldLabel(el) }}</span>
            <span v-if="el.formConfig.required" class="text-red-400">*</span>
          </div>
          <div
            class="relative flex-1 w-full rounded border flex items-center px-2.5 overflow-hidden"
            :style="{
              backgroundColor: el.formConfig.bgColor || '#18181b',
              borderColor: el.formConfig.borderColor || '#3f3f46',
              borderRadius: `${el.formConfig.borderRadius ?? 8}px`
            }"
          >
            <select
              v-if="!isEditable"
              v-model="visitorFormValues[el.formConfig.name]"
              class="h-full w-full border-none bg-transparent text-xs text-white outline-none cursor-pointer appearance-none pr-6"
              :style="{ color: el.formConfig.textColor || '#ffffff' }"
              @click.stop
            >
              <option value="" disabled selected class="bg-neutral-900 text-neutral-400">
                {{ getDisplayFieldPlaceholder(el) || 'Pilih opsi...' }}
              </option>
              <option
                v-for="opt in (el.formConfig.options || [])"
                :key="opt"
                :value="opt"
                class="bg-neutral-900 text-white"
              >
                {{ opt }}
              </option>
            </select>
            <div
              v-else
              class="h-full w-full flex items-center justify-between text-xs text-neutral-400 pointer-events-none truncate text-left"
            >
              <span>{{ getDisplayFieldPlaceholder(el) || 'Pilih opsi...' }}</span>
            </div>
            <UIcon name="i-lucide-chevron-down" class="size-4 text-neutral-400 pointer-events-none absolute right-2.5" />
          </div>
        </div>

        <!-- 6. Standard Text / Email / Password / Number / Tel Input -->
        <div v-else class="h-full w-full flex flex-col justify-center space-y-1">
          <div
            v-if="el.formConfig.label && el.formConfig.label.trim().length > 0"
            class="text-[11px] font-medium text-left px-1 truncate flex items-center gap-1 opacity-90"
            :style="{ color: el.formConfig.textColor || '#e4e4e7' }"
          >
            <span>{{ getDisplayFieldLabel(el) }}</span>
            <span v-if="el.formConfig.required" class="text-red-400">*</span>
          </div>
          <div
            class="relative flex-1 w-full rounded border flex items-center px-2.5 overflow-hidden"
            :style="{
              backgroundColor: el.formConfig.bgColor || '#18181b',
              borderColor: el.formConfig.borderColor || '#3f3f46',
              borderRadius: `${el.formConfig.borderRadius ?? 8}px`
            }"
          >
            <input
              v-if="!isEditable"
              v-model="visitorFormValues[el.formConfig.name]"
              :type="el.formConfig.fieldType === 'password' ? (showPassword[el.id] ? 'text' : 'password') : el.formConfig.fieldType"
              :placeholder="getDisplayFieldPlaceholder(el)"
              class="h-full w-full border-none bg-transparent text-xs text-white placeholder-neutral-500 outline-none pr-6"
              :style="{ color: el.formConfig.textColor || '#ffffff' }"
              @click.stop
            />
            <div
              v-else
              class="h-full w-full flex items-center text-xs text-neutral-500 pointer-events-none truncate text-left"
            >
              {{ getDisplayFieldPlaceholder(el) || 'Masukkan data...' }}
            </div>

            <!-- Password Toggle Icon -->
            <button
              v-if="el.formConfig.fieldType === 'password' && !isEditable"
              type="button"
              class="absolute right-2 text-neutral-400 hover:text-white cursor-pointer"
              @click.stop="showPassword[el.id] = !showPassword[el.id]"
            >
              <UIcon :name="showPassword[el.id] ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Text Element -->
      <textarea
        v-else-if="editingId === el.id"
        :ref="(node) => setTextareaRef(el.id, node as Element | null)"
        v-model="editingValue"
        class="h-full w-full resize-none border-none bg-transparent p-0 text-center outline-none"
        :style="fontStyle(el)"
        @click.stop
        @blur="commitEditText(el.id)"
        @keydown.enter.exact.prevent="commitEditText(el.id)"
      />

      <div
        v-else
        class="h-full w-full whitespace-pre-wrap break-words text-center pointer-events-none"
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

    <!-- Tombol "+" tambah elemen — Sticky melayang di pojok kanan-atas canvas (hanya di edit mode) -->
    <template v-if="isEditable">
      <div class="canvas-add-control-group">
        <!-- Floating Bar Menu Tambah Komponen Canvas (Background, Text, Image, Button, Form, Dialog) -->
        <div
          v-if="isAddMenuOpen"
          class="canvas-add-menu-bar"
        >
        <!-- 0. Background Per-Halaman (Khusus Canvas Konten) -->
        <UPopover
          v-if="props.pageKey !== HEADER_PAGE_KEY && props.pageKey !== FOOTER_PAGE_KEY"
          v-model:open="isPageBgPopoverOpen"
          :content="{ side: 'bottom', align: 'start' }"
        >
          <UTooltip :text="t('admin.background.label') || 'Background Halaman'">
            <UButton
              icon="i-lucide-image"
              :color="isPageBgDirty ? 'primary' : 'neutral'"
              variant="ghost"
              size="xs"
              square
              class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
              :class="isPageBgPopoverOpen ? 'bg-white/20' : ''"
              :aria-label="t('admin.background.label')"
            />
          </UTooltip>
          <template #content>
            <div class="w-72 space-y-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl text-xs text-neutral-200" @click.stop>
              <div class="font-semibold text-neutral-300 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
                <span>{{ t('admin.background.panelTitle') }}</span>
                <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  {{ props.pageKey }}
                </span>
              </div>

              <!-- Pilihan Warna -->
              <div class="flex items-center justify-between gap-3">
                <span class="text-neutral-400 font-medium">{{ t('admin.background.colorLabel') }}</span>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    class="size-6 cursor-pointer rounded border border-neutral-700 bg-transparent p-0"
                    :value="currentDraftPageBg.color || '#0f172a'"
                    @input="onPageColorInput"
                  >
                  <span class="font-mono text-[10px] text-neutral-400 uppercase">
                    {{ currentDraftPageBg.color || '#0f172a' }}
                  </span>
                </div>
              </div>

              <!-- Upload Gambar -->
              <div class="space-y-1.5 pt-2 border-t border-neutral-800/80">
                <span class="text-neutral-400 font-medium block">{{ t('admin.background.orUpload') }}</span>
                <UButton
                  :label="t('admin.background.pickImage')"
                  icon="i-lucide-upload"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  block
                  class="cursor-pointer"
                  @click="triggerPageBgFilePicker"
                />
                <input
                  ref="pageBgFileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onPageBgFileChange"
                >
              </div>

              <!-- Reset ke Default -->
              <div class="pt-2 border-t border-neutral-800/80">
                <UButton
                  :label="t('admin.background.resetDefault')"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  block
                  class="cursor-pointer text-neutral-400 hover:text-white"
                  @click="onResetPageBgDefault"
                />
              </div>
            </div>
          </template>
        </UPopover>

        <!-- 0b. Header & Footer Visibility Per-Halaman (Khusus Canvas Konten) -->
        <UPopover
          v-if="props.pageKey !== HEADER_PAGE_KEY && props.pageKey !== FOOTER_PAGE_KEY"
          v-model:open="isPageSectionsPopoverOpen"
          :content="{ side: 'bottom', align: 'start' }"
        >
          <UTooltip :text="t('admin.sections.label') || 'Header & Footer'">
            <UButton
              icon="i-lucide-panel-top"
              :color="isPageSectionsDirty ? 'primary' : 'neutral'"
              variant="ghost"
              size="xs"
              square
              class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
              :class="isPageSectionsPopoverOpen ? 'bg-white/20' : ''"
              :aria-label="t('admin.sections.label') || 'Header & Footer'"
            />
          </UTooltip>
          <template #content>
            <div class="w-64 space-y-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl text-xs text-neutral-200" @click.stop>
              <div class="font-semibold text-neutral-300 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
                <span>{{ t('admin.sections.panelTitle') }}</span>
                <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  {{ props.pageKey }}
                </span>
              </div>

              <!-- Toggle Header Halaman Ini -->
              <div class="flex items-center justify-between gap-3">
                <span class="text-neutral-300 font-medium">{{ t('admin.sections.showHeader') }}</span>
                <USwitch
                  :model-value="sections.getDraftHeaderVisible(props.pageKey)"
                  @update:model-value="(v) => sections.setDraftPageHeaderVisible(props.pageKey, !!v)"
                />
              </div>

              <!-- Toggle Footer Halaman Ini -->
              <div class="flex items-center justify-between gap-3 pt-2 border-t border-neutral-800/80">
                <span class="text-neutral-300 font-medium">{{ t('admin.sections.showFooter') }}</span>
                <USwitch
                  :model-value="sections.getDraftFooterVisible(props.pageKey)"
                  @update:model-value="(v) => sections.setDraftPageFooterVisible(props.pageKey, !!v)"
                />
              </div>
            </div>
          </template>
        </UPopover>

        <!-- 1. Text -->
        <UTooltip :text="t('admin.canvas.addText')">
          <UButton
            icon="i-lucide-type"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
            :aria-label="t('admin.canvas.addText')"
            @click.stop="onAddText"
          />
        </UTooltip>

        <!-- 2. Image -->
        <UTooltip :text="t('admin.canvas.addImage')">
          <UButton
            icon="i-lucide-image-plus"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
            :aria-label="t('admin.canvas.addImage')"
            @click.stop="triggerAddImagePicker"
          />
        </UTooltip>

        <!-- 3. Button -->
        <UTooltip :text="t('admin.canvas.addButton')">
          <UButton
            icon="i-lucide-square-mouse-pointer"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
            :aria-label="t('admin.canvas.addButton')"
            @click.stop="onAddButton"
          />
        </UTooltip>

        <!-- 4. Dynamic Form Menu (Khusus Canvas Konten) -->
        <UPopover
          v-if="props.pageKey !== HEADER_PAGE_KEY && props.pageKey !== FOOTER_PAGE_KEY"
          v-model:open="isAddFormPopoverOpen"
          :content="{ side: 'bottom', align: 'end' }"
        >
          <UTooltip :text="t('admin.canvas.addForm')">
            <UButton
              icon="i-lucide-form-input"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
              :aria-label="t('admin.canvas.addForm')"
            />
          </UTooltip>
          <template #content>
            <div class="w-64 p-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl space-y-1">
              <div class="text-[11px] font-semibold px-2 py-1 text-neutral-400 border-b border-neutral-800">
                {{ t('admin.canvas.addForm') }}
              </div>
              <div class="grid grid-cols-1 gap-0.5 max-h-72 overflow-y-auto">
                <button
                  v-for="item in formFieldTypesList"
                  :key="item.type"
                  type="button"
                  class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-xs text-neutral-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer w-full"
                  @click.stop="onAddFormInput(item.type)"
                >
                  <UIcon :name="item.icon" class="size-4 text-emerald-400 shrink-0" />
                  <div class="truncate flex-1">
                    <div class="font-medium truncate">{{ item.label }}</div>
                    <div class="text-[10px] text-neutral-400 truncate">{{ item.desc }}</div>
                  </div>
                </button>
              </div>
            </div>
          </template>
        </UPopover>

        <!-- 5. Dialog (Khusus Canvas Konten) -->
        <UTooltip v-if="props.pageKey !== HEADER_PAGE_KEY && props.pageKey !== FOOTER_PAGE_KEY" :text="t('admin.canvas.addDialog')">
          <UButton
            icon="i-lucide-message-square"
            :color="pageDialog.draftEnabled ? 'primary' : 'neutral'"
            variant="ghost"
            size="xs"
            square
            class="text-white hover:bg-white/20 cursor-pointer size-7 justify-center rounded-full"
            :aria-label="t('admin.canvas.addDialog')"
            @click.stop="onAddDialog"
          />
        </UTooltip>
      </div>

        <UTooltip :text="isAddMenuOpen ? t('admin.canvas.closeAddMenu') : t('admin.canvas.addElement')">
          <UButton
            :icon="isAddMenuOpen ? 'i-lucide-x' : 'i-lucide-plus'"
            color="neutral"
            variant="solid"
            size="sm"
            square
            class="canvas-add-trigger cursor-pointer shadow-xl"
            :aria-label="isAddMenuOpen ? t('admin.canvas.closeAddMenu') : t('admin.canvas.addElement')"
            @click.stop="toggleAddMenu"
          />
        </UTooltip>
      </div>

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

  <!-- Toolbar elemen terpilih — di-Teleport ke <body> & `fixed` positioned -->
  <Teleport to="body">
    <div
      v-if="isEditable && canvas.selectedElement && toolbarPos"
      class="canvas-toolbar-float"
      :style="{ top: `${toolbarPos.top}px`, left: `${toolbarPos.left}px` }"
      @click.stop
      @dblclick.stop
    >
      <!-- Dropdown Font Preset (Teks, Tombol, Form) -->
      <USelect
        v-if="canvas.selectedElement.type === 'text' || canvas.selectedElement.type === 'button' || canvas.selectedElement.type === 'form_input'"
        :model-value="canvas.selectedElement.fontPresetId ?? NO_PRESET_VALUE"
        :items="fontSelectItems"
        value-key="value"
        :placeholder="t('admin.canvas.fontPlaceholder')"
        size="xs"
        class="w-32"
        @update:model-value="(v) => onFontPresetChange(canvas.selectedElement!.id, v as string | null)"
      />

      <!-- Popover Pengaturan Field Form Dinamis -->
      <UPopover
        v-if="canvas.selectedElement.type === 'form_input' && canvas.selectedElement.formConfig"
        v-model:open="isFormFieldSettingsOpen"
        :content="{ side: 'bottom', align: 'start' }"
      >
        <UTooltip :text="t('admin.form.formSettings')">
          <UButton
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            variant="soft"
            size="xs"
            square
            class="cursor-pointer"
            :aria-label="t('admin.form.formSettings')"
          />
        </UTooltip>
        <template #content>
          <div class="w-80 p-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl space-y-3 max-h-96 overflow-y-auto text-xs text-neutral-200">
            <div class="font-semibold text-neutral-300 pb-1 border-b border-neutral-800 flex items-center justify-between">
              <span>{{ t('admin.form.formSettings') }}</span>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                {{ canvas.selectedElement.formConfig.fieldType }}
              </span>
            </div>

            <!-- 1. Tipe Input -->
            <div class="space-y-1">
              <label class="font-medium text-neutral-400">{{ t('admin.form.fieldType') || 'Tipe Input' }}</label>
              <USelect
                :model-value="canvas.selectedElement.formConfig.fieldType"
                :items="formTypeSelectItems"
                value-key="value"
                size="xs"
                class="w-full"
                @update:model-value="(v) => updateSelectedFormField({ fieldType: v as any })"
              />
            </div>

            <!-- 2. Label Field & Terjemahan Multi-Bahasa -->
            <div class="space-y-2">
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="font-medium text-neutral-400">{{ t('admin.form.fieldLabel') }}</label>
                  <span v-if="nonDefaultActiveLanguages.length > 0" class="text-[10px] text-neutral-500 font-medium">[Default / ID]</span>
                </div>
                <UInput
                  :model-value="canvas.selectedElement.formConfig.label"
                  :placeholder="t('admin.form.fieldLabelPlaceholder')"
                  size="xs"
                  class="w-full"
                  @update:model-value="(v) => updateSelectedFormField({ label: String(v) })"
                />
              </div>

              <!-- Input Terjemahan Label per Bahasa Aktif -->
              <div v-if="nonDefaultActiveLanguages.length > 0" class="pl-2.5 border-l-2 border-emerald-500/50 space-y-1.5 pt-0.5">
                <div class="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                  <UIcon name="i-lucide-languages" class="size-3.5 text-emerald-400" />
                  <span>Terjemahan Label:</span>
                </div>
                <div
                  v-for="lang in nonDefaultActiveLanguages"
                  :key="`trans-lbl-${lang.code}`"
                  class="space-y-0.5"
                >
                  <div class="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>{{ lang.name }}</span>
                    <span class="uppercase font-mono font-bold text-neutral-500">{{ lang.code }}</span>
                  </div>
                  <UInput
                    :model-value="getFormFieldTranslation(lang.code, 'label')"
                    :placeholder="`Label (${lang.name})...`"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => updateFormFieldTranslation(lang.code, 'label', String(v))"
                  />
                </div>
              </div>
            </div>

            <!-- 3. Key / Nama Variabel (Bukan Tombol Submit) -->
            <div v-if="canvas.selectedElement.formConfig.fieldType !== 'submit'" class="space-y-1">
              <label class="font-medium text-neutral-400">{{ t('admin.form.fieldName') }}</label>
              <UInput
                :model-value="canvas.selectedElement.formConfig.name"
                :placeholder="t('admin.form.fieldNamePlaceholder')"
                size="xs"
                class="w-full font-mono text-[11px]"
                @update:model-value="(v) => updateSelectedFormField({ name: String(v) })"
              />
            </div>

            <!-- 4. Placeholder & Terjemahan Multi-Bahasa -->
            <div
              v-if="['text', 'email', 'password', 'number', 'tel', 'textarea', 'select'].includes(canvas.selectedElement.formConfig.fieldType)"
              class="space-y-2"
            >
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="font-medium text-neutral-400">{{ t('admin.form.placeholder') }}</label>
                  <span v-if="nonDefaultActiveLanguages.length > 0" class="text-[10px] text-neutral-500 font-medium">[Default / ID]</span>
                </div>
                <UInput
                  :model-value="canvas.selectedElement.formConfig.placeholder"
                  :placeholder="t('admin.form.placeholderPlaceholder')"
                  size="xs"
                  class="w-full"
                  @update:model-value="(v) => updateSelectedFormField({ placeholder: String(v) })"
                />
              </div>

              <!-- Input Terjemahan Placeholder per Bahasa Aktif -->
              <div v-if="nonDefaultActiveLanguages.length > 0" class="pl-2.5 border-l-2 border-emerald-500/50 space-y-1.5 pt-0.5">
                <div class="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                  <UIcon name="i-lucide-languages" class="size-3.5 text-emerald-400" />
                  <span>Terjemahan Placeholder:</span>
                </div>
                <div
                  v-for="lang in nonDefaultActiveLanguages"
                  :key="`trans-plc-${lang.code}`"
                  class="space-y-0.5"
                >
                  <div class="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>{{ lang.name }}</span>
                    <span class="uppercase font-mono font-bold text-neutral-500">{{ lang.code }}</span>
                  </div>
                  <UInput
                    :model-value="getFormFieldTranslation(lang.code, 'placeholder')"
                    :placeholder="`Placeholder (${lang.name})...`"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => updateFormFieldTranslation(lang.code, 'placeholder', String(v))"
                  />
                </div>
              </div>
            </div>

            <!-- 5. Opsi (Select & Radio) -->
            <div
              v-if="['select', 'radio'].includes(canvas.selectedElement.formConfig.fieldType)"
              class="space-y-1"
            >
              <label class="font-medium text-neutral-400">{{ t('admin.form.optionsLabel') }}</label>
              <UInput
                :model-value="(canvas.selectedElement.formConfig.options || []).join(', ')"
                :placeholder="t('admin.form.optionsPlaceholder')"
                size="xs"
                class="w-full"
                @update:model-value="(v) => updateSelectedFormField({ options: String(v).split(',').map(s => s.trim()).filter(Boolean) })"
              />
            </div>

            <!-- 6. Required Switch -->
            <div
              v-if="canvas.selectedElement.formConfig.fieldType !== 'submit'"
              class="flex items-center justify-between py-1 border-t border-neutral-800/80"
            >
              <span class="font-medium text-neutral-400">{{ t('admin.form.required') }}</span>
              <USwitch
                :model-value="!!canvas.selectedElement.formConfig.required"
                size="xs"
                @update:model-value="(v) => updateSelectedFormField({ required: !!v })"
              />
            </div>

            <!-- 7. Konfigurasi Khusus Submit Button -->
            <template v-if="canvas.selectedElement.formConfig.fieldType === 'submit'">
              <div class="space-y-2 pt-2 border-t border-neutral-800/80">
                <div class="font-semibold text-neutral-400 text-[11px]">{{ t('admin.form.endpointFeedbackSection') }}</div>
                <div class="space-y-1">
                  <label class="font-medium text-neutral-400">{{ t('admin.form.endpointLabel') }}</label>
                  <UInput
                    :model-value="canvas.selectedElement.formConfig.endpoint || ''"
                    placeholder="/api/submit atau https://..."
                    size="xs"
                    class="w-full font-mono text-[11px]"
                    @update:model-value="(v) => updateSelectedFormField({ endpoint: String(v) })"
                  />
                </div>
                <div class="space-y-1">
                  <label class="font-medium text-neutral-400">{{ t('admin.form.methodLabel') }}</label>
                  <USelect
                    :model-value="canvas.selectedElement.formConfig.method || 'POST'"
                    :items="methodOptions"
                    value-key="value"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => updateSelectedFormField({ method: String(v) })"
                  />
                </div>
                <div class="space-y-1">
                  <label class="font-medium text-neutral-400">{{ t('admin.form.successMsgLabel') }}</label>
                  <UInput
                    :model-value="canvas.selectedElement.formConfig.successMessage || ''"
                    :placeholder="t('admin.form.successMsgPlaceholder')"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => updateSelectedFormField({ successMessage: String(v) })"
                  />
                </div>
                <div class="space-y-1">
                  <label class="font-medium text-neutral-400">{{ t('admin.form.successUrlLabel') }}</label>
                  <UInput
                    :model-value="canvas.selectedElement.formConfig.successUrl || ''"
                    :placeholder="t('admin.form.successUrlPlaceholder')"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => updateSelectedFormField({ successUrl: String(v) })"
                  />
                </div>
              </div>
            </template>

            <!-- 8. Tampilan & Warna -->
            <div class="space-y-2 pt-2 border-t border-neutral-800/80">
              <div class="font-semibold text-neutral-400 text-[11px]">{{ t('admin.form.styleSection') }}</div>
              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <label class="text-[10px] text-neutral-400">{{ t('admin.form.bgLabel') }}</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      type="color"
                      :value="canvas.selectedElement.formConfig.bgColor || (canvas.selectedElement.formConfig.fieldType === 'submit' ? '#10b981' : '#18181b')"
                      class="size-6 rounded border border-neutral-700 bg-transparent cursor-pointer"
                      @input="(e) => updateSelectedFormField({ bgColor: (e.target as HTMLInputElement).value })"
                    />
                    <span class="font-mono text-[10px] text-neutral-400 uppercase">
                      {{ canvas.selectedElement.formConfig.bgColor || (canvas.selectedElement.formConfig.fieldType === 'submit' ? '#10b981' : '#18181b') }}
                    </span>
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] text-neutral-400">{{ t('admin.form.textColorLabel') }}</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      type="color"
                      :value="canvas.selectedElement.formConfig.textColor || '#ffffff'"
                      class="size-6 rounded border border-neutral-700 bg-transparent cursor-pointer"
                      @input="(e) => updateSelectedFormField({ textColor: (e.target as HTMLInputElement).value })"
                    />
                    <span class="font-mono text-[10px] text-neutral-400 uppercase">
                      {{ canvas.selectedElement.formConfig.textColor || '#ffffff' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UPopover>

      <!-- Terjemahan manual (EN/JA/dst) — Hanya untuk Teks & Tombol biasa (Form Input diatur lengkap di Pengaturan Field) -->
      <UPopover
        v-if="canvas.selectedElement.type === 'text' || canvas.selectedElement.type === 'button'"
        v-model:open="isTranslatePanelOpen"
        :content="{ side: 'bottom', align: 'start' }"
      >
        <UTooltip :text="t('admin.canvas.translateAria')">
          <UButton
            icon="i-lucide-languages"
            color="neutral"
            variant="soft"
            size="xs"
            square
            class="cursor-pointer"
            :aria-label="t('admin.canvas.translateAria')"
          />
        </UTooltip>
        <template #content>
          <div class="w-64 space-y-2.5 p-2 max-h-72 overflow-y-auto">
            <div v-if="nonDefaultActiveLanguages.length === 0" class="text-xs text-neutral-400 py-1 text-center">
              Tidak ada bahasa tambahan yang aktif.
            </div>
            <div
              v-for="lang in nonDefaultActiveLanguages"
              :key="lang.code"
              class="space-y-1 text-xs text-neutral-700 dark:text-neutral-300"
            >
              <div class="flex items-center justify-between font-medium">
                <span>{{ lang.name }}</span>
                <span class="text-[10px] uppercase font-bold text-neutral-400">[{{ lang.code }}]</span>
              </div>
              <UTextarea
                :model-value="getElTranslation(canvas.selectedElement, lang.code)"
                :placeholder="`Terjemahan ${lang.name}...`"
                size="xs"
                class="w-full"
                :rows="2"
                @update:model-value="(v) => onTranslateLang(canvas.selectedElement.id, lang.code, String(v))"
              />
            </div>
          </div>
        </template>
      </UPopover>

      <!-- Urutan tumpuk (z-index) -->
      <UTooltip :text="t('admin.canvas.bringToFront')">
        <UButton
          icon="i-lucide-chevrons-up"
          color="neutral"
          variant="soft"
          size="xs"
          square
          class="cursor-pointer"
          :aria-label="t('admin.canvas.bringToFront')"
          @click="canvas.bringToFront(canvas.selectedElement!.id)"
        />
      </UTooltip>
      <UTooltip :text="t('admin.canvas.sendToBack')">
        <UButton
          icon="i-lucide-chevrons-down"
          color="neutral"
          variant="soft"
          size="xs"
          square
          class="cursor-pointer"
          :aria-label="t('admin.canvas.sendToBack')"
          @click="canvas.sendToBack(canvas.selectedElement!.id)"
        />
      </UTooltip>
      <UTooltip :text="t('admin.canvas.deleteElement')">
        <UButton
          icon="i-lucide-x"
          color="error"
          variant="solid"
          size="xs"
          square
          class="cursor-pointer"
          :aria-label="t('admin.canvas.deleteElement')"
          @click="canvas.removeElement(canvas.selectedElement!.id)"
        />
      </UTooltip>
    </div>
  </Teleport>

  <!-- Visitor Translate Dropdown / Tab — di-Teleport ke <body> agar tidak terpotong header/footer -->
  <Teleport to="body">
    <div
      v-if="!isEditable && visitorTranslateEl && visitorTranslatePos"
      class="visitor-translate-portal fixed z-[99999] shadow-2xl backdrop-blur-md border border-white/10"
      :class="[
        getTranslateConfig(visitorTranslateEl).style === 'dropdown' ? 'w-40 rounded-xl p-1.5 flex flex-col gap-1' : 'flex gap-1 rounded-full p-1',
        visitorTranslatePos.openUpwards ? '-translate-x-1/2 -translate-y-full' : '-translate-x-1/2'
      ]"
      :style="{
        top: `${visitorTranslatePos.top}px`,
        left: `${visitorTranslatePos.left}px`,
        backgroundColor: getTranslateConfig(visitorTranslateEl).bgColor
      }"
      @click.stop
    >
      <!-- Tab Style (Horizontal) -->
      <template v-if="getTranslateConfig(visitorTranslateEl).style === 'tab'">
        <button
          v-for="l in siteLanguages.activeLanguages"
          :key="l.code"
          type="button"
          class="cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold uppercase leading-none transition-all duration-150"
          :style="contentLocale === l.code ? { backgroundColor: getTranslateConfig(visitorTranslateEl).activeBgColor, color: getTranslateConfig(visitorTranslateEl).activeTextColor } : { color: getTranslateConfig(visitorTranslateEl).textColor }"
          :aria-label="`${l.name}`"
          :aria-pressed="contentLocale === l.code"
          @click.stop="onSelectLocale(l.code)"
        >
          {{ l.code }}
        </button>
      </template>

      <!-- Dropdown Style (Vertical) -->
      <template v-else>
        <button
          v-for="l in siteLanguages.activeLanguages"
          :key="l.code"
          type="button"
          class="flex items-center justify-between w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150"
          :style="contentLocale === l.code ? { backgroundColor: getTranslateConfig(visitorTranslateEl).activeBgColor, color: getTranslateConfig(visitorTranslateEl).activeTextColor } : { color: getTranslateConfig(visitorTranslateEl).textColor }"
          :aria-label="`${l.name}`"
          :aria-pressed="contentLocale === l.code"
          @click.stop="onSelectLocale(l.code)"
        >
          <span>{{ l.name }}</span>
          <span class="text-[10px] uppercase opacity-60">{{ l.code }}</span>
        </button>
      </template>
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
.canvas-add-control-group {
  position: sticky;
  top: 8px;
  z-index: 35;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding-inline-end: 8px;
  pointer-events: none;
}

.canvas-add-trigger {
  pointer-events: auto;
  flex-shrink: 0;
}

.canvas-add-menu-bar {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 9999px;
  background-color: rgba(23, 23, 23, 0.9);
  padding: 4px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Elemen non-edit-mode (visitor biasa) sengaja gak nangkep klik sama
   sekali — cuma dekorasi/konten, KECUALI yang punya onClickAction. */
.canvas-editor:not(.canvas-editor--editable) .canvas-element {
  pointer-events: none;
}

.canvas-editor:not(.canvas-editor--editable) .canvas-element.canvas-element--interactive {
  pointer-events: auto;
  cursor: pointer;
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
