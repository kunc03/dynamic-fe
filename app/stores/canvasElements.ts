import { defineStore } from 'pinia'

export type CanvasElementType = 'text' | 'image' | 'button' | 'form_input'

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'submit'

export interface CanvasFormConfig {
  fieldType: FormFieldType
  name: string
  label: string
  placeholder: string
  required?: boolean
  options?: string[]
  endpoint?: string
  method?: string
  successMessage?: string
  successUrl?: string
  bgColor?: string
  textColor?: string
  borderColor?: string
  borderRadius?: number
  translations?: Record<string, { label?: string; placeholder?: string; options?: string[]; buttonText?: string }>
}

export interface OnClickTranslateConfig {
  style?: 'tab' | 'dropdown'
  bgColor?: string
  textColor?: string
  activeBgColor?: string
  activeTextColor?: string
  url?: string
  borderRadius?: number
  [key: string]: any
}

export interface CanvasElement {
  // Server ngasih uuid asli. Elemen baru hasil "Add Text"/"Add Image" (lihat
  // tombol "+" di CanvasEditor.vue) pakai id sementara `tmp-...` sampai
  // ke-save — dibedain lewat isTempId() di bawah.
  id: string
  type: CanvasElementType
  content: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  // Referensi ke preset di fontPresets.ts (fontFamily/fontSize/fontWeight
  // di-resolve dari sana tiap render — lihat CanvasEditor.vue — BUKAN
  // disalin ke sini, biar ubah satu preset otomatis kebawa ke semua elemen
  // yang pakai). null = belum pilih preset, fallback ke default di
  // CanvasEditor.vue. Gak relevan buat type='image'.
  fontPresetId: string | null
  color: string | null
  // Terjemahan KONTEN manual per elemen (BEDA dari string UI "chrome" admin
  // yang ditaruh di app/i18n.config.ts) — admin ngisi sendiri lewat tombol
  // "Terjemahkan" di toolbar elemen terpilih (CanvasEditor.vue, cuma muncul
  // buat type='text'). null = belum diisi -> tampilan fallback ke `content`
  // (bahasa aslinya) buat locale itu, lihat displayText() di CanvasEditor.vue.
  contentEn: string | null
  contentJa: string | null
  // Terjemahan dinamis untuk bahasa apa pun (translations: { en: '...', ja: '...', ko: '...' })
  translations?: Record<string, string> | null
  // Aksi interaktif saat elemen diklik oleh pengunjung (mis. 'translate',
  // null = tidak ada aksi).
  onClickAction: string | null
  // Konfigurasi kustom untuk aksi OnClick (mis. style tab/dropdown, warna custom).
  onClickConfig?: OnClickTranslateConfig | null
  formConfig?: CanvasFormConfig | null
}

function isTempId(id: string) {
  return id.startsWith('tmp-')
}

function cloneElements(list: CanvasElement[]): CanvasElement[] {
  return list.map(el => ({ ...el }))
}

// Posisi/ukuran default elemen baru — px, relatif ke kontainer canvas-nya
// sendiri. Lebar kontainer ini di-cap MAKSIMAL 390px (--app-mobile-width di
// main.css) tapi CUMA di layar > 480px (desktop/tablet) — di HP asli
// (<=480px) lebarnya ngikutin device beneran (360-430px-an tergantung HP),
// biar gak ada celah putih kiri-kanan yang gak perlu. Elemen yang posisinya
// deket tepi kanan bisa geser dikit antar-device beda lebar, tapi masih
// dalam toleransi wajar buat sistem posisi-bebas kayak gini.
const DEFAULT_TEXT = { width: 160, height: 40, color: '#ffffff' }
const DEFAULT_IMAGE = { width: 160, height: 120 }

// page_key KHUSUS (bukan route halaman beneran) buat elemen header & footer
// GLOBAL — sama-sama disimpan di tabel `canvas_elements` (lihat migration
// 0013), tapi dipakai/ditampilin di SEMUA halaman lewat SiteHeader.vue &
// SiteFooter.vue (dipasang di app.vue), bukan cuma satu halaman kayak
// page_key biasa (mis. 'home'). Diekspor biar SiteHeader/SiteFooter &
// SaveEditsButton.vue makenya konsisten, gak salah ketik.
export const HEADER_PAGE_KEY = '__header__'
export const FOOTER_PAGE_KEY = '__footer__'

export interface ActiveCanvasSelection {
  pageKey: string | null
  elementId: string | null
}

const activeSelection = ref<ActiveCanvasSelection>({ pageKey: null, elementId: null })

export function useActiveCanvasSelection() {
  const activeCanvas = computed(() => {
    if (!activeSelection.value.pageKey) return null
    return useCanvasElementsStore(activeSelection.value.pageKey)
  })

  const activeElement = computed(() => {
    if (!activeSelection.value.pageKey || !activeSelection.value.elementId) return null
    const canvas = useCanvasElementsStore(activeSelection.value.pageKey)
    return canvas.draftElements.find(el => el.id === activeSelection.value.elementId) ?? null
  })

  function setActive(pageKey: string | null, elementId: string | null) {
    activeSelection.value = { pageKey, elementId }
  }

  function clearActive() {
    activeSelection.value = { pageKey: null, elementId: null }
  }

  return {
    activeSelection,
    activeCanvas,
    activeElement,
    setActive,
    clearActive
  }
}

// Elemen teks/gambar posisi-bebas ("canvas") di atas suatu area — beda dari
// backgroundSettings.ts (yang cuma satu warna/gambar buat SELURUH content),
// ini banyak elemen individual yang bisa digeser & di-resize satu-satu
// lewat CanvasEditor.vue (pakai vue3-moveable). Sumber kebenarannya tabel
// `canvas_elements` di Supabase (lihat migration
// 0013_canvas_elements.sql di project `be`).
//
// PENTING — kenapa ini FACTORY (bukan langsung `defineStore(...)` kayak
// store lain di project ini): dulu cuma ada SATU canvas per halaman (isi
// content), sekarang ada TIGA yang bisa nyala BARENGAN di layar yang sama
// (header GLOBAL + content halaman + footer GLOBAL, lihat app.vue). Kalau
// tetep satu store singleton, ketiganya bakal REBUTAN satu state yang sama
// (elements/draftElements/selectedId ketimpa-timpa). Solusinya: tiap
// `pageKey` (termasuk HEADER_PAGE_KEY/FOOTER_PAGE_KEY di atas) dapet
// instance store SENDIRI, di-cache Pinia otomatis lewat id store yang
// di-computed dari pageKey-nya — manggil `useCanvasElementsStore('home')`
// dua kali di komponen berbeda bakal balikin instance YANG SAMA (state
// disatuin), tapi `useCanvasElementsStore('home')` vs
// `useCanvasElementsStore(HEADER_PAGE_KEY)` independen total. ID store
// dengan karakter `__` di dalamnya (dari HEADER_PAGE_KEY/FOOTER_PAGE_KEY)
// gak masalah, Pinia cuma perlu string unik.
//
// Sama kayak backgroundSettings.ts: ada state TERSIMPAN (`elements`) &
// state DRAFT (`draftElements`) yang dipakai buat live preview (nambah/
// geser/resize/edit teks LANGSUNG kelihatan di canvas) tapi baru kesimpan
// ke database pas tombol Save diklik (lihat SaveEditsButton.vue, yang juga
// nyimpen perubahan background & font preset dalam satu klik yang sama).
export function useCanvasElementsStore(pageKey: string) {
  return defineStore(`canvasElements:${pageKey}`, () => {
    const { t } = useI18n()

    const elements = ref<CanvasElement[]>([])
    const draftElements = ref<CanvasElement[]>([])

    const selectedId = ref<string | null>(null)

    const saving = ref(false)
    const error = ref<string | null>(null)

    const isDirty = computed(() =>
      JSON.stringify(draftElements.value) !== JSON.stringify(elements.value)
    )

    const selectedElement = computed(() =>
      draftElements.value.find(el => el.id === selectedId.value) ?? null
    )

    function resetDraft() {
      draftElements.value = cloneElements(elements.value)
      selectedId.value = null
      const globalSelection = useActiveCanvasSelection()
      if (globalSelection.activeSelection.value.pageKey === pageKey) {
        globalSelection.clearActive()
      }
    }

    // Ambil semua elemen milik `pageKey` (tetap buat instance store ini,
    // gak dikirim sebagai parameter lagi — beda dari versi lama sebelum
    // di-factory-in) & simpan ke `elements` + sinkronkan draft. Dipanggil
    // dari onMounted CanvasEditor.vue.
    async function load() {
      if (import.meta.server) return

      const supabase = useSupabaseClient()

      const { data, error: fetchError } = await supabase
        .from('canvas_elements')
        .select('id, type, content, content_en, content_ja, translations, pos_x, pos_y, width, height, z_index, color, font_preset_id, on_click_action, on_click_config')
        .eq('page_key', pageKey)
        .order('z_index', { ascending: true })

      if (!fetchError && data) {
        elements.value = data.map(row => {
          const trans = (row.translations as Record<string, string>) || {}
          const cfg = (row.on_click_config as any) || {}
          const formCfg: CanvasFormConfig | null = row.type === 'form_input' || cfg?.fieldType ? {
            fieldType: cfg.fieldType || 'text',
            name: cfg.name || 'field',
            label: cfg.label || row.content || 'Label',
            placeholder: cfg.placeholder || '',
            required: !!cfg.required,
            options: cfg.options || (cfg.fieldType === 'select' || cfg.fieldType === 'radio' ? ['Opsi 1', 'Opsi 2', 'Opsi 3'] : undefined),
            endpoint: cfg.endpoint,
            method: cfg.method || 'POST',
            successMessage: cfg.successMessage,
            successUrl: cfg.successUrl,
            bgColor: cfg.bgColor || (cfg.fieldType === 'submit' ? '#10b981' : '#18181b'),
            textColor: cfg.textColor || '#ffffff',
            borderColor: cfg.borderColor || '#3f3f46',
            borderRadius: cfg.borderRadius ?? 8,
            translations: cfg.translations || {}
          } : null

          let elType: CanvasElementType = 'text'
          if (row.type === 'image') elType = 'image'
          else if (row.type === 'button') elType = 'button'
          else if (row.type === 'form_input' || formCfg) elType = 'form_input'

          return {
            id: row.id,
            type: elType,
            content: row.content ?? '',
            contentEn: trans.en ?? row.content_en ?? null,
            contentJa: trans.ja ?? row.content_ja ?? null,
            translations: trans,
            x: Number(row.pos_x),
            y: Number(row.pos_y),
            width: Number(row.width),
            height: Number(row.height),
            zIndex: row.z_index ?? 0,
            fontPresetId: row.font_preset_id ?? null,
            color: row.color ?? null,
            onClickAction: row.on_click_action ?? null,
            onClickConfig: (row.on_click_config as OnClickTranslateConfig) ?? null,
            formConfig: formCfg
          }
        })
      }
      // Kalau fetch gagal (mis. offline) — biarin `elements` apa adanya
      // (kosong di load pertama), canvas cuma gak nampilin apa-apa, gak
      // nge-blank-in seluruh app.

      resetDraft()
    }

    // Menghitung posisi (x, y) cerdas saat menambah elemen baru:
    // 1. Memeriksa posisi scroll saat ini (.app-content-scroll) jika bukan header/footer
    // 2. Jika tipe form_input, auto-append di bawah elemen terbawah yang sudah ada
    // 3. Jika viewport sedang di-scroll ke bawah, spawn tepat di area pandang aktif
    function getNextSpawnPosition(type: CanvasElementType, defaultWidth: number, defaultHeight: number) {
      if (pageKey === HEADER_PAGE_KEY || pageKey === FOOTER_PAGE_KEY) {
        return {
          x: Math.max(16, Math.round((390 - defaultWidth) / 2)),
          y: Math.max(12, Math.round((DEFAULT_HEADER_HEIGHT_PX - defaultHeight) / 2))
        }
      }

      const scrollEl = import.meta.client ? (document.querySelector('.app-content-scroll') as HTMLElement | null) : null
      const scrollTop = scrollEl?.scrollTop ?? 0

      // Posisi terbawah dari elemen-elemen di canvas saat ini
      const maxBottom = draftElements.value.length > 0
        ? Math.max(...draftElements.value.map(e => e.y + e.height))
        : 0

      let y = 24
      if (type === 'form_input') {
        // Untuk form input: auto-append di bawah field terbawah jika sudah ada elemen
        if (maxBottom > 0) {
          y = maxBottom + 12
        } else {
          y = Math.max(24, scrollTop + 40)
        }
      } else {
        // Untuk teks/gambar/tombol:
        // Jika sedang di-scroll, spawn di area yang sedang terlihat
        if (scrollTop > 40) {
          y = scrollTop + 60
        } else if (maxBottom > 0) {
          y = maxBottom + 16
        } else {
          y = 24
        }
      }

      const x = Math.max(16, Math.round((390 - defaultWidth) / 2))

      return { x, y }
    }

    function scrollToElementIfOffscreen(el: CanvasElement) {
      if (!import.meta.client || pageKey === HEADER_PAGE_KEY || pageKey === FOOTER_PAGE_KEY) return
      setTimeout(() => {
        const scrollEl = document.querySelector('.app-content-scroll') as HTMLElement | null
        if (!scrollEl) return
        const viewTop = scrollEl.scrollTop
        const viewBottom = viewTop + scrollEl.clientHeight
        const elTop = el.y
        const elBottom = el.y + el.height

        if (elBottom > viewBottom - 30 || elTop < viewTop + 30) {
          scrollEl.scrollTo({
            top: Math.max(0, elTop - 60),
            behavior: 'smooth'
          })
        }
      }, 50)
    }

    // "Add Text" — nambah elemen teks baru ke DRAFT
    function addText() {
      const firstPresetId = useFontPresetsStore().draftPresets[0]?.id ?? null
      const { x, y } = getNextSpawnPosition('text', DEFAULT_TEXT.width, DEFAULT_TEXT.height)

      const el: CanvasElement = {
        id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
        type: 'text',
        content: 'Teks baru',
        x,
        y,
        width: DEFAULT_TEXT.width,
        height: DEFAULT_TEXT.height,
        zIndex: draftElements.value.length,
        fontPresetId: firstPresetId,
        color: DEFAULT_TEXT.color,
        contentEn: null,
        contentJa: null,
        onClickAction: null,
        onClickConfig: null,
        formConfig: null
      }
      draftElements.value = [...draftElements.value, el]
      select(el.id)
      scrollToElementIfOffscreen(el)
    }

    // "Add Image" — sama kayak addText, isinya data URL hasil upload.
    function addImage(dataUrl: string) {
      const { x, y } = getNextSpawnPosition('image', DEFAULT_IMAGE.width, DEFAULT_IMAGE.height)

      const el: CanvasElement = {
        id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
        type: 'image',
        content: dataUrl,
        x,
        y,
        width: DEFAULT_IMAGE.width,
        height: DEFAULT_IMAGE.height,
        zIndex: draftElements.value.length,
        fontPresetId: null,
        color: null,
        contentEn: null,
        contentJa: null,
        onClickAction: null,
        onClickConfig: null,
        formConfig: null
      }
      draftElements.value = [...draftElements.value, el]
      select(el.id)
      scrollToElementIfOffscreen(el)
    }

    // "Add Button" — nambah elemen tombol interaktif ke DRAFT
    function addButton() {
      const firstPresetId = useFontPresetsStore().draftPresets[0]?.id ?? null
      const { x, y } = getNextSpawnPosition('button', 140, 42)

      const el: CanvasElement = {
        id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
        type: 'button',
        content: 'Tombol',
        x,
        y,
        width: 140,
        height: 42,
        zIndex: draftElements.value.length,
        fontPresetId: firstPresetId,
        color: '#ffffff',
        contentEn: null,
        contentJa: null,
        onClickAction: 'url',
        onClickConfig: {
          url: '',
          bgColor: '#10b981',
          textColor: '#ffffff',
          borderRadius: 8
        },
        formConfig: null
      }
      draftElements.value = [...draftElements.value, el]
      select(el.id)
      scrollToElementIfOffscreen(el)
    }

    // "Add Form Input" — nambah field input form dinamis langsung ke halaman
    function addFormInput(fieldType: FormFieldType = 'text') {
      const firstPresetId = useFontPresetsStore().draftPresets[0]?.id ?? null
      const defaultFields: Record<FormFieldType, { label: string; placeholder: string; name: string; width: number; height: number }> = {
        text: { label: 'Nama Lengkap', placeholder: 'Masukkan nama...', name: 'name', width: 342, height: 68 },
        email: { label: 'Email', placeholder: 'nama@example.com', name: 'email', width: 342, height: 68 },
        password: { label: 'Password', placeholder: '••••••••', name: 'password', width: 342, height: 68 },
        number: { label: 'Jumlah / Usia', placeholder: '0', name: 'number', width: 342, height: 68 },
        tel: { label: 'No. WhatsApp / HP', placeholder: '08xxxxxxxxxx', name: 'phone', width: 342, height: 68 },
        textarea: { label: 'Pesan / Catatan', placeholder: 'Tuliskan pesan Anda di sini...', name: 'message', width: 342, height: 104 },
        select: { label: 'Pilihan Kategori', placeholder: 'Pilih salah satu...', name: 'category', width: 342, height: 68 },
        checkbox: { label: 'Saya menyetujui syarat & ketentuan', placeholder: '', name: 'terms', width: 342, height: 42 },
        radio: { label: 'Pilihan Opsi A', placeholder: '', name: 'option_choice', width: 342, height: 42 },
        submit: { label: 'Kirim Formulir', placeholder: '', name: 'submit_btn', width: 220, height: 46 }
      }

      const def = defaultFields[fieldType] || defaultFields.text
      const { x, y } = getNextSpawnPosition('form_input', def.width, def.height)

      const formCfg: CanvasFormConfig = {
        fieldType,
        name: `${def.name}_${Math.random().toString(36).slice(2, 6)}`,
        label: def.label,
        placeholder: def.placeholder,
        required: false,
        options: fieldType === 'select' || fieldType === 'radio' ? ['Opsi 1', 'Opsi 2', 'Opsi 3'] : undefined,
        endpoint: fieldType === 'submit' ? '/api/submit' : undefined,
        method: fieldType === 'submit' ? 'POST' : undefined,
        successMessage: fieldType === 'submit' ? 'Formulir berhasil dikirim!' : undefined,
        bgColor: fieldType === 'submit' ? '#10b981' : '#18181b',
        textColor: '#ffffff',
        borderColor: '#3f3f46',
        borderRadius: 8
      }

      const el: CanvasElement = {
        id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
        type: 'form_input',
        content: def.label,
        x,
        y,
        width: def.width,
        height: def.height,
        zIndex: draftElements.value.length,
        fontPresetId: firstPresetId,
        color: '#ffffff',
        contentEn: null,
        contentJa: null,
        translations: {},
        onClickAction: fieldType === 'submit' ? 'submit_form' : null,
        onClickConfig: formCfg as any,
        formConfig: formCfg
      }

      draftElements.value = [...draftElements.value, el]
      select(el.id)
      scrollToElementIfOffscreen(el)
      return el
    }

    // Dipanggil dari CanvasEditor.vue tiap kali admin selesai drag/resize
    // (dragEnd/resizeEnd, BUKAN tiap frame) atau selesai ngedit teks inline.
    function updateElement(id: string, patch: Partial<CanvasElement>) {
      const index = draftElements.value.findIndex(el => el.id === id)
      if (index === -1) return

      draftElements.value = draftElements.value.map((el, i) => {
        if (i !== index) return el
        const updated = { ...el, ...patch }
        if (patch.formConfig) {
          updated.onClickConfig = { ...(updated.onClickConfig || {}), ...patch.formConfig }
        }
        return updated
      })
    }

    function removeElement(id: string) {
      draftElements.value = draftElements.value.filter(el => el.id !== id)
      if (selectedId.value === id) {
        selectedId.value = null
        const globalSelection = useActiveCanvasSelection()
        if (globalSelection.activeSelection.value.elementId === id) {
          globalSelection.clearActive()
        }
      }
    }

    function select(id: string | null) {
      selectedId.value = id
      const globalSelection = useActiveCanvasSelection()
      if (id) {
        globalSelection.setActive(pageKey, id)
      } else if (globalSelection.activeSelection.value.pageKey === pageKey) {
        globalSelection.clearActive()
      }
    }

    // --- Urutan tumpuk (z-index) ---
    // zIndex sebuah elemen = posisinya di array `draftElements` (elemen
    // paling belakang array = paling atas tumpukan, konsisten sama urutan
    // render `v-for` + z-index CSS-nya, lihat elementStyle() di
    // CanvasEditor.vue). Jadi "ubah z-index" di sini cukup PINDAHIN posisi
    // elemennya di array, terus re-number semua zIndex biar 0..n-1 tanpa
    // celah — dipanggil dari tombol "ke depan"/"ke belakang" di toolbar
    // elemen terpilih.
    function reorderAndReindex(fromIndex: number, toIndex: number) {
      if (fromIndex === -1 || fromIndex === toIndex) return

      const list = [...draftElements.value]
      const [moved] = list.splice(fromIndex, 1)
      list.splice(toIndex, 0, moved)

      draftElements.value = list.map((el, i) => ({ ...el, zIndex: i }))
    }

    function bringToFront(id: string) {
      const index = draftElements.value.findIndex(el => el.id === id)
      reorderAndReindex(index, draftElements.value.length - 1)
    }

    function sendToBack(id: string) {
      const index = draftElements.value.findIndex(el => el.id === id)
      reorderAndReindex(index, 0)
    }

    function bringForward(id: string) {
      const index = draftElements.value.findIndex(el => el.id === id)
      if (index === -1) return
      reorderAndReindex(index, Math.min(index + 1, draftElements.value.length - 1))
    }

    function sendBackward(id: string) {
      const index = draftElements.value.findIndex(el => el.id === id)
      if (index === -1) return
      reorderAndReindex(index, Math.max(index - 1, 0))
    }

    // Commit draft -> tersimpan: replace-all lewat RPC `save_canvas_elements`
    // (SECURITY DEFINER, cek is_admin() sendiri — lihat migration
    // 0013_canvas_elements.sql di project `be`). id sementara (tmp-...) gak
    // dikirim sebagai id asli — server generate uuid baru buat elemen baru.
    async function save() {
      if (import.meta.server || !isDirty.value) return

      saving.value = true
      error.value = null

      const supabase = useSupabaseClient()

      try {
        const payload = draftElements.value.map(el => {
          const trans = { ...(el.translations || {}) }
          if (el.contentEn) trans.en = el.contentEn
          if (el.contentJa) trans.ja = el.contentJa

          const mergedConfig = el.formConfig
            ? { ...(el.onClickConfig || {}), ...el.formConfig }
            : (el.onClickConfig ?? null)

          return {
            id: isTempId(el.id) ? null : el.id,
            type: el.type,
            content: el.type === 'form_input' && el.formConfig ? el.formConfig.label : el.content,
            contentEn: el.contentEn,
            contentJa: el.contentJa,
            translations: trans,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            zIndex: el.zIndex,
            fontPresetId: el.fontPresetId,
            color: el.color,
            onClickAction: el.onClickAction,
            onClickConfig: mergedConfig
          }
        })

        const { error: rpcError } = await supabase.rpc('save_canvas_elements', {
          p_page_key: pageKey,
          p_elements: payload
        })

        if (rpcError) throw rpcError

        // Reload dari server biar id sementara ketuker jadi uuid asli.
        await load()
      } catch (e) {
        error.value = e instanceof Error ? e.message : t('admin.canvas.saveError')
        throw e
      } finally {
        saving.value = false
      }
    }

    return {
      pageKey,
      elements,
      draftElements,
      selectedId,
      selectedElement,
      isDirty,
      saving,
      error,
      load,
      resetDraft,
      addText,
      addImage,
      addButton,
      addFormInput,
      updateElement,
      removeElement,
      select,
      bringToFront,
      sendToBack,
      bringForward,
      sendBackward,
      save
    }
  })()
}
