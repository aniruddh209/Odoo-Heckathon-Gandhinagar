import React from 'react';
import { Loader2 } from 'lucide-react';
import EmptyState from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  isLoading = false,
  emptyMessage = 'No records found',
  emptyDescription = 'There is currently no data to display in this table.',
  emptyAction,
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((col, idx) => (
                <th
                  key={col.id || col.header || idx}
                  className={`py-3 px-4 ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState
                    title={emptyMessage}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`transition-colors duration-100 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-blue-50/40 active:bg-blue-50/70'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.id || colIdx}
                      className={`py-3.5 px-4 text-slate-700 align-middle ${col.cellClassName || ''}`}
                    >
                      {col.render
                        ? col.render(item, rowIdx)
                        : col.accessor
                        ? item[col.accessor]
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
