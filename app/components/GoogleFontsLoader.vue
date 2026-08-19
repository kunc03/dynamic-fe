<script setup lang="ts">
// Komponen "invisible" (gak render elemen apa-apa) yang otomatis nge-load
// stylesheet Google Fonts buat setiap font family yang dipakai preset
// tipografi (lihat fontPresets.ts) — supaya nama font yang diketik admin di
// FontPresetsButton.vue (mis. "Poppins") beneran ke-render pakai font itu,
// bukan cuma jadi teks CSS `font-family` yang fallback ke default browser.
//
// Dipasang SEKALI di app.vue (bukan per-komponen) biar fontnya ke-load
// global buat semua halaman & tetep aktif walau admin lagi buka panel
// FontPresetsButton di halaman lain.
const fonts = useFontPresetsStore()

// Nama-nama generik yang BUKAN nama font Google Fonts asli — kalau
// diketik/dibiarkan default, jangan coba fetch ke Google Fonts (cuma
// buang-buang request & pasti 400).
const NOT_A_GOOGLE_FONT = new Set([
  'inherit', 'initial', 'unset', 'sans-serif', 'serif', 'monospace',
  'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'cursive', 'fantasy'
])

// Gabungkan preset TERSIMPAN + DRAFT biar font ke-load baik pas admin lagi
// preview perubahan (belum di-Save) maupun di tampilan publik (view-only,
// cuma baca `presets`). Cukup ambil nama family yang UNIK.
const families = computed(() => {
  const all = [...fonts.presets, ...fonts.draftPresets]
  const unique = new Set(
    all
      .map(p => p.fontFamily.trim())
      .filter(name => name && !NOT_A_GOOGLE_FONT.has(name.toLowerCase()))
  )
  return Array.from(unique)
})

function toGoogleFontsHref(family: string) {
  // Google Fonts pakai "+" buat spasi di nama family (mis. "Playfair Display"
  // -> "Playfair+Display"). wght@400;500;600;700 nge-cover semua opsi weight
  // yang ada di FontPresetsButton.vue sekaligus.
  const encoded = encodeURIComponent(family).replace(/%20/g, '+')
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`
}

// SATU <link rel=stylesheet> PER family (bukan digabung jadi satu request) —
// sengaja, biar kalau admin ketik nama yang BUKAN font Google Fonts asli
// (typo, atau font system biasa), request itu gagal sendirian tanpa bikin
// font-font lain yang valid ikut gagal ke-load.
useHead(() => ({
  link: [
    ...(families.value.length > 0
      ? [
          { rel: 'preconnect', href: 'https://fonts.googleapis.com', key: 'google-fonts-preconnect-1' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '', key: 'google-fonts-preconnect-2' }
        ]
      : []),
    ...families.value.map(name => ({
      rel: 'stylesheet',
      href: toGoogleFontsHref(name),
      key: `google-font-${name}`
    }))
  ]
}))
</script>

<template />
