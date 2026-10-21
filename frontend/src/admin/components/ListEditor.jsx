import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui'
import { withKey } from './listKeys'

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md p-1.5 text-stone-500 hover:bg-white hover:text-bay-700 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

export default function ListEditor({ items, onChange, renderItem, newItem, addLabel, itemName, max = 50, emptyText }) {
  function move(index, offset) {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + offset, 0, moved)
    onChange(next)
  }

  function patchItem(index, patch) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && emptyText && <p className="text-sm text-stone-500">{emptyText}</p>}

      {items.map((item, index) => (
        <div key={item._key} className="flex gap-3 rounded-xl bg-stone-50 p-3">
          <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-bay-100 text-xs font-bold text-bay-800">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-2">{renderItem(item, index, (patch) => patchItem(index, patch))}</div>
          <div className="flex shrink-0 flex-col">
            <IconButton label={`Move ${itemName} ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
              <ArrowUp size={16} />
            </IconButton>
            <IconButton
              label={`Move ${itemName} ${index + 1} down`}
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown size={16} />
            </IconButton>
            <IconButton label={`Remove ${itemName} ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        </div>
      ))}

      {items.length < max && (
        <Button variant="secondary" onClick={() => onChange([...items, withKey(newItem())])}>
          <Plus size={16} aria-hidden="true" /> {addLabel}
        </Button>
      )}
    </div>
  )
}
