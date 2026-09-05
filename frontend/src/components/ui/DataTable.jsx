import React from 'react';
import EmptyState from './EmptyState';
import { Skeleton } from './Skeleton';

export const DataTable = ({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  isLoading = false,
  skeletonRows = 5,
  emptyMessage = 'No records found',
  emptyDescription = 'There is currently no data to display in this table.',
  emptyAction,
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              {columns.map((col, idx) => (
                <th
                  key={col.id || col.header || idx}
                  className={`py-3.5 px-4 ${col.className || ''} ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-50">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-3.5 px-4">
                      <Skeleton
                        className={`h-4 ${
                          cIdx === 0
                            ? 'w-24'
                            : cIdx === 1
                            ? 'w-40'
                            : col.align === 'right'
                            ? 'w-16 ml-auto'
                            : col.align === 'center'
                            ? 'w-20 mx-auto'
                            : 'w-24'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))
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
                  className={`transition-colors duration-150 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-blue-50/40 active:bg-blue-50/70'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.id || colIdx}
                      className={`py-3.5 px-4 text-slate-700 align-middle ${
                        col.align === 'right'
                          ? 'text-right font-mono'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.cellClassName || ''}`}
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
