import { Search } from 'lucide-react'
import { SURFACE } from './ui'

// Columns can set `hideBelow: 'xl'` to drop secondary details on narrower screens so the table always fits.
const HIDE_BELOW = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }

function cellClass(column) {
  return [column.hideBelow ? HIDE_BELOW[column.hideBelow] : '', column.className || ''].join(' ')
}

export function TableToolbar({ search, onSearch, searchPlaceholder, children }) {
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-3 p-3 ${SURFACE}`}>
      <div className="relative min-w-56 flex-1 basis-72">
        <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <label className="sr-only" htmlFor="resource-search">
          {searchPlaceholder}
        </label>
        <input
          id="resource-search"
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg bg-stone-50 py-2.5 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bay-500/30"
        />
      </div>
      {children}
    </div>
  )
}

export function DataTable({ loading, error, rows, columns, emptyText }) {
  return (
    <div className={`mt-4 overflow-hidden ${SURFACE}`}>
      {loading && !rows && (
        <div role="status" aria-label="Loading" className="space-y-1 p-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg px-3 py-3.5">
              <div className="h-3.5 w-1/3 rounded bg-stone-200" />
              <div className="h-3.5 w-16 rounded-full bg-stone-100" />
              <div className="h-3.5 w-24 rounded bg-stone-100" />
              <div className="ml-auto h-3.5 w-12 rounded bg-stone-100" />
            </div>
          ))}
        </div>
      )}
      {error && <p className="p-6 text-sm text-red-600">{error}</p>}
      {rows && rows.length === 0 && <p className="p-12 text-center text-sm text-stone-500">{emptyText}</p>}

      {rows && rows.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="hidden text-xs font-semibold uppercase tracking-wider text-stone-400 md:table-header-group">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 pb-2 pt-4 first:pl-6 last:pr-6 ${cellClass(column)}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="flex flex-col gap-1.5 px-6 py-4 transition-colors hover:bg-stone-50/80 md:table-row md:p-0">
                {columns.map((column) => (
                  <td key={column.key} className={`align-middle md:px-4 md:py-3.5 md:first:pl-6 md:last:pr-6 ${cellClass(column)}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function ResourceTable({ search, onSearch, searchPlaceholder, toolbar, ...tableProps }) {
  return (
    <>
      <TableToolbar search={search} onSearch={onSearch} searchPlaceholder={searchPlaceholder}>
        {toolbar}
      </TableToolbar>
      <DataTable {...tableProps} />
    </>
  )
}
