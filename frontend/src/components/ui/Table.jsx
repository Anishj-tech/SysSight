import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function Table({
  columns = [],
  data = [],
  sortColumn = null,
  sortDirection = 'asc',
  onSort = null,
  rowKey = 'id',
  emptyMessage = 'No data available',
  className = '',
  maxHeight = 'max-h-96',
}) {
  return (
    <div className={`w-full overflow-x-auto overflow-y-auto border border-slate-800 light:border-slate-200 rounded-md ${maxHeight} ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead className="sticky top-0 bg-slate-900 light:bg-slate-100 z-10 border-b border-slate-800 light:border-slate-200 shadow-sm">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable && onSort;
              const isSorted = sortColumn === col.key;

              return (
                <th
                  key={col.key}
                  onClick={() => isSortable && onSort(col.key)}
                  className={`px-3 py-2.5 font-medium text-slate-400 light:text-slate-600 select-none whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${isSortable ? 'cursor-pointer hover:text-slate-200 light:hover:text-slate-900 transition-colors' : ''} ${
                    col.headerClassName || ''
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''
                    }`}
                  >
                    <span>{col.label}</span>
                    {isSortable && (
                      <span className="text-slate-500 light:text-slate-400">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-sky-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-sky-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 light:divide-slate-200/80 bg-slate-950/40 light:bg-white font-mono">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-500 light:text-slate-400 font-sans italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] || index;
              return (
                <tr
                  key={key}
                  className="hover:bg-slate-800/40 light:hover:bg-slate-50/90 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-slate-300 light:text-slate-700 whitespace-nowrap text-[11px] ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, index) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
