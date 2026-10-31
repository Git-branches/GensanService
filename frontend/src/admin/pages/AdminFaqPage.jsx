import { useCallback, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { adminApi } from '../api'
import { canEditContent, useAdminAuth } from '../auth'
import { useAdminList } from '../useAdminList'
import FormModal from '../components/FormModal'
import ResourceTable from '../components/ResourceTable'
import Toast from '../components/Toast'
import { ActiveBadge, Button, Field, IconAction, PageTitle, Switch, inputClass } from '../components/ui'

const CATEGORIES = [
  { value: 'about', label: 'About' },
  { value: 'guides', label: 'Using guides' },
  { value: 'directory', label: 'Agencies and offices' },
  { value: 'accuracy', label: 'Accuracy and reports' },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ceb', label: 'Bisaya' },
  { code: 'fil', label: 'Filipino' },
  { code: 'hil', label: 'Hiligaynon' },
]

function toForm(faq, nextOrder) {
  return {
    category: faq?.category ?? 'about',
    display_order: String(faq?.display_order ?? nextOrder),
    is_active: faq ? Boolean(faq.is_active) : true,
    translations: Object.fromEntries(
      LANGUAGES.map(({ code }) => [code, { question: faq?.translations[code]?.question ?? '', answer: faq?.translations[code]?.answer ?? '' }]),
    ),
  }
}

function LanguageFields({ language, values, set, errors }) {
  const text = values.translations[language.code]
  const update = (patch) => set({ translations: { ...values.translations, [language.code]: { ...text, ...patch } } })
  const required = language.code === 'en'
  const questionKey = `translations.${language.code}.question`
  const answerKey = `translations.${language.code}.answer`

  return (
    <fieldset className="space-y-3 rounded-lg bg-stone-50 p-4">
      <legend className="float-left mb-2 text-sm font-bold text-bay-950">
        {language.label}{!required && <span className="ml-1 font-normal text-stone-500">(blank shows English)</span>}
      </legend>
      <div className="clear-both space-y-3">
        <Field id={`faq-q-${language.code}`} label="Question" required={required} error={errors[questionKey]}>
          <input id={`faq-q-${language.code}`} value={text.question} maxLength={255} aria-invalid={Boolean(errors[questionKey])} onChange={(e) => update({ question: e.target.value })} className={inputClass} />
        </Field>
        <Field id={`faq-a-${language.code}`} label="Answer" required={required} error={errors[answerKey]}>
          <textarea id={`faq-a-${language.code}`} rows={3} maxLength={3000} value={text.answer} aria-invalid={Boolean(errors[answerKey])} onChange={(e) => update({ answer: e.target.value })} className={inputClass} />
        </Field>
      </div>
    </fieldset>
  )
}

function FaqFormModal({ faq, nextOrder, readOnly, onClose, onSaved }) {
  return (
    <FormModal
      title={faq ? 'Edit question' : 'Add question'}
      description="Questions appear on the FAQ page, and the first three on the home page."
      initialValues={toForm(faq, nextOrder)}
      readOnly={readOnly}
      submitLabel={faq ? 'Save changes' : 'Add question'}
      onClose={onClose}
      onSaved={() => onSaved(faq ? 'Question updated.' : 'Question added.')}
      onSubmit={(values) => {
        const payload = { ...values, display_order: Number(values.display_order) }
        return faq ? adminApi.update('faqs', faq.id, payload) : adminApi.create('faqs', payload)
      }}
    >
      {(values, set, errors) => (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field id="faq-category" label="Category" required error={errors.category}>
              <select id="faq-category" data-autofocus value={values.category} onChange={(e) => set({ category: e.target.value })} className={inputClass}>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </Field>
            <Field id="faq-order" label="Order" error={errors.display_order}>
              <input id="faq-order" type="number" min={0} max={9999} value={values.display_order} onChange={(e) => set({ display_order: e.target.value })} className={inputClass} />
            </Field>
          </div>

          {LANGUAGES.map((language) => (
            <LanguageFields key={language.code} language={language} values={values} set={set} errors={errors} />
          ))}

          <Switch
            id="faq-active"
            label="Show on the public site"
            description="Hidden questions stay here and can be shown again."
            checked={values.is_active}
            onChange={(is_active) => set({ is_active })}
          />
        </>
      )}
    </FormModal>
  )
}

export default function AdminFaqPage() {
  usePageTitle('FAQ · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const { data, error, loading, reload } = useAdminList('faqs')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  const needle = search.trim().toLowerCase()
  const rows = data?.filter((faq) => !needle || (faq.translations.en?.question ?? '').toLowerCase().includes(needle))
  const nextOrder = (data ?? []).reduce((max, faq) => Math.max(max, Number(faq.display_order)), 0) + 1

  const columns = [
    { key: 'order', label: 'Order', className: 'md:w-20', render: (faq) => <span className="tabular-nums text-stone-500">{faq.display_order}</span> },
    { key: 'question', label: 'Question', render: (faq) => <span className="font-semibold text-bay-900">{faq.translations.en?.question}</span> },
    { key: 'category', label: 'Category', hideBelow: 'xl', className: 'whitespace-nowrap', render: (faq) => <span className="text-stone-700">{CATEGORIES.find((c) => c.value === faq.category)?.label ?? faq.category}</span> },
    {
      key: 'languages',
      label: 'Languages',
      className: 'whitespace-nowrap',
      render: (faq) => <span className="text-stone-700">{LANGUAGES.filter(({ code }) => faq.translations[code]).length} of {LANGUAGES.length}</span>,
    },
    { key: 'status', label: 'Status', render: (faq) => <ActiveBadge active={Boolean(faq.is_active)} /> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (faq) => (
        <div className="flex md:justify-end">
          <IconAction label={`${canEdit ? 'Edit' : 'View'} question ${faq.translations.en?.question ?? ''}`} onClick={() => setEditing(faq)}>
            <Pencil size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="FAQ"
        description="Questions and answers shown to residents. Lower order numbers appear first."
        action={
          canEdit && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={17} aria-hidden="true" /> Add question
            </Button>
          )
        }
      />
      <ResourceTable search={search} onSearch={setSearch} searchPlaceholder="Search questions" loading={loading} error={error} rows={rows} columns={columns} emptyText="No questions match your search." />

      {editing && (
        <FaqFormModal
          faq={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          readOnly={!canEdit}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null)
            setToast(message)
            reload()
          }}
        />
      )}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  )
}
