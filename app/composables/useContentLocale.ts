// State reaktif untuk bahasa tampilan KONTEN canvas (terpisah dari bahasa UI admin edit mode).
// Dipakai agar saat pengunjung/user mengubah bahasa di dalam konten (OnClick Translate),
// hanya teks konten canvas yang berubah tanpa mengubah bahasa UI admin/tombol edit di luar konten.
export function useContentLocale() {
  const contentLocale = useState<string>('app_content_locale', () => 'id')

  function setContentLocale(locale: string) {
    contentLocale.value = locale ? locale.toLowerCase() : 'id'
  }

  return {
    contentLocale,
    setContentLocale
  }
}
