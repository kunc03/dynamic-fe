import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FormFieldType } from './canvasElements'
export type { FormFieldType }

export interface FormFieldTranslation {
  label?: string
  placeholder?: string
}

export interface FormFieldConfig {
  id: string
  type: FormFieldType
  name: string
  label: string
  labelEn?: string | null
  labelJa?: string | null
  placeholder: string
  placeholderEn?: string | null
  placeholderJa?: string | null
  required: boolean
  translations?: Record<string, FormFieldTranslation>
}

export interface DialogTranslation {
  title?: string
  description?: string
  buttonText?: string
  formSuccessMessage?: string
}

export interface PageDialogConfig {
  enabled: boolean
  title: string
  titleEn: string | null
  titleJa: string | null
  description: string
  descriptionEn: string | null
  descriptionJa: string | null
  imageUrl: string | null
  buttonText: string
  buttonTextEn: string | null
  buttonTextJa: string | null
  buttonUrl: string | null
  formEnabled: boolean
  formEndpoint: string
  formMethod: string
  formFields: FormFieldConfig[]
  formSuccessMessage: string
  formSuccessMessageEn: string | null
  formSuccessMessageJa: string | null
  formSuccessUrl: string | null
  translations?: Record<string, DialogTranslation>
}

const DEFAULT_DIALOG_CONFIG: PageDialogConfig = {
  enabled: false,
  title: '',
  titleEn: null,
  titleJa: null,
  description: '',
  descriptionEn: null,
  descriptionJa: null,
  imageUrl: null,
  buttonText: 'OK',
  buttonTextEn: null,
  buttonTextJa: null,
  buttonUrl: null,
  formEnabled: false,
  formEndpoint: '',
  formMethod: 'POST',
  formFields: [],
  formSuccessMessage: '',
  formSuccessMessageEn: null,
  formSuccessMessageJa: null,
  formSuccessUrl: null,
  translations: {}
}

function cloneFormFields(fields: FormFieldConfig[]): FormFieldConfig[] {
  return fields.map(f => ({
    ...f,
    translations: f.translations ? JSON.parse(JSON.stringify(f.translations)) : {}
  }))
}

export function usePageDialogStore(pageKey: string) {
  return defineStore(`pageDialog:${pageKey}`, () => {
    const adminAuth = useAdminAuthStore()

    const enabled = ref(DEFAULT_DIALOG_CONFIG.enabled)
    const title = ref(DEFAULT_DIALOG_CONFIG.title)
    const titleEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.titleEn)
    const titleJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.titleJa)
    const description = ref(DEFAULT_DIALOG_CONFIG.description)
    const descriptionEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.descriptionEn)
    const descriptionJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.descriptionJa)
    const imageUrl = ref<string | null>(DEFAULT_DIALOG_CONFIG.imageUrl)
    const buttonText = ref(DEFAULT_DIALOG_CONFIG.buttonText)
    const buttonTextEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.buttonTextEn)
    const buttonTextJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.buttonTextJa)
    const buttonUrl = ref<string | null>(DEFAULT_DIALOG_CONFIG.buttonUrl)
    const formEnabled = ref(DEFAULT_DIALOG_CONFIG.formEnabled)
    const formEndpoint = ref(DEFAULT_DIALOG_CONFIG.formEndpoint)
    const formMethod = ref(DEFAULT_DIALOG_CONFIG.formMethod)
    const formFields = ref<FormFieldConfig[]>(DEFAULT_DIALOG_CONFIG.formFields)
    const formSuccessMessage = ref(DEFAULT_DIALOG_CONFIG.formSuccessMessage)
    const formSuccessMessageEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.formSuccessMessageEn)
    const formSuccessMessageJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.formSuccessMessageJa)
    const formSuccessUrl = ref<string | null>(DEFAULT_DIALOG_CONFIG.formSuccessUrl)
    const translations = ref<Record<string, DialogTranslation>>({})

    const draftEnabled = ref(DEFAULT_DIALOG_CONFIG.enabled)
    const draftTitle = ref(DEFAULT_DIALOG_CONFIG.title)
    const draftTitleEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.titleEn)
    const draftTitleJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.titleJa)
    const draftDescription = ref(DEFAULT_DIALOG_CONFIG.description)
    const draftDescriptionEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.descriptionEn)
    const draftDescriptionJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.descriptionJa)
    const draftImageUrl = ref<string | null>(DEFAULT_DIALOG_CONFIG.imageUrl)
    const draftButtonText = ref(DEFAULT_DIALOG_CONFIG.buttonText)
    const draftButtonTextEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.buttonTextEn)
    const draftButtonTextJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.buttonTextJa)
    const draftButtonUrl = ref<string | null>(DEFAULT_DIALOG_CONFIG.buttonUrl)
    const draftFormEnabled = ref(DEFAULT_DIALOG_CONFIG.formEnabled)
    const draftFormEndpoint = ref(DEFAULT_DIALOG_CONFIG.formEndpoint)
    const draftFormMethod = ref(DEFAULT_DIALOG_CONFIG.formMethod)
    const draftFormFields = ref<FormFieldConfig[]>(DEFAULT_DIALOG_CONFIG.formFields)
    const draftFormSuccessMessage = ref(DEFAULT_DIALOG_CONFIG.formSuccessMessage)
    const draftFormSuccessMessageEn = ref<string | null>(DEFAULT_DIALOG_CONFIG.formSuccessMessageEn)
    const draftFormSuccessMessageJa = ref<string | null>(DEFAULT_DIALOG_CONFIG.formSuccessMessageJa)
    const draftFormSuccessUrl = ref<string | null>(DEFAULT_DIALOG_CONFIG.formSuccessUrl)
    const draftTranslations = ref<Record<string, DialogTranslation>>({})

    const isModalOpen = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)

    const isEditable = computed(() => adminAuth.isAuthenticated && adminAuth.isEditMode)

    const effectiveConfig = computed<PageDialogConfig>(() => ({
      enabled: isEditable.value ? draftEnabled.value : enabled.value,
      title: isEditable.value ? draftTitle.value : title.value,
      titleEn: isEditable.value ? draftTitleEn.value : titleEn.value,
      titleJa: isEditable.value ? draftTitleJa.value : titleJa.value,
      description: isEditable.value ? draftDescription.value : description.value,
      descriptionEn: isEditable.value ? draftDescriptionEn.value : descriptionEn.value,
      descriptionJa: isEditable.value ? draftDescriptionJa.value : descriptionJa.value,
      imageUrl: isEditable.value ? draftImageUrl.value : imageUrl.value,
      buttonText: isEditable.value ? draftButtonText.value : buttonText.value,
      buttonTextEn: isEditable.value ? draftButtonTextEn.value : buttonTextEn.value,
      buttonTextJa: isEditable.value ? draftButtonTextJa.value : buttonTextJa.value,
      buttonUrl: isEditable.value ? draftButtonUrl.value : buttonUrl.value,
      formEnabled: isEditable.value ? draftFormEnabled.value : formEnabled.value,
      formEndpoint: isEditable.value ? draftFormEndpoint.value : formEndpoint.value,
      formMethod: isEditable.value ? draftFormMethod.value : formMethod.value,
      formFields: isEditable.value ? draftFormFields.value : formFields.value,
      formSuccessMessage: isEditable.value ? draftFormSuccessMessage.value : formSuccessMessage.value,
      formSuccessMessageEn: isEditable.value ? draftFormSuccessMessageEn.value : formSuccessMessageEn.value,
      formSuccessMessageJa: isEditable.value ? draftFormSuccessMessageJa.value : formSuccessMessageJa.value,
      formSuccessUrl: isEditable.value ? draftFormSuccessUrl.value : formSuccessUrl.value,
      translations: isEditable.value ? draftTranslations.value : translations.value
    }))

    const isDirty = computed(() =>
      draftEnabled.value !== enabled.value
      || draftTitle.value !== title.value
      || draftTitleEn.value !== titleEn.value
      || draftTitleJa.value !== titleJa.value
      || draftDescription.value !== description.value
      || draftDescriptionEn.value !== descriptionEn.value
      || draftDescriptionJa.value !== descriptionJa.value
      || draftImageUrl.value !== imageUrl.value
      || draftButtonText.value !== buttonText.value
      || draftButtonTextEn.value !== buttonTextEn.value
      || draftButtonTextJa.value !== buttonTextJa.value
      || draftButtonUrl.value !== buttonUrl.value
      || draftFormEnabled.value !== formEnabled.value
      || draftFormEndpoint.value !== formEndpoint.value
      || draftFormMethod.value !== formMethod.value
      || JSON.stringify(draftFormFields.value) !== JSON.stringify(formFields.value)
      || draftFormSuccessMessage.value !== formSuccessMessage.value
      || draftFormSuccessMessageEn.value !== formSuccessMessageEn.value
      || draftFormSuccessMessageJa.value !== formSuccessMessageJa.value
      || draftFormSuccessUrl.value !== formSuccessUrl.value
      || JSON.stringify(draftTranslations.value) !== JSON.stringify(translations.value)
    )

    function resetDraft() {
      draftEnabled.value = enabled.value
      draftTitle.value = title.value
      draftTitleEn.value = titleEn.value
      draftTitleJa.value = titleJa.value
      draftDescription.value = description.value
      draftDescriptionEn.value = descriptionEn.value
      draftDescriptionJa.value = descriptionJa.value
      draftImageUrl.value = imageUrl.value
      draftButtonText.value = buttonText.value
      draftButtonTextEn.value = buttonTextEn.value
      draftButtonTextJa.value = buttonTextJa.value
      draftButtonUrl.value = buttonUrl.value
      draftFormEnabled.value = formEnabled.value
      draftFormEndpoint.value = formEndpoint.value
      draftFormMethod.value = formMethod.value
      draftFormFields.value = cloneFormFields(formFields.value)
      draftFormSuccessMessage.value = formSuccessMessage.value
      draftFormSuccessMessageEn.value = formSuccessMessageEn.value
      draftFormSuccessMessageJa.value = formSuccessMessageJa.value
      draftFormSuccessUrl.value = formSuccessUrl.value
      draftTranslations.value = JSON.parse(JSON.stringify(translations.value || {}))
    }

    async function load() {
      if (import.meta.server) return

      const supabase = useSupabaseClient()

      const { data, error: fetchError } = await supabase
        .from('canvas_page_dialogs')
        .select('*')
        .eq('page_key', pageKey)
        .maybeSingle()

      if (!fetchError && data) {
        const row = data as any
        const trans = (row.translations as Record<string, DialogTranslation>) || {}
        enabled.value = row.enabled ?? false
        title.value = row.title ?? ''
        titleEn.value = trans.en?.title ?? row.title_en ?? row.titleEn ?? null
        titleJa.value = trans.ja?.title ?? row.title_ja ?? row.titleJa ?? null
        description.value = row.description ?? ''
        descriptionEn.value = trans.en?.description ?? row.description_en ?? row.descriptionEn ?? null
        descriptionJa.value = trans.ja?.description ?? row.description_ja ?? row.descriptionJa ?? null
        imageUrl.value = row.image_url ?? row.imageUrl ?? null
        buttonText.value = row.button_text ?? row.buttonText ?? 'OK'
        buttonTextEn.value = trans.en?.buttonText ?? row.button_text_en ?? row.buttonTextEn ?? null
        buttonTextJa.value = trans.ja?.buttonText ?? row.button_text_ja ?? row.buttonTextJa ?? null
        buttonUrl.value = row.button_url ?? row.buttonUrl ?? null
        formEnabled.value = row.form_enabled ?? row.formEnabled ?? false
        formEndpoint.value = row.form_endpoint ?? row.formEndpoint ?? ''
        formMethod.value = row.form_method ?? row.formMethod ?? 'POST'
        formFields.value = Array.isArray(row.form_fields)
          ? (row.form_fields as any[]).map(f => ({
              id: f.id || `field-${Math.random().toString(36).slice(2, 9)}`,
              type: f.type || 'text',
              name: f.name || '',
              label: f.label || '',
              labelEn: f.translations?.en?.label ?? f.labelEn ?? f.label_en ?? null,
              labelJa: f.translations?.ja?.label ?? f.labelJa ?? f.label_ja ?? null,
              placeholder: f.placeholder || '',
              placeholderEn: f.translations?.en?.placeholder ?? f.placeholderEn ?? f.placeholder_en ?? null,
              placeholderJa: f.translations?.ja?.placeholder ?? f.placeholderJa ?? f.placeholder_ja ?? null,
              required: !!f.required,
              translations: f.translations ? JSON.parse(JSON.stringify(f.translations)) : {}
            }))
          : []
        formSuccessMessage.value = row.form_success_message ?? row.formSuccessMessage ?? ''
        formSuccessMessageEn.value = trans.en?.formSuccessMessage ?? row.form_success_message_en ?? row.formSuccessMessageEn ?? null
        formSuccessMessageJa.value = trans.ja?.formSuccessMessage ?? row.form_success_message_ja ?? row.formSuccessMessageJa ?? null
        formSuccessUrl.value = row.form_success_url ?? row.formSuccessUrl ?? null
        translations.value = trans
      } else {
        enabled.value = false
        title.value = ''
        titleEn.value = null
        titleJa.value = null
        description.value = ''
        descriptionEn.value = null
        descriptionJa.value = null
        imageUrl.value = null
        buttonText.value = 'OK'
        buttonTextEn.value = null
        buttonTextJa.value = null
        buttonUrl.value = null
        formEnabled.value = false
        formEndpoint.value = ''
        formMethod.value = 'POST'
        formFields.value = []
        formSuccessMessage.value = ''
        formSuccessMessageEn.value = null
        formSuccessMessageJa.value = null
        formSuccessUrl.value = null
        translations.value = {}
      }

      resetDraft()
    }

    function setDraftEnabled(val: boolean) {
      draftEnabled.value = val
    }

    function setDraftTitle(val: string) {
      draftTitle.value = val
    }

    function setDraftTitleEn(val: string | null) {
      draftTitleEn.value = val
      setDraftTitleForLang('en', val)
    }

    function setDraftTitleJa(val: string | null) {
      draftTitleJa.value = val
      setDraftTitleForLang('ja', val)
    }

    function getDraftTitleForLang(lang: string = 'id'): string {
      if (lang === 'id') return draftTitle.value || ''
      if (draftTranslations.value[lang]?.title !== undefined) {
        return draftTranslations.value[lang]?.title || ''
      }
      if (lang === 'en') return draftTitleEn.value || ''
      if (lang === 'ja') return draftTitleJa.value || ''
      return ''
    }

    function setDraftTitleForLang(lang: string, val: string | null) {
      const clean = val && val.trim().length > 0 ? val : null
      if (lang === 'id') {
        draftTitle.value = val || ''
        return
      }
      if (!draftTranslations.value[lang]) draftTranslations.value[lang] = {}
      draftTranslations.value[lang].title = clean || undefined
      if (lang === 'en') draftTitleEn.value = clean
      if (lang === 'ja') draftTitleJa.value = clean
    }

    function setDraftDescription(val: string) {
      draftDescription.value = val
    }

    function setDraftDescriptionEn(val: string | null) {
      draftDescriptionEn.value = val
      setDraftDescriptionForLang('en', val)
    }

    function setDraftDescriptionJa(val: string | null) {
      draftDescriptionJa.value = val
      setDraftDescriptionForLang('ja', val)
    }

    function getDraftDescriptionForLang(lang: string = 'id'): string {
      if (lang === 'id') return draftDescription.value || ''
      if (draftTranslations.value[lang]?.description !== undefined) {
        return draftTranslations.value[lang]?.description || ''
      }
      if (lang === 'en') return draftDescriptionEn.value || ''
      if (lang === 'ja') return draftDescriptionJa.value || ''
      return ''
    }

    function setDraftDescriptionForLang(lang: string, val: string | null) {
      const clean = val && val.trim().length > 0 ? val : null
      if (lang === 'id') {
        draftDescription.value = val || ''
        return
      }
      if (!draftTranslations.value[lang]) draftTranslations.value[lang] = {}
      draftTranslations.value[lang].description = clean || undefined
      if (lang === 'en') draftDescriptionEn.value = clean
      if (lang === 'ja') draftDescriptionJa.value = clean
    }

    function setDraftImageUrl(val: string | null) {
      draftImageUrl.value = val
    }

    async function setDraftImageFile(file: File) {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      draftImageUrl.value = dataUrl
    }

    function resetDraftImage() {
      draftImageUrl.value = null
    }

    function setDraftButtonText(val: string) {
      draftButtonText.value = val
    }

    function setDraftButtonTextEn(val: string | null) {
      draftButtonTextEn.value = val
      setDraftButtonTextForLang('en', val)
    }

    function setDraftButtonTextJa(val: string | null) {
      draftButtonTextJa.value = val
      setDraftButtonTextForLang('ja', val)
    }

    function getDraftButtonTextForLang(lang: string = 'id'): string {
      if (lang === 'id') return draftButtonText.value || 'OK'
      if (draftTranslations.value[lang]?.buttonText !== undefined) {
        return draftTranslations.value[lang]?.buttonText || ''
      }
      if (lang === 'en') return draftButtonTextEn.value || ''
      if (lang === 'ja') return draftButtonTextJa.value || ''
      return ''
    }

    function setDraftButtonTextForLang(lang: string, val: string | null) {
      const clean = val && val.trim().length > 0 ? val : null
      if (lang === 'id') {
        draftButtonText.value = val || 'OK'
        return
      }
      if (!draftTranslations.value[lang]) draftTranslations.value[lang] = {}
      draftTranslations.value[lang].buttonText = clean || undefined
      if (lang === 'en') draftButtonTextEn.value = clean
      if (lang === 'ja') draftButtonTextJa.value = clean
    }

    function setDraftButtonUrl(val: string | null) {
      draftButtonUrl.value = val
    }

    function setDraftFormEnabled(val: boolean) {
      draftFormEnabled.value = val
    }

    function setDraftFormEndpoint(val: string) {
      draftFormEndpoint.value = val
    }

    function setDraftFormMethod(val: string) {
      draftFormMethod.value = val
    }

    function addDraftFormField(type: FormFieldType = 'text', label: string = 'Input Baru') {
      const newField: FormFieldConfig = {
        id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        name: `field_${draftFormFields.value.length + 1}`,
        label,
        labelEn: null,
        labelJa: null,
        placeholder: '',
        placeholderEn: null,
        placeholderJa: null,
        required: false,
        translations: {}
      }
      draftFormFields.value.push(newField)
    }

    function updateDraftFormField(id: string, patch: Partial<FormFieldConfig>) {
      const index = draftFormFields.value.findIndex(f => f.id === id)
      if (index === -1) return
      const current = draftFormFields.value[index]
      draftFormFields.value[index] = { ...current, ...patch }
    }

    function getFieldLabelForLang(field: FormFieldConfig, lang: string = 'id'): string {
      if (lang === 'id') return field.label || ''
      if (field.translations?.[lang]?.label !== undefined) {
        return field.translations[lang].label || ''
      }
      if (lang === 'en') return field.labelEn || ''
      if (lang === 'ja') return field.labelJa || ''
      return ''
    }

    function setFieldLabelForLang(fieldId: string, lang: string, val: string | null) {
      const field = draftFormFields.value.find(f => f.id === fieldId)
      if (!field) return
      const clean = val && val.trim().length > 0 ? val : null
      if (lang === 'id') {
        field.label = val || ''
        return
      }
      if (!field.translations) field.translations = {}
      if (!field.translations[lang]) field.translations[lang] = {}
      field.translations[lang].label = clean || undefined
      if (lang === 'en') field.labelEn = clean
      if (lang === 'ja') field.labelJa = clean
    }

    function getFieldPlaceholderForLang(field: FormFieldConfig, lang: string = 'id'): string {
      if (lang === 'id') return field.placeholder || ''
      if (field.translations?.[lang]?.placeholder !== undefined) {
        return field.translations[lang].placeholder || ''
      }
      if (lang === 'en') return field.placeholderEn || ''
      if (lang === 'ja') return field.placeholderJa || ''
      return ''
    }

    function setFieldPlaceholderForLang(fieldId: string, lang: string, val: string | null) {
      const field = draftFormFields.value.find(f => f.id === fieldId)
      if (!field) return
      const clean = val && val.trim().length > 0 ? val : null
      if (lang === 'id') {
        field.placeholder = val || ''
        return
      }
      if (!field.translations) field.translations = {}
      if (!field.translations[lang]) field.translations[lang] = {}
      field.translations[lang].placeholder = clean || undefined
      if (lang === 'en') field.placeholderEn = clean
      if (lang === 'ja') field.placeholderJa = clean
    }

    function removeDraftFormField(id: string) {
      draftFormFields.value = draftFormFields.value.filter(f => f.id !== id)
    }

    function reorderDraftFormFields(fromIndex: number, toIndex: number) {
      if (fromIndex < 0 || fromIndex >= draftFormFields.value.length) return
      if (toIndex < 0 || toIndex >= draftFormFields.value.length) return
      const list = [...draftFormFields.value]
      const [moved] = list.splice(fromIndex, 1)
      list.splice(toIndex, 0, moved)
      draftFormFields.value = list
    }

    function setDraftFormSuccessMessage(val: string) {
      draftFormSuccessMessage.value = val
    }

    function setDraftFormSuccessMessageEn(val: string | null) {
      draftFormSuccessMessageEn.value = val
      setDraftFormSuccessMessageForLang('en', val)
    }

    function setDraftFormSuccessMessageJa(val: string | null) {
      draftFormSuccessMessageJa.value = val
      setDraftFormSuccessMessageForLang('ja', val)
    }

    function getDraftFormSuccessMessageForLang(lang: string = 'id'): string {
      if (lang === 'id') return draftFormSuccessMessage.value || ''
      if (draftTranslations.value[lang]?.formSuccessMessage !== undefined) {
        return draftTranslations.value[lang]?.formSuccessMessage || ''
      }
      if (lang === 'en') return draftFormSuccessMessageEn.value || ''
      if (lang === 'ja') return draftFormSuccessMessageJa.value || ''
      return ''
    }

    function setDraftFormSuccessMessageForLang(lang: string, val: string | null) {
      const clean = val && val.trim().length > 0 ? val : null
      if (lang === 'id') {
        draftFormSuccessMessage.value = val || ''
        return
      }
      if (!draftTranslations.value[lang]) draftTranslations.value[lang] = {}
      draftTranslations.value[lang].formSuccessMessage = clean || undefined
      if (lang === 'en') draftFormSuccessMessageEn.value = clean
      if (lang === 'ja') draftFormSuccessMessageJa.value = clean
    }

    function setDraftFormSuccessUrl(val: string | null) {
      draftFormSuccessUrl.value = val
    }

    function openModal() {
      isModalOpen.value = true
    }

    function closeModal() {
      isModalOpen.value = false
    }

    async function save() {
      if (import.meta.server || !isDirty.value) return

      saving.value = true
      error.value = null

      const supabase = useSupabaseClient()

      try {
        const trans = { ...(draftTranslations.value || {}) }
        if (draftTitleEn.value || draftDescriptionEn.value || draftButtonTextEn.value || draftFormSuccessMessageEn.value) {
          if (!trans.en) trans.en = {}
          if (draftTitleEn.value) trans.en.title = draftTitleEn.value
          if (draftDescriptionEn.value) trans.en.description = draftDescriptionEn.value
          if (draftButtonTextEn.value) trans.en.buttonText = draftButtonTextEn.value
          if (draftFormSuccessMessageEn.value) trans.en.formSuccessMessage = draftFormSuccessMessageEn.value
        }
        if (draftTitleJa.value || draftDescriptionJa.value || draftButtonTextJa.value || draftFormSuccessMessageJa.value) {
          if (!trans.ja) trans.ja = {}
          if (draftTitleJa.value) trans.ja.title = draftTitleJa.value
          if (draftDescriptionJa.value) trans.ja.description = draftDescriptionJa.value
          if (draftButtonTextJa.value) trans.ja.buttonText = draftButtonTextJa.value
          if (draftFormSuccessMessageJa.value) trans.ja.formSuccessMessage = draftFormSuccessMessageJa.value
        }

        const payload = {
          enabled: draftEnabled.value,
          title: draftTitle.value,
          titleEn: draftTitleEn.value,
          titleJa: draftTitleJa.value,
          title_en: draftTitleEn.value,
          title_ja: draftTitleJa.value,
          description: draftDescription.value,
          descriptionEn: draftDescriptionEn.value,
          descriptionJa: draftDescriptionJa.value,
          description_en: draftDescriptionEn.value,
          description_ja: draftDescriptionJa.value,
          imageUrl: draftImageUrl.value,
          image_url: draftImageUrl.value,
          buttonText: draftButtonText.value,
          button_text: draftButtonText.value,
          buttonTextEn: draftButtonTextEn.value,
          buttonTextJa: draftButtonTextJa.value,
          button_text_en: draftButtonTextEn.value,
          button_text_ja: draftButtonTextJa.value,
          buttonUrl: draftButtonUrl.value,
          button_url: draftButtonUrl.value,
          formEnabled: draftFormEnabled.value,
          form_enabled: draftFormEnabled.value,
          formEndpoint: draftFormEndpoint.value,
          form_endpoint: draftFormEndpoint.value,
          formMethod: draftFormMethod.value,
          form_method: draftFormMethod.value,
          formFields: draftFormFields.value.map(f => ({
            ...f,
            labelEn: f.translations?.en?.label ?? f.labelEn,
            labelJa: f.translations?.ja?.label ?? f.labelJa,
            label_en: f.translations?.en?.label ?? f.labelEn,
            label_ja: f.translations?.ja?.label ?? f.labelJa,
            placeholderEn: f.translations?.en?.placeholder ?? f.placeholderEn,
            placeholderJa: f.translations?.ja?.placeholder ?? f.placeholderJa,
            placeholder_en: f.translations?.en?.placeholder ?? f.placeholderEn,
            placeholder_ja: f.translations?.ja?.placeholder ?? f.placeholderJa
          })),
          form_fields: draftFormFields.value.map(f => ({
            ...f,
            labelEn: f.translations?.en?.label ?? f.labelEn,
            labelJa: f.translations?.ja?.label ?? f.labelJa,
            label_en: f.translations?.en?.label ?? f.labelEn,
            label_ja: f.translations?.ja?.label ?? f.labelJa,
            placeholderEn: f.translations?.en?.placeholder ?? f.placeholderEn,
            placeholderJa: f.translations?.ja?.placeholder ?? f.placeholderJa,
            placeholder_en: f.translations?.en?.placeholder ?? f.placeholderEn,
            placeholder_ja: f.translations?.ja?.placeholder ?? f.placeholderJa
          })),
          formSuccessMessage: draftFormSuccessMessage.value,
          form_success_message: draftFormSuccessMessage.value,
          formSuccessMessageEn: draftFormSuccessMessageEn.value,
          formSuccessMessageJa: draftFormSuccessMessageJa.value,
          form_success_message_en: draftFormSuccessMessageEn.value,
          form_success_message_ja: draftFormSuccessMessageJa.value,
          formSuccessUrl: draftFormSuccessUrl.value,
          form_success_url: draftFormSuccessUrl.value,
          translations: trans
        }

        const { error: rpcError } = await supabase.rpc('save_page_dialog', {
          p_page_key: pageKey,
          p_dialog: payload
        })

        if (rpcError) throw rpcError

        enabled.value = draftEnabled.value
        title.value = draftTitle.value
        titleEn.value = draftTitleEn.value
        titleJa.value = draftTitleJa.value
        description.value = draftDescription.value
        descriptionEn.value = draftDescriptionEn.value
        descriptionJa.value = draftDescriptionJa.value
        imageUrl.value = draftImageUrl.value
        buttonText.value = draftButtonText.value
        buttonTextEn.value = draftButtonTextEn.value
        buttonTextJa.value = draftButtonTextJa.value
        buttonUrl.value = draftButtonUrl.value
        formEnabled.value = draftFormEnabled.value
        formEndpoint.value = draftFormEndpoint.value
        formMethod.value = draftFormMethod.value
        formFields.value = cloneFormFields(draftFormFields.value)
        formSuccessMessage.value = draftFormSuccessMessage.value
        formSuccessMessageEn.value = draftFormSuccessMessageEn.value
        formSuccessMessageJa.value = draftFormSuccessMessageJa.value
        formSuccessUrl.value = draftFormSuccessUrl.value
        translations.value = trans
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Gagal menyimpan dialog halaman.'
        throw e
      } finally {
        saving.value = false
      }
    }

    return {
      enabled,
      title,
      titleEn,
      titleJa,
      description,
      descriptionEn,
      descriptionJa,
      imageUrl,
      buttonText,
      buttonTextEn,
      buttonTextJa,
      buttonUrl,
      formEnabled,
      formEndpoint,
      formMethod,
      formFields,
      formSuccessMessage,
      formSuccessMessageEn,
      formSuccessMessageJa,
      formSuccessUrl,
      translations,
      draftEnabled,
      draftTitle,
      draftTitleEn,
      draftTitleJa,
      draftDescription,
      draftDescriptionEn,
      draftDescriptionJa,
      draftImageUrl,
      draftButtonText,
      draftButtonTextEn,
      draftButtonTextJa,
      draftButtonUrl,
      draftFormEnabled,
      draftFormEndpoint,
      draftFormMethod,
      draftFormFields,
      draftFormSuccessMessage,
      draftFormSuccessMessageEn,
      draftFormSuccessMessageJa,
      draftFormSuccessUrl,
      draftTranslations,
      isModalOpen,
      saving,
      error,
      isDirty,
      effectiveConfig,
      load,
      resetDraft,
      setDraftEnabled,
      setDraftTitle,
      setDraftTitleEn,
      setDraftTitleJa,
      getDraftTitleForLang,
      setDraftTitleForLang,
      setDraftDescription,
      setDraftDescriptionEn,
      setDraftDescriptionJa,
      getDraftDescriptionForLang,
      setDraftDescriptionForLang,
      setDraftImageUrl,
      setDraftImageFile,
      resetDraftImage,
      setDraftButtonText,
      setDraftButtonTextEn,
      setDraftButtonTextJa,
      getDraftButtonTextForLang,
      setDraftButtonTextForLang,
      setDraftButtonUrl,
      setDraftFormEnabled,
      setDraftFormEndpoint,
      setDraftFormMethod,
      addDraftFormField,
      addFormField: addDraftFormField,
      updateDraftFormField,
      updateFormField: updateDraftFormField,
      getFieldLabelForLang,
      setFieldLabelForLang,
      getFieldPlaceholderForLang,
      setFieldPlaceholderForLang,
      removeDraftFormField,
      removeFormField: removeDraftFormField,
      reorderDraftFormFields,
      reorderFormField: reorderDraftFormFields,
      setDraftFormSuccessMessage,
      setDraftFormSuccessMessageEn,
      setDraftFormSuccessMessageJa,
      getDraftFormSuccessMessageForLang,
      setDraftFormSuccessMessageForLang,
      setDraftFormSuccessUrl,
      openModal,
      closeModal,
      save
    }
  })()
}
