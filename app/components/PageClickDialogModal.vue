<script setup lang="ts">
import { usePageDialogStore, type FormFieldConfig, type FormFieldType } from '../stores/pageDialog'

// Modal dialog pop-up yang muncul saat pengunjung mengklik di area halaman (Page Click Dialog).
// Mendukung mode Dialog Standar (Pengumuman / Tautan Aksi) dan mode Form Dinamis (Login, Kontak, Pendaftaran).
const adminAuth = useAdminAuthStore()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const currentPageKey = computed(() => {
  const slug = route.params.slug
  if (typeof slug === 'string' && slug.length > 0) return slug
  return 'home'
})

const pageDialog = computed(() => usePageDialogStore(currentPageKey.value))

// Jika sedang dalam edit mode, tampilkan draft secara live agar perubahan langsung kelihatan
const activeConfig = computed(() => {
  if (adminAuth.isAuthenticated && adminAuth.isEditMode) {
    return {
      enabled: pageDialog.value.draftEnabled,
      title: pageDialog.value.draftTitle,
      titleEn: pageDialog.value.draftTitleEn,
      titleJa: pageDialog.value.draftTitleJa,
      description: pageDialog.value.draftDescription,
      descriptionEn: pageDialog.value.draftDescriptionEn,
      descriptionJa: pageDialog.value.draftDescriptionJa,
      imageUrl: pageDialog.value.draftImageUrl,
      buttonText: pageDialog.value.draftButtonText,
      buttonTextEn: pageDialog.value.draftButtonTextEn,
      buttonTextJa: pageDialog.value.draftButtonTextJa,
      buttonUrl: pageDialog.value.draftButtonUrl,
      formEnabled: pageDialog.value.draftFormEnabled,
      formEndpoint: pageDialog.value.draftFormEndpoint,
      formMethod: pageDialog.value.draftFormMethod,
      formFields: pageDialog.value.draftFormFields,
      formSuccessMessage: pageDialog.value.draftFormSuccessMessage,
      formSuccessMessageEn: pageDialog.value.draftFormSuccessMessageEn,
      formSuccessMessageJa: pageDialog.value.draftFormSuccessMessageJa,
      formSuccessUrl: pageDialog.value.draftFormSuccessUrl
    }
  }
  return pageDialog.value.effectiveConfig
})

const { contentLocale } = useContentLocale()
const { locale: i18nLocale } = useI18n()
const siteLanguages = useSiteLanguagesStore()

onMounted(() => {
  siteLanguages.load()
})

// Bahasa aktif yang sedang dilihat (prioritas ke contentLocale saat pengunjung/admin mengubah bahasa konten)
const currentEffectiveLocale = computed<string>(() => {
  const c = contentLocale.value
  if (c && c !== 'id') return c
  const i = String(i18nLocale.value || '').toLowerCase()
  if (i && i !== 'id') return i
  return 'id'
})

// Getter teks dinamis berdasarkan bahasa pengunjung / preview aktif
const displayTitle = computed(() => {
  const cfg = activeConfig.value
  const lang = currentEffectiveLocale.value
  if (lang !== 'id') {
    if (cfg.translations?.[lang]?.title && cfg.translations[lang].title!.trim().length > 0) {
      return cfg.translations[lang].title!
    }
    if (lang === 'en' && cfg.titleEn && cfg.titleEn.trim().length > 0) return cfg.titleEn
    if (lang === 'ja' && cfg.titleJa && cfg.titleJa.trim().length > 0) return cfg.titleJa
  }
  return cfg.title
})

const displayDescription = computed(() => {
  const cfg = activeConfig.value
  const lang = currentEffectiveLocale.value
  if (lang !== 'id') {
    if (cfg.translations?.[lang]?.description && cfg.translations[lang].description!.trim().length > 0) {
      return cfg.translations[lang].description!
    }
    if (lang === 'en' && cfg.descriptionEn && cfg.descriptionEn.trim().length > 0) return cfg.descriptionEn
    if (lang === 'ja' && cfg.descriptionJa && cfg.descriptionJa.trim().length > 0) return cfg.descriptionJa
  }
  return cfg.description
})

const displayButtonText = computed(() => {
  const cfg = activeConfig.value
  const lang = currentEffectiveLocale.value
  if (lang !== 'id') {
    if (cfg.translations?.[lang]?.buttonText && cfg.translations[lang].buttonText!.trim().length > 0) {
      return cfg.translations[lang].buttonText!
    }
    if (lang === 'en' && cfg.buttonTextEn && cfg.buttonTextEn.trim().length > 0) return cfg.buttonTextEn
    if (lang === 'ja' && cfg.buttonTextJa && cfg.buttonTextJa.trim().length > 0) return cfg.buttonTextJa
  }
  return cfg.buttonText || 'OK'
})

function getDisplayFieldLabel(field: FormFieldConfig): string {
  const lang = currentEffectiveLocale.value
  if (lang !== 'id') {
    if (field.translations?.[lang]?.label && field.translations[lang].label!.trim().length > 0) {
      return field.translations[lang].label!
    }
    if (lang === 'en' && field.labelEn && field.labelEn.trim().length > 0) return field.labelEn
    if (lang === 'ja' && field.labelJa && field.labelJa.trim().length > 0) return field.labelJa
  }
  return field.label
}

function getDisplayFieldPlaceholder(field: FormFieldConfig): string {
  const lang = currentEffectiveLocale.value
  if (lang !== 'id') {
    if (field.translations?.[lang]?.placeholder && field.translations[lang].placeholder!.trim().length > 0) {
      return field.translations[lang].placeholder!
    }
    if (lang === 'en' && field.placeholderEn && field.placeholderEn.trim().length > 0) return field.placeholderEn
    if (lang === 'ja' && field.placeholderJa && field.placeholderJa.trim().length > 0) return field.placeholderJa
  }
  return field.placeholder || ''
}

// State Bahasa Terjemahan Lokal di Panel Editor
const titleLang = ref<string>('id')
const descLang = ref<string>('id')
const btnLang = ref<string>('id')
const formSuccessLang = ref<string>('id')
const formFieldLang = ref<Record<string, string>>({})

function getFieldLang(fieldId: string): string {
  return formFieldLang.value[fieldId] || 'id'
}

function setFieldLang(fieldId: string, lang: string) {
  formFieldLang.value[fieldId] = lang
}

// State Menu Tambah / Edit Komponen Dialog Lokal
const isModalAddMenuOpen = ref(false)
const openEditPopover = ref<'text' | 'image' | 'button' | 'form' | null>(null)
const bannerFileInputRef = ref<HTMLInputElement | null>(null)

// State Draggable Panel Editor (menggunakan translation delta agar 100% presisi mengikuti pergerakan kursor)
const editPanelRef = ref<HTMLElement | null>(null)
const panelTranslate = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const isDraggingPanel = ref(false)
let dragStartPos = { mouseX: 0, mouseY: 0, startX: 0, startY: 0 }

function onPanelHeaderPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('input') || target.closest('.switch')) return

  dragStartPos = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    startX: panelTranslate.value.x,
    startY: panelTranslate.value.y
  }

  isDraggingPanel.value = true
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch {}
}

function onPanelHeaderPointerMove(e: PointerEvent) {
  if (!isDraggingPanel.value) return

  const deltaX = e.clientX - dragStartPos.mouseX
  const deltaY = e.clientY - dragStartPos.mouseY

  panelTranslate.value = {
    x: dragStartPos.startX + deltaX,
    y: dragStartPos.startY + deltaY
  }
}

function onPanelHeaderPointerUp(e: PointerEvent) {
  if (isDraggingPanel.value) {
    isDraggingPanel.value = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }
}

const editPanelStyle = computed(() => {
  if (panelTranslate.value.x !== 0 || panelTranslate.value.y !== 0) {
    return {
      transform: `translate3d(${panelTranslate.value.x}px, ${panelTranslate.value.y}px, 0)`
    }
  }
  return {}
})

function triggerBannerUpload() {
  bannerFileInputRef.value?.click()
}

async function onBannerFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file || !file.type.startsWith('image/')) return

  await pageDialog.value.setDraftImageFile(file)
  openEditPopover.value = null
}

const methodOptions = [
  { label: 'POST', value: 'POST' },
  { label: 'GET', value: 'GET' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' }
]

const formTypeOptions = computed(() => [
  { label: t('admin.form.typeText'), value: 'text' },
  { label: t('admin.form.typeEmail'), value: 'email' },
  { label: t('admin.form.typePassword'), value: 'password' },
  { label: t('admin.form.typeNumber'), value: 'number' },
  { label: t('admin.form.typeTel'), value: 'tel' },
  { label: t('admin.form.typeTextarea'), value: 'textarea' }
])

// State untuk Form Dinamis
const formValues = ref<Record<string, any>>({})
const showPassword = ref<Record<string, boolean>>({})
const submitting = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)

// Inisialisasi default form values saat modal terbuka
watch(() => pageDialog.value.isModalOpen, (isOpen) => {
  if (isOpen) {
    panelTranslate.value = { x: 0, y: 0 }
    formError.value = null
    formSuccess.value = null
    const initial: Record<string, any> = {}
    if (activeConfig.value.formFields) {
      for (const field of activeConfig.value.formFields) {
        initial[field.name] = ''
      }
    }
    formValues.value = initial
  }
})

function togglePasswordVisibility(fieldId: string) {
  showPassword.value[fieldId] = !showPassword.value[fieldId]
}

async function saveDialogChanges() {
  try {
    await pageDialog.value.save()
    toast.add({
      title: t('admin.save.savedTitle'),
      description: 'Pengaturan dialog berhasil disimpan ke database.',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (e: any) {
    toast.add({
      title: t('admin.save.saveFailedTitle'),
      description: pageDialog.value.error || (e instanceof Error ? e.message : 'Gagal menyimpan dialog.'),
      color: 'error',
      icon: 'i-lucide-alert-triangle'
    })
  }
}

function resetDialogDraft() {
  pageDialog.value.resetDraft()
  toast.add({
    title: t('admin.save.discardedTitle'),
    icon: 'i-lucide-undo-2',
    color: 'neutral'
  })
}

// Handler Submit Form Dinamis
async function onSubmitForm() {
  if (submitting.value) return

  // Validasi field required
  for (const field of activeConfig.value.formFields) {
    if (field.required) {
      const val = formValues.value[field.name]
      if (val === undefined || val === null || String(val).trim() === '') {
        formError.value = `${field.label || field.name} wajib diisi.`
        return
      }
    }
  }

  const endpoint = activeConfig.value.formEndpoint?.trim()
  if (!endpoint) {
    formError.value = 'Endpoint tujuan belum dikonfigurasi.'
    return
  }

  submitting.value = true
  formError.value = null
  formSuccess.value = null

  try {
    const isLoginEndpoint = endpoint === '/api/login' || endpoint === 'login' || endpoint === 'auth/login'

    let responseData: any = null

    if (isLoginEndpoint) {
      // Autentikasi langsung dengan Supabase Auth Client
      let email = formValues.value.email || formValues.value.username || formValues.value.identifier
      if (!email) {
        for (const [k, v] of Object.entries(formValues.value)) {
          if (k.toLowerCase().includes('email') && typeof v === 'string' && v.trim()) {
            email = v
            break
          }
        }
      }
      if (!email) {
        for (const [_, v] of Object.entries(formValues.value)) {
          if (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
            email = v
            break
          }
        }
      }

      let password = formValues.value.password || formValues.value.pass || formValues.value.pwd
      if (!password) {
        for (const [k, v] of Object.entries(formValues.value)) {
          if ((k.toLowerCase().includes('pass') || k.toLowerCase().includes('pwd')) && typeof v === 'string' && v.trim()) {
            password = v
            break
          }
        }
      }

      if (!email || !password) {
        throw new Error('Email dan password wajib diisi.')
      }

      const supabase = useSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email).trim(),
        password: String(password)
      })

      if (error || !data.user) {
        throw new Error(error?.message || 'Email atau password salah.')
      }

      responseData = { success: true, user: data.user }
    } else {
      const method = (activeConfig.value.formMethod || 'POST').toUpperCase()
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }

      if (method !== 'GET' && method !== 'HEAD') {
        options.body = JSON.stringify(formValues.value)
      }

      const response = await fetch(endpoint, options)
      try {
        responseData = await response.json()
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        const message = responseData?.message || responseData?.error || `Error ${response.status}: ${response.statusText}`
        throw new Error(message || t('admin.form.submitError'))
      }
    }

    const successMsg = activeConfig.value.formSuccessMessage || responseData?.message || t('admin.form.submitSuccess')
    formSuccess.value = successMsg

    toast.add({
      title: successMsg,
      color: 'success',
      icon: 'i-lucide-check'
    })

    // Tangani redirect sukses jika ada
    if (activeConfig.value.formSuccessUrl) {
      const targetUrl = activeConfig.value.formSuccessUrl
      setTimeout(() => {
        pageDialog.value.closeModal()
        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
          window.location.href = targetUrl
        } else {
          navigateTo(targetUrl)
        }
      }, 500)
    } else {
      setTimeout(() => {
        pageDialog.value.closeModal()
      }, 800)
    }
  } catch (err: any) {
    formError.value = err?.message || t('admin.form.submitError')
    toast.add({
      title: t('admin.form.submitError'),
      description: formError.value || undefined,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    submitting.value = false
  }
}

// Handler Tombol Aksi Standar (non-form)
function onActionClick() {
  if (activeConfig.value.buttonUrl) {
    if (activeConfig.value.buttonUrl.startsWith('http://') || activeConfig.value.buttonUrl.startsWith('https://')) {
      window.open(activeConfig.value.buttonUrl, '_blank')
    } else {
      navigateTo(activeConfig.value.buttonUrl)
    }
  }
  pageDialog.value.closeModal()
}
</script>

<template>
  <UModal
    v-model:open="pageDialog.isModalOpen"
    :dismissible="!(adminAuth.isAuthenticated && adminAuth.isEditMode)"
    :ui="{
      content: 'w-[calc(100%-3rem)] max-w-[320px] overflow-visible bg-transparent shadow-none border-none p-0 mx-auto'
    }"
  >
    <template #content>
      <!-- Auto-focus sink: button dummy tak terlihat agar auto-focus modal berhenti di sini tanpa memicu tooltip pada tombol pertama -->
      <button type="button" class="sr-only opacity-0 absolute top-0 left-0 size-0 p-0 m-0 border-0 outline-none overflow-hidden" tabindex="0" />

      <!-- KARTU UTAMA DIALOG (Tengah Layar - Ukuran & Posisi Asli Pengunjung) -->
      <div class="relative w-full overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
        <!-- Edit Mode: Top Bar Navigasi & Toolbar Komponen Dialog -->
        <div
          v-if="adminAuth.isAuthenticated && adminAuth.isEditMode"
          class="flex items-center justify-between border-b border-neutral-200/80 bg-neutral-100/90 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/90 backdrop-blur-sm"
        >
          <div class="flex items-center gap-1.5">
            <!-- Toggle Menu Tambah -->
            <UTooltip :text="isModalAddMenuOpen ? t('admin.canvas.closeAddMenu') : t('admin.canvas.addElement')">
              <UButton
                :icon="isModalAddMenuOpen ? 'i-lucide-x' : 'i-lucide-plus'"
                color="neutral"
                variant="solid"
                size="xs"
                square
                class="cursor-pointer size-7 justify-center rounded-full shadow-xs"
                :aria-label="isModalAddMenuOpen ? t('admin.canvas.closeAddMenu') : t('admin.canvas.addElement')"
                @click.stop="() => { isModalAddMenuOpen = !isModalAddMenuOpen; if (!isModalAddMenuOpen) openEditPopover = null }"
              />
            </UTooltip>

            <!-- 4 Tab Komponen Dialog -->
            <div v-if="isModalAddMenuOpen" class="flex items-center gap-1 rounded-full bg-neutral-200/80 p-0.5 dark:bg-neutral-900/80">
              <!-- 1. Text -->
              <UTooltip :text="t('admin.dialog.menuText')">
                <UButton
                  icon="i-lucide-type"
                  :color="openEditPopover === 'text' ? 'primary' : 'neutral'"
                  :variant="openEditPopover === 'text' ? 'solid' : 'ghost'"
                  size="xs"
                  square
                  class="cursor-pointer size-6 justify-center rounded-full transition-all"
                  :aria-label="t('admin.dialog.menuText')"
                  @click.stop="openEditPopover = openEditPopover === 'text' ? null : 'text'"
                />
              </UTooltip>

              <!-- 2. Image -->
              <UTooltip :text="t('admin.dialog.menuImage')">
                <UButton
                  icon="i-lucide-image-plus"
                  :color="openEditPopover === 'image' ? 'primary' : 'neutral'"
                  :variant="openEditPopover === 'image' ? 'solid' : 'ghost'"
                  size="xs"
                  square
                  class="cursor-pointer size-6 justify-center rounded-full transition-all"
                  :aria-label="t('admin.dialog.menuImage')"
                  @click.stop="openEditPopover = openEditPopover === 'image' ? null : 'image'"
                />
              </UTooltip>

              <!-- 3. Button -->
              <UTooltip :text="t('admin.dialog.menuButton')">
                <UButton
                  icon="i-lucide-square-mouse-pointer"
                  :color="openEditPopover === 'button' ? 'primary' : 'neutral'"
                  :variant="openEditPopover === 'button' ? 'solid' : 'ghost'"
                  size="xs"
                  square
                  class="cursor-pointer size-6 justify-center rounded-full transition-all"
                  :aria-label="t('admin.dialog.menuButton')"
                  @click.stop="openEditPopover = openEditPopover === 'button' ? null : 'button'"
                />
              </UTooltip>

              <!-- 4. Form -->
              <UTooltip :text="t('admin.dialog.menuForm')">
                <UButton
                  icon="i-lucide-form-input"
                  :color="openEditPopover === 'form' ? 'primary' : (pageDialog.draftFormEnabled ? 'primary' : 'neutral')"
                  :variant="openEditPopover === 'form' ? 'solid' : 'ghost'"
                  size="xs"
                  square
                  class="cursor-pointer size-6 justify-center rounded-full transition-all"
                  :aria-label="t('admin.dialog.menuForm')"
                  @click.stop="openEditPopover = openEditPopover === 'form' ? null : 'form'"
                />
              </UTooltip>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Tombol Simpan Cepat di Header Modal (muncul jika ada perubahan draft) -->
            <UButton
              v-if="pageDialog.isDirty"
              :label="t('admin.save.save')"
              icon="i-lucide-check"
              color="primary"
              variant="solid"
              size="xs"
              class="cursor-pointer font-medium shadow-xs"
              :loading="pageDialog.saving"
              @click.stop="saveDialogChanges"
            />

            <!-- Tombol Tutup Dialog di Header Edit Mode -->
            <UTooltip text="Tutup Dialog">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="cursor-pointer size-7 justify-center rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                aria-label="Tutup Dialog"
                @click="pageDialog.closeModal()"
              />
            </UTooltip>
          </div>
        </div>

        <!-- Visitor Mode: Tombol Tutup X melayang di pojok kanan atas -->
        <UTooltip v-else text="Tutup Dialog">
          <button
            type="button"
            class="absolute top-3 right-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition hover:bg-black/60"
            aria-label="Tutup Dialog"
            @click="pageDialog.closeModal()"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </UTooltip>

        <!-- Gambar Banner (jika ada) -->
        <div v-if="activeConfig.imageUrl" class="relative max-h-56 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <img
            :src="activeConfig.imageUrl"
            alt="Dialog Banner"
            class="h-full w-full object-cover"
          />
        </div>

        <!-- Konten Dialog Asli (True Height & Real Visitor Appearance) -->
        <div class="space-y-4 p-5 flex-1 flex flex-col justify-center">
          <!-- Header Judul & Deskripsi -->
          <div v-if="displayTitle || displayDescription" class="text-center space-y-1.5">
            <h3
              v-if="displayTitle"
              class="text-lg font-bold text-neutral-900 dark:text-white leading-snug"
            >
              {{ displayTitle }}
            </h3>

            <p
              v-if="displayDescription"
              class="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed"
            >
              {{ displayDescription }}
            </p>
          </div>

          <!-- Alert Error / Sukses Form -->
          <div
            v-if="formError"
            class="flex items-center gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-500/20"
          >
            <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0" />
            <span class="flex-1">{{ formError }}</span>
          </div>

          <div
            v-if="formSuccess"
            class="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          >
            <UIcon name="i-lucide-check-circle" class="size-4 shrink-0" />
            <span class="flex-1">{{ formSuccess }}</span>
          </div>

          <!-- MODE 1: CUSTOM FORM DINAMIS -->
          <template v-if="activeConfig.formEnabled && activeConfig.formFields && activeConfig.formFields.length > 0">
            <form class="space-y-3" @submit.prevent="onSubmitForm">
              <div
                v-for="field in activeConfig.formFields"
                :key="field.id"
                class="space-y-1 text-left"
              >
                <!-- Label Field -->
                <label
                  v-if="getDisplayFieldLabel(field)"
                  :for="`modal-field-${field.id}`"
                  class="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {{ getDisplayFieldLabel(field) }}
                  <span v-if="field.required" class="text-red-500 font-bold">*</span>
                </label>

                <!-- Input: Textarea -->
                <UTextarea
                  v-if="field.type === 'textarea'"
                  :id="`modal-field-${field.id}`"
                  v-model="formValues[field.name]"
                  :placeholder="getDisplayFieldPlaceholder(field)"
                  :required="field.required"
                  :rows="3"
                  size="sm"
                  class="w-full"
                />

                <!-- Input: Password with toggle view inside trailing slot -->
                <UInput
                  v-else-if="field.type === 'password'"
                  :id="`modal-field-${field.id}`"
                  v-model="formValues[field.name]"
                  :type="showPassword[field.id] ? 'text' : 'password'"
                  :placeholder="getDisplayFieldPlaceholder(field)"
                  :required="field.required"
                  size="sm"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="xs"
                      :icon="showPassword[field.id] ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="showPassword[field.id] ? 'Sembunyikan password' : 'Lihat password'"
                      class="cursor-pointer p-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      @click="togglePasswordVisibility(field.id)"
                    />
                  </template>
                </UInput>

                <!-- Input: Text / Email / Number / Tel -->
                <UInput
                  v-else
                  :id="`modal-field-${field.id}`"
                  v-model="formValues[field.name]"
                  :type="field.type === 'number' ? 'number' : (field.type === 'tel' ? 'tel' : (field.type === 'email' ? 'email' : 'text'))"
                  :placeholder="getDisplayFieldPlaceholder(field)"
                  :required="field.required"
                  size="sm"
                  class="w-full"
                />
              </div>

              <!-- Tombol Submit Form -->
              <div class="pt-2">
                <UButton
                  type="submit"
                  :label="displayButtonText || t('admin.form.submitDefault')"
                  :loading="submitting"
                  color="primary"
                  variant="solid"
                  size="md"
                  block
                  class="cursor-pointer justify-center rounded-xl font-semibold shadow-md"
                />
              </div>
            </form>
          </template>

          <!-- MODE 2: DIALOG STANDAR / PENGUMUMAN -->
          <template v-else>
            <div class="pt-2">
              <UButton
                :label="displayButtonText || 'OK'"
                color="primary"
                variant="solid"
                size="md"
                block
                class="cursor-pointer justify-center rounded-xl font-semibold shadow-md"
                @click="onActionClick"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- PANEL EDITOR DIALOG MELAYANG DI SEBELAH KANAN DIALOG & BISA DI-DRAG (DRAGGABLE PANEL) -->
      <div
        v-if="pageDialog.isModalOpen && adminAuth.isAuthenticated && adminAuth.isEditMode && isModalAddMenuOpen && openEditPopover"
        ref="editPanelRef"
        class="absolute left-[calc(100%+1rem)] top-0 z-50 w-80 md:w-96 max-md:left-0 max-md:top-[calc(100%+1rem)] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[calc(100vh-6rem)] backdrop-blur-md text-left transition-shadow"
        :class="isDraggingPanel ? 'shadow-3xl ring-2 ring-primary/40' : ''"
        :style="editPanelStyle"
        @click.stop
        @pointerdown.stop
        @mousedown.stop
      >
        <!-- Header Editor (Draggable Handle Area) -->
        <div
          class="flex items-center justify-between border-b border-neutral-200 px-3.5 py-2.5 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 cursor-grab active:cursor-grabbing select-none"
          title="Tahan dan geser untuk memindahkan posisi panel"
          @pointerdown="onPanelHeaderPointerDown"
          @pointermove="onPanelHeaderPointerMove"
          @pointerup="onPanelHeaderPointerUp"
          @pointercancel="onPanelHeaderPointerUp"
        >
          <div class="flex items-center gap-2">
            <!-- Drag Handle Icon -->
            <UIcon name="i-lucide-grip-vertical" class="size-4 text-neutral-400 dark:text-neutral-500" />
            <UIcon
              :name="openEditPopover === 'text' ? 'i-lucide-type' : (openEditPopover === 'image' ? 'i-lucide-image-plus' : (openEditPopover === 'button' ? 'i-lucide-square-mouse-pointer' : 'i-lucide-form-input'))"
              class="size-4 text-primary"
            />
            <p class="text-xs font-semibold text-neutral-900 dark:text-white pointer-events-none">
              {{
                openEditPopover === 'text'
                  ? t('admin.dialog.menuTextTitle')
                  : (openEditPopover === 'image'
                    ? t('admin.dialog.menuImageTitle')
                    : (openEditPopover === 'button'
                      ? t('admin.dialog.menuButtonTitle')
                      : t('admin.dialog.menuFormTitle')))
              }}
            </p>
          </div>
          <div class="flex items-center gap-1.5" @pointerdown.stop>
            <USwitch
              v-if="openEditPopover === 'form'"
              :model-value="pageDialog.draftFormEnabled"
              size="xs"
              @update:model-value="(v) => pageDialog.setDraftFormEnabled(!!v)"
            />
            <UTooltip text="Tutup Editor">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                square
                class="size-6 cursor-pointer text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                aria-label="Tutup Editor"
                @click="openEditPopover = null"
              />
            </UTooltip>
          </div>
        </div>

        <!-- Konten Editor Scrollable -->
        <div class="p-4 space-y-3.5 overflow-y-auto flex-1 select-text">
          <!-- 1. TEXT EDITOR -->
          <div v-if="openEditPopover === 'text'" class="space-y-3 text-left">
            <!-- Judul Dialog dengan selector bahasa -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">{{ t('admin.background.dialogTitle') }}</label>
                <div class="flex items-center gap-1">
                  <button
                    v-for="l in siteLanguages.activeLanguages"
                    :key="l.code"
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer relative uppercase"
                    :class="titleLang === l.code ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'"
                    @click="titleLang = l.code"
                  >
                    {{ l.code }}
                    <span v-if="l.code !== 'id' && pageDialog.getDraftTitleForLang(l.code)" class="inline-block size-1 rounded-full bg-emerald-400 ml-0.5 align-middle" />
                  </button>
                </div>
              </div>
              <UInput
                :model-value="pageDialog.getDraftTitleForLang(titleLang)"
                :placeholder="titleLang === 'id' ? t('admin.background.dialogTitlePlaceholder') : `Judul Dialog (${titleLang.toUpperCase()})`"
                size="sm"
                class="w-full"
                @update:model-value="(v) => pageDialog.setDraftTitleForLang(titleLang, v ? String(v) : null)"
              />
            </div>

            <!-- Isi Pesan / Deskripsi dengan selector bahasa -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">{{ t('admin.background.dialogDesc') }}</label>
                <div class="flex items-center gap-1">
                  <button
                    v-for="l in siteLanguages.activeLanguages"
                    :key="l.code"
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer relative uppercase"
                    :class="descLang === l.code ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'"
                    @click="descLang = l.code"
                  >
                    {{ l.code }}
                    <span v-if="l.code !== 'id' && pageDialog.getDraftDescriptionForLang(l.code)" class="inline-block size-1 rounded-full bg-emerald-400 ml-0.5 align-middle" />
                  </button>
                </div>
              </div>
              <UTextarea
                :model-value="pageDialog.getDraftDescriptionForLang(descLang)"
                :placeholder="descLang === 'id' ? t('admin.background.dialogDescPlaceholder') : `Deskripsi (${descLang.toUpperCase()})`"
                :rows="4"
                size="sm"
                class="w-full"
                @update:model-value="(v) => pageDialog.setDraftDescriptionForLang(descLang, v ? String(v) : null)"
              />
            </div>
          </div>

          <!-- 2. IMAGE / BANNER EDITOR -->
          <div v-else-if="openEditPopover === 'image'" class="space-y-3 text-left">
            <div v-if="pageDialog.draftImageUrl" class="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
              <img :src="pageDialog.draftImageUrl" alt="Banner" class="h-32 w-full object-cover" />
              <button
                type="button"
                class="absolute top-2 right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
                @click="pageDialog.setDraftImageUrl(null)"
              >
                <UIcon name="i-lucide-trash-2" class="size-3.5" />
              </button>
            </div>
            <UButton
              :label="pageDialog.draftImageUrl ? t('admin.dialog.changeBanner') : t('admin.background.dialogPickBanner')"
              icon="i-lucide-upload"
              color="primary"
              variant="outline"
              size="sm"
              block
              class="cursor-pointer"
              @click="triggerBannerUpload"
            />
            <input ref="bannerFileInputRef" type="file" accept="image/*" class="hidden" @change="onBannerFileChange" />
          </div>

          <!-- 3. BUTTON EDITOR -->
          <div v-else-if="openEditPopover === 'button'" class="space-y-3 text-left">
            <!-- Teks Tombol dengan selector bahasa -->
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">{{ t('admin.background.dialogBtnText') }}</label>
                <div class="flex items-center gap-1">
                  <button
                    v-for="l in siteLanguages.activeLanguages"
                    :key="l.code"
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer relative uppercase"
                    :class="btnLang === l.code ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'"
                    @click="btnLang = l.code"
                  >
                    {{ l.code }}
                    <span v-if="l.code !== 'id' && pageDialog.getDraftButtonTextForLang(l.code)" class="inline-block size-1 rounded-full bg-emerald-400 ml-0.5 align-middle" />
                  </button>
                </div>
              </div>
              <UInput
                :model-value="pageDialog.getDraftButtonTextForLang(btnLang)"
                :placeholder="btnLang === 'id' ? 'OK' : `Teks Tombol (${btnLang.toUpperCase()})`"
                size="sm"
                class="w-full"
                @update:model-value="(v) => pageDialog.setDraftButtonTextForLang(btnLang, v ? String(v) : null)"
              />
            </div>

            <!-- URL Tautan -->
            <div class="space-y-1">
              <label class="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300">{{ t('admin.background.dialogBtnUrl') }}</label>
              <UInput
                :model-value="pageDialog.draftButtonUrl || ''"
                :placeholder="t('admin.background.dialogBtnUrlPlaceholder')"
                size="sm"
                class="w-full"
                @update:model-value="(v) => pageDialog.setDraftButtonUrl(v ? String(v) : null)"
              />
            </div>
          </div>

          <!-- 4. FORM & ENDPOINT EDITOR -->
          <div v-else-if="openEditPopover === 'form'" class="space-y-3 text-left">
            <template v-if="pageDialog.draftFormEnabled">
              <div class="space-y-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
                <div class="space-y-1">
                  <label class="block text-[10px] font-medium text-muted">{{ t('admin.form.endpointLabel') }}</label>
                  <UInput
                    :model-value="pageDialog.draftFormEndpoint"
                    :placeholder="t('admin.form.endpointPlaceholder')"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => pageDialog.setDraftFormEndpoint(String(v || ''))"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-[10px] font-medium text-muted">{{ t('admin.form.methodLabel') }}</label>
                  <USelect
                    :model-value="pageDialog.draftFormMethod || 'POST'"
                    :items="methodOptions"
                    value-key="value"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => pageDialog.setDraftFormMethod(String(v || 'POST'))"
                  />
                </div>

                <!-- Pesan Sukses dengan selector bahasa -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] font-medium text-muted">{{ t('admin.form.successMsgLabel') }}</label>
                    <div class="flex items-center gap-1">
                      <button
                        v-for="l in siteLanguages.activeLanguages"
                        :key="l.code"
                        type="button"
                        class="px-1.5 py-0.5 rounded text-[9px] font-semibold transition cursor-pointer relative uppercase"
                        :class="formSuccessLang === l.code ? 'bg-primary text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'"
                        @click="formSuccessLang = l.code"
                      >
                        {{ l.code }}
                        <span v-if="l.code !== 'id' && pageDialog.getDraftFormSuccessMessageForLang(l.code)" class="inline-block size-1 rounded-full bg-emerald-400 ml-0.5 align-middle" />
                      </button>
                    </div>
                  </div>
                  <UInput
                    :model-value="pageDialog.getDraftFormSuccessMessageForLang(formSuccessLang)"
                    :placeholder="formSuccessLang === 'id' ? t('admin.form.successMsgPlaceholder') : `Pesan Sukses (${formSuccessLang.toUpperCase()})`"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => pageDialog.setDraftFormSuccessMessageForLang(formSuccessLang, v ? String(v) : null)"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-[10px] font-medium text-muted">{{ t('admin.form.successUrlLabel') }}</label>
                  <UInput
                    :model-value="pageDialog.draftFormSuccessUrl || ''"
                    :placeholder="t('admin.form.successUrlPlaceholder')"
                    size="xs"
                    class="w-full"
                    @update:model-value="(v) => pageDialog.setDraftFormSuccessUrl(v ? String(v) : null)"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{{ t('admin.form.fieldsSection') }} ({{ pageDialog.draftFormFields.length }})</span>
                  <UButton :label="t('admin.form.addField')" icon="i-lucide-plus" color="primary" variant="solid" size="xs" class="cursor-pointer" @click="pageDialog.addDraftFormField('text')" />
                </div>

                <div v-for="(field, index) in pageDialog.draftFormFields" :key="field.id" class="space-y-1.5 rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-800">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-medium text-neutral-800 dark:text-neutral-200">{{ field.label || field.name || `Field ${index + 1}` }}</span>
                      <!-- Selector bahasa untuk field -->
                      <div class="flex items-center gap-0.5">
                        <button
                          v-for="l in siteLanguages.activeLanguages"
                          :key="l.code"
                          type="button"
                          class="px-1 py-0.2 rounded text-[9px] font-semibold transition cursor-pointer relative uppercase"
                          :class="getFieldLang(field.id) === l.code ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'"
                          @click="setFieldLang(field.id, l.code)"
                        >
                          {{ l.code }}
                          <span v-if="l.code !== 'id' && pageDialog.getFieldLabelForLang(field, l.code)" class="inline-block size-1 rounded-full bg-emerald-400 ml-0.5 align-middle" />
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center gap-1">
                      <UTooltip :text="t('admin.form.moveUp')">
                        <UButton icon="i-lucide-chevron-up" color="neutral" variant="ghost" size="xs" square :disabled="index === 0" class="size-5" :aria-label="t('admin.form.moveUp')" @click="pageDialog.reorderDraftFormFields(index, index - 1)" />
                      </UTooltip>
                      <UTooltip :text="t('admin.form.moveDown')">
                        <UButton icon="i-lucide-chevron-down" color="neutral" variant="ghost" size="xs" square :disabled="index === pageDialog.draftFormFields.length - 1" class="size-5" :aria-label="t('admin.form.moveDown')" @click="pageDialog.reorderDraftFormFields(index, index + 1)" />
                      </UTooltip>
                      <UTooltip :text="t('admin.form.deleteField')">
                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" square class="size-5" :aria-label="t('admin.form.deleteField')" @click="pageDialog.removeDraftFormField(field.id)" />
                      </UTooltip>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-1.5">
                    <USelect :model-value="field.type" :items="formTypeOptions" value-key="value" size="xs" @update:model-value="(v) => pageDialog.updateDraftFormField(field.id, { type: (v as any) || 'text' })" />
                    <UInput :model-value="field.name" :placeholder="t('admin.form.fieldNamePlaceholder')" size="xs" @update:model-value="(v) => pageDialog.updateDraftFormField(field.id, { name: String(v || '') })" />
                  </div>

                  <!-- Label & Placeholder input sesuai bahasa aktif field -->
                  <div class="grid grid-cols-2 gap-1.5">
                    <UInput
                      :model-value="pageDialog.getFieldLabelForLang(field, getFieldLang(field.id))"
                      :placeholder="getFieldLang(field.id) === 'id' ? t('admin.form.fieldLabelPlaceholder') : `Label (${getFieldLang(field.id).toUpperCase()})`"
                      size="xs"
                      @update:model-value="(v) => pageDialog.setFieldLabelForLang(field.id, getFieldLang(field.id), v ? String(v) : null)"
                    />
                    <UInput
                      :model-value="pageDialog.getFieldPlaceholderForLang(field, getFieldLang(field.id))"
                      :placeholder="getFieldLang(field.id) === 'id' ? t('admin.form.placeholderPlaceholder') : `Placeholder (${getFieldLang(field.id).toUpperCase()})`"
                      size="xs"
                      @update:model-value="(v) => pageDialog.setFieldPlaceholderForLang(field.id, getFieldLang(field.id), v ? String(v) : null)"
                    />
                  </div>

                  <div class="flex items-center justify-between pt-0.5">
                    <span class="text-[10px] text-muted">{{ t('admin.form.required') }}</span>
                    <USwitch :model-value="field.required" size="xs" @update:model-value="(v) => pageDialog.updateDraftFormField(field.id, { required: !!v })" />
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-xs text-muted text-center py-4">
              {{ t('admin.form.enableFormHint') }}
            </p>
          </div>
        </div>

        <!-- Footer Action: Tombol Simpan Langsung di Panel Dialog -->
        <div class="flex items-center justify-between border-t border-neutral-200 px-3.5 py-2.5 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/60">
          <div class="flex items-center gap-1.5">
            <span v-if="pageDialog.isDirty" class="inline-flex size-2 rounded-full bg-amber-500 animate-pulse" />
            <span class="text-[11px] text-muted font-medium">
              {{ pageDialog.isDirty ? t('admin.save.savePrompt') : t('admin.save.savedAll') }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              v-if="pageDialog.isDirty"
              :label="t('admin.save.discard')"
              color="neutral"
              variant="ghost"
              size="xs"
              class="cursor-pointer"
              :disabled="pageDialog.saving"
              @click="resetDialogDraft"
            />
            <UButton
              :label="t('admin.save.save')"
              icon="i-lucide-check"
              color="primary"
              variant="solid"
              size="xs"
              class="cursor-pointer font-medium shadow-xs"
              :loading="pageDialog.saving"
              :disabled="!pageDialog.isDirty"
              @click="saveDialogChanges"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
