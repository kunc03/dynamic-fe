// Konfigurasi vue-i18n buat @nuxtjs/i18n (lihat modules di nuxt.config.ts).
// Semua string UI panel admin (EditModeToggle, OuterBackgroundButton,
// SectionVisibilityButton, FontPresetsButton, PagesPanel, SaveEditsButton,
// CanvasEditor, AdminLoginModal) DAN teks fallback publik ("halaman tidak
// ditemukan") ditaruh di sini, bukan hardcode string Indonesia langsung di
// tiap komponen — 3 bahasa: id (default/bawaan), en, ja.
//
// Beda dari terjemahan KONTEN canvas (teks/gambar yang admin isi lewat
// CanvasEditor, lihat contentEn/contentJa di canvasElements.ts) — itu
// per-ELEMEN & disimpan di database, BUKAN di sini. File ini CUMA buat
// label/tombol/placeholder tetap di seluruh aplikasi (UI "chrome"-nya),
// bukan konten yang admin isi sendiri.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'id',
  messages: {
    id: {
      admin: {
        editMode: {
          edit: 'Edit',
          close: 'Tutup',
          openAria: 'Buka edit mode',
          closeAria: 'Tutup edit mode'
        },
        background: {
          label: 'Background',
          aria: 'Ubah background content',
          panelTitle: 'Background content',
          colorLabel: 'Warna',
          orUpload: 'Atau upload gambar',
          pickImage: 'Pilih gambar',
          resetDefault: 'Reset ke default',
          dirtyNotice: 'Ada perubahan yang belum disimpan — klik tombol Save di kanan atas.'
        },
        sections: {
          label: 'Header/Footer',
          aria: 'Kelola header & footer',
          panelTitle: 'Header & footer',
          showHeader: 'Tampilkan header',
          showFooter: 'Tampilkan footer',
          heightHeader: 'Tinggi header (px)',
          heightFooter: 'Tinggi footer (px)',
          allowOverflow: 'Boleh meluber keluar kotak',
          bgHeader: 'Background header',
          bgFooter: 'Background footer',
          colorHeaderAria: 'Warna background header',
          colorFooterAria: 'Warna background footer',
          uploadHeaderAria: 'Upload gambar background header',
          uploadFooterAria: 'Upload gambar background footer',
          uploadTitle: 'Upload gambar',
          resetHeaderAria: 'Reset background header ke transparan',
          resetFooterAria: 'Reset background footer ke transparan',
          resetTitle: 'Reset ke transparan',
          note: 'Isi header/footer (text/gambar) diedit langsung di canvas-nya masing-masing — cari kotak putus-putus di bagian atas/bawah halaman. Semua pengaturan di sini cuma buat KOTAK section-nya sendiri; admin yang lagi edit mode tetap bisa lihat & edit isinya walau lagi disembunyikan dari pengunjung.',
          dirtyNotice: 'Ada perubahan belum disimpan — klik Save di kanan atas.'
        },
        fonts: {
          label: 'Font',
          aria: 'Kelola preset font',
          panelTitle: 'Preset font',
          add: 'Tambah',
          emptyState: 'Belum ada preset. Klik "Tambah" buat bikin preset pertama (mis. "Primary"), nanti bisa dipilih pas ngedit elemen teks di canvas.',
          namePlaceholder: 'Nama preset',
          deleteAria: 'Hapus preset',
          manualFontPlaceholder: 'Nama font persis (fonts.google.com)',
          pickGoogleFont: 'Pilih Google Font…',
          pickFromListAria: 'Pilih dari daftar populer',
          typeManualAria: 'Ketik nama font manual',
          sizePlaceholder: 'Ukuran (px)',
          weightNormal: 'Normal (400)',
          weightMedium: 'Medium (500)',
          weightSemibold: 'Semibold (600)',
          weightBold: 'Bold (700)',
          colorTitle: 'Warna teks — {color}',
          colorAria: 'Warna teks preset {name}',
          dirtyNotice: 'Ada perubahan belum disimpan — klik Save di kanan atas.'
        },
        pages: {
          label: 'Halaman',
          aria: 'Kelola halaman',
          panelTitle: 'Halaman',
          home: 'Beranda',
          addNew: 'Tambah halaman baru',
          titlePlaceholder: 'Judul halaman (mis. Promo Lebaran)',
          slugPlaceholder: 'slug-url',
          openAt: 'Bisa dibuka di',
          submit: 'Tambah halaman',
          genericError: 'Gagal menambah halaman — slug mungkin sudah dipakai.'
        },
        save: {
          discard: 'Batalkan',
          discardAria: 'Batalkan semua perubahan yang belum disimpan',
          save: 'Simpan',
          saveAria: 'Simpan semua perubahan',
          confirmDiscard: 'Batalkan semua perubahan yang belum disimpan? Perubahan yang sudah di-Save sebelumnya gak akan hilang.',
          savedTitle: 'Perubahan tersimpan',
          saveFailedTitle: 'Gagal menyimpan sebagian/semua perubahan',
          discardedTitle: 'Perubahan dibatalkan'
        },
        canvas: {
          addElement: 'Tambah elemen',
          closeAddMenu: 'Tutup menu tambah elemen',
          addText: 'Tambah teks',
          addImage: 'Tambah gambar',
          bringToFront: 'Bawa ke paling depan',
          sendToBack: 'Bawa ke paling belakang',
          deleteElement: 'Hapus elemen',
          noPreset: 'Tanpa preset',
          fontPlaceholder: 'Font',
          translateAria: 'Terjemahan teks ini',
          translateEnglish: 'English (Inggris)',
          translateJapanese: '日本語 (Jepang)',
          translatePlaceholderEn: 'Versi bahasa Inggris (opsional)',
          translatePlaceholderJa: 'Versi bahasa Jepang (opsional)',
          saveError: 'Gagal menyimpan elemen canvas.'
        },
        login: {
          title: 'Admin Access',
          description: 'Khusus untuk admin & superadmin',
          email: 'Email',
          password: 'Password',
          submit: 'Masuk',
          emailInvalid: 'Email tidak valid',
          passwordMin: 'Password minimal 6 karakter'
        }
      },
      page: {
        notFound: 'Halaman tidak ditemukan.'
      }
    },
    en: {
      admin: {
        editMode: {
          edit: 'Edit',
          close: 'Close',
          openAria: 'Open edit mode',
          closeAria: 'Close edit mode'
        },
        background: {
          label: 'Background',
          aria: 'Change content background',
          panelTitle: 'Content background',
          colorLabel: 'Color',
          orUpload: 'Or upload an image',
          pickImage: 'Choose image',
          resetDefault: 'Reset to default',
          dirtyNotice: 'You have unsaved changes — click Save in the top right.'
        },
        sections: {
          label: 'Header/Footer',
          aria: 'Manage header & footer',
          panelTitle: 'Header & footer',
          showHeader: 'Show header',
          showFooter: 'Show footer',
          heightHeader: 'Header height (px)',
          heightFooter: 'Footer height (px)',
          allowOverflow: 'Allow overflowing the box',
          bgHeader: 'Header background',
          bgFooter: 'Footer background',
          colorHeaderAria: 'Header background color',
          colorFooterAria: 'Footer background color',
          uploadHeaderAria: 'Upload header background image',
          uploadFooterAria: 'Upload footer background image',
          uploadTitle: 'Upload image',
          resetHeaderAria: 'Reset header background to transparent',
          resetFooterAria: 'Reset footer background to transparent',
          resetTitle: 'Reset to transparent',
          note: 'Header/footer content (text/images) is edited directly on its own canvas — look for the dashed box at the top/bottom of the page. Everything here only controls the section\'s BOX itself; while in edit mode you can still see & edit its content even when it\'s hidden from visitors.',
          dirtyNotice: 'You have unsaved changes — click Save in the top right.'
        },
        fonts: {
          label: 'Font',
          aria: 'Manage font presets',
          panelTitle: 'Font presets',
          add: 'Add',
          emptyState: 'No presets yet. Click "Add" to create your first preset (e.g. "Primary"), then pick it while editing a text element on the canvas.',
          namePlaceholder: 'Preset name',
          deleteAria: 'Delete preset',
          manualFontPlaceholder: 'Exact font name (fonts.google.com)',
          pickGoogleFont: 'Choose a Google Font…',
          pickFromListAria: 'Choose from popular list',
          typeManualAria: 'Type a font name manually',
          sizePlaceholder: 'Size (px)',
          weightNormal: 'Normal (400)',
          weightMedium: 'Medium (500)',
          weightSemibold: 'Semibold (600)',
          weightBold: 'Bold (700)',
          colorTitle: 'Text color — {color}',
          colorAria: 'Text color for preset {name}',
          dirtyNotice: 'You have unsaved changes — click Save in the top right.'
        },
        pages: {
          label: 'Pages',
          aria: 'Manage pages',
          panelTitle: 'Pages',
          home: 'Home',
          addNew: 'Add a new page',
          titlePlaceholder: 'Page title (e.g. Eid Promo)',
          slugPlaceholder: 'url-slug',
          openAt: 'Will be available at',
          submit: 'Add page',
          genericError: 'Failed to add page — the slug may already be in use.'
        },
        save: {
          discard: 'Discard',
          discardAria: 'Discard all unsaved changes',
          save: 'Save',
          saveAria: 'Save all changes',
          confirmDiscard: 'Discard all unsaved changes? Changes you already saved will not be lost.',
          savedTitle: 'Changes saved',
          saveFailedTitle: 'Failed to save some or all changes',
          discardedTitle: 'Changes discarded'
        },
        canvas: {
          addElement: 'Add element',
          closeAddMenu: 'Close add-element menu',
          addText: 'Add text',
          addImage: 'Add image',
          bringToFront: 'Bring to front',
          sendToBack: 'Send to back',
          deleteElement: 'Delete element',
          noPreset: 'No preset',
          fontPlaceholder: 'Font',
          translateAria: 'Translate this text',
          translateEnglish: 'English',
          translateJapanese: '日本語 (Japanese)',
          translatePlaceholderEn: 'English version (optional)',
          translatePlaceholderJa: 'Japanese version (optional)',
          saveError: 'Failed to save canvas elements.'
        },
        login: {
          title: 'Admin Access',
          description: 'For admins & superadmins only',
          email: 'Email',
          password: 'Password',
          submit: 'Sign in',
          emailInvalid: 'Invalid email',
          passwordMin: 'Password must be at least 6 characters'
        }
      },
      page: {
        notFound: 'Page not found.'
      }
    },
    ja: {
      admin: {
        editMode: {
          edit: '編集',
          close: '閉じる',
          openAria: '編集モードを開く',
          closeAria: '編集モードを閉じる'
        },
        background: {
          label: '背景',
          aria: 'コンテンツの背景を変更',
          panelTitle: 'コンテンツの背景',
          colorLabel: '色',
          orUpload: 'または画像をアップロード',
          pickImage: '画像を選択',
          resetDefault: 'デフォルトに戻す',
          dirtyNotice: '未保存の変更があります — 右上の「保存」をクリックしてください。'
        },
        sections: {
          label: 'ヘッダー/フッター',
          aria: 'ヘッダーとフッターを管理',
          panelTitle: 'ヘッダーとフッター',
          showHeader: 'ヘッダーを表示',
          showFooter: 'フッターを表示',
          heightHeader: 'ヘッダーの高さ (px)',
          heightFooter: 'フッターの高さ (px)',
          allowOverflow: 'ボックスからのはみ出しを許可',
          bgHeader: 'ヘッダーの背景',
          bgFooter: 'フッターの背景',
          colorHeaderAria: 'ヘッダー背景の色',
          colorFooterAria: 'フッター背景の色',
          uploadHeaderAria: 'ヘッダー背景画像をアップロード',
          uploadFooterAria: 'フッター背景画像をアップロード',
          uploadTitle: '画像をアップロード',
          resetHeaderAria: 'ヘッダー背景を透明にリセット',
          resetFooterAria: 'フッター背景を透明にリセット',
          resetTitle: '透明にリセット',
          note: 'ヘッダー・フッターの内容(テキスト/画像)はそれぞれのキャンバスで直接編集します — ページ上部/下部にある破線の枠を探してください。ここの設定はセクションの「枠」自体だけに関するものです。編集モード中は、訪問者から非表示になっていても内容を確認・編集できます。',
          dirtyNotice: '未保存の変更があります — 右上の「保存」をクリックしてください。'
        },
        fonts: {
          label: 'フォント',
          aria: 'フォントプリセットを管理',
          panelTitle: 'フォントプリセット',
          add: '追加',
          emptyState: 'プリセットがまだありません。「追加」をクリックして最初のプリセット(例:「Primary」)を作成すると、キャンバス上のテキスト要素を編集する際に選択できるようになります。',
          namePlaceholder: 'プリセット名',
          deleteAria: 'プリセットを削除',
          manualFontPlaceholder: '正確なフォント名 (fonts.google.com)',
          pickGoogleFont: 'Googleフォントを選択…',
          pickFromListAria: '人気リストから選択',
          typeManualAria: 'フォント名を手入力',
          sizePlaceholder: 'サイズ (px)',
          weightNormal: '標準 (400)',
          weightMedium: 'ミディアム (500)',
          weightSemibold: 'セミボールド (600)',
          weightBold: 'ボールド (700)',
          colorTitle: '文字色 — {color}',
          colorAria: 'プリセット「{name}」の文字色',
          dirtyNotice: '未保存の変更があります — 右上の「保存」をクリックしてください。'
        },
        pages: {
          label: 'ページ',
          aria: 'ページを管理',
          panelTitle: 'ページ',
          home: 'ホーム',
          addNew: '新しいページを追加',
          titlePlaceholder: 'ページタイトル (例:レバランセール)',
          slugPlaceholder: 'url-スラッグ',
          openAt: 'アクセス先',
          submit: 'ページを追加',
          genericError: 'ページの追加に失敗しました — このスラッグは既に使用されている可能性があります。'
        },
        save: {
          discard: '破棄',
          discardAria: '未保存の変更をすべて破棄',
          save: '保存',
          saveAria: 'すべての変更を保存',
          confirmDiscard: '未保存の変更をすべて破棄しますか?保存済みの変更は失われません。',
          savedTitle: '変更を保存しました',
          saveFailedTitle: '一部またはすべての変更の保存に失敗しました',
          discardedTitle: '変更を破棄しました'
        },
        canvas: {
          addElement: '要素を追加',
          closeAddMenu: '追加メニューを閉じる',
          addText: 'テキストを追加',
          addImage: '画像を追加',
          bringToFront: '最前面へ',
          sendToBack: '最背面へ',
          deleteElement: '要素を削除',
          noPreset: 'プリセットなし',
          fontPlaceholder: 'フォント',
          translateAria: 'このテキストを翻訳',
          translateEnglish: '英語 (English)',
          translateJapanese: '日本語',
          translatePlaceholderEn: '英語版(任意)',
          translatePlaceholderJa: '日本語版(任意)',
          saveError: 'キャンバス要素の保存に失敗しました。'
        },
        login: {
          title: '管理者アクセス',
          description: '管理者・スーパー管理者専用',
          email: 'メールアドレス',
          password: 'パスワード',
          submit: 'ログイン',
          emailInvalid: '無効なメールアドレスです',
          passwordMin: 'パスワードは6文字以上で入力してください'
        }
      },
      page: {
        notFound: 'ページが見つかりません。'
      }
    }
  }
}))
