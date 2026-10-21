import { createElement } from 'react'
import {
  Briefcase,
  FileText,
  FolderOpen,
  HeartPulse,
  Home,
  IdCard,
  Receipt,
  Shield,
} from 'lucide-react'

const ICON_MAP = {
  'file-text': FileText,
  shield: Shield,
  'heart-pulse': HeartPulse,
  home: Home,
  briefcase: Briefcase,
  receipt: Receipt,
  'id-card': IdCard,
}

// Must match the allowed icons in backend/app/Controllers/Admin/CategoryController.php.
export const CATEGORY_ICON_NAMES = Object.keys(ICON_MAP)

export function renderCategoryIcon(name, props) {
  return createElement(ICON_MAP[name] || FolderOpen, { 'aria-hidden': true, ...props })
}
