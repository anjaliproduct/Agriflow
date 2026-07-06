import { ReactNode } from "react";

export default function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-cream text-xs uppercase text-slate-500">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
