<script setup lang="ts">
// Komponen "invisible" (gak render elemen apa-apa, sama pola kayak
// GoogleFontsLoader.vue) — tugasnya cuma nge-set CSS var `--app-scale` ke
// <html>, dipakai `.app-shell` (main.css) buat nge-scale SELURUH app biar
// pas persis ngisi lebar layar device asli, TANPA ngubah proporsi desain
// internal yang seluruh koordinatnya (posisi elemen canvas, tinggi
// header/footer, dst) dirancang tetap di lebar 390px
// (--app-mobile-width) — lihat penjelasan lengkap kenapa ini perlu di
// main.css.
//
// Dipasang SEKALI di app.vue (bukan per-halaman) biar tetap aktif & ke-
// update di semua halaman/kondisi (buka modal, pindah halaman, dst).
const DESIGN_WIDTH_PX = 390
// Breakpoint yang sama dipakai di tempat lain (mis. OuterBackgroundButton.vue)
// buat nentuin "ini HP asli, bukan browser desktop/tablet".
const MOBILE_BREAKPOINT_PX = 480

// Scale CUMA aktif kalau device-nya BENERAN layar sentuh primer (HP asli) —
// dicek lewat media feature `pointer`/`hover`, BUKAN cuma lebar viewport.
// Kenapa: kalau cuma ngecek lebar (<=480px), developer yang lagi nge-TES
// tampilan mobile dengan cara nyempitin JENDELA BROWSER DESKTOP (bukan pake
// device emulator/HP asli) ikut kena scale — window mouse-driven yang
// disempitin ke ~400-480px lalu di-scale sampe MENUHIN lebar segitu bikin
// tiap elemen kelihatan gede/"gemuk" di monitor desktop (yang kerapatan
// pixel-nya jauh lebih rendah dari HP asli), padahal di HP BENERAN hasilnya
// bakal kelihatan normal/pas (kerapatan pixel HP jauh lebih tinggi, elemen
// yang sama SECARA FISIK jadi kecil & proporsional). `pointer: coarse` +
// `hover: none` = layar sentuh tanpa mouse (ciri khas HP asli) — window
// desktop yang disempitin pakai mouse selalu `pointer: fine` + `hover:
// hover`, jadi otomatis GAK kena scale, balik ke tampilan frame 390px +
// center + letterbox yang biasa dipakai buat preview di desktop.
function isTouchPrimaryDevice() {
  if (import.meta.server) return false
  return window.matchMedia('(pointer: coarse) and (hover: none)').matches
}

// `useState` (bukan cuma variabel lokal) — biar nilai scale yang SAMA bisa
// dibaca komponen LAIN juga, khususnya CanvasEditor.vue yang perlu ngasih
// tau vue3-moveable lewat prop `zoom` kalau target-nya lagi ada di dalam
// container yang di-CSS-scale (lihat main.css/.app-shell) — tanpa itu,
// drag/resize elemen bakal kerasa "gak nyambung" sama gerakan
// cursor/jari pas discale (mis. gerak dikit tapi elemennya lompat jauh,
// atau sebaliknya) begitu admin buka edit mode di HP dengan lebar != 390px.
const appScale = useState('appScale', () => 1)

function updateAppScale() {
  if (import.meta.server) return

  // Cuma discale kalau DUA-DUANYA kepenuhin: (1) lebar viewport <=480px,
  // (2) beneran layar sentuh primer (bukan cuma jendela desktop yang
  // disempitin). Kalau salah satu enggak, paksa 1 (gak discale).
  const scale = (window.innerWidth <= MOBILE_BREAKPOINT_PX && isTouchPrimaryDevice())
    ? window.innerWidth / DESIGN_WIDTH_PX
    : 1

  appScale.value = scale
  document.documentElement.style.setProperty('--app-scale', String(scale))
}

onMounted(() => {
  updateAppScale()
  window.addEventListener('resize', updateAppScale)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateAppScale)
})
</script>

<template />
