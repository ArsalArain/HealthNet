import React from "react";

export function Table({ columns = [], rows = [], emptyText = "No data found.", keyField = "id" }) {
  return (
    <div className="hnu-table-wrap">
      <table className="hnu-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="hnu-table-empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row[keyField] || idx}>
                {columns.map((col) => (
                  <td key={`${col.key}-${row[keyField] || idx}`}>
                    {typeof col.render === "function" ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
