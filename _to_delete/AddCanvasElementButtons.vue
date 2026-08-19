<script setup lang="ts">
// Tool kedua di edit mode (lanjutan cluster ikon kiri, setelah
// OuterBackgroundButton — lihat app.vue): SATU tombol "+" yang begitu
// diklik, muncul dua pilihan (Tambah teks / Tambah gambar) di bawahnya —
// biar cluster ikon kiri gak penuh sama tombol yang jarang dipakai
// bareng-bareng. Nambah elemen ke canvas halaman yang lagi dibuka (lihat
// CanvasEditor.vue & canvasElements.ts). Elemen baru langsung muncul di
// draft (live preview, posisi default di kiri-atas), admin tinggal geser/
// resize/edit isinya, terus klik Save (SaveEditsButton.vue) buat kesimpan.
const adminAuth = useAdminAuthStore()
const canvas = useCanvasElementsStore()

const isMenuOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function onAddText() {
  canvas.addText()
  isMenuOpen.value = false
}

function triggerImagePicker() {
  fileInputRef.value?.click()
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  isMenuOpen.value = false

  if (!file || !file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = () => {
    canvas.addImage(reader.result as string)
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <template v-if="adminAuth.isAuthenticated && adminAuth.isEditMode">
    <UButton
      :icon="isMenuOpen ? 'i-lucide-x' : 'i-lucide-plus'"
      color="neutral"
      variant="solid"
      size="lg"
      square
      class="add-canvas-el fixed top-36 left-4 z-40 shadow-lg"
      aria-label="Tambah elemen"
      @click="toggleMenu"
    />

    <template v-if="isMenuOpen">
      <UButton
        icon="i-lucide-type"
        color="neutral"
        variant="solid"
        size="lg"
        square
        class="add-canvas-el fixed top-52 left-4 z-40 shadow-lg"
        aria-label="Tambah teks"
        @click="onAddText"
      />

      <UButton
        icon="i-lucide-image-plus"
        color="neutral"
        variant="solid"
        size="lg"
        square
        class="add-canvas-el fixed top-68 left-4 z-40 shadow-lg"
        aria-label="Tambah gambar"
        @click="triggerImagePicker"
      />
    </template>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onImageChange"
    >
  </template>
</template>

<style scoped>
/* Sama kayak tool cluster kiri lainnya — di bawah ~480px gak ada ruang
   putih tanpa nutupin konten. */
@media (max-width: 480px) {
  .add-canvas-el {
    display: none;
  }
}
</style>
