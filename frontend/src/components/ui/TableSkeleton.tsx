import React from 'react';

type TableSkeletonProps = {
  rows?: number;
  cols?: number;
  className?: string;
  headings?: string[];
};

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols = 7,
  className = '',
  headings = Array(7).fill(''),
}) => {
  return (
    <div className={`overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white ${className}`}>
      <table className="table w-full min-w-[500px]">
        <thead className="bg-gray-200">
            <tr className="text-gray-600 text-sm font-medium">
              {headings.slice(0, cols).map((heading, idx) => (
                <th key={idx} className="px-4 py-3 md:px-6 md:py-4">
                  {heading || <div className="h-4 bg-gray-300 rounded w-16 md:w-24" />}
                </th>
              ))}
            </tr>
          </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="animate-pulse">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3 md:px-6 md:py-4">
                  <div 
                    className="h-5 md:h-6 bg-gray-200 rounded min-w-[40px]" 
                    style={{ 
                      width: `${Math.max(50, Math.floor(Math.random() * 90))}%` 
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;