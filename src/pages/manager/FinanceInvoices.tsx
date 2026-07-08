export default function FinanceInvoices() {
  return (
    <div className="-m-4 sm:-m-6 min-h-full p-4 sm:p-6" style={{ backgroundColor: "#F7F7F7" }}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and track all buyer invoices</p>
        </div>
        <div
          className="rounded-2xl bg-white px-6 py-12 text-center"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <p className="text-sm text-slate-400">Invoices coming soon</p>
        </div>
      </div>
    </div>
  );
}
