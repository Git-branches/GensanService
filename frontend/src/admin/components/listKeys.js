let keySequence = 0

// Stable React keys for rows the admin can add, remove, and reorder.
export function withKey(item) {
  keySequence += 1
  return { ...item, _key: keySequence }
}
