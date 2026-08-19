<script setup lang="ts">
// Panel navigasi & manajemen daftar halaman — cluster KANAN (beda dari
// cluster KIRI EditModeToggle/OuterBackgroundButton/SectionVisibilityButton/
// FontPresetsButton yang isinya setting tampilan GLOBAL buat semua
// halaman, lihat app.vue). Isinya dua bagian:
//
//   1. Daftar semua halaman — "Beranda" (root "/", bawaan aplikasi) +
//      halaman tambahan dari tabel `pages` (lihat stores/pages.ts). Klik
//      salah satu langsung navigateTo() ke halaman itu; admin bisa
//      LANGSUNG ngedit kontennya di sana lewat CanvasEditor.vue masing-
//      masing halaman — edit mode (adminAuth.isEditMode) global, gak
//      ke-reset pas pindah halaman, jadi alurnya: buka panel → klik
//      halaman → langsung keliatan kotak putus-putus buat nambah/geser
//      elemen di halaman itu.
//   2. Form tambah halaman baru (judul + slug) — slug OTOMATIS ngikutin
//      judul (bisa diedit manual, lihat slugify()/slugTouched di bawah),
//      dipakai jadi path (/<slug>) SEKALIGUS page_key canvas_elements
//      halaman itu. Klik "Tambah halaman" LANGSUNG kesimpan ke database
//      (lihat alasannya di stores/pages.ts addPage()), lalu admin
//      otomatis dipindah ke halaman barunya buat mulai ngisi konten.
const adminAuth = useAdminAuthStore()
const pagesStore = usePagesStore()
const route = useRoute()
const { t } = useI18n()

const isPanelOpen = ref(false)

// "Beranda"/"Home" bukan baris database — selalu ada, ditaruh manual di
// awal daftar (lihat penjelasan di stores/pages.ts kenapa 'home' gak
// disimpan di tabel `pages`). Judulnya lewat t() (computed, bukan const)
// biar ikut ganti pas admin ganti bahasa lewat LanguageSwitcher.vue.
const pageEntries = computed(() => [
  { slug: 'home', title: t('admin.pages.home'), path: '/' },
  ...pagesStore.pages.map(p => ({ slug: p.slug, title: p.title, path: `/${p.slug}` }))
])

function isActivePage(path: string) {
  return route.path === path
}

function goToPage(path: string) {
  isPanelOpen.value = false
  if (route.path !== path) navigateTo(path)
}

// Daftar halaman baru di-load pas panel PERTAMA KALI dibuka (bukan pas
// komponen mount) — panel ini nempel di SETIAP halaman (dipasang global
// di app.vue), jadi kalau load() dipanggil dari onMounted, tiap kali
// pindah halaman bakal fetch ulang biarpun panelnya gak pernah dibuka.
watch(isPanelOpen, (open) => {
  if (open && pagesStore.pages.length === 0) pagesStore.load()
})

// --- Form tambah halaman ---
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

// Slug ngikutin judul OTOMATIS selama field slug belum disentuh manual
// (slugTouched) — begitu admin ngetik langsung di field slug, kontrol
// penuh pindah ke admin (mis. mau bikin slug lebih pendek dari judulnya),
// gak ketimpa lagi tiap judul berubah.
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
    isPanelOpen.value = false
    await navigateTo(`/${created.slug}`)
  } catch {
    // Error sudah ke-capture di pagesStore.error & ditampilin di bawah
    // form — form-nya SENGAJA gak di-reset di sini biar admin gak perlu
    // ngetik ulang judul/slug abis gagal (mis. slug bentrok).
  }
}
</script>

<template>
  <UPopover
    v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
    v-model:open="isPanelOpen"
    :content="{ side: 'left', align: 'start' }"
  >
    <div class="pages-panel-trigger fixed top-20 right-4 z-40 flex w-16 flex-col items-center gap-1">
      <UButton
        icon="i-lucide-files"
        color="neutral"
        variant="solid"
        size="lg"
        square
        class="size-11 shrink-0 justify-center shadow-lg cursor-pointer"
        :aria-label="t('admin.pages.aria')"
      />
      <span class="block w-full select-none text-center text-[10px] font-medium leading-tight text-gray-700">
        {{ t('admin.pages.label') }}
      </span>
    </div>

    <template #content>
      <div class="w-72 space-y-3 p-3">
        <p class="text-sm font-medium">
          {{ t('admin.pages.panelTitle') }}
        </p>

        <ul class="max-h-56 space-y-1 overflow-y-auto pr-1">
          <li v-for="entry in pageEntries" :key="entry.path">
            <button
              type="button"
              class="w-full cursor-pointer rounded px-2 py-1.5 text-left text-sm transition-colors"
              :class="isActivePage(entry.path) ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-elevated'"
              @click="goToPage(entry.path)"
            >
              {{ entry.title }}
              <span class="text-muted"> — {{ entry.path }}</span>
            </button>
          </li>
        </ul>

        <hr class="border-default">

        <p class="text-xs font-medium text-muted">
          {{ t('admin.pages.addNew') }}
        </p>

        <UInput
          v-model="newTitle"
          :placeholder="t('admin.pages.titlePlaceholder')"
          size="sm"
        />
        <UInput
          :model-value="newSlug"
          :placeholder="t('admin.pages.slugPlaceholder')"
          size="sm"
          @update:model-value="(v) => onSlugInput(String(v))"
        />
        <p class="text-xs text-muted">
          {{ t('admin.pages.openAt') }} <code>/{{ newSlug || t('admin.pages.slugPlaceholder') }}</code>
        </p>

        <UButton
          :label="t('admin.pages.submit')"
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          block
          class="cursor-pointer"
          :loading="pagesStore.saving"
          :disabled="!canSubmit"
          @click="onAddPage"
        />

        <p v-if="pagesStore.error" class="text-xs text-error">
          {{ pagesStore.error }}
        </p>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
@media (max-width: 480px) {
  .pages-panel-trigger {
    display: none;
  }
}
</style>
