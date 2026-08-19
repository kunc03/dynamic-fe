<script setup lang="ts">
import { HEADER_PAGE_KEY, FOOTER_PAGE_KEY } from '../stores/canvasElements'

// Tombol commit tunggal buat SEMUA perubahan admin yang masih berupa draft:
// background content (backgroundSettings.ts), elemen teks/gambar canvas
// content HALAMAN + HEADER + FOOTER (canvasElements.ts, tiga instance store
// beda pageKey), preset font (fontPresets.ts), DAN visibilitas/background/
// tinggi header/footer (sectionVisibility.ts). Sengaja SATU tombol (bukan
// satu-satu per fitur) biar admin gak bingung harus save di berapa tempat —
// klik sekali, semua draft yang lagi "kotor" ke-commit bareng. Posisi kanan
// atas, terpisah dari cluster ikon tool di kiri, supaya jelas ini aksi
// "simpan", bukan sekadar buka panel/nambah elemen. Grup tombol (Batalkan +
// Simpan) cuma tampil kalau ADA salah satu draft yang belum disimpan.
//
// PENTING — pageKey content DULU hardcode 'home' (situsnya cuma satu
// halaman). Sekarang multi-page sudah ada (lihat PagesPanel.vue/
// stores/pages.ts/app/pages/[slug].vue), jadi WAJIB baca pageKey dari
// route yang lagi aktif — kalau tetap hardcode 'home', klik Save pas
// admin lagi ngedit halaman LAIN (mis. /promo) gak bakal nyimpen apa-apa
// (draft-nya nyangkut di store canvasElements:promo yang gak pernah
// disentuh tombol ini), keliatan kayak "Save berhasil" padahal kontennya
// ilang pas reload. `content` di bawah jadi computed (bukan store
// singular langsung) supaya store instance-nya ikut ganti tiap pindah
// halaman.
//
// Dulu namanya SaveContentBackgroundButton.vue & cuma nyimpen background —
// di-generalize di sini pas fitur canvas (teks/gambar posisi-bebas), preset
// font, & header/footer ditambahkan, biar gak ada tombol Save
// terpisah-pisah per fitur. File lama dipindah ke _to_delete/ (lihat
// catatan project).
const adminAuth = useAdminAuthStore()
const bg = useBackgroundStore()
const route = useRoute()
const currentPageKey = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : 'home'
})
const content = computed(() => useCanvasElementsStore(currentPageKey.value))
const header = useCanvasElementsStore(HEADER_PAGE_KEY)
const footer = useCanvasElementsStore(FOOTER_PAGE_KEY)
const fonts = useFontPresetsStore()
const sections = useSectionVisibilityStore()
const toast = useToast()
const { t } = useI18n()

const isDirty = computed(() =>
  bg.isDirty || content.value.isDirty || header.isDirty || footer.isDirty || fonts.isDirty || sections.isDirty
)
const saving = computed(() =>
  bg.saving || content.value.saving || header.saving || footer.saving || fonts.saving || sections.saving
)

async function onSaveClick() {
  try {
    // Jalan paralel — semua fitur independen, gak saling bergantung. Preset
    // font di-save duluan gak masalah walau canvas ngerefer ke id-nya, sebab
    // id preset gak berubah pas di-save (cuma isinya), jadi urutan gak
    // penting di sini.
    await Promise.all([
      bg.isDirty ? bg.save() : Promise.resolve(),
      content.value.isDirty ? content.value.save() : Promise.resolve(),
      header.isDirty ? header.save() : Promise.resolve(),
      footer.isDirty ? footer.save() : Promise.resolve(),
      fonts.isDirty ? fonts.save() : Promise.resolve(),
      sections.isDirty ? sections.save() : Promise.resolve()
    ])
    toast.add({
      title: t('admin.save.savedTitle'),
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({
      title: t('admin.save.saveFailedTitle'),
      description: bg.error ?? content.value.error ?? header.error ?? footer.error ?? fonts.error ?? sections.error ?? undefined,
      color: 'error',
      icon: 'i-lucide-alert-triangle'
    })
  }
}

// Batalkan/discard — balikin SEMUA draft ke state TERSIMPAN terakhir
// (masing-masing store udah punya resetDraft() sendiri buat ini, dipanggil
// juga dari load() pas pertama kali app jalan). Gak butuh panggil server
// sama sekali karena draft emang belum pernah kekirim — murni "lupakan
// yang di layar, balik ke yang sebelumnya kesimpan".
//
// Pakai confirm() native browser sebagai jaring pengaman — sekali klik gak
// sengaja bisa buang banyak perubahan sekaligus (background + canvas + font
// + header/footer), beda dari kesalahan kecil yang gampang diulang.
function onDiscardClick() {
  const confirmed = window.confirm(t('admin.save.confirmDiscard'))
  if (!confirmed) return

  bg.resetDraft()
  content.value.resetDraft()
  header.resetDraft()
  footer.resetDraft()
  fonts.resetDraft()
  sections.resetDraft()

  toast.add({
    title: t('admin.save.discardedTitle'),
    icon: 'i-lucide-undo-2',
    color: 'neutral'
  })
}
</script>

<template>
  <div
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode && isDirty"
    class="save-edits-group fixed top-4 right-4 z-50 flex items-center gap-2"
  >
    <UButton
      :label="t('admin.save.discard')"
      icon="i-lucide-x"
      color="neutral"
      variant="outline"
      size="lg"
      :disabled="saving"
      class="bg-default shadow-lg cursor-pointer"
      :aria-label="t('admin.save.discardAria')"
      @click="onDiscardClick"
    />
    <UButton
      :label="t('admin.save.save')"
      icon="i-lucide-check"
      color="primary"
      variant="solid"
      size="lg"
      :loading="saving"
      class="shadow-lg cursor-pointer"
      :aria-label="t('admin.save.saveAria')"
      @click="onSaveClick"
    />
  </div>
</template>

<style scoped>
@media (max-width: 480px) {
  .save-edits-group {
    display: none;
  }
}
</style>
