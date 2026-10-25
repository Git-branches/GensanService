import { useId, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from '../../components/Modal'
import { Button } from './ui'

// Mount it only while open (conditional render) so each opening starts from `initialValues`.
export default function FormModal({ title, description, initialValues, onSubmit, onClose, onSaved, submitLabel = 'Save', readOnly = false, children }) {
  const formId = useId()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (patch) => setValues((current) => ({ ...current, ...patch }))

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setError('')
    try {
      await onSubmit(values)
      onSaved()
    } catch (err) {
      setErrors(err.details || {})
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button type="submit" form={formId} loading={saving}>
              {submitLabel}
            </Button>
          )}
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {error && (
          <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        <fieldset disabled={readOnly || saving} className="space-y-4">
          {children(values, set, errors)}
        </fieldset>
      </form>
    </Modal>
  )
}
