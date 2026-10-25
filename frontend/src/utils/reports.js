// Must match ReportController::REASONS in the backend.
export const REPORT_REASONS = [
  { value: 'outdated_requirements', label: 'Requirements are outdated or incomplete' },
  { value: 'wrong_fee', label: 'Fee or processing time is wrong' },
  { value: 'wrong_steps', label: 'Application steps are wrong' },
  { value: 'office_details', label: 'Office address, hours, or contact is wrong' },
  { value: 'broken_link', label: 'A link is broken' },
  { value: 'other', label: 'Something else' },
]

export function reasonLabel(value) {
  return REPORT_REASONS.find((reason) => reason.value === value)?.label ?? value
}
