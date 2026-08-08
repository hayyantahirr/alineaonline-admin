"use client";

export default function Table({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-dark text-white">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`
                  px-4 py-3 text-left font-semibold
                  font-(family-name:--font-ibm-plex-mono) text-xs uppercase tracking-wider
                  ${i === 0 ? "rounded-tl-xl" : ""}
                  ${i === columns.length - 1 ? "rounded-tr-xl" : ""}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`
                ${onRowClick ? "cursor-pointer" : ""}
                ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                hover:bg-primary/5 transition-colors duration-150
              `}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-4 py-3 text-dark">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">No data available</p>
        </div>
      )}
    </div>
  );
}
