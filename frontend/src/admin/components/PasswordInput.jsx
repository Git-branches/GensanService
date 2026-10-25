import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from './ui'

export default function PasswordInput({ id, value, onChange, error, autoComplete = 'new-password', ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`${inputClass} pr-10`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-500 hover:text-stone-700"
      >
        {shown ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
