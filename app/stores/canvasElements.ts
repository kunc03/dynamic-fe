import { defineStore } from 'pinia'

export type CanvasElementType = 'text' | 'image'

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
  // Gak relevan buat type='image'.
  contentEn: string | null
  contentJa: string | null
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
        .select('id, type, content, content_en, content_ja, pos_x, pos_y, width, height, z_index, color, font_preset_id')
        .eq('page_key', pageKey)
        .order('z_index', { ascending: true })

      if (!fetchError && data) {
        elements.value = data.map(row => ({
          id: row.id,
          type: row.type === 'image' ? 'image' : 'text',
          content: row.content ?? '',
          contentEn: row.content_en ?? null,
          contentJa: row.content_ja ?? null,
          x: Number(row.pos_x),
          y: Number(row.pos_y),
          width: Number(row.width),
          height: Number(row.height),
          zIndex: row.z_index ?? 0,
          fontPresetId: row.font_preset_id ?? null,
          color: row.color ?? null
        }))
      }
      // Kalau fetch gagal (mis. offline) — biarin `elements` apa adanya
      // (kosong di load pertama), canvas cuma gak nampilin apa-apa, gak
      // nge-blank-in seluruh app.

      resetDraft()
    }

    // "Add Text" — nambah elemen teks baru ke DRAFT (langsung kelihatan di
    // canvas), posisi default di kiri-atas biar gampang ketemu & digeser.
    // Default fontPresetId ke preset PERTAMA kalau ada (biar teks baru
    // otomatis ikut preset yang udah didefinisikan admin, gak usah pilih
    // manual tiap kali) — lihat fontPresets.ts.
    function addText() {
      const firstPresetId = useFontPresetsStore().draftPresets[0]?.id ?? null

      const el: CanvasElement = {
        id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
        type: 'text',
        content: 'Teks baru',
        x: 24,
        y: 24,
        width: DEFAULT_TEXT.width,
        height: DEFAULT_TEXT.height,
        zIndex: draftElements.value.length,
        fontPresetId: firstPresetId,
        color: DEFAULT_TEXT.color,
        contentEn: null,
        contentJa: null
      }
      draftElements.value = [...draftElements.value, el]
      selectedId.value = el.id
    }

    // "Add Image" — sama kayak addText, isinya data URL hasil upload.
    function addImage(dataUrl: string) {
      const el: CanvasElement = {
        id: `tmp-${Math.random().toString(36).slice(2, 10)}`,
        type: 'image',
        content: dataUrl,
        x: 24,
        y: 24,
        width: DEFAULT_IMAGE.width,
        height: DEFAULT_IMAGE.height,
        zIndex: draftElements.value.length,
        fontPresetId: null,
        color: null,
        contentEn: null,
        contentJa: null
      }
      draftElements.value = [...draftElements.value, el]
      selectedId.value = el.id
    }

    // Dipanggil dari CanvasEditor.vue tiap kali admin selesai drag/resize
    // (dragEnd/resizeEnd, BUKAN tiap frame) atau selesai ngedit teks inline.
    function updateElement(id: string, patch: Partial<CanvasElement>) {
      const index = draftElements.value.findIndex(el => el.id === id)
      if (index === -1) return

      draftElements.value = draftElements.value.map((el, i) =>
        i === index ? { ...el, ...patch } : el
      )
    }

    function removeElement(id: string) {
      draftElements.value = draftElements.value.filter(el => el.id !== id)
      if (selectedId.value === id) selectedId.value = null
    }

    function select(id: string | null) {
      selectedId.value = id
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
        const payload = draftElements.value.map(el => ({
          id: isTempId(el.id) ? null : el.id,
          type: el.type,
          content: el.content,
          contentEn: el.contentEn,
          contentJa: el.contentJa,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          zIndex: el.zIndex,
          fontPresetId: el.fontPresetId,
          color: el.color
        }))

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
