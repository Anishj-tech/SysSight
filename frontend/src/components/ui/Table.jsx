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
    <div className={`w-full overflow-x-auto overflow-y-auto border border-mist rounded-md bg-paper ${maxHeight} ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead className="sticky top-0 bg-mist/60 z-10 border-b border-mist shadow-sm backdrop-blur-sm">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable && onSort;
              const isSorted = sortColumn === col.key;

              return (
                <th
                  key={col.key}
                  onClick={() => isSortable && onSort(col.key)}
                  className={`px-3 py-2.5 font-semibold text-navy select-none whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${isSortable ? 'cursor-pointer hover:text-ink transition-colors' : ''} ${
                    col.headerClassName || ''
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''
                    }`}
                  >
                    <span>{col.label}</span>
                    {isSortable && (
                      <span className="text-navy/50">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-amber" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-amber" />
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
        <tbody className="divide-y divide-mist/60 bg-paper font-mono">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-navy/60 font-sans italic"
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
                  className="hover:bg-mist/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-ink whitespace-nowrap text-[11px] ${
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
