// Shortcut rahasia untuk membuka modal login admin/superadmin: Alt+Shift+A.
// Tidak ada elemen UI yang mengarah ke sini, jadi visitor biasa tidak akan
// tahu shortcut ini ada.
//
// Sengaja TANPA Ctrl/Cmd sama sekali:
// - Ctrl+Shift+<huruf> banyak dipakai browser (mis. Ctrl+Shift+S = screenshot
//   di Firefox, Ctrl+Shift+A = Add-ons manager di Firefox), jadi rawan bentrok.
// - Ctrl+Alt+<huruf> di sebagian keyboard layout Eropa sama persis dengan
//   tombol AltGr (dipakai buat ngetik karakter khusus), jadi juga dihindari.
// Alt+Shift+A jauh lebih aman dari kedua isu itu.
export default defineNuxtPlugin(() => {
  function isTypingTarget(target: EventTarget | null) {
    const el = target as HTMLElement | null
    if (!el) return false
    const tag = el.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
  }

  function handleKeydown(e: KeyboardEvent) {
    const isShortcut = e.code === 'KeyA'
      && e.altKey
      && e.shiftKey
      && !e.ctrlKey
      && !e.metaKey

    // `!e.repeat` supaya gak toggle berkali-kali kalau tombolnya ditahan lama.
    if (isShortcut && !e.repeat && !isTypingTarget(e.target)) {
      e.preventDefault()
      useAdminAuthStore().toggle()
    }
  }

  window.addEventListener('keydown', handleKeydown)
})
