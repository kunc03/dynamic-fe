<script setup lang="ts">
// Halaman 'home' (root "/") — sekarang juga tempat CanvasEditor (elemen
// teks/gambar posisi-bebas yang bisa ditambah/digeser/di-resize admin,
// lihat CanvasEditor.vue & canvasElements.ts). Background gelap tetap dari
// app-shell/main.css.
//
// Beda dari halaman TAMBAHAN (lihat app/pages/[slug].vue, dibuat admin
// lewat PagesPanel.vue) — 'home' selalu ada & gak perlu dicek ke tabel
// `pages` dulu (lihat stores/pages.ts), karena dia bagian bawaan aplikasi,
// bukan baris di database.
//
// Rumus `contentMinHeight` (kenapa dibagi --app-scale, kenapa dikurangi
// tinggi header/footer, kenapa angka eksplisit bukan flex) dijelaskan
// lengkap di useContentMinHeight.ts — diekstrak ke sana supaya halaman
// tambahan ([slug].vue) bisa pakai rumus yang SAMA persis tanpa dobel-tulis.
const contentMinHeight = useContentMinHeight()
</script>

<template>
  <div class="relative" :style="{ minHeight: contentMinHeight }">
    <CanvasEditor page-key="home" />
  </div>
</template>
