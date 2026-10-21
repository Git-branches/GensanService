import { useCallback, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { CATEGORY_ICON_NAMES, renderCategoryIcon } from '../../utils/icons'
import { adminApi } from '../api'
import { canEditContent, useAdminAuth } from '../auth'
import { useAdminList } from '../useAdminList'
import FormModal from '../components/FormModal'
import ResourceTable from '../components/ResourceTable'
import Toast from '../components/Toast'
import { ActiveBadge, Button, Field, IconAction, PageTitle, Switch, inputClass } from '../components/ui'

const EMPTY = { name: '', slug: '', description: '', icon: 'file-text', display_order: '0', is_active: true }

function toForm(category) {
  if (!category) return EMPTY
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    icon: category.icon ?? '',
    display_order: String(category.display_order ?? 0),
    is_active: Boolean(category.is_active),
  }
}

function CategoryFormModal({ category, nextOrder, readOnly, onClose, onSaved }) {
  return (
    <FormModal
      title={category ? `Edit ${category.name}` : 'Add category'}
      description="Categories group guides on the homepage and the service search."
      initialValues={category ? toForm(category) : { ...EMPTY, display_order: String(nextOrder) }}
      readOnly={readOnly}
      submitLabel={category ? 'Save changes' : 'Add category'}
      onClose={onClose}
      onSaved={() => onSaved(category ? 'Category updated.' : 'Category added.')}
      onSubmit={(values) => {
        const payload = { ...values, display_order: Number(values.display_order) }
        return category ? adminApi.update('categories', category.id, payload) : adminApi.create('categories', payload)
      }}
    >
      {(values, set, errors) => (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field id="category-name" label="Category name" required error={errors.name}>
              <input id="category-name" data-autofocus value={values.name} maxLength={100} aria-invalid={Boolean(errors.name)} onChange={(e) => set({ name: e.target.value })} className={inputClass} placeholder="e.g. Social Security" />
            </Field>
            <Field id="category-order" label="Display order" error={errors.display_order}>
              <input id="category-order" type="number" min={0} max={999} value={values.display_order} onChange={(e) => set({ display_order: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <Field id="category-slug" label="Web address" error={errors.slug} hint="Leave blank to create it from the name.">
            <div className="flex items-center rounded-lg border border-stone-300 bg-stone-50 focus-within:border-bay-500 focus-within:ring-2 focus-within:ring-bay-500/20">
              <span className="shrink-0 whitespace-nowrap pl-3 text-sm text-stone-500">?category=</span>
              <input id="category-slug" value={values.slug} maxLength={120} aria-invalid={Boolean(errors.slug)} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} className="w-full rounded-r-lg bg-white px-2 py-2 text-sm focus:outline-none" />
            </div>
          </Field>

          <Field id="category-description" label="Short description" error={errors.description}>
            <input id="category-description" value={values.description} maxLength={255} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold text-stone-700">Icon</legend>
            {errors.icon && <p className="mt-1 text-xs font-medium text-red-600">{errors.icon}</p>}
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CATEGORY_ICON_NAMES.map((name) => (
                <label
                  key={name}
                  title={name}
                  className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors has-focus-visible:ring-2 has-focus-visible:ring-bay-500 ${
                    values.icon === name ? 'bg-bay-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <input type="radio" name="category-icon" value={name} checked={values.icon === name} onChange={() => set({ icon: name })} className="sr-only" aria-label={name.replace('-', ' ')} />
                  {renderCategoryIcon(name, { size: 20 })}
                </label>
              ))}
            </div>
          </fieldset>

          <Switch
            id="category-active"
            label="Show on the public site"
            description="Inactive categories are hidden from browsing."
            checked={values.is_active}
            onChange={(is_active) => set({ is_active })}
            error={errors.is_active}
          />
        </>
      )}
    </FormModal>
  )
}

export default function AdminCategoriesPage() {
  usePageTitle('Categories · Admin')
  const { admin } = useAdminAuth()
  const canEdit = canEditContent(admin)
  const { data, error, loading, reload } = useAdminList('categories')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const dismissToast = useCallback(() => setToast(''), [])

  const needle = search.trim().toLowerCase()
  const rows = data?.filter((c) => !needle || c.name.toLowerCase().includes(needle))
  const nextOrder = (data ?? []).reduce((max, c) => Math.max(max, Number(c.display_order)), 0) + 1

  const columns = [
    { key: 'order', label: 'Order', className: 'md:w-20', render: (c) => <span className="tabular-nums text-stone-500">{c.display_order}</span> },
    {
      key: 'name',
      label: 'Category',
      render: (c) => (
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bay-50 text-bay-700 ring-1 ring-bay-100">
            {renderCategoryIcon(c.icon, { size: 18 })}
          </span>
          <span>
            <span className="block font-semibold text-bay-900">{c.name}</span>
            {c.description && <span className="block text-xs text-stone-500">{c.description}</span>}
          </span>
        </span>
      ),
    },
    { key: 'guides', label: 'Live guides', className: 'whitespace-nowrap', render: (c) => <span className="text-stone-700">{c.published_count} <span className="text-stone-400">of {c.service_count}</span></span> },
    { key: 'status', label: 'Status', render: (c) => <ActiveBadge active={Boolean(c.is_active)} /> },
    {
      key: 'actions',
      label: <span className="sr-only">Actions</span>,
      className: 'md:w-px',
      render: (c) => (
        <div className="flex md:justify-end">
          <IconAction label={`${canEdit ? 'Edit' : 'View'} ${c.name}`} onClick={() => setEditing(c)}>
            <Pencil size={16} />
          </IconAction>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Categories"
        description="How guides are grouped on the homepage and in search. Lower display order appears first."
        action={
          canEdit && (
            <Button onClick={() => setEditing('new')}>
              <Plus size={17} aria-hidden="true" /> Add category
            </Button>
          )
        }
      />
      <ResourceTable
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search categories"
        loading={loading}
        error={error}
        rows={rows}
        columns={columns}
        emptyText="No categories match your search."
      />

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
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
